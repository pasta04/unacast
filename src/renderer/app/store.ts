import { create } from 'zustand';
import { AppConfig, defaultConfig, loadConfigFromStorage, saveConfigToStorage } from './config';

export type ConnectionStatusKey = 'bbs' | 'bbsTitle' | 'jpnknFast' | 'youtube' | 'youtubeLiveId' | 'twitch' | 'niconico' | 'twitcasting' | 'stt' | 'voicevox';

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
  /** ユーザ設定（フォーム上の編集中の値） */
  config: AppConfig;
  /** 最後に「適用」または「サーバー起動」で送出した時点の設定スナップショット */
  appliedConfig: AppConfig;
  /** 接続状況など、サーバ側からの状態 */
  status: Record<ConnectionStatusKey, string>;
  voicevoxSpeakers: VoicevoxSpeakerOption[];
  /** 取得結果。null は未取得 (取得が走っていない/取得中) を表す。空配列は「取得したが 0 件」 */
  audioOutputs: AudioOutputDevice[] | null;
  audioInputs: AudioInputDevice[] | null;
  /** サーバ起動中かどうか */
  isServerRunning: boolean;
  /** 適用ボタンが押せるか */
  isConfigReady: boolean;
  /**
   * オーディオデバイス列挙の進行状態 (HeaderBar の案内表示に使う)。
   * loading = 取得中 / ready = 出力デバイス取得済み / gaveUp = リトライを使い切った
   */
  audioDeviceLoadStatus: 'loading' | 'ready' | 'gaveUp';
  /** 設定変更ダイアログ系 */
  alert: AlertState;
  confirmStopOpen: boolean;
  dictionaryDialogOpen: boolean;
  ngWordDialogOpen: boolean;

  setConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => void;
  patchConfig: (patch: Partial<AppConfig>) => void;
  replaceConfig: (config: AppConfig) => void;
  /** 現在の config を「適用済み」としてマーク（適用/起動ボタン押下時に呼ぶ） */
  markApplied: () => void;
  /**
   * main プロセスから SAVE_CONFIG で送られてきた config をマージする。
   * ユーザがフォーム上で編集中の項目を上書きしないように、
   * 「未編集 (config[k] === appliedConfig[k]) のフィールドだけ」新しい値を採用する。
   * appliedConfig 側は全フィールドを最新値で上書きする (差分検知の基準を更新)。
   */
  mergeFromServer: (incoming: AppConfig) => void;

  setStatus: (key: ConnectionStatusKey, value: string) => void;

  setVoicevoxSpeakers: (speakers: VoicevoxSpeakerOption[]) => void;
  setAudioOutputs: (devices: AudioOutputDevice[] | null) => void;
  setAudioInputs: (devices: AudioInputDevice[] | null) => void;

  setServerRunning: (running: boolean) => void;
  setConfigReady: (ready: boolean) => void;
  setAudioDeviceLoadStatus: (status: 'loading' | 'ready' | 'gaveUp') => void;

  openAlert: (message: string) => void;
  closeAlert: () => void;
  setConfirmStopOpen: (open: boolean) => void;
  setDictionaryDialogOpen: (open: boolean) => void;
  setNgWordDialogOpen: (open: boolean) => void;

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

const initialConfig = loadConfigFromStorage();

export const useAppStore = create<StoreState>((set, get) => ({
  config: initialConfig,
  appliedConfig: initialConfig,
  status: { ...initialStatus },
  voicevoxSpeakers: [],
  audioOutputs: null,
  audioInputs: null,
  isServerRunning: false,
  isConfigReady: false,
  audioDeviceLoadStatus: 'loading' as const,
  alert: { open: false, message: '' },
  confirmStopOpen: false,
  dictionaryDialogOpen: false,
  ngWordDialogOpen: false,

  setConfig: (key, value) =>
    set((state) => ({
      config: { ...state.config, [key]: value },
    })),
  patchConfig: (patch) =>
    set((state) => ({
      config: { ...state.config, ...patch },
    })),
  replaceConfig: (config) => set({ config, appliedConfig: config }),
  markApplied: () => set((state) => ({ appliedConfig: state.config })),
  mergeFromServer: (incoming) =>
    set((state) => {
      const nextConfig: AppConfig = { ...state.config };
      const nextApplied: AppConfig = { ...state.appliedConfig };
      (Object.keys(incoming) as (keyof AppConfig)[]).forEach((key) => {
        const incomingValue = incoming[key];
        // appliedConfig 側は常に最新化 (これにより「適用済み」基準が main 側に追従)
        (nextApplied[key] as AppConfig[typeof key]) = incomingValue;
        // ユーザが編集していないフィールドだけ、ローカルの config も新値で更新する
        // Object.is にしているのは dispNumber=NaN を「同じ」として扱うため
        if (Object.is(state.config[key], state.appliedConfig[key])) {
          (nextConfig[key] as AppConfig[typeof key]) = incomingValue;
        }
      });
      return { config: nextConfig, appliedConfig: nextApplied };
    }),

  setStatus: (key, value) =>
    set((state) => ({
      status: { ...state.status, [key]: value },
    })),

  setVoicevoxSpeakers: (speakers) => set({ voicevoxSpeakers: speakers }),
  setAudioOutputs: (devices) => set({ audioOutputs: devices }),
  setAudioInputs: (devices) => set({ audioInputs: devices }),

  setServerRunning: (running) => set({ isServerRunning: running }),
  setConfigReady: (ready) => set({ isConfigReady: ready }),
  setAudioDeviceLoadStatus: (status) => set({ audioDeviceLoadStatus: status }),

  openAlert: (message) => set({ alert: { open: true, message } }),
  closeAlert: () => set({ alert: { open: false, message: '' } }),
  setConfirmStopOpen: (open) => set({ confirmStopOpen: open }),
  setDictionaryDialogOpen: (open) => set({ dictionaryDialogOpen: open }),
  setNgWordDialogOpen: (open) => set({ ngWordDialogOpen: open }),

  persist: () => saveConfigToStorage(get().config),
}));

/** defaultConfig をフォームの初期値再設定などで使うためにエクスポートしておく */
export { defaultConfig };

/** 個別キーの setter を 1 つだけ subscribe したい場合のヘルパー */
export const makeConfigSetter =
  <K extends keyof AppConfig>(key: K): ConfigSetter<K> =>
  (value) =>
    useAppStore.getState().setConfig(key, value);
