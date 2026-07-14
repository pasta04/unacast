import type {} from '../../types/global';

export type AppConfig = (typeof globalThis)['config'];

export const defaultConfig: AppConfig = {
  url: '',
  resNumber: '',
  initMessage: 'スレッド読み込みを開始しました',
  port: 3000,
  interval: 10,
  dispNumber: NaN,
  youtubeId: '',
  youtubeLiveId: '',
  twitchId: '',
  niconicoId: '',
  twitcastingId: '',
  jpnknFastBoardId: '',
  dispSort: false,
  minDisplayTime: 2.5,
  newLine: true,
  showIcon: true,
  showNumber: true,
  showName: false,
  showTime: false,
  wordBreak: true,
  thumbnail: 0,
  hideImgUrl: false,
  emoteAnimation: false,
  emoteSize: 1,
  iconDirBbs: '',
  iconDirYoutube: '',
  iconDirTwitch: '',
  iconDirNiconico: '',
  iconDirTwitcasting: '',
  iconDirStt: '',
  sePath: '',
  playSeVolume: 100,
  playSe: false,
  playSeStt: false,
  typeYomiko: 'none',
  typeYomikoStt: 'none',
  yomikoDictionary: [
    { pattern: "h?ttps?://[A-Za-z0-9:/?#\\[\\]@!$&'()*+.,;=%-]+", pronunciation: 'URL' },
    { pattern: 'www+', pronunciation: 'わらわら' },
    { pattern: 'ｗｗｗ+', pronunciation: 'わらわら' },
  ],
  tamiyasuPath: '',
  bouyomiPort: 50001,
  bouyomiVolume: 50,
  voicevox: {
    path: '',
    engineUrl: '',
    speakerAndStyle: '',
  },
  yomikoReplaceNewline: false,
  yomikoOmit: {
    enable: false,
    maxLength: 100,
  },
  yomikoTemplate: { default: '{text}', perSource: {} },
  bbsAnonymousName: '',
  notifyThreadConnectionErrorLimit: 0,
  notifyThreadResLimit: 0,
  moveThread: true,
  autoCreateThread: { enable: false, resThreshold: 950 },
  commentProcessType: 0,
  dispType: 0,
  aamode: {
    enable: true,
    condition: {
      length: 200,
      words: ['д', '（●）', '从', '）)ﾉヽ', '∀', '<●>', '（__人__）'],
    },
    speakWord: 'アスキーアート',
  },
  translate: {
    enable: true,
    targetLang: 'ja',
  },
  azureStt: {
    enable: true,
    name: '',
    key: '',
    region: '',
    language: 'ja-JP',
    inputDevice: 'default',
  },
  audioOutputDevices: ['default'],
  external: {
    enabled: false,
    iconDir: '',
  },
  sourceFilter: {
    broadcast: {
      bbs: true,
      jpnkn: true,
      youtube: true,
      twitch: true,
      niconico: true,
      twitcasting: true,
      stt: true,
      external: true,
    },
  },
  ngWords: [],
};

const STORAGE_KEY = 'config';

export const loadConfigFromStorage = (): AppConfig => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...defaultConfig };
  try {
    const stored = JSON.parse(raw) as Partial<AppConfig>;
    return {
      ...defaultConfig,
      ...stored,
      // トップレベルの浅いマージだけだと、後から増えたネストのキー (engineUrl 等) が
      // 旧保存データで欠けたままになるため、ネストしたオブジェクトは既定値で補完する
      voicevox: { ...defaultConfig.voicevox, ...stored.voicevox },
      yomikoOmit: { ...defaultConfig.yomikoOmit, ...stored.yomikoOmit },
    };
  } catch {
    return { ...defaultConfig };
  }
};

export const saveConfigToStorage = (config: AppConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};
