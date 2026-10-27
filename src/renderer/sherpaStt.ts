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

async function start(inputDevice?: string) {
  if (audioCtx) return;
  logger.info('starting text recognition from microphone.');
  const stream = await navigator.mediaDevices.getUserMedia({
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
  // AudioContext を最初から 16kHz で作り、マイク入力のリサンプルは Chromium に任せる
  const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
  if (ctx.sampleRate !== SAMPLE_RATE) {
    logger.error(`AudioContext could not be created with ${SAMPLE_RATE}Hz (actual: ${ctx.sampleRate}Hz).`);
    stream.getTracks().forEach((track) => track.stop());
    await ctx.close();
    return;
  }
  const source = ctx.createMediaStreamSource(stream);
  const processor = ctx.createScriptProcessor(0, 1, 1);
  // 同期処理で送ることで、音声チャンクの送信順を保証する
  processor.onaudioprocess = (evt) => {
    ipcRenderer.send(electronEvent.SHERPA_STT, 'audio', {
      timeStamp: evt.timeStamp,
      // inputBuffer は使い回されるためコピーして送る
      data: evt.inputBuffer.getChannelData(0).slice(),
    });
  };
  source.connect(processor);
  processor.connect(ctx.destination);

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
};

const registerIpcSubscribers = () => {
  ipcRenderer.on(electronEvent.SHERPA_STT, async (_event: any, command: string, args: { inputDevice?: string } | boolean) => {
    switch (command) {
      case 'start':
        await start((args as { inputDevice?: string }).inputDevice);
        break;
      case 'stop':
        stop();
        break;
    }
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
