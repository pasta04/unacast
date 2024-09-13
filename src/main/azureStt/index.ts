/**
 * azure speech to text
 */
import { ipcMain } from 'electron';
import { electronEvent } from '../const';
import { EventEmitter } from '../EventEmitter';
import electronlog from 'electron-log';
const logger = electronlog.scope('azureStt');

type EventMap = {
  comment: [item: UserComment];
  start: [];
  end: [reason: string];
  error: [error: Error];
};
class AzureSpeechToText extends EventEmitter<EventMap> {
  name: string;
  key: string;
  region: string;
  language: string;
  inputDevice?: string;
  constructor(name: string, key: string, region: string, language: string, inputDevice?: string) {
    super();
    if (!key) throw TypeError('key required.');
    if (!region) throw TypeError('Region required.');
    this.name = name;
    this.key = key;
    this.region = region;
    this.language = language;
    this.inputDevice = inputDevice;
    ipcMain.on(electronEvent.AZURE_STT_EVENT, (event: any, event_name: keyof EventMap, arg?: { date: string; text: string }) => {
      if (arg) {
        const item: UserComment = {
          name: this.name,
          date: arg.date,
          text: arg.text,
          imgUrl: globalThis.electron.iconList.getBbs(),
          from: 'stt',
        };
        if (event_name === 'comment') {
          this.emit(event_name, item);
        }
      } else {
        this.emit(event_name);
      }
    });
  }

  public async start() {
    logger.info('starting');
    globalThis.electron.mainWindow.webContents.send(electronEvent.AZURE_STT_START, { key: this.key, region: this.region, language: this.language, inputDevice: this.inputDevice });
  }

  public async stop() {
    logger.info('stopping');
    globalThis.electron.mainWindow.webContents.send(electronEvent.AZURE_STT_STOP);
  }

  // イベント
  public on(event: 'comment', listener: (comment: UserComment) => void): this;
  // 接続開始時
  public on(event: 'start', listener: () => void): this;
  // 停止した時
  public on(event: 'end', listener: (reason?: string) => void): this;
  // 何かエラーあった時
  public on(event: 'error', listener: (err: Error) => void): this;
  public on(event: keyof EventMap, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
}

export default AzureSpeechToText;
