import { create } from 'zustand';
import { AppConfig, defaultConfig, loadConfigFromStorage, saveConfigToStorage } from './config';

export type ConnectionStatusKey =
  | 'bbs'
  | 'bbsTitle'
  | 'jpnknFast'
  | 'youtube'
  | 'youtubeLiveId'
  | 'twitch'
  | 'niconico'
  | 'twitcasting'
  | 'stt'
  | 'voicevox';

export type VoicevoxSpeakerOption = {
  /** "speaker\\style" 形式の value */
  value: string;
  /** 表示用ラベル */
  label: string;
};

export type AudioOutputDevice = {
  deviceId: string;
  label: string;
};

export type AudioInputDevice = {
  deviceId: string;
  label: string;
};

export type AlertState = {
  open: boolean;
  message: string;
};

type ConfigSetter<T extends keyof AppConfig> = (value: AppConfig[T]) => void;

export type StoreState = {
  /** ユーザ設定（フォームの値そのもの） */
  config: AppConfig;
  /** 接続状況など、サーバ側からの状態 */
  status: Record<ConnectionStatusKey, string>;
  voicevoxSpeakers: VoicevoxSpeakerOption[];
  audioOutputs: AudioOutputDevice[];
  audioInputs: AudioInputDevice[];
  /** サーバ起動中かどうか */
  isServerRunning: boolean;
  /** 適用ボタンが押せるか */
  isConfigReady: boolean;
  /** 設定変更ダイアログ系 */
  alert: AlertState;
  confirmStopOpen: boolean;
  dictionaryDialogOpen: boolean;

  setConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => void;
  patchConfig: (patch: Partial<AppConfig>) => void;
  replaceConfig: (config: AppConfig) => void;

  setStatus: (key: ConnectionStatusKey, value: string) => void;

  setVoicevoxSpeakers: (speakers: VoicevoxSpeakerOption[]) => void;
  setAudioOutputs: (devices: AudioOutputDevice[]) => void;
  setAudioInputs: (devices: AudioInputDevice[]) => void;

  setServerRunning: (running: boolean) => void;
  setConfigReady: (ready: boolean) => void;

  openAlert: (message: string) => void;
  closeAlert: () => void;
  setConfirmStopOpen: (open: boolean) => void;
  setDictionaryDialogOpen: (open: boolean) => void;

  /** 現在の config をローカルストレージへ保存 */
  persist: () => void;
};

const initialStatus: Record<ConnectionStatusKey, string> = {
  bbs: 'none',
  bbsTitle: '',
  jpnknFast: 'none',
  youtube: 'none',
  youtubeLiveId: 'none',
  twitch: 'none',
  niconico: 'none',
  twitcasting: 'none',
  stt: 'none',
  voicevox: 'none',
};

export const useAppStore = create<StoreState>((set, get) => ({
  config: loadConfigFromStorage(),
  status: { ...initialStatus },
  voicevoxSpeakers: [],
  audioOutputs: [],
  audioInputs: [],
  isServerRunning: false,
  isConfigReady: false,
  alert: { open: false, message: '' },
  confirmStopOpen: false,
  dictionaryDialogOpen: false,

  setConfig: (key, value) =>
    set((state) => ({
      config: { ...state.config, [key]: value },
    })),
  patchConfig: (patch) =>
    set((state) => ({
      config: { ...state.config, ...patch },
    })),
  replaceConfig: (config) => set({ config }),

  setStatus: (key, value) =>
    set((state) => ({
      status: { ...state.status, [key]: value },
    })),

  setVoicevoxSpeakers: (speakers) => set({ voicevoxSpeakers: speakers }),
  setAudioOutputs: (devices) => set({ audioOutputs: devices }),
  setAudioInputs: (devices) => set({ audioInputs: devices }),

  setServerRunning: (running) => set({ isServerRunning: running }),
  setConfigReady: (ready) => set({ isConfigReady: ready }),

  openAlert: (message) => set({ alert: { open: true, message } }),
  closeAlert: () => set({ alert: { open: false, message: '' } }),
  setConfirmStopOpen: (open) => set({ confirmStopOpen: open }),
  setDictionaryDialogOpen: (open) => set({ dictionaryDialogOpen: open }),

  persist: () => saveConfigToStorage(get().config),
}));

/** defaultConfig をフォームの初期値再設定などで使うためにエクスポートしておく */
export { defaultConfig };

/** 個別キーの setter を 1 つだけ subscribe したい場合のヘルパー */
export const makeConfigSetter =
  <K extends keyof AppConfig>(key: K): ConfigSetter<K> =>
  (value) =>
    useAppStore.getState().setConfig(key, value);
