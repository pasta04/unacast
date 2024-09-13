export interface IEventEmitter<Events extends Record<string, unknown[]>> {
  /**
   * イベントリスナーを登録する
   * @param event イベント名
   * @param listener イベントリスナー
   */
  on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this;

  /**
   * イベントリスナーを削除する
   * @param event
   * @param listener
   */
  off<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this;

  /**
   * イベントリスナーを一度だけ実行するように登録する
   * @param event
   * @param listener
   */
  once<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this;

  emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean;
}

export class EventEmitter<Events extends Record<string, unknown[]>> implements IEventEmitter<Events> {
  private readonly callbacksMap = new Map<string, Set<(...args: unknown[]) => void>>();

  /**
   * イベントリスナーを登録する
   * @param event イベント名
   * @param listener イベントリスナー
   */
  on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
    let callbacks = this.callbacksMap.get(event as string);
    if (callbacks === undefined) {
      callbacks = new Set();
      this.callbacksMap.set(event as string, callbacks);
    }
    callbacks.add(listener as (...args: unknown[]) => void);

    return this;
  }

  /**
   * イベントリスナーを削除する
   * @param event
   * @param listener
   */
  off<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
    const callbacks = this.callbacksMap.get(event as string);
    if (callbacks === undefined) return this;

    callbacks.delete(listener as (...args: unknown[]) => void);
    if (callbacks.size === 0) {
      this.callbacksMap.delete(event as string);
    }

    return this;
  }

  /**
   * イベントリスナーを一度だけ実行するように登録する
   * @param event
   * @param listener
   */
  once<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
    const onceListener = (...args: unknown[]) => {
      this.off(event, onceListener as typeof listener);
      (listener as (...args: unknown[]) => void)(...args);
    };

    return this.on(event, onceListener as typeof listener);
  }

  emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean {
    const callbacks = this.callbacksMap.get(event as string);
    if (callbacks === undefined) {
      return false;
    }
    for (const callback of callbacks) {
      callback(...args);
    }
    return true;
  }

  /**
   * 全てのイベントリスナーを削除する
   * @returns
   */
  public removeAllListeners(): this {
    const keys = this.callbacksMap.keys();
    for (const key of keys) {
      this.callbacksMap.delete(key);
    }
    return this;
  }
}
