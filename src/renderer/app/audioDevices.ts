import { useAppStore } from './store';

type DeviceEntry = { deviceId: string; label: string };
type EnumerateResult = { outputs: DeviceEntry[]; inputs: DeviceEntry[] };

/** enumerateDevices を 1 回試して、output / input の配列を返す */
const enumerateAudioDevicesOnce = async (): Promise<EnumerateResult> => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return {
    outputs: devices.filter((d) => d.kind === 'audiooutput').map((d) => ({ deviceId: d.deviceId, label: d.label })),
    inputs: devices.filter((d) => d.kind === 'audioinput').map((d) => ({ deviceId: d.deviceId, label: d.label })),
  };
};

/** ストアに結果を反映 */
const apply = (result: EnumerateResult) => {
  useAppStore.getState().setAudioOutputs(result.outputs);
  useAppStore.getState().setAudioInputs(result.inputs);
};

/**
 * オーディオデバイスをリトライ付きで取得する。
 *
 * 起動直後やスリープ復帰直後は enumerateDevices が 0 件で返ってくることが
 * あるため、output が空の間は時間を空けて再試行する。各試行ごとに取得結果を
 * 即時反映するので、UI が「読み込み中…」のまま固まることはない。
 *
 * - 着信音出力先(audiooutput)が 1 件以上取れた時点でリトライ終了
 * - リトライを使い切ったら、それまでの最新値で確定
 */
export const loadAudioDevicesWithRetry = async (shouldAbort: () => boolean = () => false): Promise<void> => {
  // 0ms = 即時 1 回試す → ダメなら短い間隔から徐々に伸ばす
  const delays = [0, 300, 700, 1500, 3000, 6000];
  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (shouldAbort()) return;
    if (delays[attempt] > 0) {
      await new Promise((r) => setTimeout(r, delays[attempt]));
    }
    if (shouldAbort()) return;
    try {
      const result = await enumerateAudioDevicesOnce();
      if (shouldAbort()) return;
      // 取れた分は毎回ストアへ反映する (null のまま固まるのを防ぐ)
      apply(result);
      // 着信音出力先が 1 件以上あればもう十分とみなしリトライ終了
      if (result.outputs.length > 0) return;
    } catch {
      // 個別の失敗は無視。次の機会に再取得する
    }
  }
  // ここまで来た時点で出力が 0 件のまま。状態は最後の試行値 (空配列 or null) になっている。
  // null のままだと UI が読み込み中のままになるので空配列で確定する。
  if (useAppStore.getState().audioOutputs === null) useAppStore.getState().setAudioOutputs([]);
  if (useAppStore.getState().audioInputs === null) useAppStore.getState().setAudioInputs([]);
};

/**
 * 「再読込」ボタンから呼ぶ手動再ロード。
 * 既存の値は残したまま再試行する。完全に取れたら上書き、取れなかったらそのまま。
 */
export const reloadAudioDevices = async (): Promise<void> => {
  await loadAudioDevicesWithRetry();
};

/** devicechange イベントで後から認識されたデバイスを即時反映する */
export const refreshAudioDevicesFromEvent = async (): Promise<void> => {
  try {
    const result = await enumerateAudioDevicesOnce();
    apply(result);
  } catch {
    // 無視
  }
};
