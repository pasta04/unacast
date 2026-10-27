/**
 * VAD で発話を区切って認識する処理の本体。
 * utilityProcess (worker.ts) 内で動かすため Electron に依存しない。
 * sherpa-onnx は import 時に大きな WebAssembly を同期コンパイルするので、main プロセスからは import しないこと。
 */
import sherpa_onnx from 'sherpa-onnx';

/** 認識モデルが受け付けるサンプルレート */
export const SAMPLE_RATE = 16000;
const bufferSizeInSeconds = 30;

export type ModelPaths = {
  encoder: string;
  decoder: string;
  joiner: string;
  tokens: string;
  vad: string;
};

export type SpeechRecognizer = {
  /** 16kHz モノラルの音声を投入し、区切りが確定した発話の認識結果を返す (無ければ空配列) */
  accept(data: Float32Array): string[];
};

export const createSpeechRecognizer = (paths: ModelPaths): SpeechRecognizer => {
  const recognizer = sherpa_onnx.createOfflineRecognizer({
    featConfig: {
      sampleRate: SAMPLE_RATE,
      featureDim: 80,
    },
    modelConfig: {
      transducer: {
        encoder: paths.encoder,
        decoder: paths.decoder,
        joiner: paths.joiner,
      },
      tokens: paths.tokens,
      numThreads: 1,
      provider: 'cpu',
      debug: false,
    },
  });

  const vad = sherpa_onnx.createVad(
    {
      sileroVad: {
        model: paths.vad,
        threshold: 0.25,
        minSpeechDuration: 0.1,
        minSilenceDuration: 1.0,
        maxSpeechDuration: 10.0,
        windowSize: 512,
      },
      sampleRate: SAMPLE_RATE,
      debug: false,
      numThreads: 1,
      provider: 'cpu',
    },
    bufferSizeInSeconds * 2,
  );
  const buffer = sherpa_onnx.createCircularBuffer(bufferSizeInSeconds * SAMPLE_RATE);
  const windowSize: number = vad.config.sileroVad.windowSize;

  return {
    accept(data: Float32Array): string[] {
      buffer.push(data);
      while (buffer.size() > windowSize) {
        const samples = buffer.get(buffer.head(), windowSize);
        vad.acceptWaveform(samples);
        buffer.pop(windowSize);
      }

      const texts: string[] = [];
      while (!vad.isEmpty()) {
        const segment = vad.front();
        vad.pop();
        const stream = recognizer.createStream();
        // 発話の頭が欠けないよう、先頭に 0.9 秒の無音を足してから認識する
        const offset = SAMPLE_RATE * 0.9;
        const samples = new Float32Array(segment.samples.length + offset);
        samples.set(segment.samples, offset);
        stream.acceptWaveform(SAMPLE_RATE, samples);
        recognizer.decode(stream);
        const result = recognizer.getResult(stream);
        if (result.text.length > 0) texts.push(result.text);
      }
      return texts;
    },
  };
};
