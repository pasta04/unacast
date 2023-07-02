import electron, { remote } from 'electron';
import electronlog from 'electron-log';
const log = electronlog.scope('renderer-main');
import { electronEvent } from '../main/const';
import { sleep } from '../main/util';
import 'material-design-lite'

const ipcRenderer = electron.ipcRenderer;

document.addEventListener('DOMContentLoaded', async () => {
  log.debug('DOM Content Loaded');
  // 設定のロード
  await loadConfigToLocalStrage();

  // 設定適用ボタン
  const applyButton = document.getElementById('button-config-apply') as HTMLInputElement;
  applyButton.onclick = () => {
    const config = buildConfigJson();
    log.debug('config=');
    log.debug(config);
    //設定情報をローカルストレージへ保存
    saveConfigToLocalStrage(config);

    ipcRenderer.send(electronEvent.APPLY_CONFIG, config);
  };

  // 起動・停止ボタン
  const startButton = document.getElementById('button-server-start') as HTMLInputElement;
  startButton.onclick = () => {
    // いじっちゃいけない設定を非活性に
    toggleInputFormDisable(true);

    //設定情報取得
    const config = buildConfigJson();
    log.debug('config=');
    log.debug(config);
    //設定情報をローカルストレージへ保存
    saveConfigToLocalStrage(config);

    // ポートを指定していない場合はエラー
    if (config.port === null || (config.port as any).length < 1) {
      return;
    }

    // URL表示
    const serverUrl = `http://localhost:${config.port}`;
    (document.getElementById('server-full-url') as HTMLInputElement).insertAdjacentHTML(
      'afterbegin',
      `<div style="cursor:pointer;color:blue;" onClick="urlopen('${serverUrl}')">${serverUrl}</div>`,
    );
    (document.getElementById('port-number-area') as HTMLInputElement).style.display = 'none';

    // サーバー開始メッセージを送信する
    const result = ipcRenderer.sendSync(electronEvent.START_SERVER, config);
    log.debug(` ${result}`);
    // サーバー起動・停止ボタン状態変更
    stopButton.disabled = false;
    startButton.disabled = true;
    return;
  };

  //サーバー停止ボタン
  const stopButton = document.getElementById('button-server-stop') as HTMLInputElement;
  stopButton.onclick = () => {
    //確認ダイアログを表示
    (dialog as any).showModal();
  };

  // 確認ダイアログのボタン
  const closeOkButton = document.getElementById('button-close-dialog-ok') as HTMLInputElement;
  const closeCancelButton = document.getElementById('button-close-dialog-cancel') as HTMLInputElement;
  // 停止確認ダイアログ
  const dialog = document.getElementById('close-dialog') as HTMLElement;

  // サーバー停止確認ダイアログ
  closeOkButton.onclick = () => {
    const result = ipcRenderer.sendSync(electronEvent.STOP_SERVER);
    log.debug('' + result);
    //ダイアログクローズ
    (dialog as any).close();

    (document.getElementById('server-full-url') as HTMLInputElement).innerHTML = '';
    (document.getElementById('port-number-area') as HTMLInputElement).style.display = 'block';

    toggleInputFormDisable(false);
    // サーバー起動・停止ボタン状態変更
    startButton.disabled = false;
    stopButton.disabled = true;
    return;
  };
  closeCancelButton.onclick = () => {
    //ダイアログクローズ
    (dialog as any).close();
    return;
  };

  // アラートダイアログのボタン
  const alertOkButton = document.getElementById('button-alert-dialog-ok') as HTMLInputElement;
  // 停止確認ダイアログ
  const alertDialog = document.getElementById('alert-dialog') as HTMLElement;
  alertOkButton.onclick = () => {
    //ダイアログクローズ
    (alertDialog as any).close();
    return;
  };

  // コメントテストボタン
  const commentTestButton = document.getElementById('button-comment-test') as HTMLInputElement;
  commentTestButton.onclick = () => {
    const config = buildConfigJson();
    ipcRenderer.send(electronEvent.COMMENT_TEST, config);
  };

  // 読み上げ辞書編集ボタン
  const editYomikoDictionary = document.getElementById('button-yomikoDictionary-edit') as HTMLInputElement;
  editYomikoDictionary.onclick = () => {
    //確認ダイアログを表示
    (document.getElementById('yomikoDictionary-dialog') as HTMLDialogElement).showModal();
  };
  (document.getElementById('button-yomikoDictionary-dialog-close') as HTMLButtonElement).onclick = () => {
    (document.getElementById('yomikoDictionary-dialog') as HTMLDialogElement).close();
  }
  (document.getElementById('button-yomikoDictionary-dialog-add') as HTMLButtonElement).onclick = () => {
    addYomikoDictionaryEntry('', '');
  };
});

