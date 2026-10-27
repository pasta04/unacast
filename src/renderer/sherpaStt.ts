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

async function start(port: MessagePort, inputDevice?: string) {
  if (audioCtx) {
    port.close();
    return;
  }
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
    return;
  }
  // AudioContext を最初から 16kHz で作り、マイク入力のリサンプルは Chromium に任せる
  const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
  if (ctx.sampleRate !== SAMPLE_RATE) {
    logger.error(`AudioContext could not be created with ${SAMPLE_RATE}Hz (actual: ${ctx.sampleRate}Hz).`);
    stream.getTracks().forEach((track) => track.stop());
    await ctx.close();
    port.close();
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

  audioPort = port;
  audioCtx = ctx;
  mediaStream = stream;
  sourceNode = source;
  processorNode = processor;
}

const stop = () => {
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

const checkSherpaSttModelStatus = () => {
  ipcRenderer.send(electronEvent.SHERPA_STT, 'checkModelStatus');
};

export default {
  registerIpcSubscribers,
  downloadSherpaSttModel,
  checkSherpaSttModelStatus,
};
