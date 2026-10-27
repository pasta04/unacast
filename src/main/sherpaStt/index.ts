/**
 * Sherpa ONNX speech to text
 */
import { app, ipcMain, net } from 'electron';
import { electronEvent } from '../const';
import { EventEmitter } from 'events';
import electronlog from 'electron-log';
import sherpa_onnx from 'sherpa-onnx';
import fsPromise from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import { downloadFile } from './download';

const logger = electronlog.scope('sherpaStt');
const bufferSizeInSeconds = 30;

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
  recognizer?: any;
  vad?: any;
  buffer?: any;
  constructor() {
    super();
    this.name = '';
    this.inputDevice = 'default';
    this.recognizer = null;
    this.vad = null;
    this.buffer = null;

    ipcMain.on(electronEvent.SHERPA_STT, (event: any, command: string, arg?: { timeStamp: number; data: Float32Array }) => {
      switch (command) {
        case 'audio':
          if (arg) {
            this.onAudio(arg.data);
          }
          break;
      }
    });
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

  public start() {
    if (this.recognizer) {
      // 開始済み
      return;
    }

    if (!this.checkModels()) {
      logger.error(`model files not found`);
      this.emit('status', 'モデルファイルがダウンロードされていません');
      return;
    }

    try {
      this.recognizer = sherpa_onnx.createOfflineRecognizer({
        featConfig: {
          sampleRate: 16000,
          featureDim: 80,
        },
        modelConfig: {
          transducer: {
            encoder: modelPath(ModelFiles.encoder),
            decoder: modelPath(ModelFiles.decoder),
            joiner: modelPath(ModelFiles.joiner),
          },
          tokens: modelPath(ModelFiles.tokens),
          numThreads: 1,
          provider: 'cpu',
          debug: false,
        },
      });

      this.vad = sherpa_onnx.createVad(
        {
          sileroVad: {
            model: modelPath(ModelFiles.vad),
            threshold: 0.25,
            minSpeechDuration: 0.1,
            minSilenceDuration: 1.0,
            maxSpeechDuration: 10.0,
            windowSize: 512,
          },
          sampleRate: 16000,
          debug: false,
          numThreads: 1,
          provider: 'cpu',
        },
        bufferSizeInSeconds * 2,
      );
      this.buffer = sherpa_onnx.createCircularBuffer(bufferSizeInSeconds * this.vad.config.sampleRate);
    } catch (err) {
      this.recognizer = null;
      this.vad = null;
      this.buffer = null;
      logger.error(`start failed ${err}`);
      this.emit('error', err instanceof Error ? err : new Error(String(err)), '初期化に失敗しました');
      return;
    }
    globalThis.electron.mainWindow.webContents.send(electronEvent.SHERPA_STT, 'start', { inputDevice: this.inputDevice });
    this.emit('start');
  }

  public stop() {
    if (this.recognizer) {
      globalThis.electron.mainWindow.webContents.send(electronEvent.SHERPA_STT, 'stop');
      this.emit('end');
      this.recognizer = null;
      this.vad = null;
      this.buffer = null;
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

  private onAudio(data: Float32Array) {
    if (!this.buffer || !this.recognizer || !this.vad) {
      return;
    }

    this.buffer.push(data);
    const windowSize = this.vad.config.sileroVad.windowSize;
    while (this.buffer.size() > windowSize) {
      const samples = this.buffer.get(this.buffer.head(), windowSize);
      this.vad.acceptWaveform(samples);
      this.buffer.pop(windowSize);
    }

    while (!this.vad.isEmpty()) {
      const segment = this.vad.front();
      this.vad.pop();
      const stream = this.recognizer.createStream();
      const offset = this.recognizer.config.featConfig.sampleRate * 0.9;
      const samples = new Float32Array(segment.samples.length + offset);
      samples.set(segment.samples, offset);
      stream.acceptWaveform(this.recognizer.config.featConfig.sampleRate, samples);
      this.recognizer.decode(stream);
      const r = this.recognizer.getResult(stream);
      if (r.text.length > 0) {
        const item: UserComment = {
          type: 'comment',
          name: this.name,
          date: new Date().toLocaleString(),
          text: r.text,
          imgUrl: globalThis.electron.iconList.getBbs(),
          from: 'stt',
        };
        this.emit('comment', item);
      }
    }
  }
}

export default SherpaSpeechToText;
