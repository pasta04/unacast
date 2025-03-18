# unacast

掲示板のレスをYoutubeコメント風に表示したいという思想の元に開発されるツール

## 対応サービス

- 2ch互換掲示板(したらば含む)
- jpnkn Fastインターフェース
- Youtube Live
- Twitch
- ニコ生

## マニュアル

- [基本的な使い方](./documents/README.md)
- [詳細な使い方](./documents/詳細な使い方.md)
- [見た目のカスタム](./documents/見た目のカスタム.md)

## ビルド方法

Node.jsが入ってることが前提。

```
git clone https://github.com/pasta04/unacast.git
cd unacast
npm ci
npm run buildwin
```

Macの場合は`npm run buildmac`とすること。