const mainContextMenuInText = (target: HTMLInputElement) => {
  const menu = new remote.Menu();

  menu.append(
    new remote.MenuItem({
      label: 'Cut',
      type: 'normal',
      click: (menu, browser, event) => {
        const text = window.getSelection()?.toString() ?? '';
        if (!text) return;

        electron.clipboard.writeText(text);
        target.value = target.value.replace(text, '');
      },
    }),
  );

  menu.append(
    new remote.MenuItem({
      label: 'Copy',
      type: 'normal',
      click: (menu, browser, event) => {
        const text = window.getSelection()?.toString() ?? '';
        if (!text) return;

        electron.clipboard.writeText(text);
      },
    }),
  );

  menu.append(
    new remote.MenuItem({
      label: 'Paste',
      type: 'normal',
      click: (menu, browser, event) => {
        const text = electron.clipboard.readText();
        target.value = text;
      },
    }),
  );

  return menu;
};

const mainContextMenu = new remote.Menu();
mainContextMenu.append(
  new remote.MenuItem({
    label: '最前面表示',
    type: 'checkbox',
    checked: false,
    click: (e) => {
      remote.getCurrentWindow().setAlwaysOnTop(e.checked);
    },
  }),
);

// 右クリックメニュー
document.oncontextmenu = (e) => {
  e.preventDefault();
  const nodeName = (e.target as HTMLInputElement).nodeName;
  if (nodeName === 'INPUT') {
    // テキストボックスとか
    mainContextMenuInText(e.target as HTMLInputElement).popup({ window: remote.getCurrentWindow(), x: e.x, y: e.y });
  } else {
    // それ以外
    mainContextMenu.popup({ window: remote.getCurrentWindow(), x: e.x, y: e.y });
  }
};

/**
 * サーバ起動中にいじっちゃいけない設定の活性状態を切り替える
 * @param isDisabled 非活性ならtrue
 */
const toggleInputFormDisable = (isDisabled: boolean) => {
  (document.getElementById('text-port-number') as HTMLInputElement).disabled = isDisabled;
  (document.getElementById('text-youtube-id') as HTMLInputElement).disabled = isDisabled;
  (document.getElementById('text-youtube-liveid') as HTMLInputElement).disabled = isDisabled;
  (document.getElementById('text-twitch-id') as HTMLInputElement).disabled = isDisabled;
  (document.getElementById('text-niconico-id') as HTMLInputElement).disabled = isDisabled;
  (document.getElementById('text-jpnknFast-id') as HTMLInputElement).disabled = isDisabled;

  document.getElementsByName('dispSort').forEach((v, i) => {
    (v as HTMLInputElement).disabled = isDisabled;
    (v.parentNode as HTMLElement).style.backgroundColor = isDisabled ? 'lightgray' : '';
  });
  document.getElementsByName('dispType').forEach((v, i) => {
    (v as HTMLInputElement).disabled = isDisabled;
    (v.parentNode as HTMLElement).style.backgroundColor = isDisabled ? 'lightgray' : '';
  });

  (document.getElementById('checkbox-wordBreak') as any).disabled = isDisabled;
  (document.getElementById('checkbox-wordBreak') as any).parentNode.style.backgroundColor = isDisabled ? 'lightgray' : '';

  (document.getElementById('azureStt-enable') as HTMLInputElement).disabled = isDisabled;
  (document.getElementById('azureStt-name') as HTMLInputElement).disabled = isDisabled;
  (document.getElementById('azureStt-key') as HTMLInputElement).disabled = isDisabled;
  (document.getElementById('azureStt-region') as HTMLInputElement).disabled = isDisabled;
  (document.getElementById('azureStt-language') as HTMLInputElement).disabled = isDisabled;
  (document.getElementById('azureStt-inputDevice') as HTMLInputElement).disabled = isDisabled;
};

