import net from 'net';

type Options = {
  host?: string;
  port?: number;
  speed?: number;
  tone?: number;
  volume?: number;
  type?: number;
  prefix?: string;
};

class BouyomiChan {
  constructor(options?: Options) {
    if (!options) return;
    if (options.host) this.host = options.host;
    if (options.port) this.port = options.port;
    if (options.speed) this.speed = options.speed;
    if (options.tone) this.tone = options.tone;
    if (options.volume) this.volume = options.volume;
    if (options.type) this.type = options.type;
    if (options.prefix) this.prefix = options.prefix;
  }

  /**
   * 棒読みちゃんのホスト
   */
  private host = 'localhost';
  /**
   * 棒読みちゃんのポート番号
   */
  private port = 50001;
  /**
   * 速度（-1:棒読みちゃん画面上の設定）
   */
  private speed = -1;
  /**
   * 音程（-1:棒読みちゃん画面上の設定）
   */
  private tone = -1;
  /**
   * 音量（-1:棒読みちゃん画面上の設定）
   */
  private volume = -1;
  /**
   * 声質（ 0:棒読みちゃん画面上の設定、1:女性1、2:女性2、3:男性1、4:男性2、5:中性、6:ロボット、7:機械1、8:機械2、10001～:SAPI5）
   */
  private type = 0;

  /**
   * 読み上げの際先頭に付加する文字列
   */
  private prefix = '';

  /**
   * @param message 棒読みちゃんに読み上げてもらう文章
   */
  speak(message: string) {
    /** 読み前に文字列を処理する */
    const concatMessage = this.prefix.concat(message);
    /** 棒読みちゃんに送信する設定のバイト長 */
    const SETTINGS_BYTES_LENGTH = 15;
    const messageByteLength = Buffer.byteLength(concatMessage);
    const bufferLength = SETTINGS_BYTES_LENGTH + messageByteLength;
    const buff = Buffer.alloc(bufferLength);
    /** メッセージ読み上げコマンド */
    const COMMAND_TO_SPEAK = 1;
    let len = buff.writeUInt16LE(COMMAND_TO_SPEAK);
    len = buff.writeInt16LE(this.speed, len);
    len = buff.writeInt16LE(this.tone, len);
    len = buff.writeInt16LE(this.volume, len);
    len = buff.writeUInt16LE(this.type, len);
    /** 文字コード(0:UTF-8, 1:Unicode, 2:Shift-JIS) */
    const ENCODING = 0;
    len = buff.writeUInt8(ENCODING, len);
    len = buff.writeUInt32LE(messageByteLength, len);
    buff.write(concatMessage, len);

    const client = net.createConnection(this.port, this.host);
    client.write(buff);
    client.end();
  }
}

export default BouyomiChan;
