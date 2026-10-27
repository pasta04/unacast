/**
 * Sherpa ONNX speech to text
 */
import { app, net, utilityProcess, MessageChannelMain, UtilityProcess } from 'electron';
import { electronEvent } from '../const';
import { EventEmitter } from 'events';
import electronlog from 'electron-log';
import fsPromise from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import { downloadFile } from './download';
import workerPath from './worker?modulePath';
import type { WorkerRequest, WorkerResponse } from './worker';

const logger = electronlog.scope('sherpaStt');

/** モデルの保存先。userData 直下は Chromium のセッションデータと混ざるため専用フォルダに置く */
const getModelDir = () => path.join(app.getPath('userData'), 'sherpa-models');

/** ReazonSpeech のリビジョン。main は上流で差し替わり得るため、動作確認したコミットに固定する */
const REAZON_REVISION = '291488c8151be24d7da4bf7af26e533fad96e407';
const reazonUrl = (fileName: string) => `https://huggingface.co/reazon-research/reazonspeech-k2-v2/resolve/${REAZON_REVISION}/${fileName}?download=true`;

type ModelFile = {
  fileName: string;
  url: string;
  /** ダウンロード後に検証する sha256 */
  sha256: string;
  /** 進捗表示用のファイルサイズ (byte) */
  size: number;
};

const ModelFiles: Record<'encoder' | 'decoder' | 'joiner' | 'tokens' | 'vad', ModelFile> = {
  encoder: {
    fileName: 'encoder-epoch-99-avg-1.int8.onnx',
    url: reazonUrl('encoder-epoch-99-avg-1.int8.onnx'),
    sha256: '2c7bd08a8a99f9ddd0d9e458456577b1f6279214e51426f114f9eced44c54e1d',
    size: 154670139,
  },
  decoder: {
    fileName: 'decoder-epoch-99-avg-1.onnx',
    url: reazonUrl('decoder-epoch-99-avg-1.onnx'),
    sha256: '58b18211ae06265466bfa17172dab574df94f76c8bcb61a3640c28ba860e4124',
    size: 11767836,
  },
  joiner: {
    fileName: 'joiner-epoch-99-avg-1.int8.onnx',
    url: reazonUrl('joiner-epoch-99-avg-1.int8.onnx'),
    sha256: '49cc7ea1d3d35a40a27442db5e89996da64bf0e683a903dce76e99e57a12e4de',
    size: 2696970,
  },
  tokens: {
    fileName: 'tokens.txt',
    url: reazonUrl('tokens.txt'),
    sha256: '2c3ac659818a48a0c04010e0593bbc4d7c8a24a054340b01131499c05fd52def',
    size: 45754,
  },
  vad: {
    fileName: 'silero_vad.onnx',
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/silero_vad.onnx',
    sha256: '9e2449e1087496d8d4caba907f23e0bd3f78d91fa552479bb9c23ac09cbb1fd6',
    size: 643854,
  },
};

const modelPath = (file: ModelFile) => path.join(getModelDir(), file.fileName);

class SherpaSpeechToText extends EventEmitter {
  name: string;
  inputDevice?: string;
  /**
   * 音声認識を行う utilityProcess。認識は CPU を使う同期処理のため main では動かさない
   * (sherpa-onnx の読み込み自体も重いので、開始時にだけ子プロセス側で読み込む)。
   */
  private child: UtilityProcess | null = null;

  constructor() {
    super();
    this.name = '';
    this.inputDevice = 'default';
  }

  /** ダウンロード実行中か (二重実行防止) */
  private downloading = false;

  public checkModels() {
    // 本来の名前のファイルはハッシュ検証済みのものしか置かれないため、存在確認で足りる
    return Object.values(ModelFiles).every((file) => fs.existsSync(modelPath(file)));
  }

  /**
   * モデルファイルを全てダウンロードし直す。成功したら true。
   * 1ファイルずつ一時ファイルに落として sha256 を検証してから置き換えるため、
   * 途中で失敗しても既存のモデルは壊れない。
   */
  public async downloadModels(): Promise<boolean> {
    if (this.downloading) return false;
    this.downloading = true;
    try {
      await fsPromise.mkdir(getModelDir(), { recursive: true });
      const totalSize = Object.values(ModelFiles).reduce((sum, file) => sum + file.size, 0);
      let downloadedSize = 0;
      this.emit('status', 'ダウンロード中');
      for (const file of Object.values(ModelFiles)) {
        logger.info(`downloading ${file.url} to ${modelPath(file)}`);
        await downloadFile(
          file.url,
          modelPath(file),
          file.sha256,
          (bytes) => {
            downloadedSize += bytes;
            const rate = (downloadedSize * 100.0) / totalSize;
            this.emit('status', `ダウンロード中 ${rate.toFixed(0)}% (${downloadedSize}/${totalSize})`);
          },
          (url) => net.fetch(url),
        );
      }
      logger.info('download completed.');
      this.emit('status', 'ダウンロード完了');
      return true;
    } catch (err) {
      logger.error(`download failed ${err}`);
      this.emit('status', `ダウンロードに失敗しました: ${err}`);
      return false;
    } finally {
      this.downloading = false;
    }
  }