const addYomikoDictionaryEntry = (pattern: string, pronunciation: string) => {
  const yomikoDictionaryTableBody = document.getElementById('yomikoDictionary-table-body') as HTMLTableSectionElement;
  const createTextInput = (value: string) => {
    const inputDiv = document.createElement('div');
    inputDiv.classList.add('mdl-textfield', 'mdl-js-textfield');
    inputDiv.style.width = 'auto';
    const inputText = document.createElement('input');
    inputText.classList.add('mdl-textfield__input');
    inputText.type = 'text';
    inputText.value = value;
    inputDiv.appendChild(inputText);
    componentHandler.upgradeElement(inputDiv);
    return inputDiv;
  };
  const newRow = yomikoDictionaryTableBody.insertRow();
  const col0 = newRow.insertCell();
  col0.classList.add('mdl-data-table__cell--non-numeric');
  col0.appendChild(createTextInput(pattern));
  const col1 = newRow.insertCell();
  col1.classList.add('mdl-data-table__cell--non-numeric');
  col1.appendChild(createTextInput(pronunciation));
  const col2 = newRow.insertCell();
  const deleteButton = document.createElement('button');
  deleteButton.classList.add('mdl-button', 'mdl-js-button', 'mdl-button--fab', 'mdl-button--mini-fab', 'mdl-js-ripple-effect');
  deleteButton.innerHTML = '<i class="material-icons">delete</i>';
  deleteButton.onclick = () => {
    yomikoDictionaryTableBody.deleteRow(newRow.rowIndex - 1);
  };
  componentHandler.upgradeElement(deleteButton);
  col2.appendChild(deleteButton);
};

/**
 * 設定RenderのHTMLから、Configを取得する
 */
