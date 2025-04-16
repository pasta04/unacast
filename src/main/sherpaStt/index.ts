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

const logger = electronlog.scope('sherpaStt');
const bufferSizeInSeconds = 30;

const basePath = app.getPath('sessionData');

const ModelFiles = {
  encoder: {
    fileName: 'encoder-epoch-99-avg-1.int8.onnx',
    url: 'https://huggingface.co/reazon-research/reazonspeech-k2-v2/resolve/main/encoder-epoch-99-avg-1.int8.onnx?download=true',
  },
  decoder: {
    fileName: 'decoder-epoch-99-avg-1.onnx',
    url: 'https://huggingface.co/reazon-research/reazonspeech-k2-v2/resolve/main/decoder-epoch-99-avg-1.onnx?download=true',
  },
  joiner: {
    fileName: 'joiner-epoch-99-avg-1.int8.onnx',
    url: 'https://huggingface.co/reazon-research/reazonspeech-k2-v2/resolve/main/joiner-epoch-99-avg-1.int8.onnx?download=true',
  },
  tokens: {
    fileName: 'tokens.txt',
    url: 'https://huggingface.co/reazon-research/reazonspeech-k2-v2/resolve/main/tokens.txt',
  },
  vad: {
    fileName: 'silero_vad.onnx',
    url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/silero_vad.onnx',
  },
};

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

  public checkModels() {
    let downloaded = true;
    for (const [_, entry] of Object.entries(ModelFiles)) {
      const filePath = `${basePath}/${entry.fileName}`;
      if (!fs.existsSync(filePath)) {
        downloaded = false;
      }
    }
    return downloaded;
  }

  public async downloadModels() {
    try {
      let totalSize = 0;
      let downloadedCount = 0;
      this.emit('status', `ダウンロード中`);
      for (const [_, entry] of Object.entries(ModelFiles)) {
        const filePath = `${basePath}/${entry.fileName}`;
        if (fs.existsSync(filePath)) {
          // 既にあったら削除する(再ダウンロード用)
          await fsPromise.rm(filePath);
        }
        const response = await net.fetch(entry.url);
        if (response.ok && response.body) {
          const f = await fsPromise.open(filePath, 'w');
          logger.info(`downloading ${entry.url} to ${filePath}`);
          totalSize += Number(response.headers.get('Content-Length') ?? '0');

          for await (const chunk of response.body) {
            downloadedCount += chunk.length;
            await f.write(chunk);
            const rate = (downloadedCount * 100.0) / (totalSize === 0 ? 100.0 : totalSize);
            this.emit('status', `ダウンロード中 ${rate.toFixed(0)}% (${downloadedCount}/${totalSize})`);
          }
          await f.close();
        } else {
          logger.error(`download failed ${entry.url} with ${response.statusText}`);
          this.emit('status', `ダウンロードに失敗しました: ${entry.url} with ${response.statusText}`);
          break;
        }
      }
      logger.info(`download completed.`);
      this.emit('status', `ダウンロード完了`);
    } catch (err) {
      logger.error(`download failed ${err}`);
      this.emit('status', `ダウンロードに失敗しました: ${err}`);
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
            encoder: `${basePath}/${ModelFiles.encoder.fileName}`,
            decoder: `${basePath}/${ModelFiles.decoder.fileName}`,
            joiner: `${basePath}/${ModelFiles.joiner.fileName}`,
          },
          tokens: `${basePath}/${ModelFiles.tokens.fileName}`,
          numThreads: 1,
          provider: 'cpu',
          debug: false,
        },
      });

      this.vad = sherpa_onnx.createVad(
        {
          sileroVad: {
            model: `${basePath}/${ModelFiles.vad.fileName}`,
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
      this.emit('error', `${err}`, '初期化に失敗しました');
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
