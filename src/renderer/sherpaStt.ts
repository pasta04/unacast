// Renderer 側ではマイクからの音声入力だけを行う

import electron from 'electron';
import electronlog from 'electron-log';
import { electronEvent } from '../main/const';
import { useAppStore } from './app/store';

const logger = electronlog.scope('renderer-sherpaStt');
const ipcRenderer = electron.ipcRenderer;
let audioCtx: AudioContext | undefined;

async function resample(buffer: AudioBuffer, target: number) {
  if (buffer.sampleRate === target) {
    return buffer;
  } else {
    const context = new OfflineAudioContext(buffer.numberOfChannels, (buffer.length * target) / buffer.sampleRate, target);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start();
    return await context.startRendering();
  }
}

async function start(inputDevice?: string) {
  logger.info('starting text recognition from microphone.');
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: inputDevice,
      channelCount: 1,
      sampleRate: 16000,
      sampleSize: 16,
      echoCancellation: false,
      noiseSuppression: true,
      autoGainControl: false,
    },
  });
  audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const processor = audioCtx.createScriptProcessor(0, 1, 1);

  processor.onaudioprocess = async (evt) => {
    const buffer = await resample(evt.inputBuffer, 16000);
    ipcRenderer.send(electronEvent.SHERPA_STT, 'audio', {
      timeStamp: evt.timeStamp,
      data: buffer.getChannelData(0),
    });
  };
  source.connect(processor);
  processor.connect(audioCtx.destination);
}

const stop = () => {
  if (audioCtx) {
    audioCtx.close();
    audioCtx = undefined;
    ipcRenderer.send(electronEvent.SHERPA_STT, 'end');
  }
};

const registerIpcSubscribers = () => {
  ipcRenderer.on(electronEvent.SHERPA_STT, async (event: any, command: string, args: { inputDevice?: string } | boolean) => {
    const { setStatus } = useAppStore.getState();
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