const buildConfigJson = () => {
  //画面から各種項目を取得する
  const url = (document.getElementById('text-url') as HTMLInputElement).value;
  const resNumber = (document.getElementById('text-res-number') as HTMLInputElement).value;
  const initMessage = (document.getElementById('text-init-message') as HTMLInputElement).value;
  const port = parseInt((document.getElementById('text-port-number') as HTMLInputElement).value);
  // const dispNumber = parseInt((document.getElementById('text-disp-number') as HTMLInputElement).value);
  const dispNumber = NaN;
  const interval = parseInt((document.getElementById('rangeSpan') as HTMLInputElement).value);
  const youtubeUrl = (document.getElementById('text-youtube-id') as HTMLInputElement).value;
  const youtubeLiveId = (document.getElementById('text-youtube-liveid') as HTMLInputElement).value;
  const twitchUrl = (document.getElementById('text-twitch-id') as HTMLInputElement).value;
  const niconicoUrl = (document.getElementById('text-niconico-id') as HTMLInputElement).value;
  const jpnknFastBoardId = (document.getElementById('text-jpnknFast-id') as HTMLInputElement).value;
  const sePath = (document.getElementById('text-se-path') as HTMLInputElement).value;
  const tamiyasuPath = (document.getElementById('text-tamiyasu-path') as HTMLInputElement).value;
  const bouyomiPort = parseInt((document.getElementById('text-bouyomi-port') as HTMLInputElement).value);
  const bouyomiVolume = parseInt((document.getElementById('bouyomi-volume') as HTMLInputElement).value);
  const bouyomiPrefix = (document.getElementById('text-bouyomi-prefix') as HTMLInputElement).value;
  const yomikoReplaceNewline = (document.getElementById('yomiko-replace-newline') as any).checked === true;

  // 読み上げ文字列置き換え
  const yomikoDictionaryTableBody = document.getElementById('yomikoDictionary-table-body') as HTMLTableSectionElement;
  const yomikoDictionary = [];
  for (let i = 0; i < yomikoDictionaryTableBody.rows.length; i++) {
    const row = yomikoDictionaryTableBody.rows.item(i);
    const pattern = row?.cells.item(0)?.getElementsByTagName('input').item(0)?.value;
    const pronunciation = row?.cells.item(1)?.getElementsByTagName('input').item(0)?.value || '';
    if (pattern) {
      yomikoDictionary.push({ pattern, pronunciation });
    }
  }

  // Azure Text To Speect
  const azureStt: typeof globalThis['config']['azureStt'] = {
    enable: (document.getElementById('azureStt-enable') as any).checked === true,
    name: (document.getElementById('azureStt-name') as HTMLInputElement).value,
    key: (document.getElementById('azureStt-key') as HTMLInputElement).value,
    region: (document.getElementById('azureStt-region') as HTMLInputElement).value,
    language: ((document.getElementById('azureStt-language') as HTMLSelectElement).value as typeof globalThis['config']['azureStt']['language']) ?? 'ja-JP',
    inputDevice: (document.getElementById('azureStt-inputDevice') as HTMLSelectElement).value,
  };

  const notifyThreadConnectionErrorLimit = parseInt((document.getElementById('text-notify-threadConnectionErrorLimit') as HTMLInputElement).value);
  const notifyThreadResLimit = parseInt((document.getElementById('text-notify-threadResLimit') as HTMLInputElement).value);
  // 自動レス移動
  const moveThread = (document.getElementById('moveThread') as any).checked === true;

  // アイコン表示設定
  const showIcon = (document.getElementById('checkbox-showIcon') as HTMLInputElement).checked === true;
  // レス番表示設定
  const showNumber = (document.getElementById('checkbox-showNumber') as HTMLInputElement).checked === true;
  // 名前表示設定
  const showName = (document.getElementById('checkbox-showName') as any).checked === true;
  // 時刻表示設定
  const showTime = (document.getElementById('checkbox-showTime') as any).checked === true;
  // 自動改行設定
  const wordBreak = (document.getElementById('checkbox-wordBreak') as any).checked === true;
  // 表示順序設定
  const dispSort = (document.getElementById('newResUp') as any).checked === false;
  // 表示秒数設定
  const minDisplayTime = parseFloat((document.getElementById('min-display-time') as any).value);
  // 本文改行設定
  const newLine = (document.getElementById('enableNewLine') as any).checked === true;

  // アイコンパス
  const iconDirBbs = (document.getElementById('icon_dir_bbs') as HTMLInputElement).value.trim();
  const iconDirYoutube = (document.getElementById('icon_dir_youtube') as HTMLInputElement).value.trim();
  const iconDirTwitch = (document.getElementById('icon_dir_twitch') as HTMLInputElement).value.trim();
  const iconDirNiconico = (document.getElementById('icon_dir_niconico') as HTMLInputElement).value.trim();
  const iconDirStt = (document.getElementById('icon_dir_stt') as HTMLInputElement).value.trim();

  // SE再生設定
  const playSe = (document.getElementById('checkbox-playSe') as any).checked === true;
  const playSeStt = (document.getElementById('checkbox-playSeStt') as any).checked === true;
  const playSeVolume = parseInt((document.getElementById('playSe-volume') as HTMLInputElement).value);

  let thumbnail: typeof globalThis['config']['thumbnail'] = 0;
  document.getElementsByName('thumbnail').forEach((v) => {
    const elem = v as HTMLInputElement;
    if (elem.checked) thumbnail = Number(elem.value) as typeof globalThis['config']['thumbnail'];
  });
  const hideImgUrl = (document.getElementById('checkbox-hideImgUrl') as any).checked === true;

  // エモート表示
  const emoteAnimation = (document.getElementById('checkbox-emoteAnimation') as HTMLInputElement).checked === true;

  let emoteSize: typeof globalThis['config']['emoteSize'] = 1;
  document.getElementsByName('emoteSize').forEach((v) => {
    const elem = v as HTMLInputElement;
    if (elem.checked) emoteSize = Number(elem.value) as typeof globalThis['config']['emoteSize'];
  });

  let typeYomiko: typeof globalThis['config']['typeYomiko'] = 'none';
  document.getElementsByName('typeYomiko').forEach((v) => {
    const elem = v as HTMLInputElement;
    if (elem.checked) typeYomiko = elem.value as typeof globalThis['config']['typeYomiko'];
  });

  let typeYomikoStt: typeof globalThis['config']['typeYomikoStt'] = 'none';
  document.getElementsByName('typeYomikoStt').forEach((v) => {
    const elem = v as HTMLInputElement;
    if (elem.checked) typeYomikoStt = elem.value as typeof globalThis['config']['typeYomikoStt'];
  });


  // コメント処理
  let commentProcessType: typeof globalThis['config']['commentProcessType'] = 0;
  document.getElementsByName('commentProcessType').forEach((v) => {
    const elem = v as HTMLInputElement;
    if (elem.checked) commentProcessType = Number(elem.value) as typeof globalThis['config']['commentProcessType'];
  });

  let dispType: typeof globalThis['config']['dispType'] = 0;
  document.getElementsByName('dispType').forEach((v) => {
    const elem = v as HTMLInputElement;
    if (elem.checked) dispType = Number(elem.value) as typeof globalThis['config']['dispType'];
  });

  // AAモード
  const aamode: typeof globalThis['config']['aamode'] = {
    enable: (document.getElementById('aamode_enable') as any).checked === true,
    condition: {
      length: parseInt((document.getElementById('aamode_condition_length') as HTMLInputElement).value),
      words: [],
    },
    speakWord: 'アスキーアート',
  };
  if (aamode.condition.length < 1) aamode.condition.length = 200;
  const aamodeConditionWords = (document.getElementById('aamode_condition_words') as HTMLTextAreaElement).value;
  aamode.condition.words = aamodeConditionWords.split(/\r|\r\n|\n/).filter((word) => !!word);

  // 翻訳
  let translate: typeof globalThis['config']['translate'] = null as any;
  try {
    translate = {
      enable: (document.getElementById('translate_enable') as any).checked === true,
      targetLang: ((document.getElementById('translate_targetLang') as HTMLSelectElement).value as typeof globalThis['config']['translate']['targetLang']) ?? 'ja',
    };
  } catch (e) {
    translate = {
      enable: true,
      targetLang: globalThis.config.translate.targetLang,
    };
  }

  // 音声出力先
  const audioOutputDevices: string[] = [];
  document.getElementsByName('audioOutputDevices').forEach((val) => {
    const isChecked = (val as HTMLInputElement).checked;
    const id = (val as HTMLInputElement).id.replace('audioOutputDevices_', '');
    if (isChecked) {
      // log.info('出力先：' + id);
      audioOutputDevices.push(id);
    }
  });

  const config: typeof globalThis['config'] = {
    url: url,
    yomikoDictionary,
    resNumber,
    initMessage,
    port,
    dispNumber,
    interval,
    youtubeId: youtubeUrl,
    youtubeLiveId: youtubeLiveId,
    twitchId: twitchUrl,
    niconicoId: niconicoUrl,
    jpnknFastBoardId,
    dispSort,
    minDisplayTime,
    newLine,
    showIcon,
    showNumber,
    showName,
    showTime,
    wordBreak,
    thumbnail,
    hideImgUrl,
    emoteAnimation,
    emoteSize,
    iconDirBbs,
    iconDirYoutube,
    iconDirTwitch,
    iconDirNiconico,
    iconDirStt,
    sePath,
    playSe,
    playSeStt,
    playSeVolume,
    typeYomiko,
    typeYomikoStt,
    tamiyasuPath,
    bouyomiPort,
    bouyomiVolume,
    bouyomiPrefix,
    yomikoReplaceNewline,
    notifyThreadConnectionErrorLimit,
    notifyThreadResLimit,
    moveThread,
    commentProcessType,
    dispType,
    aamode,
    azureStt,
    translate,
    audioOutputDevices,
  };

  return config;
};

