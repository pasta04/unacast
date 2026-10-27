/**
 * 音声認識用 utilityProcess のエントリポイント。
 * 認識は CPU を使う同期処理のため、main プロセスを止めないよう別プロセスで動かす。
 *
 * main とのやり取り (process.parentPort):
 *   main → worker: { type: 'init', paths }            モデルを読み込む
 *                  { type: 'audioPort' } + ports[0]    renderer からの音声を受け取る MessagePort
 *   worker → main: { type: 'ready' } / { type: 'error', message } / { type: 'text', text }
 * 音声は main を経由せず、renderer から MessagePort で直接届く。
 */
import { createSpeechRecognizer, ModelPaths, SpeechRecognizer } from './recognizer';

export type WorkerRequest = { type: 'init'; paths: ModelPaths } | { type: 'audioPort' };
export type WorkerResponse = { type: 'ready' } | { type: 'error'; message: string } | { type: 'text'; text: string };

const post = (message: WorkerResponse) => process.parentPort.postMessage(message);

let recognizer: SpeechRecognizer | null = null;

process.parentPort.on('message', (event) => {
  const request = event.data as WorkerRequest;
  switch (request.type) {
    case 'init':
      try {
        recognizer = createSpeechRecognizer(request.paths);
        post({ type: 'ready' });
      } catch (err) {
        post({ type: 'error', message: String(err) });
      }
      break;
    case 'audioPort': {
      const port = event.ports[0];
      port.on('message', (audioEvent) => {
        if (!recognizer) return;
        try {
          for (const text of recognizer.accept(audioEvent.data as Float32Array)) {
            post({ type: 'text', text });
          }
        } catch (err) {
          post({ type: 'error', message: String(err) });
        }
      });
      port.start();
      break;
    }
  }
});
