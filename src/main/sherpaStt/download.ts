/**
 * モデルファイル1件分のダウンロード。
 * Electron 非依存 (fetch は呼び出し側から渡す) にして単体テストできるようにしている。
 */
import { createHash } from 'node:crypto';
import fsPromise from 'node:fs/promises';

/**
 * url を destPath にダウンロードする。失敗時は例外。
 *
 * `${destPath}.part` に書き込みながら sha256 を計算し、ハッシュが一致したときだけ destPath に rename する。
 * そのため destPath には検証済みのファイルしか存在せず、存在確認だけで「ダウンロード済み」と判定できる。
 * 失敗時は .part を削除し、既存の destPath (以前のダウンロード) には手を付けない。
 */
export const downloadFile = async (
  url: string,
  destPath: string,
  expectedSha256: string,
  onChunk: (bytes: number) => void,
  fetchImpl: (url: string) => Promise<Response>,
): Promise<void> => {
  const partPath = `${destPath}.part`;
  const response = await fetchImpl(url);
  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const hash = createHash('sha256');
  const file = await fsPromise.open(partPath, 'w');
  let completed = false;
  try {
    // ReadableStream は型定義上 async iterable ではないため reader で読む
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      hash.update(value);
      await file.write(value);
      onChunk(value.length);
    }
    await file.close();

    const actual = hash.digest('hex');
    if (actual !== expectedSha256) {
      throw new Error(`ハッシュが一致しません (期待値=${expectedSha256} 実際=${actual})`);
    }
    await fsPromise.rename(partPath, destPath);
    completed = true;
  } finally {
    // close 済みでも二重 close は例外にならないよう握りつぶす
    await file.close().catch(() => undefined);
    if (!completed) {
      await fsPromise.rm(partPath, { force: true }).catch(() => undefined);
    }
  }
};