/**
 * 設定をローカルストレージへ保存する
 * サーバー起動時に呼び出される
 */
const saveConfigToLocalStrage = (config: typeof globalThis['config']) => {
  localStorage.setItem('config', JSON.stringify(config));
  log.debug('config saved');
};

/**
 * ローカルストレージから設定をロードする
 */
const loadConfigToLocalStrage = async () => {
  const initConfig: typeof globalThis['config'] = {
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
    iconDirStt: '',
    sePath: '',
    playSeVolume: 100,
    playSe: false,
    playSeStt: false,
    typeYomiko: 'none',
    typeYomikoStt: 'none',
    yomikoDictionary: [
      { pattern: 'h?ttps?://[A-Za-z0-9:/?#\\[\\]@!$&\'()*+.,;=%\-]+', pronunciation: 'URL' },
      { pattern: 'www+', pronunciation: 'わらわら' },
      { pattern: 'ｗｗｗ+', pronunciation: 'わらわら' },
    ],
    tamiyasuPath: '',
    bouyomiPort: 50001,
    bouyomiVolume: 50,
    bouyomiPrefix: '',
    yomikoReplaceNewline: false,
    notifyThreadConnectionErrorLimit: 0,
    notifyThreadResLimit: 0,
    moveThread: true,
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
      name: "",
      key: "",
      region: "",
      language: "ja-JP",
      inputDevice: "default",
    },
    audioOutputDevices: ['default'],
  };

  const storageStr = localStorage.getItem('config');
  const storageJson: typeof globalThis['config'] = storageStr ? JSON.parse(storageStr) : {};

  globalThis.config = {
    ...initConfig,
    ...storageJson,
  };

  // 表示に反映する
  // アイコン表示初期化
  (document.getElementById('checkbox-showIcon') as any).checked = config.showIcon;
  // レス番表示初期化
  (document.getElementById('checkbox-showNumber') as any).checked = config.showNumber;
  // 名前表示初期化
  (document.getElementById('checkbox-showName') as any).checked = config.showName;
  // 時刻表示初期化
  (document.getElementById('checkbox-showTime') as any).checked = config.showTime;
  // 自動改行初期化
  (document.getElementById('checkbox-wordBreak') as any).checked = config.wordBreak;
  // レス表示順ラジオ初期化
  if (config.dispSort) {
    (document.getElementById('newResDown') as any).checked = true;
  } else {
    (document.getElementById('newResUp') as any).checked = true;
  }

  // 改行設定初期化
  if (config.newLine) {
    (document.getElementById('enableNewLine') as any).checked = true;
  } else {
    (document.getElementById('disableNewLine') as any).checked = true;
  }

  (document.getElementById('text-port-number') as any).value = config.port;
  (document.getElementById('spanDisp') as any).innerHTML = config.interval;
  (document.getElementById('rangeSpan') as any).value = config.interval;
  (document.getElementById('text-init-message') as any).value = config.initMessage;
  (document.getElementById('text-url') as any).value = config.url;
  (document.getElementById('text-res-number') as any).value = config.resNumber.toString();
  (document.getElementById('text-youtube-id') as any).value = config.youtubeId;
  (document.getElementById('text-youtube-liveid') as any).value = config.youtubeLiveId;
  (document.getElementById('text-twitch-id') as any).value = config.twitchId;
  (document.getElementById('text-niconico-id') as any).value = config.niconicoId;
  (document.getElementById('text-jpnknFast-id') as any).value = config.jpnknFastBoardId;
  // レス着信音
  (document.getElementById('text-se-path') as any).value = config.sePath;
  (document.getElementById('checkbox-playSe') as any).checked = config.playSe;
  (document.getElementById('checkbox-playSeStt') as any).checked = config.playSeStt;
  (document.getElementById('disp-playSe-volume') as any).innerHTML = config.playSeVolume;
  (document.getElementById('playSe-volume') as any).value = config.playSeVolume;

  // サムネイル表示
  (document.getElementById(`thumbnail_${config.thumbnail}`) as any).checked = true;
  (document.getElementById('checkbox-hideImgUrl') as any).checked = config.hideImgUrl;

  // エモート表示
  (document.getElementById('checkbox-emoteAnimation') as any).checked = config.emoteAnimation;
  (document.getElementById(`emoteSize_${config.emoteSize}`) as any).checked = config.emoteSize;

  (document.getElementById('yomiko-replace-newline') as any).checked == config.yomikoReplaceNewline;

  // Iconパス
  (document.getElementById('icon_dir_bbs') as any).value = config.iconDirBbs;
  (document.getElementById('icon_dir_youtube') as any).value = config.iconDirYoutube;
  (document.getElementById('icon_dir_twitch') as any).value = config.iconDirTwitch;
  (document.getElementById('icon_dir_niconico') as any).value = config.iconDirNiconico;
  (document.getElementById('icon_dir_stt') as any).value = config.iconDirStt;

  // 読み子の種類
  switch (config.typeYomiko) {
    case 'none':
      (document.getElementById('yomiko_none') as any).checked = true;
      break;
    case 'tamiyasu':
      (document.getElementById('yomiko_tamiyasu') as any).checked = true;
      break;
    case 'bouyomi':
      (document.getElementById('yomiko_bouyomi') as any).checked = true;
      break;
  }

  switch (config.typeYomikoStt) {
    case 'none':
      (document.getElementById('yomiko_stt_none') as any).checked = true;
      break;
    case 'tamiyasu':
      (document.getElementById('yomiko_stt_tamiyasu') as any).checked = true;
      break;
    case 'bouyomi':
      (document.getElementById('yomiko_stt_bouyomi') as any).checked = true;
      break;
  }

  for (const entry of config.yomikoDictionary) {
    addYomikoDictionaryEntry(entry.pattern, entry.pronunciation);
  }

  switch (config.commentProcessType) {
    case 0:
    case 1:
      (document.getElementById(`commentProcessType_${config.commentProcessType}`) as any).checked = true;
      break;
  }

  switch (config.dispType) {
    case 0:
    case 1:
      (document.getElementById(`dispType_${config.dispType}`) as any).checked = true;
      break;
  }

  (document.getElementById('text-tamiyasu-path') as any).value = config.tamiyasuPath;
  (document.getElementById('text-bouyomi-port') as any).value = config.bouyomiPort;
  (document.getElementById('disp-bouyomi-volume') as any).innerHTML = config.bouyomiVolume;
  (document.getElementById('text-bouyomi-prefix') as any).value = config.bouyomiPrefix;
  (document.getElementById('bouyomi-volume') as any).value = config.bouyomiVolume;
  (document.getElementById('text-notify-threadConnectionErrorLimit') as any).value = config.notifyThreadConnectionErrorLimit;
  (document.getElementById('text-notify-threadResLimit') as any).value = config.notifyThreadResLimit;
  (document.getElementById('moveThread') as any).checked == config.moveThread;

  (document.getElementById('aamode_enable') as any).checked = config.aamode.enable;
  (document.getElementById('aamode_condition_length') as HTMLInputElement).value = config.aamode.condition.length.toString();
  (document.getElementById('aamode_condition_words') as HTMLTextAreaElement).value = config.aamode.condition.words.join('\n');

  (document.getElementById('min-display-time') as HTMLInputElement).value = config.minDisplayTime.toString();

  // 翻訳
  (document.getElementById('translate_enable') as any).checked = config.translate.enable;
  (document.getElementById('translate_targetLang') as HTMLSelectElement).value = config.translate.targetLang;

  // Azure Text To Speech
  (document.getElementById('azureStt-enable') as any).checked = config.azureStt.enable;
  (document.getElementById('azureStt-name') as any).value = config.azureStt.name;
  (document.getElementById('azureStt-key') as any).value = config.azureStt.key;
  (document.getElementById('azureStt-region') as any).value = config.azureStt.region;
  (document.getElementById('azureStt-language') as any).value = config.azureStt.language;

  // --------------------この下の処理でラジオボタンの処理が動かなくなるので、何か足す時はここより上に追記すること------------------------------

  // 使用可能なデバイスの一覧を取得
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audiooutput = devices.filter((device) => device.kind === 'audiooutput');
  // log.info(audiooutput);
  audiooutput.map((val) => {
    const checkedStr = globalThis.config.audioOutputDevices.includes(val.deviceId) ? 'checked' : '';
    const domstr = `
  <label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="audioOutputDevices_${val.deviceId}">
    <input type="checkbox" id="audioOutputDevices_${val.deviceId}" name="audioOutputDevices" class="mdl-checkbox__input" ${checkedStr} />
    <span class="mdl-checkbox__label">${val.label}</span>
  </label>
    `;
    (document.getElementById('audioOutputDevices') as HTMLDivElement).insertAdjacentHTML('afterbegin', domstr);
  });
  const audioinput = devices.filter((device) => device.kind === 'audioinput');
  audioinput.map((val) => {
    const domstr = `<option value="${val.deviceId}">${val.label}</option>`;
    (document.getElementById('azureStt-inputDevice') as HTMLDivElement).insertAdjacentHTML('afterbegin', domstr);
  });
  (document.getElementById('azureStt-inputDevice') as any).value = config.azureStt.inputDevice;

  log.debug('config loaded');
};

