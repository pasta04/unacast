// マイクからの入力は Renderer 側でしかできないので、こちらで認識全体を行う

import electron from 'electron';
import electronlog from 'electron-log';
const logger = electronlog.scope('renderer-azureStt');
import { electronEvent } from '../main/const';
import { SpeechConfig, SpeechRecognizer, AudioConfig, CancellationReason } from 'microsoft-cognitiveservices-speech-sdk';

const ipcRenderer = electron.ipcRenderer;

let speechRecognizer: SpeechRecognizer | undefined;

const start = (key: string, region: string, language: string, inputDevice?: string) => {
  logger.info('starting text recognition from microphone.');
  const speechConfig = SpeechConfig.fromSubscription(key, region);
  speechConfig.speechRecognitionLanguage = language;
  const audioConfig = AudioConfig.fromMicrophoneInput(inputDevice === '' ? undefined : inputDevice);
  const startTime = Date.now();
  const recognizer = new SpeechRecognizer(speechConfig, audioConfig);
  recognizer.recognized = (s, e) => {
    if (e.result.text) {
      logger.debug('text recognized:' + e.result.text);
      ipcRenderer.send(electronEvent.AZURE_STT_EVENT, 'comment', { date: new Date(startTime + e.result.offset / 10000).toLocaleString(), text: e.result.text });
    }
  };

  recognizer.canceled = (s, e) => {
    logger.warn('text recognition is canceled.');
    if (e.reason == CancellationReason.Error) {
      ipcRenderer.send(electronEvent.AZURE_STT_EVENT, 'error', { date: new Date(startTime + e.offset / 10000).toLocaleString(), text: 'Speech recognition error.' });
    }
    recognizer.stopContinuousRecognitionAsync();
    if (speechRecognizer === recognizer) {
      speechRecognizer = undefined;
    }
  };

  recognizer.sessionStopped = (s, e) => {
    logger.warn('text recognition session is stopped.');
    recognizer.stopContinuousRecognitionAsync();
    if (speechRecognizer === recognizer) {
      speechRecognizer = undefined;
    }
  };
  speechRecognizer = recognizer;
  recognizer.startContinuousRecognitionAsync();
  ipcRenderer.send(electronEvent.AZURE_STT_EVENT, 'end');
};

const stop = () => {
  if (speechRecognizer) {
    speechRecognizer.stopContinuousRecognitionAsync();
    speechRecognizer = undefined;
  }
};

ipcRenderer.on(electronEvent.AZURE_STT_START, (event: any, arg: { key: string; region: string; language: string; inputDevice?: string }) => {
  logger.debug('DOM Content Loaded');
  start(arg.key, arg.region, arg.language, arg.inputDevice);
});

ipcRenderer.on(electronEvent.AZURE_STT_STOP, (event: any) => {
  stop();
});
