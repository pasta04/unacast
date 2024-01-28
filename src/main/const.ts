export const electronEvent = {
  /** サーバー起動 */
  START_SERVER: 'start-server',
  /** サーバー停止 */
  STOP_SERVER: 'stop-server',
  /** Config適用 */
  APPLY_CONFIG: 'apply-config',

  /** アラート表示 */
  SHOW_ALERT: 'show-alert',

  SAVE_CONFIG: 'save-config',

  /** 棒読み再生 */
  PLAY_TAMIYASU: 'play-tamiyasu',
  /** レス着信音再生 */
  PLAY_SOUND_START: 'play-sound-start',
  PLAY_SOUND_END: 'play-sound-end',

  WAIT_YOMIKO_TIME: 'wait-yomiko-time',
  SPEAK_WAV: 'speak-wav',
  ABORT_WAV: 'abort-wav',
  SPEAKING_END: 'speaking-end',

  // VOICEVOX の読み込み renderer → main
  LOAD_VOICEVOX: 'load-voicevox',
  // VOICEVOX の状態更新 renderer ← main
  UPDATE_VOICEVOX_CONFIG: 'update-voicevox-config',

  /** コメント表示 */
  SHOW_COMMENT: 'show-comment',
  /** コメント欄初期化 */
  CLEAR_COMMENT: 'clear-comment',

  /** 翻訳コメント表示 */
  SHOW_COMMENT_TL: 'show_comment_translate',

  /** サーバー起動の返信 */
  START_SERVER_REPLY: 'start-server-reply',

  /** 強制的に端にスクロール */
  FORCE_SCROLL: 'FORCE_SCROLL',

  /** ステータス更新 */
  UPDATE_STATUS: 'UPDATE_STATUS',

  /** コメントテスト */
  COMMENT_TEST: 'COMMENT_TEST',

  /** 画像プレビュー */
  PREVIEW_IMAGE: 'PREVIEW_IMAGE',

  /** Azure Speech To text **/
  AZURE_STT_START: 'azure-stt-start',
  AZURE_STT_STOP: 'azure-stt-stop',
  AZURE_STT_EVENT: 'azure-stt-event',
};