// サーバー起動返信
ipcRenderer.on(electronEvent.START_SERVER_REPLY, (event: any, arg: any) => {
  log.debug(arg);
});

// 着信音再生
ipcRenderer.on(electronEvent.PLAY_SOUND_START, (event: any, arg: { wavfilepath: string; volume: number; deviceId: string }) => {
  playSe(arg);
});

const playSe = async (arg: { wavfilepath: string; volume: number; deviceId: string }) => {
  const audioElem = new Audio();

  try {
    await (audioElem as any).setSinkId(arg.deviceId);
    audioElem.volume = arg.volume / 100;
    audioElem.src = arg.wavfilepath;
    audioElem.play();
    audioElem.onended = () => {
      ipcRenderer.send(electronEvent.PLAY_SOUND_END);
    };
    audioElem.onerror = () => {
      ipcRenderer.send(electronEvent.PLAY_SOUND_END);
    };
  } catch (e) {
    log.error(e);
    ipcRenderer.send(electronEvent.PLAY_SOUND_END);
  }
};

ipcRenderer.on(electronEvent.WAIT_YOMIKO_TIME, async (event: any, arg: string) => {
  await yomikoTime(arg);
  ipcRenderer.send(electronEvent.SPEAKING_END);
});

/**
 * 音声合成が終わってそうな頃にreturn返す
 * @param 読み込む文章
 */
