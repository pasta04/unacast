// Renderer 側ではマイクからの音声入力だけを行う

import electron from 'electron';
import electronlog from 'electron-log/renderer';
import { electronEvent } from '../main/const';

const logger = electronlog.scope('renderer-sherpaStt');
const ipcRenderer = electron.ipcRenderer;

/** 認識モデルが受け付けるサンプルレート */
const SAMPLE_RATE = 16000;

let audioCtx: AudioContext | undefined;
let mediaStream: MediaStream | undefined;
let sourceNode: MediaStreamAudioSourceNode | undefined;
let processorNode: ScriptProcessorNode | undefined;
/** 認識プロセスへ音声を直接送る port (main を経由しない) */
let audioPort: MessagePort | undefined;
/** start() の途中で stop() が来たことを検知するための世代番号 */
let generation = 0;

/** マイクの開始結果を main に知らせる。失敗時は status にそのまま表示される理由を添える */
const notifyMicStarted = () => ipcRenderer.send(electronEvent.SHERPA_STT, 'micStarted');
const notifyMicError = (reason: string) => ipcRenderer.send(electronEvent.SHERPA_STT, 'micError', reason);

/** getUserMedia の失敗を利用者向けの理由にする */
const micErrorReason = (err: unknown): string => {
  const name = err instanceof DOMException ? err.name : '';
  switch (name) {
    case 'NotAllowedError':
      return 'マイクの使用が許可されていません';
    case 'NotFoundError':
      return 'マイクが見つかりません';
    case 'NotReadableError':
      return 'マイクを開けません (他のアプリが使用中の可能性があります)';
    default:
      return err instanceof Error ? err.message : String(err);
  }
};

async function start(port: MessagePort, inputDevice?: string) {
  if (audioCtx) {
    port.close();
    return;
  }
  const myGeneration = ++generation;
  logger.info('starting text recognition from microphone.');
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: inputDevice,
        channelCount: 1,
        sampleRate: SAMPLE_RATE,
        sampleSize: 16,
        echoCancellation: false,
        noiseSuppression: true,
        autoGainControl: false,
      },
    });
  } catch (err) {
    logger.error(`failed to open microphone: ${err}`);
    port.close();
    if (myGeneration === generation) notifyMicError(micErrorReason(err));
    return;
  }
  if (myGeneration !== generation) {
    // マイクを開いている間に停止された。開いたマイクはすぐ閉じる
    stream.getTracks().forEach((track) => track.stop());
    port.close();
    return;
  }

  // AudioContext を最初から 16kHz で作り、マイク入力のリサンプルは Chromium に任せる
  const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
  if (ctx.sampleRate !== SAMPLE_RATE) {
    logger.error(`AudioContext could not be created with ${SAMPLE_RATE}Hz (actual: ${ctx.sampleRate}Hz).`);
    stream.getTracks().forEach((track) => track.stop());
    await ctx.close();
    port.close();
    notifyMicError('音声を16kHzで取り込めません');
    return;
  }
  const source = ctx.createMediaStreamSource(stream);
  const processor = ctx.createScriptProcessor(0, 1, 1);
  // 同期処理で送ることで、音声チャンクの送信順を保証する
  processor.onaudioprocess = (evt) => {
    // inputBuffer は使い回されるためコピーして送る。
    // 受け側の MessagePortMain は MessagePort 以外の転送 (transfer) に対応しておらず、
    // ArrayBuffer を transfer 指定すると null で届くため、通常の複製で送る
    port.postMessage(evt.inputBuffer.getChannelData(0).slice());
  };
  source.connect(processor);
  processor.connect(ctx.destination);

  // 使用中にマイクが抜かれた場合 (stop() で止めた場合は ended は発生しない)
  stream.getAudioTracks().forEach((track) =>
    track.addEventListener('ended', () => {
      if (mediaStream === stream) notifyMicError('マイクが切断されました');
    }),
  );

  audioPort = port;
  audioCtx = ctx;
  mediaStream = stream;
  sourceNode = source;
  processorNode = processor;
  notifyMicStarted();
}

const stop = () => {
  generation++;
  if (processorNode) {
    processorNode.onaudioprocess = null;
    processorNode.disconnect();
    processorNode = undefined;
  }
  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = undefined;
  }
  // AudioContext を閉じてもマイクは解放されないため、トラックを明示的に止める
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = undefined;
  }
  if (audioCtx) {
    audioCtx.close();
    audioCtx = undefined;
  }
  if (audioPort) {
    audioPort.close();
    audioPort = undefined;
  }
};

const registerIpcSubscribers = () => {
  // 認識プロセスの準備ができたら、音声送信用の port と一緒に開始指示が届く
  ipcRenderer.on(electronEvent.SHERPA_STT_AUDIO_PORT, async (event: Electron.IpcRendererEvent, args: { inputDevice?: string }) => {
    await start(event.ports[0], args.inputDevice);
  });
  ipcRenderer.on(electronEvent.SHERPA_STT, (_event: any, command: string) => {
    if (command === 'stop') stop();
  });
};

const downloadSherpaSttModel = () => {
  ipcRenderer.send(electronEvent.SHERPA_STT, 'downloadModels');
};

/** サーバー起動中に、指定のデバイスでマイクと認識をつなぎ直す (main 側で起動中のときだけ実行される) */
const restartSherpaStt = (inputDevice: string) => {
  ipcRenderer.send(electronEvent.SHERPA_STT, 'restart', { inputDevice });
};

const checkSherpaSttModelStatus = () => {
  ipcRenderer.send(electronEvent.SHERPA_STT, 'checkModelStatus');
};

export default {
  registerIpcSubscribers,
  downloadSherpaSttModel,
  checkSherpaSttModelStatus,
  restartSherpaStt,
};