  /**
   * サーバーが音声認識を動かしたい状態か (サーバー起動中で音声認識が有効)。
   * マイクのエラーで認識プロセスを止めても true のまま残り、デバイス再読込で再接続できる。
   */
  private enabled = false;
  /** renderer のマイクが開始済みか */
  private micStarted = false;

  /** サーバー起動時に呼ぶ */
  public start() {
    this.enabled = true;
    this.startRecognition();
  }

  /** サーバー停止時に呼ぶ */
  public stop() {
    const wasEnabled = this.enabled;
    this.enabled = false;
    this.stopRecognition();
    if (wasEnabled) this.emit('end');
  }

  /** デバイス再読込から呼ぶ。サーバー起動中なら、指定のデバイスでマイクと認識プロセスをつなぎ直す */
  public restart(inputDevice?: string) {
    if (!this.enabled) return;
    if (inputDevice) this.inputDevice = inputDevice;
    logger.info(`restart speech recognition (inputDevice=${this.inputDevice})`);
    this.stopRecognition();
    this.startRecognition();
  }

  /** renderer でマイクを開始できた。ここで初めて「読み取り開始」とする */
  public onMicStarted() {
    if (!this.child || this.micStarted) return;
    this.micStarted = true;
    this.emit('start');
  }

  /** renderer でマイクを開始できなかった、または使用中に切断された */
  public onMicError(reason: string) {
    if (!this.child) return;
    logger.error(`microphone error: ${reason}`);
    this.stopRecognition();
    // 理由の文面でマイクの問題と分かるため、見出しは付けない
    this.emit('error', new Error(reason), '');
  }

  private startRecognition() {
    if (this.child) return;

    if (!this.checkModels()) {
      logger.error(`model files not found`);
      this.emit('error', new Error('モデルファイルがダウンロードされていません'), '');
      return;
    }

    this.emit('status', '準備中');
    const child = utilityProcess.fork(workerPath, [], { serviceName: 'unacast 音声認識' });
    this.child = child;
    this.micStarted = false;
    child.on('message', (message: WorkerResponse) => this.onWorkerMessage(child, message));
    child.on('exit', (code) => {
      // stopRecognition() による終了は child を先に外しているので、ここに来るのは予期しない終了だけ
      if (this.child !== child) return;
      this.child = null;
      this.micStarted = false;
      logger.error(`speech recognition process exited unexpectedly (code=${code})`);
      globalThis.electron.mainWindow.webContents.send(electronEvent.SHERPA_STT, 'stop');
      this.emit('error', new Error(`exit code ${code}`), '音声認識プロセスが終了しました');
    });
    this.postToWorker(child, {
      type: 'init',
      paths: {
        encoder: modelPath(ModelFiles.encoder),
        decoder: modelPath(ModelFiles.decoder),
        joiner: modelPath(ModelFiles.joiner),
        tokens: modelPath(ModelFiles.tokens),
        vad: modelPath(ModelFiles.vad),
      },
    });
  }

  /** 認識プロセスと renderer のマイクを止める (enabled は変えない) */
  private stopRecognition() {
    const child = this.child;
    if (!child) return;
    this.child = null;
    this.micStarted = false;
    globalThis.electron.mainWindow.webContents.send(electronEvent.SHERPA_STT, 'stop');
    child.kill();
  }

  private postToWorker(child: UtilityProcess, message: WorkerRequest, ports?: Electron.MessagePortMain[]) {
    child.postMessage(message, ports);
  }

  private onWorkerMessage(child: UtilityProcess, message: WorkerResponse) {
    if (this.child !== child) return;
    switch (message.type) {
      case 'ready': {
        // renderer のマイク音声を main を経由せず子プロセスへ直接流す
        const { port1, port2 } = new MessageChannelMain();
        this.postToWorker(child, { type: 'audioPort' }, [port1]);
        // 「読み取り開始」は renderer からマイク開始の成功が届いてから出す (onMicStarted)
        globalThis.electron.mainWindow.webContents.postMessage(electronEvent.SHERPA_STT_AUDIO_PORT, { inputDevice: this.inputDevice }, [port2]);
        break;
      }
      case 'text': {
        const item: UserComment = {
          type: 'comment',
          name: this.name,
          date: new Date().toLocaleString(),
          text: message.text,
          imgUrl: globalThis.electron.iconList.getStt(),
          from: 'stt',
        };
        this.emit('comment', item);
        break;
      }
      case 'error':
        logger.error(`speech recognition failed ${message.message}`);
        this.stopRecognition();
        this.emit('error', new Error(message.message), '音声認識に失敗しました');
        break;
    }
  }

  // イベント
  public on(event: 'comment', listener: (comment: UserComment) => void): this;

  // 接続開始時
  public on(event: 'start', listener: () => void): this;

  // 停止した時
  public on(event: 'end', listener: (reason?: string) => void): this;

  // 何かエラーあった時
  public on(event: 'error', listener: (err: Error, message: string) => void): this;

  public on(event: 'status', listener: (message: string) => void): this;

  public on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
}

export default SherpaSpeechToText;