const yomikoTime = async (msg: string) => {
  return new Promise<void>((resolve) => {
    const uttr = new globalThis.SpeechSynthesisUtterance(msg);
    uttr.volume = 0;
    uttr.onend = (event) => {
      resolve();
    };
    speechSynthesis.speak(uttr);

    // 10秒経ったら強制的に終わらせる
    sleep(10 * 1000).then(() => {
      resolve();
    });
  });
};

// 何かしら通知したいことがあったら表示する
ipcRenderer.on(electronEvent.SHOW_ALERT, async (event: any, args: string) => {
  // 停止確認ダイアログ
  ((document.getElementById('alert-dialog') as HTMLElement).getElementsByClassName('mdl-dialog__content')[0] as HTMLElement).innerText = args;

  const alertDialog = document.getElementById('alert-dialog') as HTMLElement;
  (alertDialog as any).showModal();
});

// 何かしら通知したいことがあったら表示する
ipcRenderer.on(electronEvent.UPDATE_STATUS, async (event: any, args: { commentType: 'bbs' | 'jpnkn' | 'youtube' | 'twitch' | 'niconico' | 'stt'; category: string; message: string }) => {
  log.debug(`[UPDATE_STATUS] commentType = ${args.commentType} category = ${args.category}`);
  switch (args.commentType) {
    case 'bbs': {
      if (args.category === 'title') {
        (document.getElementById('bbs-title') as HTMLElement).innerText = args.message;
      } else if (args.category === 'status') {
        (document.getElementById('bbs-connection-status') as HTMLElement).innerText = args.message;
      }
      break;
    }
    case 'jpnkn': {
      if (args.category === 'status') {
        (document.getElementById('jpnknFast-connection-status') as HTMLElement).innerText = args.message;
      }
      break;
    }
    case 'youtube': {
      if (args.category === 'status') {
        (document.getElementById('youtube-connection-status') as HTMLElement).innerText = args.message;
      } else {
        (document.getElementById('youtube-live-id') as HTMLElement).innerText = args.message;
      }
      break;
    }
    case 'twitch': {
      (document.getElementById('twitch-connection-status') as HTMLElement).innerText = args.message;
      break;
    }
    case 'niconico': {
      if (args.category === 'status') {
        (document.getElementById('niconico-connection-status') as HTMLElement).innerText = args.message;
      }
      break;
    }
    case 'stt': {
      if (args.category === 'status') {
        (document.getElementById('stt-status') as HTMLElement).innerText = args.message;
      }
      break;
    }
  }
});

// config保存
ipcRenderer.on(electronEvent.SAVE_CONFIG, async (event: any, arg: typeof globalThis.config) => {
  saveConfigToLocalStrage(arg);
});

ipcRenderer.on(electronEvent.PREVIEW_IMAGE, (event: any, url: string) => {
  window.electron.imagePreviewWindow.webContents.send(electronEvent.PREVIEW_IMAGE, url);
});

require('./azureStt');
