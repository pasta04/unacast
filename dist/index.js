/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/main/main.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/main/CommentIcons.ts":
/*!**********************************!*\
  !*** ./src/main/CommentIcons.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * アイコン表示に関するモジュール
 */
var fs_1 = __importDefault(__webpack_require__(/*! fs */ "fs"));
var path_1 = __importDefault(__webpack_require__(/*! path */ "path"));
var electron_log_1 = __importDefault(__webpack_require__(/*! electron-log */ "electron-log"));
var log = electron_log_1.default.scope('ReadIcons');
var CommentIcons = /** @class */ (function () {
    function CommentIcons(arg) {
        var _this = this;
        this.bbsIconList = [];
        this.youtubeIconList = [];
        this.twitchIconList = [path_1.default.resolve(__dirname, "../public/img/twitch.png")];
        this.niconicoIconList = [path_1.default.resolve(__dirname, "../public/img/niconico.png")];
        this.sttIconList = [];
        // /**
        //  * アイコンランダム表示機能（デフォルト）
        //  * 起動時に作成したアイコンリストからランダムで1つ取得
        //  */
        // getRandomIcons = () => {
        //   let iconPath = '';
        //   try {
        //     const dirName = './img/random/';
        //     // リストからランダム取得
        //     //  const size = randomIconList.size;
        //     const num = Math.floor(bbsIconList.length * Math.random());
        //     iconPath = dirName + bbsIconList[num];
        //   } catch (e) {
        //     log.error(e);
        //   }
        //   return iconPath;
        // };
        this.getBbs = function () {
            var icon = '';
            try {
                var num = Math.floor(_this.bbsIconList.length * Math.random());
                var iconPath = _this.bbsIconList[num];
                icon = fs_1.default.readFileSync(iconPath, { encoding: 'base64' });
            }
            catch (e) {
                log.error(e);
            }
            return icon;
        };
        this.getYoutube = function () {
            var icon = '';
            try {
                var num = Math.floor(_this.youtubeIconList.length * Math.random());
                var iconPath = _this.youtubeIconList[num];
                icon = fs_1.default.readFileSync(iconPath, { encoding: 'base64' });
            }
            catch (e) {
                log.error(e);
            }
            return icon;
        };
        this.getYoutubeLogo = function () {
            var icon = '';
            try {
                var iconPath = path_1.default.resolve(__dirname, "../public/img/youtube.png");
                icon = fs_1.default.readFileSync(iconPath, { encoding: 'base64' });
            }
            catch (e) {
                log.error(e);
            }
            return icon;
        };
        this.getTwitch = function () {
            var icon = '';
            try {
                var num = Math.floor(_this.twitchIconList.length * Math.random());
                var iconPath = _this.twitchIconList[num];
                icon = fs_1.default.readFileSync(iconPath, { encoding: 'base64' });
            }
            catch (e) {
                log.error(e);
            }
            return icon;
        };
        this.getNiconico = function () {
            var icon = '';
            try {
                var num = Math.floor(_this.niconicoIconList.length * Math.random());
                var iconPath = _this.niconicoIconList[num];
                icon = fs_1.default.readFileSync(iconPath, { encoding: 'base64' });
            }
            catch (e) {
                log.error(e);
            }
            return icon;
        };
        this.getStt = function () {
            var icon = '';
            // 専用アイコンがなければ BBS のアイコンを使う
            var list = _this.sttIconList.length !== 0 ? _this.sttIconList : _this.bbsIconList;
            try {
                var num = Math.floor(list.length * Math.random());
                var iconPath = list[num];
                icon = fs_1.default.readFileSync(iconPath, { encoding: 'base64' });
            }
            catch (e) {
                log.error(e);
            }
            return icon;
        };
        var randomDir = fs_1.default.existsSync(arg.bbs) ? arg.bbs : path_1.default.resolve(__dirname, "../public/img/random/");
        log.debug('loadRandomDir = ' + randomDir);
        this.bbsIconList = readDir(randomDir);
        if (fs_1.default.existsSync(arg.youtube)) {
            this.youtubeIconList = readDir(arg.youtube);
        }
        if (fs_1.default.existsSync(arg.twitch)) {
            var list = readDir(arg.twitch);
            if (list.length > 0)
                this.twitchIconList = list;
        }
        if (fs_1.default.existsSync(arg.niconico)) {
            var list = readDir(arg.niconico);
            if (list.length > 0)
                this.niconicoIconList = list;
        }
        if (fs_1.default.existsSync(arg.stt)) {
            var list = readDir(arg.stt);
            if (list.length > 0)
                this.sttIconList = list;
        }
        log.debug(this.bbsIconList);
        log.debug(this.youtubeIconList);
        log.debug(this.twitchIconList);
        log.debug(this.niconicoIconList);
        log.debug(this.sttIconList);
    }
    return CommentIcons;
}());
var readDir = function (imgDir) {
    var iconFileList = [];
    //  指定したディレクトリのアイコン取得
    var files = fs_1.default.readdirSync(imgDir, { withFileTypes: true });
    //pngファイルのみ返却リストに格納する
    files.forEach(function (file) {
        // asar圧縮するとfileが文字列になる。開発環境だとfileオブジェクトになる
        var target = typeof file.name !== 'string' ? file : file.name;
        var regx = /.*\.png$/.test(target);
        if (regx) {
            iconFileList.push(path_1.default.join(imgDir, target));
        }
    });
    return iconFileList;
};
exports.default = CommentIcons;


/***/ }),

/***/ "./src/main/azureStt/index.ts":
/*!************************************!*\
  !*** ./src/main/azureStt/index.ts ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * azure speech to text
 */
var electron_1 = __webpack_require__(/*! electron */ "electron");
var const_1 = __webpack_require__(/*! ../const */ "./src/main/const.ts");
var events_1 = __webpack_require__(/*! events */ "events");
var electron_log_1 = __importDefault(__webpack_require__(/*! electron-log */ "electron-log"));
var logger = electron_log_1.default.scope('azureStt');
var AzureSpeechToText = /** @class */ (function (_super) {
    __extends(AzureSpeechToText, _super);
    function AzureSpeechToText(name, key, region, language, inputDevice) {
        var _this = _super.call(this) || this;
        if (!key)
            throw TypeError('key required.');
        if (!region)
            throw TypeError('Region required.');
        _this.name = name;
        _this.key = key;
        _this.region = region;
        _this.language = language;
        _this.inputDevice = inputDevice;
        electron_1.ipcMain.on(const_1.electronEvent.AZURE_STT_EVENT, function (event, event_name, arg) {
            if (arg) {
                var item = {
                    name: _this.name,
                    date: arg.date,
                    text: arg.text,
                    imgUrl: globalThis.electron.iconList.getBbs(),
                    from: 'stt',
                };
                _this.emit(event_name, item);
            }
            else {
                _this.emit(event_name);
            }
        });
        return _this;
    }
    AzureSpeechToText.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                logger.info('starting');
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.AZURE_STT_START, { key: this.key, region: this.region, language: this.language, inputDevice: this.inputDevice });
                return [2 /*return*/];
            });
        });
    };
    AzureSpeechToText.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                logger.info('stopping');
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.AZURE_STT_STOP);
                return [2 /*return*/];
            });
        });
    };
    AzureSpeechToText.prototype.on = function (event, listener) {
        return _super.prototype.on.call(this, event, listener);
    };
    return AzureSpeechToText;
}(events_1.EventEmitter));
exports.default = AzureSpeechToText;


/***/ }),

/***/ "./src/main/bouyomi-chan/index.ts":
/*!****************************************!*\
  !*** ./src/main/bouyomi-chan/index.ts ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var net_1 = __importDefault(__webpack_require__(/*! net */ "net"));
var BouyomiChan = /** @class */ (function () {
    function BouyomiChan(options) {
        /**
         * 棒読みちゃんのホスト
         */
        this.host = 'localhost';
        /**
         * 棒読みちゃんのポート番号
         */
        this.port = 50001;
        /**
         * 速度（-1:棒読みちゃん画面上の設定）
         */
        this.speed = -1;
        /**
         * 音程（-1:棒読みちゃん画面上の設定）
         */
        this.tone = -1;
        /**
         * 音量（-1:棒読みちゃん画面上の設定）
         */
        this.volume = -1;
        /**
         * 声質（ 0:棒読みちゃん画面上の設定、1:女性1、2:女性2、3:男性1、4:男性2、5:中性、6:ロボット、7:機械1、8:機械2、10001～:SAPI5）
         */
        this.type = 0;
        /**
         * 読み上げの際先頭に付加する文字列
         */
        this.prefix = '';
        if (!options)
            return;
        if (options.host)
            this.host = options.host;
        if (options.port)
            this.port = options.port;
        if (options.speed)
            this.speed = options.speed;
        if (options.tone)
            this.tone = options.tone;
        if (options.volume)
            this.volume = options.volume;
        if (options.type)
            this.type = options.type;
        if (options.prefix)
            this.prefix = options.prefix;
    }
    /**
     * @param message 棒読みちゃんに読み上げてもらう文章
     */
    BouyomiChan.prototype.speak = function (message) {
        /** 読み前に文字列を処理する */
        var concatMessage = this.prefix.concat(message);
        /** 棒読みちゃんに送信する設定のバイト長 */
        var SETTINGS_BYTES_LENGTH = 15;
        var messageByteLength = Buffer.byteLength(concatMessage);
        var bufferLength = SETTINGS_BYTES_LENGTH + messageByteLength;
        var buff = Buffer.alloc(bufferLength);
        /** メッセージ読み上げコマンド */
        var COMMAND_TO_SPEAK = 1;
        var len = buff.writeUInt16LE(COMMAND_TO_SPEAK);
        len = buff.writeInt16LE(this.speed, len);
        len = buff.writeInt16LE(this.tone, len);
        len = buff.writeInt16LE(this.volume, len);
        len = buff.writeUInt16LE(this.type, len);
        /** 文字コード(0:UTF-8, 1:Unicode, 2:Shift-JIS) */
        var ENCODING = 0;
        len = buff.writeUInt8(ENCODING, len);
        len = buff.writeUInt32LE(messageByteLength, len);
        len = buff.write(concatMessage, len);
        var client = net_1.default.createConnection(this.port, this.host);
        client.write(buff);
        client.end();
    };
    return BouyomiChan;
}());
exports.default = BouyomiChan;


/***/ }),

/***/ "./src/main/const.ts":
/*!***************************!*\
  !*** ./src/main/const.ts ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.electronEvent = void 0;
exports.electronEvent = {
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


/***/ }),

/***/ "./src/main/getRes.ts":
/*!****************************!*\
  !*** ./src/main/getRes.ts ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.threadUrlToBoardInfo = exports.postResponse = exports.getThreadList = exports.getRes = void 0;
var axios_1 = __importDefault(__webpack_require__(/*! axios */ "axios"));
var iconv_lite_1 = __importDefault(__webpack_require__(/*! iconv-lite */ "iconv-lite")); // 文字コード変換用パッケージ
var express_1 = __importDefault(__webpack_require__(/*! express */ "express"));
var body_parser_1 = __importDefault(__webpack_require__(/*! body-parser */ "body-parser")); // jsonパーサ
var router = express_1.default.Router();
var electron_log_1 = __importDefault(__webpack_require__(/*! electron-log */ "electron-log"));
var log = electron_log_1.default.scope('bbs');
var startServer_1 = __webpack_require__(/*! ./startServer */ "./src/main/startServer.ts");
var util_1 = __webpack_require__(/*! ./util */ "./src/main/util.ts");
var readSitaraba_1 = __importStar(__webpack_require__(/*! ./readBBS/readSitaraba */ "./src/main/readBBS/readSitaraba.ts")); // したらば読み込み用モジュール
var Read5ch_1 = __importStar(__webpack_require__(/*! ./readBBS/Read5ch */ "./src/main/readBBS/Read5ch.ts")); // 5ch互換板読み込み用モジュール
var sitaraba = new readSitaraba_1.default();
var read5ch = new Read5ch_1.default();
// 掲示板読み込みモジュール、一度決定したら使いまわすためにグローバル宣言
var bbsModule = null;
// リクエストのbodyをパース下りエンコードしたりするためのやつ
router.use(body_parser_1.default.urlencoded({ extended: true }));
router.use(body_parser_1.default.json());
/**
 * ブラウザからの初期処理リクエスト
 */
router.get('/', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var threadUrl, resNum, result, doms;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                log.info('access /');
                threadUrl = globalThis.config.url;
                resNum = globalThis.config.resNumber ? Number(globalThis.config.resNumber) : NaN;
                log.info("threadUrl=" + threadUrl + " resNum=" + resNum);
                if (!resNum) {
                    res.send(JSON.stringify([]));
                    return [2 /*return*/];
                }
                res.header('Content-Type', 'application/json; charset=UTF-8');
                return [4 /*yield*/, exports.getRes(threadUrl, resNum)];
            case 1:
                result = _a.sent();
                result = result.filter(function (item) { return item.from !== 'system'; });
                doms = util_1.judgeAaMessage(result).map(function (item) { return startServer_1.createDom(item, 'server', item.isAA); });
                res.send(JSON.stringify(doms));
                return [2 /*return*/];
        }
    });
}); });
/**
 * 掲示板のレスを取得する
 * @param threadUrl スレのURL
 * @param resNum この番号以降を取得する。指定しない場合は全件取得
 */
var getRes = function (threadUrl, resNum) { return __awaiter(void 0, void 0, void 0, function () {
    var response, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                // リクエストURLを解析し、使用するモジュールを変更する
                bbsModule = analysBBSName(threadUrl);
                return [4 /*yield*/, bbsModule.read(threadUrl, resNum)];
            case 1:
                response = _a.sent();
                globalThis.electron.threadConnectionError = 0;
                log.info("fetch " + threadUrl + " resNum = " + resNum + ", result = " + response.length + " lastResNum=" + (response.length > 0 ? response[response.length - 1].number : '-'));
                return [2 /*return*/, response.map(function (res) {
                        return __assign(__assign({}, res), { imgUrl: globalThis.electron.iconList.getBbs() });
                    })];
            case 2:
                e_1 = _a.sent();
                log.error(e_1);
                // エラー回数が規定回数以上かチェックして、超えてたら通知する
                if (globalThis.config.notifyThreadConnectionErrorLimit > 0) {
                    globalThis.electron.threadConnectionError += 1;
                    if (globalThis.electron.threadConnectionError >= globalThis.config.notifyThreadConnectionErrorLimit) {
                        log.info('エラー回数超過');
                        globalThis.electron.threadConnectionError = 0;
                        return [2 /*return*/, [
                                {
                                    name: 'unacastより',
                                    imgUrl: './img/unacast.png',
                                    text: '掲示板が規定回数通信エラーになりました。設定を見直すか、掲示板URLを変更してください。',
                                    from: 'system',
                                },
                            ]];
                    }
                }
                return [2 /*return*/, []];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getRes = getRes;
/*
 * URLをみてどこのBBSか判定して使用するモジュールを返却する
 */
var analysBBSName = function (threadUrl) {
    // したらばドメイン名
    var sitarabaDomain = 'jbbs.shitaraba.net';
    if (threadUrl.indexOf(sitarabaDomain) !== -1) {
        // URLにしたらばドメイン名が入ってればしたらば
        return sitaraba;
    }
    // どこにも該当しなかったらとりあえず5chで
    // この辺も対応ドメインリストとか作ってちゃんと判定したほうがよさそう
    return read5ch;
};
var getThreadList = function (boardUrl) { return __awaiter(void 0, void 0, void 0, function () {
    var sitarabaDomain;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                sitarabaDomain = 'jbbs.shitaraba.net';
                if (!(boardUrl.indexOf(sitarabaDomain) !== -1)) return [3 /*break*/, 2];
                return [4 /*yield*/, readSitaraba_1.readBoard(boardUrl)];
            case 1: 
            // URLにしたらばドメイン名が入ってればしたらば
            //
            return [2 /*return*/, _a.sent()];
            case 2: return [4 /*yield*/, Read5ch_1.readBoard(boardUrl)];
            case 3: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.getThreadList = getThreadList;
/** レスを投稿 */
var postResponse = function (hostname, threadNumber, boardId, message) { return __awaiter(void 0, void 0, void 0, function () {
    var sitarabaDomain;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                log.info("[postResponse] " + hostname + " " + threadNumber + " " + boardId);
                sitarabaDomain = 'jbbs.shitaraba.net';
                if (!(hostname.indexOf(sitarabaDomain) !== -1)) return [3 /*break*/, 2];
                return [4 /*yield*/, readSitaraba_1.postRes(hostname, threadNumber, boardId, message)];
            case 1: 
            // URLにしたらばドメイン名が入ってればしたらば
            return [2 /*return*/, _a.sent()];
            case 2: return [4 /*yield*/, Read5ch_1.postRes(hostname, threadNumber, boardId, message)];
            case 3: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.postResponse = postResponse;
/**
 * スレのURLから板情報を取得
 * @param threadUrl スレのURL
 */
var threadUrlToBoardInfo = function (threadUrl) { return __awaiter(void 0, void 0, void 0, function () {
    var sitarabaDomain, result, boardUrl, tempUrl, encoding, options, response, str, e_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                sitarabaDomain = 'jbbs.shitaraba.net';
                result = {
                    status: 'ng',
                    boardUrl: threadUrl,
                    boardName: '★取得失敗★',
                };
                boardUrl = '';
                tempUrl = threadUrl;
                tempUrl = tempUrl.replace(/\/l\d+$/, '/');
                if (!tempUrl.match(/.*\/$/)) {
                    tempUrl += '/';
                }
                encoding = '';
                if (tempUrl.indexOf(sitarabaDomain) !== -1) {
                    // スレ: https://jbbs.shitaraba.net/bbs/read.cgi/game/51638/1581839266/
                    // 板: https://jbbs.shitaraba.net/game/51638/
                    // 設定: https://jbbs.shitaraba.net/bbs/api/setting.cgi/game/51638/
                    encoding = 'EUC-JP';
                    // 板かスレか判定
                    if (tempUrl.match('read.cgi')) {
                        // スレ
                        tempUrl = tempUrl.replace('jbbs.shitaraba.net/bbs/read.cgi/', '').replace(/https?:\/\//, '');
                        tempUrl = tempUrl.match(/(.+)\/.+\/$/)[1] + '/';
                        boardUrl = "http://jbbs.shitaraba.net/" + tempUrl;
                        tempUrl = "http://jbbs.shitaraba.net/bbs/api/setting.cgi/" + tempUrl;
                    }
                    else {
                        // 板
                        boardUrl = tempUrl;
                        tempUrl = tempUrl.replace('jbbs.shitaraba.net/', '').replace(/https?:\/\//, '');
                        tempUrl = "http://jbbs.shitaraba.net/bbs/api/setting.cgi/" + tempUrl;
                    }
                }
                else {
                    // スレ: https://bbs.jpnkn.com/test/read.cgi/pasta04/1586794623/
                    // 板: https://bbs.jpnkn.com/pasta04/
                    // 設定: https://bbs.jpnkn.com/pasta04/SETTING.TXT
                    encoding = 'SHIFT-JIS';
                    // 板かスレか判定
                    if (tempUrl.match(/test\/read.cgi\/.+\/.+\//)) {
                        // スレ
                        tempUrl = tempUrl.replace('test/read.cgi/', '').match(/(.+)\/.+\/$/)[1] + "/";
                        boardUrl = tempUrl;
                        tempUrl = tempUrl + "SETTING.TXT";
                    }
                    else {
                        // 板
                        boardUrl = tempUrl;
                        tempUrl = tempUrl + "SETTING.TXT";
                    }
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                options = {
                    url: tempUrl,
                    method: 'GET',
                    timeout: 3 * 1000,
                    responseType: 'arraybuffer',
                };
                return [4 /*yield*/, axios_1.default(options)];
            case 2:
                response = _a.sent();
                if (response.status < 400) {
                    str = iconv_lite_1.default.decode(Buffer.from(response.data), encoding);
                    str.split(/\n/g).map(function (text) {
                        var matched = text.match(/BBS_TITLE=(.+)/);
                        if (matched) {
                            result.boardName = matched[1];
                            result.boardUrl = boardUrl;
                            result.status = 'ok';
                        }
                    });
                }
                return [3 /*break*/, 4];
            case 3:
                e_2 = _a.sent();
                log.error('なんかエラー');
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/, result];
        }
    });
}); };
exports.threadUrlToBoardInfo = threadUrlToBoardInfo;
exports.default = router;


/***/ }),

/***/ "./src/main/jpnkn/index.ts":
/*!*********************************!*\
  !*** ./src/main/jpnkn/index.ts ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * jpnkn fast
 */
var events_1 = __webpack_require__(/*! events */ "events");
var paho_mqtt_1 = __importDefault(__webpack_require__(/*! paho-mqtt */ "paho-mqtt"));
var electron_log_1 = __importDefault(__webpack_require__(/*! electron-log */ "electron-log"));
var log = electron_log_1.default.scope('jpnkn');
var ws_1 = __importDefault(__webpack_require__(/*! ws */ "ws"));
global.WebSocket = ws_1.default;
var JpnknFast = /** @class */ (function (_super) {
    __extends(JpnknFast, _super);
    function JpnknFast(boardId) {
        var _this = _super.call(this) || this;
        /** コメント取得のWebSocket */
        // commentSocket: mqtt.Client = null as any;
        _this.commentSocket = null;
        /** WebSocketに対する定期ping */
        _this.commentPingIntervalObj = null;
        _this.fetchComment = function () { return __awaiter(_this, void 0, void 0, function () {
            var client, onConnect, onConnectionLost, onMessageArrived;
            var _this = this;
            return __generator(this, function (_a) {
                log.info("[fetchComment] boardId = " + this.boardId);
                client = new paho_mqtt_1.default.Client('a.mq.jpnkn.com', 9091, 'peca' + new Date().getTime());
                onConnect = function (o) {
                    client.subscribe("bbs/" + _this.boardId);
                    _this.emit('open');
                };
                onConnectionLost = function (e) {
                    log.error('[fetchComment] なんかエラーだ');
                    log.error(JSON.stringify(e, null, '  '));
                    _this.emit('error', new Error("jpnkn\u306EWebSocket\u3067Error: [" + e.errorCode + "] " + e.errorMessage));
                    _this.fetchComment();
                };
                onMessageArrived = function (e) {
                    var response = JSON.parse(e.payloadString);
                    var res = response.body.split('<>');
                    var item = {
                        number: response.no,
                        name: res[0],
                        date: res[2],
                        text: res[3],
                        imgUrl: globalThis.electron.iconList.getBbs(),
                        threadTitle: '',
                        id: '',
                        email: res[1],
                        from: 'jpnkn',
                    };
                    _this.emit('comment', item);
                };
                client.connect({ userName: 'genkai', password: '7144', onSuccess: onConnect, useSSL: true });
                client.onConnectionLost = onConnectionLost;
                client.onMessageArrived = onMessageArrived;
                // // 定期的にping打つ
                // this.commentPingIntervalObj = setInterval(() => {
                //   if (ws.OPEN) {
                //     ws.ping();
                //   } else {
                //     clearInterval(this.commentPingIntervalObj);
                //   }
                // }, 30 * 1000);
                this.commentSocket = client;
                return [2 /*return*/];
            });
        }); };
        /** コメント取得の停止 */
        _this.stop = function () {
            if (_this.commentPingIntervalObj) {
                clearInterval(_this.commentPingIntervalObj);
                _this.commentPingIntervalObj = null;
            }
            if (_this.commentSocket && _this.commentSocket.isConnected())
                _this.commentSocket.disconnect();
            // if (this.commentSocket && this.commentSocket.connected) this.commentSocket.end();
            _this.emit('end');
        };
        if (!boardId)
            throw TypeError('Required channelId.');
        _this.boardId = boardId;
        return _this;
    }
    JpnknFast.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.boardId) {
                    this.emit('start');
                    this.fetchComment();
                }
                return [2 /*return*/];
            });
        });
    };
    JpnknFast.prototype.on = function (event, listener) {
        return _super.prototype.on.call(this, event, listener);
    };
    return JpnknFast;
}(events_1.EventEmitter));
exports.default = JpnknFast;


/***/ }),

/***/ "./src/main/main.ts":
/*!**************************!*\
  !*** ./src/main/main.ts ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Electronのモジュール
var path_1 = __importDefault(__webpack_require__(/*! path */ "path"));
var electron_1 = __importStar(__webpack_require__(/*! electron */ "electron"));
var electron_log_1 = __importDefault(__webpack_require__(/*! electron-log */ "electron-log"));
var util_1 = __webpack_require__(/*! ./util */ "./src/main/util.ts");
var electron_window_state_1 = __importDefault(__webpack_require__(/*! electron-window-state */ "electron-window-state"));
console.trace = function () {
    //
};
process.on('uncaughtException', function (err) {
    electron_log_1.default.error(err);
});
// アプリケーションをコントロールするモジュール
var app = electron_1.default.app;
// 多重起動防止
if (!app.requestSingleInstanceLock()) {
    electron_log_1.default.error('[app] It is terminated for multiple launches.');
    app.quit();
}
else {
    electron_log_1.default.info('[app] started');
    app.allowRendererProcessReuse = true;
    var iconPath_1 = path_1.default.resolve(__dirname, '../icon.png');
    // サーバー起動モジュール
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    var ss = __webpack_require__(/*! ./startServer */ "./src/main/startServer.ts");
    console.trace(ss);
    // メインウィンドウはGCされないようにグローバル宣言
    globalThis.electron = {
        mainWindow: null,
        chatWindow: null,
        translateWindow: null,
        imagePreviewWindow: null,
        iconList: null,
        seList: [],
        twitchChat: null,
        youtubeChat: null,
        niconicoChat: null,
        jpnknFast: null,
        azureStt: null,
        threadConnectionError: 0,
        threadNumber: 0,
        commentQueueList: [],
        translateQueueList: [],
    };
    globalThis.config = {};
    // 全てのウィンドウが閉じたら終了
    // app.on('window-all-closed', () => {
    //   if (process.platform != 'darwin') {
    //     app.quit();
    //   }
    // });
    // Electronの初期化完了後に実行
    app.on('ready', function () {
        var windowState = electron_window_state_1.default({
            defaultWidth: 700,
            defaultHeight: 720,
            file: 'mainWindow.json',
        });
        // ウィンドウサイズを（フレームサイズを含まない）設定
        var mainWin = new electron_1.default.BrowserWindow({
            // 前回起動時のを復元
            x: windowState.x,
            y: windowState.y,
            width: windowState.width,
            height: windowState.height,
            useContentSize: true,
            icon: iconPath_1,
            webPreferences: {
                nodeIntegration: true,
            },
            skipTaskbar: false,
        });
        globalThis.electron.mainWindow = mainWin;
        windowState.manage(mainWin);
        mainWin.setTitle('unacast');
        mainWin.setMenu(null);
        // レンダラーで使用するhtmlファイルを指定する
        mainWin.loadURL('file://' + path_1.default.resolve(__dirname, '../src/html/index.html'));
        // ウィンドウが閉じられたらアプリも終了
        mainWin.on('close', function (event) {
            // 確認ダイアログではいをクリックしたら閉じる
            event.preventDefault();
            electron_1.dialog
                .showMessageBox(mainWin, {
                type: 'question',
                buttons: ['Yes', 'No'],
                // title: '',
                message: '終了しますか？',
            })
                .then(function (value) {
                if (value.response === 0) {
                    app.exit();
                }
            });
        });
        mainWin.on('closed', function () {
            electron_log_1.default.info('[app] close');
            app.exit();
        });
        // 開発者ツールを開く
        mainWin.webContents.openDevTools();
        // タスクトレイの設定
        var tray = null;
        app.whenReady().then(function () {
            tray = new electron_1.Tray(iconPath_1);
            var contextMenu = electron_1.Menu.buildFromTemplate([
                {
                    label: '設定',
                    click: function () {
                        globalThis.electron.mainWindow.focus();
                    },
                },
                {
                    label: 'コメント',
                    click: function () {
                        globalThis.electron.chatWindow.focus();
                    },
                },
                {
                    label: '翻訳',
                    click: function () {
                        globalThis.electron.translateWindow.focus();
                    },
                },
                {
                    label: '終了',
                    click: function () {
                        globalThis.electron.mainWindow.close();
                    },
                },
            ]);
            tray.setToolTip('∈(ﾟ◎ﾟ)∋ｳﾅｰ');
            tray.setContextMenu(contextMenu);
            // タスクトレイクリック時の挙動
            var isDoubleClicked = false;
            tray.on('click', function (event) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            isDoubleClicked = false;
                            return [4 /*yield*/, util_1.sleep(200)];
                        case 1:
                            _a.sent();
                            if (isDoubleClicked)
                                return [2 /*return*/];
                            globalThis.electron.chatWindow.focus();
                            return [2 /*return*/];
                    }
                });
            }); });
            tray.on('double-click', function (event) {
                isDoubleClicked = true;
                globalThis.electron.mainWindow.focus();
            });
        });
        createChatWindow();
        createTranslateWindow();
        createImagePreviewWindow();
    });
    // 音声再生できるようにする
    app.commandLine.appendSwitch('--autoplay-policy', 'no-user-gesture-required');
}
var createChatWindow = function () {
    var windowState = electron_window_state_1.default({
        defaultWidth: 400,
        defaultHeight: 720,
        file: 'chatWindow.json',
    });
    var iconPath = path_1.default.resolve(__dirname, '../icon.png');
    var chatWindow = new electron_1.default.BrowserWindow({
        x: windowState.x,
        y: windowState.y,
        width: windowState.width,
        height: windowState.height,
        useContentSize: true,
        icon: iconPath,
        webPreferences: {
            nodeIntegration: true,
        },
        // タスクバーに表示しない
        skipTaskbar: false,
        // 閉じれなくする
        closable: false,
    });
    windowState.manage(chatWindow);
    chatWindow.setTitle('unacast');
    chatWindow.setMenu(null);
    // レンダラーで使用するhtmlファイルを指定する
    chatWindow.loadURL('file://' + path_1.default.resolve(__dirname, '../src/html/chat.html'));
    globalThis.electron.chatWindow = chatWindow;
    // chatWindow.webContents.openDevTools();
};
var createTranslateWindow = function () {
    var windowState = electron_window_state_1.default({
        defaultWidth: 400,
        defaultHeight: 720,
        file: 'translateWindow.json',
    });
    var iconPath = path_1.default.resolve(__dirname, '../icon.png');
    var translateWindow = new electron_1.default.BrowserWindow({
        x: windowState.x,
        y: windowState.y,
        width: windowState.width,
        height: windowState.height,
        useContentSize: true,
        icon: iconPath,
        webPreferences: {
            nodeIntegration: true,
        },
        // タスクバーに表示しない
        skipTaskbar: false,
        // 閉じれなくする
        closable: false,
    });
    windowState.manage(translateWindow);
    translateWindow.setTitle('unacast');
    translateWindow.setMenu(null);
    // レンダラーで使用するhtmlファイルを指定する
    translateWindow.loadURL('file://' + path_1.default.resolve(__dirname, '../src/html/translate.html'));
    // 初期表示は最小化
    translateWindow.minimize();
    globalThis.electron.translateWindow = translateWindow;
    // translateWindow.webContents.openDevTools();
};
var createImagePreviewWindow = function () {
    var windowState = electron_window_state_1.default({
        defaultWidth: 400,
        defaultHeight: 400,
        file: 'imagePreview.json',
    });
    var iconPath = path_1.default.resolve(__dirname, '../icon.png');
    var childwindow = new electron_1.default.BrowserWindow({
        x: windowState.x,
        y: windowState.y,
        width: windowState.width,
        height: windowState.height,
        useContentSize: true,
        icon: iconPath,
        webPreferences: {
            nodeIntegration: true,
        },
        // タスクバーに表示しない
        skipTaskbar: false,
        minimizable: false,
        minHeight: 100,
        closable: true,
    });
    windowState.manage(childwindow);
    childwindow.setTitle('unacast');
    childwindow.setMenu(null);
    childwindow.hide();
    // レンダラーで使用するhtmlファイルを指定する
    childwindow.loadURL('file://' + path_1.default.resolve(__dirname, '../src/html/imagePreview.html'));
    // ×押したらインスタンス再生成
    childwindow.on('close', function (e) {
        setTimeout(function () {
            createImagePreviewWindow();
        }, 10);
    });
    globalThis.electron.imagePreviewWindow = childwindow;
    // childwindow.webContents.openDevTools();
};


/***/ }),

/***/ "./src/main/niconama/index.ts":
/*!************************************!*\
  !*** ./src/main/niconama/index.ts ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ニコ生コメント
 */
var events_1 = __webpack_require__(/*! events */ "events");
var axios_1 = __importDefault(__webpack_require__(/*! axios */ "axios"));
var cheerio_1 = __importDefault(__webpack_require__(/*! cheerio */ "cheerio"));
var electron_log_1 = __importDefault(__webpack_require__(/*! electron-log */ "electron-log"));
var log = electron_log_1.default.scope('niconama');
var util_1 = __webpack_require__(/*! ../util */ "./src/main/util.ts");
var ws_1 = __importDefault(__webpack_require__(/*! ws */ "ws"));
var NiconamaComment = /** @class */ (function (_super) {
    __extends(NiconamaComment, _super);
    function NiconamaComment(options) {
        var _this = _super.call(this) || this;
        /** 配信開始待ちのインターバル(ms) */
        _this.waitBroadcastPollingInterval = 5000;
        /** 初期処理のコメントを受信し終わった */
        _this.isFirstCommentReceived = false;
        /** 最新のコメント番号 */
        _this.latestNo = NaN;
        /** コメント取得のWebSocket */
        _this.commentSocket = null;
        /** ニコ生チャットWebSocketに対する定期ping */
        _this.commentPingIntervalObj = null;
        /** ニコ生の配信開始待ち */
        _this.pollingStartBroadcast = function () { return __awaiter(_this, void 0, void 0, function () {
            var url, res, $, embeddedData, e_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        url = "https://live.nicovideo.jp/watch/" + this.communityId;
                        log.info("[pollingStartBroadcast] " + url);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 8]);
                        return [4 /*yield*/, axios_1.default.get(url)];
                    case 2:
                        res = _b.sent();
                        $ = cheerio_1.default.load(res.data);
                        embeddedData = JSON.parse((_a = $('#embedded-data').attr('data-props')) !== null && _a !== void 0 ? _a : '');
                        if (!(embeddedData.program.status === 'ENDED' || embeddedData.program.endTime * 1000 < new Date().getTime())) return [3 /*break*/, 4];
                        return [4 /*yield*/, util_1.sleep(this.waitBroadcastPollingInterval)];
                    case 3:
                        _b.sent();
                        this.pollingStartBroadcast();
                        return [3 /*break*/, 5];
                    case 4:
                        // 始まってる
                        this.emit('start');
                        this.fetchCommentServerThread();
                        _b.label = 5;
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_1 = _b.sent();
                        this.emit('error', new Error("connection error to " + url));
                        log.error(JSON.stringify(e_1, null, '  '));
                        return [4 /*yield*/, util_1.sleep(this.waitBroadcastPollingInterval * 2)];
                    case 7:
                        _b.sent();
                        this.pollingStartBroadcast();
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        }); };
        /** ニコ生のコメントを取得 */
        _this.fetchCommentServerThread = function () { return __awaiter(_this, void 0, void 0, function () {
            var url, res, $, embeddedData, broadcastId, audienceToken, frontendId, threadWssUrl, tWs;
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        log.info("[fetchCommentServerThread]");
                        url = "https://live.nicovideo.jp/watch/" + this.communityId;
                        return [4 /*yield*/, axios_1.default.get(url)];
                    case 1:
                        res = _c.sent();
                        $ = cheerio_1.default.load(res.data);
                        embeddedData = JSON.parse((_a = $('#embedded-data').attr('data-props')) !== null && _a !== void 0 ? _a : '');
                        broadcastId = embeddedData.program.broadcastId || embeddedData.program.reliveProgramId;
                        audienceToken = embeddedData.player.audienceToken;
                        if (!broadcastId) {
                            broadcastId = ((_b = audienceToken.match(/^\d+/)) === null || _b === void 0 ? void 0 : _b[0]) || '';
                        }
                        frontendId = embeddedData.site.frontendId;
                        threadWssUrl = "wss://a.live2.nicovideo.jp/unama/wsapi/v2/watch/" + broadcastId + "?audience_token=" + audienceToken + "&frontend_id=" + frontendId;
                        log.info(threadWssUrl);
                        tWs = new ws_1.default(threadWssUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36',
                            },
                        });
                        tWs.onmessage = function (event) {
                            var obj = JSON.parse(event.data.toString());
                            // log.info(JSON.stringify(obj, null, '  '));
                            log.info("[fetchCommentServerThread] WS received - type: " + obj.type);
                            switch (obj.type) {
                                case 'serverTime': {
                                    // currentMs
                                    break;
                                }
                                case 'seat': {
                                    // keepIntervalSec
                                    break;
                                }
                                case 'stream': {
                                    // hlsのURLとか
                                    break;
                                }
                                case 'room': {
                                    var data = obj.data;
                                    _this.fetchComment(data.messageServer.uri, data.threadId);
                                    break;
                                }
                                case 'statistics': {
                                    // 視聴者数とか
                                    break;
                                }
                                case 'schedule': {
                                    // 開始、終了時刻
                                    break;
                                }
                                case 'akashic': {
                                    var data = obj.data;
                                    break;
                                }
                                case 'ping': {
                                    tWs.send(JSON.stringify({ type: 'pong' }));
                                    break;
                                }
                                // 切断。枠が終了した時もここ。
                                case 'disconnect': {
                                    var data = obj.data;
                                    _this.stop();
                                    _this.start();
                                    break;
                                }
                            }
                        };
                        tWs.on('open', function () {
                            log.info('startWatching');
                            tWs.send(JSON.stringify({
                                type: 'startWatching',
                                data: { stream: { quality: 'high', protocol: 'hls', latency: 'low', chasePlay: false }, room: { protocol: 'webSocket', commentable: true }, reconnect: false },
                            }));
                            log.info('getAkashic');
                            tWs.send(JSON.stringify({ type: 'getAkashic', data: { chasePlay: false } }));
                        });
                        tWs.on('error', function (event) {
                            log.error('[fetchCommentServerThread] スレッドID取得のWebSocketでエラー。再接続を実施。');
                            log.error(JSON.stringify(event, null, '  '));
                            _this.emit('error', new Error("\u30B9\u30EC\u30C3\u30C9ID\u53D6\u5F97\u306EWebSocket\u3067Error"));
                            if (tWs.OPEN)
                                tWs.close();
                            _this.fetchCommentServerThread();
                        });
                        return [2 /*return*/];
                }
            });
        }); };
        /**
         *
         * @param wsUrl コメントサーバのWebSocket URL
         * @param threadId threadID
         */
        _this.fetchComment = function (wsUrl, threadId) { return __awaiter(_this, void 0, void 0, function () {
            var ws;
            var _this = this;
            return __generator(this, function (_a) {
                log.info("[fetchComment] threadId = " + threadId);
                ws = new ws_1.default(wsUrl, 'niconama', {
                    headers: {
                        'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
                        'Sec-WebSocket-Protocol': 'msg.nicovideo.jp#json',
                    },
                });
                ws.on('message', function (event) {
                    var _a, _b, _c;
                    var obj = JSON.parse(event.toString());
                    // 初回取得時は ping, ping, thread, chat, chat..., ping, pingの順で受け取る
                    // log.info(`[fetchComment] WS received  - ${JSON.stringify(obj)}`);
                    // コメント番号更新
                    if ((_a = obj === null || obj === void 0 ? void 0 : obj.chat) === null || _a === void 0 ? void 0 : _a.no) {
                        _this.latestNo = obj.chat.no;
                    }
                    if (((_b = obj === null || obj === void 0 ? void 0 : obj.ping) === null || _b === void 0 ? void 0 : _b.content) === 'rf:0') {
                        _this.isFirstCommentReceived = true;
                        _this.emit('open', { liveId: '', number: _this.latestNo });
                    }
                    if (!_this.isFirstCommentReceived)
                        return;
                    var chat = obj;
                    var comment = (_c = chat.chat) === null || _c === void 0 ? void 0 : _c.content;
                    if (!comment)
                        return;
                    log.info("[fetchComment]WS - content: " + comment);
                    // /で始まるのはなんかコマンドなので除外する
                    if (comment.match(/^\/[a-z]+ /))
                        return;
                    var item = {
                        number: chat.chat.no.toString(),
                        name: '',
                        comment: comment,
                    };
                    _this.emit('comment', item);
                });
                ws.on('error', function (event) {
                    log.error('[fetchComment]なんかエラーだ');
                    log.error(JSON.stringify(event, null, '  '));
                    _this.emit('error', new Error("\u30CB\u30B3\u751F\u30C1\u30E3\u30C3\u30C8\u306EWebSocket\u3067Error"));
                    if (ws.OPEN)
                        ws.close();
                    _this.fetchComment(wsUrl, threadId);
                });
                ws.on('open', function () {
                    log.info('[fetchComment] connected');
                    ws.send(JSON.stringify([
                        { ping: { content: 'rs:0' } },
                        { ping: { content: 'ps:0' } },
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        { thread: { thread: threadId, version: '20061206', user_id: 'guest', res_from: -150, with_global: 1, scores: 1, nicoru: 0 } },
                        { ping: { content: 'pf:0' } },
                        { ping: { content: 'rf:0' } },
                    ]));
                });
                // 定期的にping打つ
                this.commentPingIntervalObj = setInterval(function () {
                    if (ws.OPEN) {
                        ws.ping();
                    }
                    else {
                        clearInterval(_this.commentPingIntervalObj);
                    }
                }, 30 * 1000);
                this.commentSocket = ws;
                return [2 /*return*/];
            });
        }); };
        /** コメント取得の停止 */
        _this.stop = function () {
            _this.isFirstCommentReceived = false;
            _this.latestNo = NaN;
            if (_this.commentPingIntervalObj) {
                clearInterval(_this.commentPingIntervalObj);
                _this.commentPingIntervalObj = null;
            }
            if (_this.commentSocket)
                _this.commentSocket.close();
            _this.emit('end');
        };
        if ('communityId' in options) {
            _this.communityId = options.communityId;
        }
        else {
            throw TypeError('Required channelId.');
        }
        return _this;
    }
    NiconamaComment.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.communityId) {
                    this.emit('wait');
                    this.pollingStartBroadcast();
                }
                return [2 /*return*/];
            });
        });
    };
    NiconamaComment.prototype.on = function (event, listener) {
        return _super.prototype.on.call(this, event, listener);
    };
    return NiconamaComment;
}(events_1.EventEmitter));
exports.default = NiconamaComment;


/***/ }),

/***/ "./src/main/readBBS/Read5ch.ts":
/*!*************************************!*\
  !*** ./src/main/readBBS/Read5ch.ts ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRes = exports.readBoard = void 0;
/**
 * 5ch互換BBS読み込み用モジュール
 */
var axios_1 = __importDefault(__webpack_require__(/*! axios */ "axios"));
var iconv_lite_1 = __importDefault(__webpack_require__(/*! iconv-lite */ "iconv-lite")); // 文字コード変換用パッケージ
var electron_log_1 = __importDefault(__webpack_require__(/*! electron-log */ "electron-log"));
var log = electron_log_1.default.scope('bbs');
var https_1 = __importDefault(__webpack_require__(/*! https */ "https"));
var encoding_japanese_1 = __importDefault(__webpack_require__(/*! encoding-japanese */ "encoding-japanese"));
var instance = axios_1.default.create({
    httpsAgent: new https_1.default.Agent({
        rejectUnauthorized: false,
    }),
});
/** ステータスコード304 _NotModified */
var NOT_MODIFIED = '304';
var RANGE_NOT_SATISFIABLE = '416';
/** スレ一覧を読み込む */
var readBoard = function (boardUrl) { return __awaiter(void 0, void 0, void 0, function () {
    var requestUrl, list, options, response, str, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                requestUrl = boardUrl + "subject.txt";
                list = [];
                options = {
                    url: requestUrl,
                    method: 'GET',
                    timeout: 3 * 1000,
                    responseType: 'arraybuffer',
                };
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, instance(options)];
            case 2:
                response = _a.sent();
                str = iconv_lite_1.default.decode(Buffer.from(response.data), 'Shift_JIS');
                // パースして格納
                list.push.apply(list, str
                    .split('\n')
                    .filter(function (item) { return item; })
                    .map(function (line) { return parseThreadList(boardUrl, line); }));
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                if (error_1.status == NOT_MODIFIED) {
                    log.error('5ch系BBS板取得APIリクエストエラー、NOT_MODIFIED');
                }
                else if (error_1.status == RANGE_NOT_SATISFIABLE) {
                    log.error('5ch系BBS板取得APIリクエストエラー、RANGE_NOT_SATISFIABLE');
                }
                else {
                    log.error('5ch系BBS板取得APIリクエストエラー、message=' + error_1.message);
                }
                throw new Error('connection error');
            case 4: return [2 /*return*/, list];
        }
    });
}); };
exports.readBoard = readBoard;
/**
 * レスを投稿する
 * @param hostname ホスト名。https://hogehoge/
 * @param threadNumber スレ番号 12345678
 * @param boardId 板ID pasta04
 * @param message 投稿文
 */
var postRes = function (hostname, threadNumber, boardId, message) { return __awaiter(void 0, void 0, void 0, function () {
    var unicodeArray, i, sjisArray, encodedKeyword, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                unicodeArray = [];
                for (i = 0; i < message.length; i++) {
                    unicodeArray.push(message.charCodeAt(i));
                }
                sjisArray = encoding_japanese_1.default.convert(unicodeArray, {
                    to: 'SJIS',
                    from: 'UNICODE',
                });
                encodedKeyword = encoding_japanese_1.default.urlEncode(sjisArray);
                // log.info(encodeURIComponent.toString());
                log.info(hostname + "test/bbs.cgi");
                log.info("FROM=&MESSAGE=" + encodedKeyword + "&mail=sage&key=" + threadNumber + "&bbs=" + boardId);
                return [4 /*yield*/, axios_1.default.post(hostname + "test/bbs.cgi", "FROM=&MESSAGE=" + encodedKeyword + "&mail=sage&key=" + threadNumber + "&bbs=" + boardId, {
                        headers: {
                            Accept: '*/*',
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept-Encoding': 'gzip, deflate, br',
                            Cookie: 'MAIL="sage"; NAME=""',
                        },
                        withCredentials: true,
                    })];
            case 1:
                result = _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.postRes = postRes;
var Read5ch = /** @class */ (function () {
    function Read5ch() {
        var _this = this;
        /**
         * レス読み込み
         * 引数で指定した板からレスを読む
         * レス番号を指定していない場合は全件取得
         * @param threadUrl スレURL
         * @param resNum レス番号
         */
        this.read = function (threadUrl, resNum) { return __awaiter(_this, void 0, void 0, function () {
            var rep, requestUrl, range, options, responseJson, response, headers, str, result, dateStr, date, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // log.info(`[Read5ch] threadUrl=${threadUrl} resNum=${resNum}`);
                        // 板や最終レス番号がかわったら最初からとり直す(lastmodifiと rangeのリセット)
                        if (threadUrl != this.lastThreadUrl || Number.isNaN(resNum) || resNum < this.lastResNumber) {
                            this.lastThreadUrl = threadUrl;
                            this.lastModified = null;
                            this.lastByte = 0;
                            this.lastWroteDate = null;
                            log.info(' reset');
                        }
                        else {
                            log.debug('noreset');
                        }
                        rep = /\/test\/read.cgi(\/.+)(\/.+)\//;
                        requestUrl = threadUrl.replace(rep, '$1/dat$2.dat');
                        range = this.lastByte;
                        options = {
                            url: requestUrl,
                            method: 'GET',
                            timeout: 3 * 1000,
                            responseType: 'arraybuffer',
                            headers: {
                                'if-modified-since': this.lastModified,
                                range: 'bytes=' + range + '-',
                            },
                            validateStatus: function (status) {
                                return status >= 200 && status <= 304;
                            },
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, instance(options)];
                    case 2:
                        response = _a.sent();
                        if (response.status === 304) {
                            log.info('status 304');
                            return [2 /*return*/, []];
                        }
                        headers = response.headers;
                        str = iconv_lite_1.default.decode(Buffer.from(response.data), 'Shift_JIS');
                        // レスポンスオブジェクト作成、content-rangeがある場合とない場合で処理を分ける
                        if (headers['content-range'] == null || this.lastByte == 0) {
                            log.debug('content-range=' + headers['content-range']);
                            result = parseNewResponse(str, resNum);
                            responseJson = result.result;
                        }
                        else {
                            responseJson = parseDiffResponse(str, resNum);
                        }
                        // 最終書き込み時刻の整合性チェック
                        // ぜろちゃんねる固有の問題？たまにデータが巻き戻る
                        if (responseJson.length > 0) {
                            dateStr = responseJson[responseJson.length - 1].date;
                            if (dateStr) {
                                date = new Date(dateStr);
                                if (this.lastWroteDate) {
                                    // スレが変わったわけでもないのに最終書き込み時刻よりも古いデータが取得できた場合は無かったことにする
                                    if (this.lastWroteDate > date) {
                                        log.warn("\u6642\u523B\u4E0D\u6574\u5408: unacast: " + this.lastWroteDate + " bbs: " + date);
                                        responseJson = [];
                                    }
                                    else {
                                        this.lastWroteDate = date;
                                    }
                                }
                                else {
                                    this.lastWroteDate = date;
                                }
                            }
                        }
                        // LastModifiedとRange更新処理
                        if (responseJson.length > 0 && headers['last-modified'] != null) {
                            this.lastModified = headers['last-modified'];
                        }
                        // 最終レス番更新
                        if (responseJson.length > 0) {
                            this.lastResNumber = Number(responseJson[responseJson.length - 1].number);
                        }
                        // 取得バイト数表示
                        if (headers['content-length'] != null && responseJson.length > 0) {
                            this.lastByte = this.lastByte + parseInt(headers['content-length']) - 1;
                            log.debug('lastByte=' + this.lastByte);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        responseJson = [];
                        if (error_2.status == NOT_MODIFIED) {
                            log.error('5ch系BBSレス取得APIリクエストエラー、NOT_MODIFIED');
                        }
                        else if (error_2.status == RANGE_NOT_SATISFIABLE) {
                            log.error('5ch系BBSレス取得APIリクエストエラー、RANGE_NOT_SATISFIABLE');
                        }
                        else {
                            log.error('5ch系BBSレス取得APIリクエストエラー、message=' + error_2.message);
                        }
                        throw new Error('connection error');
                    case 4: return [2 /*return*/, responseJson];
                }
            });
        }); };
        this.lastThreadUrl = '';
        this.lastResNumber = 0;
        this.lastModified = null;
        this.lastByte = 0;
        this.lastWroteDate = null;
    }
    return Read5ch;
}());
/**
 * 全取得したレスポンス（複数）のパース
 * 戻りとしてパースしたjsonオブジェクトの配列を返す
 * @param res 板から返却されたdat
 * @param resNum リクエストされたレス番号
 */
var parseNewResponse = function (res, resNum) {
    log.info("parseNewResponse: res=" + res.length + " resNum=" + resNum);
    // 結果を格納する配列
    var result = [];
    // レス番号
    var num = 0;
    // 新着レスを改行ごとにSplitする
    var resArray = res.split(/\r\n|\r|\n/);
    // 新着なしなら戻る。
    if (resArray.length === 0) {
        return { result: result, lastResNumber: resNum };
    }
    // 配列の最後に空の要素が入ることがあるので取り除く
    if (resArray[resArray.length - 1].length === 0) {
        resArray.pop();
    }
    // レス指定なしの場合全件取得
    if (Number.isNaN(resNum) || resNum < 1) {
        log.info("resNum: " + resNum + " ");
        num = 0;
    }
    else {
        num = resNum;
    }
    // log.info(`num = ${num}  resArrayLength = ${resArray.length}   ${resArray[num]}`);
    // 1行ごとにパースする
    for (; num < resArray.length; num++) {
        // パースメソッド呼び出し
        if (resArray[num].length > 0) {
            result.push(parseResponse(resArray[num], num + 1));
        }
    }
    // パースしたオブジェクトの配列を返却
    return { result: result, lastResNumber: num + 1 };
};
/**
 * 差分取得したレスポンス（複数）のパース
 * 戻りとしてパースしたjsonオブジェクトの配列を返す
 * @param res 板から返却されたdat1行分
 * @param resNum リクエストされたレス番号
 */
var parseDiffResponse = function (res, resNum) {
    log.info("parseDiffResponse: res=" + res.length + " resNum=" + resNum);
    //結果を格納する配列
    var result = [];
    // レス番号
    var num = resNum + 1;
    //新着レスを改行ごとにSplitする
    var resArray = res.split(/\r\n|\r|\n/);
    // 新着なしなら戻る。
    if (resArray.length === 0) {
        return result;
    }
    else {
        // 配列の最後に空の要素が入ることがあるので取り除く
        if (resArray[resArray.length - 1].length == 0) {
            resArray.pop();
        }
    }
    log.debug('purseDiffResponse 取得レス番号=' + num);
    //1行ごとにパースする
    resArray.forEach(function (value) {
        //パースメソッド呼び出し
        if (value.length > 0) {
            result.push(parseResponse(value, num));
            num++;
        }
    });
    // パースしたオブジェクトの配列を返却
    return result;
};
/**
 * スレ一覧のパース
 * @param String // res レスポンス1レス
 * @param Integer // num レス番（0スタート）
 */
var parseThreadList = function (boardUrl, subjectLine) {
    var _a, _b, _c, _d, _e;
    //APIの返却値を<>で分割
    //レスの要素
    //0:dat名
    //1:スレタイ（レス数）
    var splitRes = subjectLine.split('<>');
    // log.debug(splitRes);
    var datNum = splitRes[0].replace('.dat', '');
    var hostname = (_b = (_a = boardUrl.match(/^https?:\/\/.+?\//)) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : '';
    var boardName = boardUrl.replace(hostname, '');
    var url = hostname + "test/read.cgi/" + boardName + datNum + "/";
    var titleTemp = splitRes[1];
    var name = (_d = (_c = titleTemp.match(/(.*?) \(\d+\)$/)) === null || _c === void 0 ? void 0 : _c[1]) !== null && _d !== void 0 ? _d : '★取得失敗★';
    var resNum = Number((_e = titleTemp.match(/\(\d+\)$/)) === null || _e === void 0 ? void 0 : _e[0].replace(/\(|\)/g, ''));
    // オブジェクトを返却
    return {
        url: url,
        name: name,
        resNum: resNum,
    };
};
/**
 * レスのパース
 * @param res レスポンス1レス
 * @param num レス番
 */
var parseResponse = function (res, num) {
    //APIの返却値を<>で分割
    //レスの要素
    //0:名前
    //1:メアド
    //2:日付とID （2019/11/03(日) 08:55:00 ID:kanikani）みたいに表示
    //3:本文
    //4:スレタイ （1レス目のみ）
    var splitRes = res.split('<>');
    // 日付とID分離処理、' ID:'で区切る
    var dateId = splitRes[2].split(' ID:');
    var date = dateId[0];
    var id = dateId.length === 2 ? dateId[1] : '';
    var resJson = {
        number: num.toString(),
        name: splitRes[0],
        email: splitRes[1],
        date: date,
        text: splitRes[3],
        threadTitle: splitRes[4] ? splitRes[4] : '',
        id: id,
        imgUrl: '',
        from: 'bbs',
    };
    // オブジェクトを返却
    return resJson;
};
exports.default = Read5ch;


/***/ }),

/***/ "./src/main/readBBS/readSitaraba.ts":
/*!******************************************!*\
  !*** ./src/main/readBBS/readSitaraba.ts ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRes = exports.readBoard = void 0;
/**
 * したらば読み込み用モジュール
 */
var axios_1 = __importDefault(__webpack_require__(/*! axios */ "axios"));
var https_1 = __importDefault(__webpack_require__(/*! https */ "https"));
var iconv_lite_1 = __importDefault(__webpack_require__(/*! iconv-lite */ "iconv-lite")); // 文字コード変換用パッケージ
var electron_log_1 = __importDefault(__webpack_require__(/*! electron-log */ "electron-log"));
var log = electron_log_1.default.scope('bbs');
var encoding_japanese_1 = __importDefault(__webpack_require__(/*! encoding-japanese */ "encoding-japanese"));
/** スレ一覧を読み込む */
var readBoard = function (boardUrl) { return __awaiter(void 0, void 0, void 0, function () {
    var requestUrl, list, options, response, str, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                requestUrl = boardUrl + "subject.txt";
                list = [];
                options = {
                    url: requestUrl,
                    method: 'GET',
                    timeout: 3 * 1000,
                    responseType: 'arraybuffer',
                };
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, axios_1.default(options)];
            case 2:
                response = _a.sent();
                str = iconv_lite_1.default.decode(Buffer.from(response.data), 'EUC-JP');
                // パースして格納
                list.push.apply(list, str
                    .split('\n')
                    .filter(function (item) { return item; })
                    .map(function (line) { return parseThreadList(boardUrl, line); }));
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                log.error('[Read5ch.js]5ch系BBS板取得APIリクエストエラー、message=' + error_1.message);
                throw new Error('connection error');
            case 4: return [2 /*return*/, list];
        }
    });
}); };
exports.readBoard = readBoard;
/**
 * レスを投稿する
 * @param hostname ホスト名。https://hogehoge/
 * @param threadNumber スレ番号 12345678
 * @param boardId 板ID pasta04
 * @param message 投稿文
 */
var postRes = function (hostname, threadNumber, boardId, message) { return __awaiter(void 0, void 0, void 0, function () {
    var unicodeArray, i, sjisArray, encodedKeyword, dir, bbs, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                unicodeArray = [];
                for (i = 0; i < message.length; i++) {
                    unicodeArray.push(message.charCodeAt(i));
                }
                sjisArray = encoding_japanese_1.default.convert(unicodeArray, {
                    to: 'EUCJP',
                    from: 'UNICODE',
                });
                encodedKeyword = encoding_japanese_1.default.urlEncode(sjisArray);
                dir = boardId.split('/')[0];
                bbs = boardId.split('/')[1];
                return [4 /*yield*/, axios_1.default.post(hostname + "bbs/write.cgi/" + boardId + "/" + threadNumber + "/", "dir=" + dir + "&bbs=" + bbs + "&key=" + threadNumber + "&time=" + new Date().getTime() + "&name=&MAIL=sage&MESSAGE=" + encodedKeyword, {
                        headers: {
                            Accept: '*/*',
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept-Encoding': 'gzip, deflate, br',
                            Referer: "" + hostname + boardId + "/",
                            Cookie: 'MAIL="sage"; NAME=""',
                        },
                        withCredentials: true,
                    })];
            case 1:
                result = _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.postRes = postRes;
var ReadSitaraba = /** @class */ (function () {
    function ReadSitaraba() {
        var _this = this;
        /**
         * レス読み込み
         * @description 引数で指定した板からレスを読む。
         * @description レス番号を指定していない場合は全件取得
         * @param threadUrl スレURL
         * @param resNum レス番号
         */
        this.read = function (threadUrl, resNum) { return __awaiter(_this, void 0, void 0, function () {
            var requestUrl, options, response, str, responseJson, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestUrl = threadUrl.replace('read.cgi', 'rawmode.cgi');
                        if (resNum > 0) {
                            // レス番号がある場合レス番号以降を取得
                            requestUrl += resNum + '-';
                        }
                        else {
                            // レス番号がない場合全県取得
                            requestUrl += '';
                        }
                        options = {
                            url: requestUrl,
                            method: 'GET',
                            responseType: 'arraybuffer',
                            timeout: 3 * 1000,
                            httpsAgent: new https_1.default.Agent({
                                rejectUnauthorized: false,
                            }),
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, axios_1.default(options)];
                    case 2:
                        response = _a.sent();
                        str = decodeUnicodeStr(iconv_lite_1.default.decode(Buffer.from(response.data), 'EUC-JP'));
                        responseJson = parseNewResponse(str);
                        return [2 /*return*/, responseJson];
                    case 3:
                        e_1 = _a.sent();
                        // 通信エラー
                        throw new Error("\u901A\u4FE1\u30A8\u30E9\u30FC: " + requestUrl + " stack=" + e_1);
                    case 4: return [2 /*return*/];
                }
            });
        }); };
    }
    return ReadSitaraba;
}());
/**
 * 取得したレスポンス（複数）のパース
 * @param res
 */
var parseNewResponse = function (res) {
    //結果を格納する配列
    var result = [];
    // 新着レスを改行ごとにSplitする
    var resArray = res.split(/\r\n|\r|\n/);
    // 1行ごとにパースする
    resArray.forEach(function (value) {
        // パースメソッド呼び出し
        if (value.length > 0) {
            result.push(purseResponse(value));
        }
    });
    return result;
};
/**
 * スレ一覧のパース
 * @param String // res レスポンス1レス
 * @param Integer // num レス番（0スタート）
 */
var parseThreadList = function (boardUrl, subjectLine) {
    var _a, _b, _c, _d, _e;
    //APIの返却値を<>で分割
    //レスの要素
    //0:dat名
    //1:スレタイ（レス数）
    var splitRes = subjectLine.split(',');
    // log.debug(splitRes);
    var datNum = splitRes[0].replace('.cgi', '');
    var hostname = (_b = (_a = boardUrl.match(/^https?:\/\/.+?\//)) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : '';
    var boardName = boardUrl.replace(hostname, '');
    var url = hostname + "bbs/read.cgi/" + boardName + datNum + "/";
    // log.info(`${hostname}  ${boardName} ${datNum}`);
    var titleTemp = splitRes[1];
    var name = (_d = (_c = titleTemp.match(/(.*?)\(\d+\)$/)) === null || _c === void 0 ? void 0 : _c[1]) !== null && _d !== void 0 ? _d : '★取得失敗★';
    var resNum = Number((_e = titleTemp.match(/\(\d+\)$/)) === null || _e === void 0 ? void 0 : _e[0].replace(/\(|\)/g, ''));
    // オブジェクトを返却
    return {
        url: url,
        name: name,
        resNum: resNum,
    };
};
/**
 * レスポンスのパース
 * Jsonオブジェクトを返却する
 * @param String // res レスポンス1レス
 */
var purseResponse = function (res) {
    //APIの返却値を<>で分割
    //レスの要素
    //0:レス番号
    //1:名前
    //2:メアド
    //3:日付
    //4:本文
    //5:スレタイ
    //6:ID
    var splitRes = res.split('<>');
    var resJson = {
        number: splitRes[0],
        name: splitRes[1],
        email: splitRes[2],
        date: splitRes[3],
        text: splitRes[4],
        threadTitle: splitRes[5] ? splitRes[5] : '',
        id: splitRes[6],
        imgUrl: '',
        from: 'bbs',
    };
    // オブジェクトを返却
    return resJson;
};
/** したらばだけは全角ダッシュがUnicode文字列として格納されるので変換する */
var decodeUnicodeStr = function (str) {
    return str.replace(/&#65374;/g, '～');
};
exports.default = ReadSitaraba;


/***/ }),

/***/ "./src/main/startServer.ts":
/*!*********************************!*\
  !*** ./src/main/startServer.ts ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTranslateDom = exports.sendDom = exports.createDom = exports.findSeList = void 0;
var path_1 = __importDefault(__webpack_require__(/*! path */ "path"));
var express_1 = __importDefault(__webpack_require__(/*! express */ "express"));
var axios_1 = __importDefault(__webpack_require__(/*! axios */ "axios"));
var cors_1 = __importDefault(__webpack_require__(/*! cors */ "cors"));
var electron_log_1 = __importDefault(__webpack_require__(/*! electron-log */ "electron-log"));
var dank_twitch_irc_1 = __webpack_require__(/*! dank-twitch-irc */ "dank-twitch-irc");
var youtube_chat_1 = __webpack_require__(/*! ./youtube-chat */ "./src/main/youtube-chat/index.ts");
var electron_1 = __webpack_require__(/*! electron */ "electron");
var express_ws_1 = __importDefault(__webpack_require__(/*! express-ws */ "express-ws"));
var util_1 = __webpack_require__(/*! ./util */ "./src/main/util.ts");
// レス取得APIをセット
var getRes_1 = __importStar(__webpack_require__(/*! ./getRes */ "./src/main/getRes.ts"));
var bouyomi_chan_1 = __importDefault(__webpack_require__(/*! ./bouyomi-chan */ "./src/main/bouyomi-chan/index.ts"));
var voicevox_1 = __importDefault(__webpack_require__(/*! ./voicevox */ "./src/main/voicevox/index.ts"));
var child_process_1 = __webpack_require__(/*! child_process */ "child_process");
var const_1 = __webpack_require__(/*! ./const */ "./src/main/const.ts");
var niconama_1 = __importDefault(__webpack_require__(/*! ./niconama */ "./src/main/niconama/index.ts"));
var jpnkn_1 = __importDefault(__webpack_require__(/*! ./jpnkn */ "./src/main/jpnkn/index.ts"));
var azureStt_1 = __importDefault(__webpack_require__(/*! ./azureStt */ "./src/main/azureStt/index.ts"));
var googletrans_1 = __importDefault(__webpack_require__(/*! googletrans */ "googletrans"));
var CommentIcons_1 = __importDefault(__webpack_require__(/*! ./CommentIcons */ "./src/main/CommentIcons.ts"));
var app;
// サーバーをグローバル変数にセットできるようにする（サーバー停止処理のため）
var server;
/** 棒読みちゃんインスタンス */
var bouyomi;
/** VoiceVoxインスタンス */
var voiceVox;
/** スレッド定期取得実行するか */
var threadIntervalEvent = false;
/** キュー処理実行するか */
var isExecuteQue = false;
/** 接続中の全WebSocket */
var aWss;
var serverId = 0;
/**
 * VOICEVOX の読み込み(Rendererからの要求による)
 */
var loadVoiceVox = function (config_voicevox, force) {
    if (force === void 0) { force = false; }
    return __awaiter(void 0, void 0, void 0, function () {
        var configuration;
        return __generator(this, function (_a) {
            if (!(voiceVox === null || voiceVox === void 0 ? void 0 : voiceVox.available) || force) {
                voiceVox = new voicevox_1.default({ path: config_voicevox.path });
            }
            configuration = {
                path: voiceVox.path,
                available: voiceVox.available,
                speakerAndStyle: config_voicevox.speakerAndStyle,
                speakers: voiceVox.speakers.reduce(function (state, speaker) {
                    return state.concat(speaker.styles.map(function (style) { return { speaker: speaker.name, style: style.name }; }));
                }, []),
            };
            globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_VOICEVOX_CONFIG, configuration);
            return [2 /*return*/];
        });
    });
};
electron_1.ipcMain.on(const_1.electronEvent.LOAD_VOICEVOX, function (event, config_voicevox) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        loadVoiceVox(config_voicevox, false);
        return [2 /*return*/];
    });
}); });
/**
 * 設定の適用
 */
electron_1.ipcMain.on(const_1.electronEvent.APPLY_CONFIG, function (event, config) { return __awaiter(void 0, void 0, void 0, function () {
    var oldConfig, isChangedUrl, isChangeSePath, ret;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                electron_log_1.default.info('[apply-config] start');
                electron_log_1.default.info(config);
                oldConfig = globalThis.config;
                isChangedUrl = globalThis.config.url !== config.url;
                isChangeSePath = globalThis.config.sePath !== config.sePath;
                globalThis.config = config;
                if (!isChangeSePath) return [3 /*break*/, 2];
                return [4 /*yield*/, exports.findSeList()];
            case 1:
                _d.sent();
                _d.label = 2;
            case 2:
                // initメッセージ
                resetInitMessage();
                // iconを設定
                globalThis.electron.iconList = new CommentIcons_1.default({
                    bbs: config.iconDirBbs,
                    youtube: config.iconDirYoutube,
                    twitch: config.iconDirTwitch,
                    niconico: config.iconDirNiconico,
                    stt: config.iconDirStt,
                });
                if (!(isChangedUrl && config.url)) return [3 /*break*/, 4];
                return [4 /*yield*/, getRes_1.getRes(globalThis.config.url, NaN)];
            case 3:
                ret = _d.sent();
                electron_log_1.default.debug(ret);
                if (ret.length === 0) {
                    globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.SHOW_ALERT, '掲示板URLがおかしそうです');
                    return [2 /*return*/];
                }
                globalThis.electron.threadNumber = Number(ret[ret.length - 1].number);
                electron_log_1.default.info("[apply-config] new res num is " + globalThis.electron.threadNumber);
                // チャットウィンドウとブラウザに、末尾のスレだけ反映する
                exports.sendDom([ret[ret.length - 1]]);
                // スレタイ更新
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'bbs', category: 'title', message: ret[0].threadTitle });
                _d.label = 4;
            case 4:
                // VOICE VOX 関連
                if (config.typeYomiko === 'voicevox' || config.typeYomikoStt === 'voicevox') {
                    // VOICEVOX 利用の場合のみ
                    if (((_a = oldConfig.voicevox) === null || _a === void 0 ? void 0 : _a.path) !== ((_b = config.voicevox) === null || _b === void 0 ? void 0 : _b.path)) {
                        // VOICEVOX 読み込み先パスが変わっていれば強制読み込み直し
                        loadVoiceVox(config.voicevox, true);
                    }
                    else {
                        // パスが変わっていない場合は未読み込みの時だけ読み込む
                        loadVoiceVox(config.voicevox, false);
                    }
                }
                if (voiceVox) {
                    voiceVox.speaker = ((_c = config.voicevox) === null || _c === void 0 ? void 0 : _c.speakerAndStyle) || '';
                    voiceVox.prefix = config.bouyomiPrefix;
                    voiceVox.volume = config.bouyomiVolume;
                }
                return [2 /*return*/];
        }
    });
}); });
/**
 * サーバー起動
 */
electron_1.ipcMain.on(const_1.electronEvent.START_SERVER, function (event, config) { return __awaiter(void 0, void 0, void 0, function () {
    var expressApp, expressInstance, nico, jpn, stt;
    return __generator(this, function (_a) {
        globalThis.electron.chatWindow.webContents.send(const_1.electronEvent.CLEAR_COMMENT);
        globalThis.electron.translateWindow.webContents.send(const_1.electronEvent.CLEAR_COMMENT);
        globalThis.electron.threadNumber = 0;
        globalThis.electron.commentQueueList = [];
        globalThis.electron.threadConnectionError = 0;
        serverId = new Date().getTime();
        expressApp = express_1.default();
        expressApp.use(cors_1.default());
        expressInstance = express_ws_1.default(expressApp);
        app = expressInstance.app;
        aWss = expressInstance.getWss();
        app.set('view engine', 'ejs');
        // viewディレクトリの指定
        app.set('views', path_1.default.resolve(__dirname, '../views'));
        // 設定情報をグローバル変数へセットする
        globalThis.config = config;
        electron_log_1.default.debug('[startServer]設定値 = ');
        electron_log_1.default.debug(globalThis.config);
        app.get('/', function (req, res, next) {
            res.render('server', config);
            req.connection.end();
        });
        // サーバー設定のIF
        app.get('/config', function (req, res, next) {
            res.send(JSON.stringify(globalThis.config));
        });
        // 静的コンテンツはpublicディレクトリの中身を使用するという宣言
        app.use(express_1.default.static(path_1.default.resolve(__dirname, '../public')));
        // 2ch互換掲示板の取得
        app.use('/getRes', getRes_1.default);
        // iconを設定
        globalThis.electron.iconList = new CommentIcons_1.default({
            bbs: globalThis.config.iconDirBbs,
            youtube: globalThis.config.iconDirYoutube,
            twitch: globalThis.config.iconDirTwitch,
            niconico: globalThis.config.iconDirNiconico,
            stt: globalThis.config.iconDirStt,
        });
        // SEを取得する
        if (globalThis.config.sePath) {
            exports.findSeList();
        }
        // Twitchに接続
        if (globalThis.config.twitchId) {
            startTwitchChat();
        }
        // Youtubeチャット
        if (globalThis.config.youtubeId || globalThis.config.youtubeLiveId) {
            startYoutubeChat();
        }
        // ニコ生
        if (globalThis.config.niconicoId) {
            nico = new niconama_1.default({ communityId: globalThis.config.niconicoId });
            globalThis.electron.niconicoChat = nico;
            nico.on('start', function () {
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'niconico', category: 'status', message: "connection waiting" });
            });
            nico.on('wait', function () {
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'niconico', category: 'status', message: "wait for starting boradcast" });
            });
            nico.on('open', function (event) {
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, {
                    commentType: 'niconico',
                    category: 'status',
                    message: "ok No=" + event.number,
                });
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, {
                    commentType: 'niconico',
                    category: 'liveId',
                    message: "" + event.liveId,
                });
            });
            nico.on('comment', function (event) {
                globalThis.electron.commentQueueList.push({
                    imgUrl: globalThis.electron.iconList.getNiconico(),
                    number: event.number,
                    name: event.name,
                    text: event.comment,
                    from: 'niconico',
                });
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, {
                    commentType: 'niconico',
                    category: 'status',
                    message: "ok No=" + event.number,
                });
            });
            // 切断とか枠終了とか
            nico.on('end', function () {
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, {
                    commentType: 'niconico',
                    category: 'status',
                    message: "disconnect",
                });
            });
            nico.on('error', function () {
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'niconico', category: 'status', message: "error" });
            });
            nico.start();
        }
        // jpnkn
        if (globalThis.config.jpnknFastBoardId) {
            jpn = new jpnkn_1.default(globalThis.config.jpnknFastBoardId);
            globalThis.electron.jpnknFast = jpn;
            jpn.on('start', function () {
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'jpnkn', category: 'status', message: "connection waiting" });
            });
            jpn.on('open', function () {
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, {
                    commentType: 'jpnkn',
                    category: 'status',
                    message: "ok",
                });
            });
            jpn.on('comment', function (event) {
                globalThis.electron.commentQueueList.push(__assign(__assign({}, event), { imgUrl: globalThis.electron.iconList.getBbs() }));
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, {
                    commentType: 'jpnkn',
                    category: 'status',
                    message: "ok No=" + event.number,
                });
            });
            // 切断とか枠終了とか
            jpn.on('end', function () {
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, {
                    commentType: 'jpnkn',
                    category: 'status',
                    message: "disconnect",
                });
            });
            jpn.on('error', function () {
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'jpnkn', category: 'status', message: "error" });
            });
            jpn.start();
        }
        // 棒読みちゃん接続
        if (config.typeYomiko === 'bouyomi' || config.typeYomikoStt === 'bouyomi') {
            if (config.bouyomiPort) {
                bouyomi = new bouyomi_chan_1.default({ port: config.bouyomiPort, volume: config.bouyomiVolume, prefix: config.bouyomiPrefix });
            }
        }
        // VoiceVox 接続
        if (config.typeYomiko === 'voicevox' || config.typeYomikoStt === 'voicevox') {
            if (config.voicevox) {
                if (!(voiceVox === null || voiceVox === void 0 ? void 0 : voiceVox.available)) {
                    voiceVox = new voicevox_1.default({
                        path: config.voicevox.path,
                        speaker: config.voicevox.speakerAndStyle,
                        volume: config.bouyomiVolume,
                        prefix: config.bouyomiPrefix,
                    });
                }
                else {
                    voiceVox.speaker = config.voicevox.speakerAndStyle;
                    voiceVox.volume = config.bouyomiVolume;
                    voiceVox.prefix = config.bouyomiPrefix;
                }
            }
        }
        // Azure SpeechToText
        if (globalThis.config.azureStt && globalThis.config.azureStt.enable && globalThis.config.azureStt.key && globalThis.config.azureStt.region) {
            stt = new azureStt_1.default(globalThis.config.azureStt.name || "", globalThis.config.azureStt.key, globalThis.config.azureStt.region, globalThis.config.azureStt.language || "ja-JP", globalThis.config.azureStt.inputDevice);
            globalThis.electron.azureStt = stt;
            stt.on('start', function () {
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, {
                    commentType: 'stt',
                    category: 'status',
                    message: "started"
                });
            });
            stt.on('comment', function (event) {
                globalThis.electron.commentQueueList.push(__assign(__assign({}, event), { imgUrl: globalThis.electron.iconList.getStt() }));
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, {
                    commentType: 'stt',
                    category: 'status',
                    message: "ok",
                });
            });
            // 読み取り終了
            stt.on('end', function () {
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, {
                    commentType: 'stt',
                    category: 'status',
                    message: "stopped",
                });
            });
            stt.on('error', function () {
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, {
                    commentType: 'stt',
                    category: 'status',
                    message: "error",
                });
            });
            stt.start();
        }
        // レス取得定期実行
        threadIntervalEvent = true;
        getResInterval(serverId);
        // キュー処理の開始
        isExecuteQue = true;
        taskScheduler(serverId);
        if (globalThis.config.translate.enable) {
            globalThis.electron.translateWindow.focus();
            translateTaskScheduler(serverId);
        }
        // WebSocketを立てる
        app.ws('/ws', function (ws, req) {
            ws.on('message', function (message) {
                electron_log_1.default.debug('Received: ' + message.toString());
                if (message.toString() === 'ping') {
                    ws.send('pong');
                }
            });
            ws.on('close', function () {
                electron_log_1.default.debug('I lost a client');
            });
        });
        // 指定したポートで待ち受け開始
        server = app.listen(config.port, function () {
            electron_log_1.default.debug('[startServer] start server on port:' + config.port);
        });
        // 成功メッセージ返却
        event.returnValue = 'success';
        return [2 /*return*/];
    });
}); });
electron_1.ipcMain.on(const_1.electronEvent.COMMENT_TEST, function (event, config) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        globalThis.config = config;
        return [2 /*return*/, commentTest()];
    });
}); });
var commentTest = function () { return __awaiter(void 0, void 0, void 0, function () {
    var textList, text;
    return __generator(this, function (_a) {
        // コメントテスト
        try {
            textList = [
                'ﾃｽﾃｽｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗ',
                '∈(･ω･)∋ ﾀﾞﾑｰ',
                'おめーらいつまで経っても<br/>ピアキャストかよ',
                "Hello everyone!<br/>I'm Unacast<br/><br/>Yes.",
            ];
            text = textList[Math.floor(Math.random() * textList.length)];
            exports.sendDom([
                {
                    id: '100',
                    name: 'ななしさん',
                    text: text,
                    imgUrl: './img/unacast.png',
                    from: 'bbs',
                },
            ]);
        }
        catch (e) {
            electron_log_1.default.debug(e);
        }
        return [2 /*return*/];
    });
}); };
var findSeList = function () { return __awaiter(void 0, void 0, void 0, function () {
    var list, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                if (!globalThis.config.sePath) return [3 /*break*/, 2];
                return [4 /*yield*/, util_1.readWavFiles(globalThis.config.sePath)];
            case 1:
                list = _a.sent();
                globalThis.electron.seList = list.map(function (file) { return globalThis.config.sePath + "/" + file; });
                electron_log_1.default.debug("SE files = " + globalThis.electron.seList.length);
                return [3 /*break*/, 3];
            case 2:
                globalThis.electron.seList = [];
                _a.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                e_1 = _a.sent();
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.SHOW_ALERT, '着信音のパスがおかしそうです');
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.findSeList = findSeList;
/**
 * Twitchチャットに接続
 * @description 再接続処理はライブラリが勝手にやってくれる
 */
var startTwitchChat = function () { return __awaiter(void 0, void 0, void 0, function () {
    var twitchChat;
    return __generator(this, function (_a) {
        try {
            twitchChat = new dank_twitch_irc_1.ChatClient();
            twitchChat.connect();
            twitchChat.join(globalThis.config.twitchId);
            globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'twitch', category: 'status', message: 'wait live' });
            // 接続完了
            twitchChat.on('ready', function () {
                electron_log_1.default.debug('[Twitch] Successfully connected to chat');
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'twitch', category: 'status', message: 'ok' });
            });
            // チャット受信
            twitchChat.on('PRIVMSG', function (msg) {
                electron_log_1.default.info('[Twitch] comment received');
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'twitch', category: 'status', message: 'ok' });
                // log.info(JSON.stringify(msg, null, '  '));
                var imgUrl = globalThis.electron.iconList.getTwitch();
                var name = util_1.escapeHtml(msg.displayName);
                var text = util_1.escapeHtml(msg.messageText);
                // エモートを画像タグにする
                if (globalThis.config.emoteAnimation) {
                    msg.emotes.map(function (emote) {
                        text = text.replace(emote.code, "<img src=\"https://static-cdn.jtvnw.net/emoticons/v2/" + emote.id + "/default/light/" + globalThis.config.emoteSize + ".0\" />");
                    });
                }
                else {
                    msg.emotes.map(function (emote) {
                        text = text.replace(emote.code, "<img src=\"https://static-cdn.jtvnw.net/emoticons/v1/" + emote.id + "/" + globalThis.config.emoteSize + ".0\" />");
                    });
                }
                globalThis.electron.commentQueueList.push({ imgUrl: imgUrl, name: name, text: text, from: 'twitch' });
            });
            globalThis.electron.twitchChat = twitchChat;
            // なんかエラーがあった
            twitchChat.on('error', function (event) {
                electron_log_1.default.error("[Twitch] " + JSON.stringify(event));
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'twitch', category: 'status', message: 'error!' });
            });
            twitchChat.on('close', function (event) {
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'twitch', category: 'status', message: 'connection end' });
            });
        }
        catch (e) {
            electron_log_1.default.error(e);
            globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'twitch', category: 'status', message: 'error!' });
        }
        return [2 /*return*/];
    });
}); };
/** Youtubeチャットに接続 */
var startYoutubeChat = function () { return __awaiter(void 0, void 0, void 0, function () {
    var createYoutubeComment_1;
    return __generator(this, function (_a) {
        try {
            electron_log_1.default.info('[Youtube Chat] connect started');
            if (globalThis.config.youtubeLiveId) {
                globalThis.electron.youtubeChat = new youtube_chat_1.LiveChat({ liveId: globalThis.config.youtubeLiveId });
            }
            else {
                globalThis.electron.youtubeChat = new youtube_chat_1.LiveChat({ channelId: globalThis.config.youtubeId });
            }
            globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'status', message: 'wait live' });
            // 接続開始イベント
            globalThis.electron.youtubeChat.on('start', function (liveId) {
                electron_log_1.default.info("[Youtube Chat] connected liveId = " + liveId);
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'liveid', message: liveId });
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'status', message: 'ok' });
            });
            // 接続終了イベント
            globalThis.electron.youtubeChat.on('end', function (reason) {
                electron_log_1.default.info('[Youtube Chat] disconnect');
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'status', message: 'connection end' });
            });
            createYoutubeComment_1 = function (comment) { return __awaiter(void 0, void 0, void 0, function () {
                var icon, thumbnail, thumbnailImgBuf, b64, e_2, imgUrl, name, text, _i, _a, message, txtItem, imageItem;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            icon = globalThis.electron.iconList.getYoutube();
                            thumbnail = (_c = (_b = comment.author.thumbnail) === null || _b === void 0 ? void 0 : _b.url) !== null && _c !== void 0 ? _c : '';
                            if (!(!icon && thumbnail)) return [3 /*break*/, 4];
                            _d.label = 1;
                        case 1:
                            _d.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, axios_1.default.get(thumbnail, { responseType: 'arraybuffer' })];
                        case 2:
                            thumbnailImgBuf = _d.sent();
                            b64 = Buffer.from(thumbnailImgBuf.data).toString('base64');
                            icon = b64;
                            return [3 /*break*/, 4];
                        case 3:
                            e_2 = _d.sent();
                            electron_log_1.default.warn(e_2);
                            return [3 /*break*/, 4];
                        case 4:
                            if (!icon) {
                                icon = globalThis.electron.iconList.getYoutubeLogo();
                            }
                            imgUrl = icon;
                            name = util_1.escapeHtml(comment.author.name);
                            text = '';
                            for (_i = 0, _a = comment.message; _i < _a.length; _i++) {
                                message = _a[_i];
                                txtItem = message.text;
                                if (txtItem) {
                                    text += util_1.escapeHtml(txtItem);
                                }
                                else {
                                    imageItem = message;
                                    text += "<img src=\"" + imageItem.url + "\" width=\"" + 24 + "\" height=\"" + 24 + "\" />";
                                }
                            }
                            // const text = escapeHtml((comment.message[0] as any).text);
                            return [2 /*return*/, { imgUrl: imgUrl, name: name, text: text, from: 'youtube' }];
                    }
                });
            }); };
            // 初期チャット受信
            globalThis.electron.youtubeChat.on('firstComment', function (comment) {
                electron_log_1.default.info('[Youtube] comment received');
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'status', message: 'ok' });
                // チャットウィンドウだけに出力
                createYoutubeComment_1(comment).then(function (data) { return sendDomForChatWindow([data]); });
            });
            // チャット受信
            globalThis.electron.youtubeChat.on('comment', function (comment) {
                electron_log_1.default.info('[Youtube] comment received');
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'status', message: 'ok' });
                createYoutubeComment_1(comment).then(function (data) { return globalThis.electron.commentQueueList.push(data); });
            });
            // 何かエラーがあった
            globalThis.electron.youtubeChat.on('error', function (err) {
                electron_log_1.default.error("[Youtube Chat] " + err.message);
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'status', message: "error! " + err.message });
            });
            globalThis.electron.youtubeChat.start();
        }
        catch (e) {
            // たぶんここには来ない
            electron_log_1.default.error(e);
        }
        return [2 /*return*/];
    });
}); };
/**
 * サーバー停止
 */
electron_1.ipcMain.on(const_1.electronEvent.STOP_SERVER, function (event) {
    electron_log_1.default.debug('[startServer] server stop');
    server.close();
    aWss.close();
    app = null;
    event.returnValue = 'stop';
    // キュー処理停止
    isExecuteQue = false;
    globalThis.electron.commentQueueList = [];
    // レス取得の停止
    threadIntervalEvent = false;
    globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'bbs', category: 'title', message: "" });
    globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'bbs', category: 'status', message: "connection end" });
    // Twitchチャットの停止
    if (globalThis.electron.twitchChat) {
        globalThis.electron.twitchChat.close();
        globalThis.electron.twitchChat.removeAllListeners();
        globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'twitch', category: 'status', message: "connection end" });
    }
    // Youtubeチャットの停止
    if (globalThis.electron.youtubeChat) {
        globalThis.electron.youtubeChat.stop();
        globalThis.electron.youtubeChat.removeAllListeners();
        globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'status', message: "connection end" });
        globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'youtube', category: 'liveId', message: "none" });
    }
    // ニコ生チャットの停止
    if (globalThis.electron.niconicoChat) {
        globalThis.electron.niconicoChat.stop();
        globalThis.electron.niconicoChat.removeAllListeners();
        globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'niconico', category: 'status', message: "connection end" });
        globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'niconico', category: 'liveId', message: "none" });
    }
    // jpnkn Fastインターフェース
    if (globalThis.electron.jpnknFast) {
        globalThis.electron.jpnknFast.stop();
        globalThis.electron.jpnknFast.removeAllListeners();
        globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'jpnkn', category: 'status', message: "connection end" });
    }
    // Azure Speech To Textインターフェース
    if (globalThis.electron.azureStt) {
        globalThis.electron.azureStt.stop();
        globalThis.electron.azureStt.removeAllListeners();
        globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'stt', category: 'status', message: "connection end" });
    }
});
var getResInterval = function (exeId) { return __awaiter(void 0, void 0, void 0, function () {
    var resNum, isfirst, result, threadTitle, temp, _loop_1, _i, result_1, item;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                isfirst = false;
                if (!(!globalThis.config.url && threadIntervalEvent && exeId === serverId)) return [3 /*break*/, 2];
                return [4 /*yield*/, util_1.sleep(globalThis.config.interval * 1000)];
            case 1:
                _a.sent();
                getResInterval(exeId);
                return [2 /*return*/];
            case 2:
                if (!globalThis.electron.threadNumber) {
                    // 初回
                    isfirst = true;
                    resNum = NaN;
                }
                else {
                    // 2回目以降
                    resNum = globalThis.electron.threadNumber;
                }
                return [4 /*yield*/, getRes_1.getRes(globalThis.config.url, resNum)];
            case 3:
                result = _a.sent();
                if (isfirst && result.length > 0) {
                    threadTitle = result[0].threadTitle;
                    globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'bbs', category: 'title', message: threadTitle });
                }
                // 指定したレス番以下は除外対象
                if (resNum) {
                    result = result.filter(function (res) { return (res.number ? Number(res.number) > resNum : true); });
                }
                if (result.length > 0 && result[result.length - 1].number) {
                    globalThis.electron.threadNumber = Number(result[result.length - 1].number);
                    if (isfirst) {
                        temp = result;
                        if (!globalThis.config.dispSort) {
                            temp = temp.reverse();
                        }
                        sendDomForChatWindow(temp);
                    }
                    else {
                        _loop_1 = function (item) {
                            // リストに同じレス番があったら追加しない
                            if (!globalThis.electron.commentQueueList.find(function (comment) { return comment.number === item.number; })) {
                                globalThis.electron.commentQueueList.push(item);
                            }
                        };
                        for (_i = 0, result_1 = result; _i < result_1.length; _i++) {
                            item = result_1[_i];
                            _loop_1(item);
                        }
                    }
                    globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'bbs', category: 'status', message: "ok res=" + globalThis.electron.threadNumber });
                }
                else if (result.length > 0) {
                    globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.UPDATE_STATUS, { commentType: 'bbs', category: 'status', message: 'error!' });
                    // 番号が無くて結果が入ってるのは通信エラーメッセージ
                    sendDomForChatWindow(result);
                }
                return [4 /*yield*/, checkAutoMoveThread()];
            case 4:
                _a.sent();
                return [4 /*yield*/, notifyThreadResLimit()];
            case 5:
                _a.sent();
                if (!(threadIntervalEvent && exeId === serverId)) return [3 /*break*/, 7];
                return [4 /*yield*/, util_1.sleep(globalThis.config.interval * 1000)];
            case 6:
                _a.sent();
                getResInterval(exeId);
                _a.label = 7;
            case 7: return [2 /*return*/];
        }
    });
}); };
/** レス番が上限かチェックして、超えてたら通知する */
var notifyThreadResLimit = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(globalThis.config.notifyThreadResLimit > 0 && globalThis.electron.threadNumber >= globalThis.config.notifyThreadResLimit)) return [3 /*break*/, 2];
                sendDomForChatWindow([
                    {
                        name: 'unacastより',
                        imgUrl: './img/unacast.png',
                        text: "\u30EC\u30B9\u304C" + globalThis.config.notifyThreadResLimit + "\u3092\u8D85\u3048\u307E\u3057\u305F\u3002\u6B21\u30B9\u30EC\u3092\u7ACB\u3066\u3066\u304F\u3060\u3055\u3044\u3002",
                        from: 'system',
                    },
                ]);
                // スレ立て中だと思うのでちょっと待つ
                return [4 /*yield*/, util_1.sleep(10 * 1000)];
            case 1:
                // スレ立て中だと思うのでちょっと待つ
                _a.sent();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); };
var checkAutoMoveThread = function () { return __awaiter(void 0, void 0, void 0, function () {
    var threadUrl, boardInfo, threadList, target;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!globalThis.config.moveThread)
                    return [2 /*return*/];
                if (globalThis.electron.threadNumber < 1000)
                    return [2 /*return*/];
                threadUrl = globalThis.config.url;
                return [4 /*yield*/, getRes_1.threadUrlToBoardInfo(threadUrl)];
            case 1:
                boardInfo = _a.sent();
                return [4 /*yield*/, getRes_1.getThreadList(boardInfo.boardUrl)];
            case 2:
                threadList = _a.sent();
                target = threadList.find(function (item) { return item.url !== threadUrl && item.resNum < 1000; });
                if (!target)
                    return [2 /*return*/];
                // 次スレが見つかったので移動する
                globalThis.electron.commentQueueList.push({
                    name: 'unacastより',
                    imgUrl: './img/unacast.png',
                    text: "\u30EC\u30B91000\u3092\u8D85\u3048\u307E\u3057\u305F\u3002\u6B21\u30B9\u30EC\u5019\u88DC \u300C" + target.name + "\u300D \u306B\u79FB\u52D5\u3057\u307E\u3059",
                    from: 'system',
                });
                globalThis.config.url = target.url;
                globalThis.electron.threadNumber = 0;
                globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.SAVE_CONFIG, globalThis.config);
                return [2 /*return*/];
        }
    });
}); };
/**
 * キューに溜まったコメントをブラウザに表示する
 */
var taskScheduler = function (exeId) { return __awaiter(void 0, void 0, void 0, function () {
    var temp, comment;
    var _a;
    var _b, _c, _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                if (!(((_c = (_b = globalThis.electron) === null || _b === void 0 ? void 0 : _b.commentQueueList) === null || _c === void 0 ? void 0 : _c.length) > 0)) return [3 /*break*/, 3];
                electron_log_1.default.info("[taskScheduler] " + ((_e = (_d = globalThis.electron) === null || _d === void 0 ? void 0 : _d.commentQueueList) === null || _e === void 0 ? void 0 : _e.length));
                if (!(globalThis.config.commentProcessType === 0)) return [3 /*break*/, 1];
                temp = __spreadArrays(globalThis.electron.commentQueueList);
                globalThis.electron.commentQueueList = [];
                // 新着が上の場合は逆順にする
                if (!globalThis.config.dispSort) {
                    temp = temp.reverse();
                }
                exports.sendDom(temp);
                if (globalThis.config.translate.enable) {
                    (_a = globalThis.electron.translateQueueList).push.apply(_a, temp);
                }
                return [3 /*break*/, 3];
            case 1:
                comment = globalThis.electron.commentQueueList.shift();
                return [4 /*yield*/, exports.sendDom([comment])];
            case 2:
                _f.sent();
                if (globalThis.config.translate.enable) {
                    globalThis.electron.translateQueueList.push(comment);
                }
                _f.label = 3;
            case 3:
                if (!(isExecuteQue && exeId === serverId)) return [3 /*break*/, 5];
                return [4 /*yield*/, util_1.sleep(100)];
            case 4:
                _f.sent();
                taskScheduler(exeId);
                _f.label = 5;
            case 5: return [2 /*return*/];
        }
    });
}); };
/**
 * キューに溜まったコメントをブラウザに表示する
 */
var translateTaskScheduler = function (exeId) { return __awaiter(void 0, void 0, void 0, function () {
    var comment;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                if (!(((_b = (_a = globalThis.electron) === null || _a === void 0 ? void 0 : _a.translateQueueList) === null || _b === void 0 ? void 0 : _b.length) > 0)) return [3 /*break*/, 4];
                electron_log_1.default.info("[translateTaskScheduler] " + ((_d = (_c = globalThis.electron) === null || _c === void 0 ? void 0 : _c.translateQueueList) === null || _d === void 0 ? void 0 : _d.length));
                comment = globalThis.electron.translateQueueList.shift();
                if (!(globalThis.config.translate.targetLang === 'ja' && !util_1.isNihongo(comment.text))) return [3 /*break*/, 2];
                // 日本語が1文字も入ってなければ翻訳する
                return [4 /*yield*/, sendDomForTranslateWindow(comment)];
            case 1:
                // 日本語が1文字も入ってなければ翻訳する
                _e.sent();
                return [3 /*break*/, 4];
            case 2:
                if (!(globalThis.config.translate.targetLang === 'en')) return [3 /*break*/, 4];
                // 英語オンリーってどうやって簡易的に判断するのかよくわからないので全部翻訳する
                return [4 /*yield*/, sendDomForTranslateWindow(comment)];
            case 3:
                // 英語オンリーってどうやって簡易的に判断するのかよくわからないので全部翻訳する
                _e.sent();
                _e.label = 4;
            case 4:
                if (!(isExecuteQue && exeId === serverId)) return [3 /*break*/, 6];
                return [4 /*yield*/, util_1.sleep(500)];
            case 5:
                _e.sent();
                translateTaskScheduler(exeId);
                _e.label = 6;
            case 6: return [2 /*return*/];
        }
    });
}); };
/** 読み子によって発話中であるか */
var isSpeaking = false;
/** 読み子を再生する */
var playYomiko = function (typeYomiko, msg) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                // log.info('[playYomiko] start');
                if (isSpeaking) {
                    // 以前の読み子がまだ読んでいる
                    switch (typeYomiko) {
                        case 'tamiyasu': {
                            // TODO:強制的に発話を終了する
                            break;
                        }
                        case 'bouyomi': {
                            // TODO:強制的に発話を終了する
                            break;
                        }
                        case 'voicevox': {
                            // 強制的に発話を終了する
                            if (voiceVox)
                                voiceVox.abort();
                            break;
                        }
                    }
                }
                isSpeaking = true;
                // 読み子呼び出し
                switch (typeYomiko) {
                    case 'tamiyasu': {
                        electron_log_1.default.debug(config.tamiyasuPath + " \"" + msg + "\"");
                        child_process_1.spawn(config.tamiyasuPath, [msg]);
                        // 読み子が読んでる時間分相当待つ
                        globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.WAIT_YOMIKO_TIME, msg);
                        break;
                    }
                    case 'bouyomi': {
                        if (bouyomi) {
                            bouyomi.speak(msg);
                            // 読み子が読んでる時間分相当待つ
                            globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.WAIT_YOMIKO_TIME, msg);
                        }
                        else {
                            isSpeaking = false;
                        }
                        break;
                    }
                    case 'voicevox': {
                        if (voiceVox) {
                            voiceVox.speak(msg);
                        }
                        else {
                            isSpeaking = false;
                        }
                        break;
                    }
                    default:
                        isSpeaking = false;
                        break;
                }
                _a.label = 1;
            case 1:
                if (!isSpeaking) return [3 /*break*/, 3];
                return [4 /*yield*/, util_1.sleep(50)];
            case 2:
                _a.sent();
                return [3 /*break*/, 1];
            case 3: return [2 /*return*/];
        }
    });
}); };
electron_1.ipcMain.on(const_1.electronEvent.SPEAKING_END, function (event) { return (isSpeaking = false); });
var isPlayingSe = false;
var playSe = function () { return __awaiter(void 0, void 0, void 0, function () {
    var wavfilepath, _i, _a, deviceId;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                wavfilepath = globalThis.electron.seList[Math.floor(Math.random() * globalThis.electron.seList.length)];
                isPlayingSe = true;
                for (_i = 0, _a = globalThis.config.audioOutputDevices; _i < _a.length; _i++) {
                    deviceId = _a[_i];
                    globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.PLAY_SOUND_START, { wavfilepath: wavfilepath, volume: globalThis.config.playSeVolume, deviceId: deviceId });
                }
                _b.label = 1;
            case 1:
                if (!isPlayingSe) return [3 /*break*/, 3];
                return [4 /*yield*/, util_1.sleep(50)];
            case 2:
                _b.sent();
                return [3 /*break*/, 1];
            case 3: return [2 /*return*/];
        }
    });
}); };
electron_1.ipcMain.on(const_1.electronEvent.PLAY_SOUND_END, function (event) { return (isPlayingSe = false); });
var createDom = function (message, type, isAA) {
    var domStr = "<li class=\"list-item\">";
    /** レス番とかの行が何かしら表示対象になっているか */
    var isResNameShowed = false;
    // アイコン表示
    if (globalThis.config.showIcon) {
        domStr += "\n    <span class=\"icon-block\">\n      <img class=\"icon\" src=\"data:image/png;base64," + message.imgUrl + "\">\n    </span>\n    ";
        isResNameShowed = true;
    }
    domStr += "<div class=\"content\">";
    // レス番表示
    if (globalThis.config.showNumber && message.number) {
        domStr += "\n      <span class=\"resNumber\">" + message.number + "</span>\n    ";
        isResNameShowed = true;
    }
    // 名前表示
    if (globalThis.config.showName && message.name) {
        domStr += "<span class=\"name\">" + message.name + "</span>";
        isResNameShowed = true;
    }
    // 時刻表示
    if (globalThis.config.showTime && message.date) {
        domStr += "<span class=\"date\">" + message.date + "</span>";
        isResNameShowed = true;
    }
    // 名前と本文を改行で分ける
    // 名前や時刻の行が一つも無ければ、改行しない
    if (globalThis.config.newLine && isResNameShowed) {
        domStr += '<br />';
    }
    else if (globalThis.config.aamode.enable && isAA) {
        // AAモードがオンで対象がAAなら強制的に改行する
        domStr += '<br />';
    }
    // リンクを整形する
    var text = message.text
        .replace(/<a .*?>/g, '') // したらばはアンカーをaタグ化している
        .replace(/<\\a>/g, '');
    // httpの直前に英数字記号が無い箇所を置換
    var reg = new RegExp("(h?ttps?(://[-_.!~*'()a-zA-Z0-9;/?:@&=+$,%#]+))", 'g');
    // FIXME: imgタグへの誤爆を雑に回避
    var tempText = text.replace(/"http/g, '★★★★http★★★★');
    var commentText = tempText.replace(reg, '<span class="url" onClick=\'urlopen("$1")\'>$1</span>');
    commentText = commentText.replace(/★★★★http★★★★/g, '"http');
    if (isAA) {
        domStr += "\n    <span class=\"aares\">\n      " + commentText + "\n    </span>\n  ";
    }
    else {
        domStr += "\n    <span class=\"res\">\n      " + commentText + "\n    </span>\n  ";
    }
    // サムネイル表示
    var isThumbnailShow = (globalThis.config.thumbnail == 1 && type === 'chat') || globalThis.config.thumbnail == 2;
    if (isThumbnailShow) {
        var imgreg = new RegExp("(h?ttps?(://[-_.!~*'()a-zA-Z0-9;/?:@&=+$,%#]+)(.jpg|.png|.gif))", 'g');
        var imgUrls_2 = [];
        var matched = text.match(imgreg);
        if (matched) {
            matched.map(function (value) {
                // log.info(value);
                imgUrls_2.push(value);
            });
        }
        if (imgUrls_2.length > 0) {
            domStr += '<div class="thumbnail">';
            domStr += imgUrls_2
                .map(function (url) {
                var tmp = url;
                if (tmp.match(/^ttp/)) {
                    tmp = "h" + tmp;
                }
                return "<img class=\"img\" src=\"" + tmp + "\" onClick='imageopen(\"" + tmp + "\")' />";
            })
                .join('');
            domStr += '</div>';
            // 画像URL非表示が有効なら消す
            if (globalThis.config.hideImgUrl) {
                for (var _i = 0, imgUrls_1 = imgUrls_2; _i < imgUrls_1.length; _i++) {
                    var imgurl = imgUrls_1[_i];
                    // log.info('非表示するぞ ' + imgurl);
                    domStr = domStr.replace("<span class=\"url\" onClick='urlopen(\"" + imgurl + "\")'>" + imgurl + "</span>", '');
                }
            }
        }
    }
    // 〆
    domStr += "</div>\n  </li>";
    return domStr;
};
exports.createDom = createDom;
/**
 * コメントのDOMをブラウザに送る
 * 必要ならレス着信音も鳴らす
 * @param message
 */
var sendDom = function (messageList) { return __awaiter(void 0, void 0, void 0, function () {
    var newList, domStr, socketObject_1, typeYomiko, text, e_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 12, , 13]);
                newList = util_1.judgeAaMessage(messageList);
                domStr = newList.map(function (message) { return exports.createDom(message, 'server', message.isAA); }).join('\n');
                socketObject_1 = {
                    type: 'add',
                    message: domStr,
                };
                if (aWss) {
                    aWss.clients.forEach(function (client) {
                        client.send(JSON.stringify(socketObject_1));
                    });
                }
                // レンダラーのコメント一覧にも表示
                sendDomForChatWindow(newList);
                if (!(globalThis.electron.seList.length > 0)) return [3 /*break*/, 5];
                if (!newList.every(function (message) { return message.from === 'stt'; })) return [3 /*break*/, 3];
                if (!config.playSeStt) return [3 /*break*/, 2];
                return [4 /*yield*/, playSe()];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [3 /*break*/, 5];
            case 3:
                if (!config.playSe) return [3 /*break*/, 5];
                return [4 /*yield*/, playSe()];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5:
                typeYomiko = newList[newList.length - 1].from === 'stt' ? globalThis.config.typeYomikoStt : globalThis.config.typeYomiko;
                if (!(typeYomiko !== 'none')) return [3 /*break*/, 9];
                if (!(newList[newList.length - 1].isAA && config.aamode.enable)) return [3 /*break*/, 7];
                return [4 /*yield*/, playYomiko(typeYomiko, config.aamode.speakWord)];
            case 6:
                _a.sent();
                return [3 /*break*/, 9];
            case 7:
                text = newList[newList.length - 1].text.replace(/<br> /g, '\n ').replace(/<br>/g, '\n ');
                text = text.replace(/<img.*?\/>/g, '');
                text = text.replace(/<a .*?>/g, '').replace(/<\/a>/g, '');
                text = util_1.unescapeHtml(text);
                if (globalThis.config.yomikoReplaceNewline) {
                    text = text.replace(/\r\n/g, ' ').replace(/\n/g, ' ');
                }
                return [4 /*yield*/, playYomiko(typeYomiko, text)];
            case 8:
                _a.sent();
                _a.label = 9;
            case 9:
                if (!(globalThis.config.dispType === 1)) return [3 /*break*/, 11];
                return [4 /*yield*/, util_1.sleep(globalThis.config.minDisplayTime * 1000)];
            case 10:
                _a.sent();
                _a.label = 11;
            case 11:
                // 鳴らし終わって読み子が終わった
                resetInitMessage();
                return [3 /*break*/, 13];
            case 12:
                e_3 = _a.sent();
                electron_log_1.default.error(e_3);
                return [3 /*break*/, 13];
            case 13: return [2 /*return*/];
        }
    });
}); };
exports.sendDom = sendDom;
/** チャットウィンドウへのコメント表示 */
var sendDomForChatWindow = function (messageList) {
    var domStr2 = util_1.judgeAaMessage(messageList)
        .map(function (message) {
        var imgUrl = message.imgUrl && message.imgUrl.match(/^\./) ? '../../public/' + message.imgUrl : message.imgUrl;
        return __assign(__assign({}, message), { imgUrl: imgUrl });
    })
        .map(function (message) { return exports.createDom(message, 'chat', message.isAA); })
        .join('\n');
    globalThis.electron.chatWindow.webContents.send(const_1.electronEvent.SHOW_COMMENT, { config: globalThis.config, dom: domStr2 });
};
var resetInitMessage = function () {
    if (globalThis.config.dispType === 1) {
        var resetObj_1 = {
            type: 'reset',
            message: globalThis.config.initMessage,
        };
        aWss.clients.forEach(function (client) {
            client.send(JSON.stringify(resetObj_1));
        });
    }
};
var createTranslateDom = function (message, translated) {
    var domStr = "<li class=\"list-item\">";
    /** レス番とかの行が何かしら表示対象になっているか */
    var isResNameShowed = false;
    // アイコン表示
    if (globalThis.config.showIcon) {
        domStr += "\n    <span class=\"icon-block\">\n      <img class=\"icon\" src=\"" + message.imgUrl + "\">\n    </span>\n    ";
    }
    domStr += "<div class=\"content\">";
    // レス番表示
    if (globalThis.config.showNumber && message.number) {
        domStr += "\n      <span class=\"resNumber\">" + message.number + "</span>\n    ";
        isResNameShowed = true;
    }
    // 名前表示
    if (globalThis.config.showName && message.name) {
        domStr += "<span class=\"name\">" + message.name + "</span>";
        isResNameShowed = true;
    }
    // 時刻表示
    if (globalThis.config.showTime && message.date) {
        domStr += "<span class=\"date\">" + message.date + "</span>";
        isResNameShowed = true;
    }
    // 名前と本文を改行で分ける
    // 名前や時刻の行が一つも無ければ、改行しない
    if (isResNameShowed) {
        domStr += '<br />';
    }
    electron_log_1.default.info(translated + "   ---  " + message.text);
    domStr += "\n  <div class=\"res\">\n    " + translated + "\n  </div>\n  <hr style=\"margin: 1px;border-top: 1px solid black\" />\n  <span class=\"res-org\">\n    " + message.text + "\n  </span>\n";
    // 〆
    domStr += "</div>\n  </li>";
    return domStr;
};
exports.createTranslateDom = createTranslateDom;
/** 翻訳ウィンドウへのコメント表示 */
var sendDomForTranslateWindow = function (message) { return __awaiter(void 0, void 0, void 0, function () {
    var reg, orgText, translated, domStr, e_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                electron_log_1.default.info('[sendDomForTranslateWindow]');
                message.imgUrl = message.imgUrl && message.imgUrl.match(/^\./) ? '../../public/' + message.imgUrl : message.imgUrl;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                reg = new RegExp("(h?ttps?(://[-_.!~*'()a-zA-Z0-9;/?:@&=+$,%#]+))", 'g');
                orgText = message.text
                    .replace(/<a .*?>/g, '')
                    .replace(/<\\a>/g, '')
                    .replace(/<img .*?>/g, '')
                    .replace(/<\\img>/g, '')
                    .replace(reg, '')
                    .trim();
                return [4 /*yield*/, googletrans_1.default(util_1.unescapeHtml(orgText), {
                        to: globalThis.config.translate.targetLang,
                        from: 'auto',
                        tld: globalThis.config.translate.targetLang === 'ja' ? 'co.jp' : 'com',
                    })];
            case 2:
                translated = _a.sent();
                electron_log_1.default.info(translated.text);
                // もし何もテキストとして残らなかったら表示しない
                if (!translated.text)
                    return [2 /*return*/, ''];
                domStr = exports.createTranslateDom(__assign(__assign({}, message), { text: orgText }), util_1.escapeHtml(translated.text));
                globalThis.electron.translateWindow.webContents.send(const_1.electronEvent.SHOW_COMMENT_TL, { config: globalThis.config, dom: domStr });
                return [3 /*break*/, 4];
            case 3:
                e_4 = _a.sent();
                electron_log_1.default.error(JSON.stringify(e_4));
                globalThis.electron.translateWindow.webContents.send(const_1.electronEvent.SHOW_COMMENT_TL, { config: globalThis.config, dom: '<div>翻訳でエラー</div>' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
electron_1.ipcMain.on(const_1.electronEvent.PREVIEW_IMAGE, function (event, url) {
    globalThis.electron.imagePreviewWindow.webContents.send(const_1.electronEvent.PREVIEW_IMAGE, url);
    globalThis.electron.imagePreviewWindow.show();
});
exports.default = {};


/***/ }),

/***/ "./src/main/util.ts":
/*!**************************!*\
  !*** ./src/main/util.ts ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNihongo = exports.judgeAaMessage = exports.unescapeHtml = exports.escapeHtml = exports.sleep = exports.readWavFiles = void 0;
var fs_1 = __importDefault(__webpack_require__(/*! fs */ "fs"));
var readWavFiles = function (path) {
    return new Promise(function (resolve, reject) {
        fs_1.default.readdir(path, function (err, files) {
            if (err)
                reject(err);
            var fileList = files.filter(function (file) {
                return isExistFile(path + '/' + file) && /.*\.wav$/.test(file); //絞り込み
            });
            resolve(fileList);
        });
    });
};
exports.readWavFiles = readWavFiles;
var isExistFile = function (file) {
    try {
        fs_1.default.statSync(file).isFile();
        return true;
    }
    catch (err) {
        if (err.code === 'ENOENT')
            return false;
    }
};
var sleep = function (msec) { return new Promise(function (resolve) { return setTimeout(resolve, msec); }); };
exports.sleep = sleep;
var escapeHtml = function (string) {
    if (typeof string !== 'string') {
        return string;
    }
    return string.replace(/[&'`"<>]/g, function (match) {
        return {
            '&': '&amp;',
            "'": '&#x27;',
            '`': '&#x60;',
            '"': '&quot;',
            '<': '&lt;',
            '>': '&gt;',
        }[match];
    });
};
exports.escapeHtml = escapeHtml;
var unescapeHtml = function (str) {
    return str
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x60;/g, '`')
        .replace(/&#044;/g, ',')
        .replace(/&amp;/g, '&');
};
exports.unescapeHtml = unescapeHtml;
var judgeAaMessage = function (messageList) {
    return messageList.map(function (message) {
        var isAA = false;
        if (config.aamode.enable) {
            if (config.aamode.condition.length <= message.text.length)
                isAA = true;
            for (var _i = 0, _a = config.aamode.condition.words; _i < _a.length; _i++) {
                var word = _a[_i];
                if (message.text.includes(word))
                    isAA = true;
            }
        }
        return __assign(__assign({}, message), { isAA: isAA });
    });
};
exports.judgeAaMessage = judgeAaMessage;
/** 日本語のテキストか */
var isNihongo = function (message) {
    var reg = new RegExp('.*[ぁ-んァ-ヶ亜-熙ａ-ｚＡ-Ｚ]+.*');
    return reg.test(message);
};
exports.isNihongo = isNihongo;


/***/ }),

/***/ "./src/main/voicevox/index.ts":
/*!************************************!*\
  !*** ./src/main/voicevox/index.ts ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var const_1 = __webpack_require__(/*! ../const */ "./src/main/const.ts");
var ffi_napi_1 = __importDefault(__webpack_require__(/*! ffi-napi */ "ffi-napi"));
var ref_napi_1 = __importDefault(__webpack_require__(/*! ref-napi */ "ref-napi"));
var ref_struct_napi_1 = __importDefault(__webpack_require__(/*! ref-struct-napi */ "ref-struct-napi"));
var os_1 = __importDefault(__webpack_require__(/*! os */ "os"));
var path_1 = __importDefault(__webpack_require__(/*! path */ "path"));
var fs_1 = __importDefault(__webpack_require__(/*! fs */ "fs"));
var VoicevoxInitializeOptions = ref_struct_napi_1.default({
    accelerationMode: 'int',
    cpuNumThreads: 'uint16',
    loadAllModels: 'bool',
    openJTalkDictDir: 'string',
});
var VoicevoxAudioQueryOptions = ref_struct_napi_1.default({
    kana: 'bool',
});
var VoicevoxSynthesisOptions = ref_struct_napi_1.default({
    enable_interrogative_upspeak: 'bool',
});
var VoicevoxTtsOptions = ref_struct_napi_1.default({
    kana: 'bool',
    enable_interrogative_upspeak: 'bool',
});
var VoiceVoxClient = /** @class */ (function () {
    function VoiceVoxClient(options) {
        var _a, _b, _c;
        /**
         * 読み上げに使用する話者。
         * 話者名とスタイル名を\で接続した文字列を格納する。
         */
        this.speaker = '';
        /**
         * 読み上げ音量 default=50 (0 ～ 100)
        */
        this.volume = 50;
        /**
         * 読み上げの際先頭に付加する文字列
         */
        this.prefix = '';
        /**
         * 速度倍率 default=1.0 (0.5 ～ 2.0)
         */
        this.speed = 1.0;
        /**
         * 音声ピッチ default=0.0 (-0.15 ～ 0.15)
         */
        this.pitch = 0.0;
        /**
         * 抑揚倍率 default=1.0 (0.0 ～ 2.0)
         */
        this.intonation = 1.0;
        var voicevox_path = (options === null || options === void 0 ? void 0 : options.path) || "";
        if (os_1.default.platform() == 'win32') {
            // パスが設定されていれば指定したパスから VOICEVOX を読み込む。
            // 設定されていない(空の場合)は VOICEVOX の既定のインストール先を検索する。
            // Windows の場合は
            // * C:/Program Files/VOICEVOX
            // * C:/Users/(ユーザー名)/AppData/Local/Programs/VOICEVOX
            // のいずれか
            var search_paths = voicevox_path ? [voicevox_path] : [
                path_1.default.join(process.env['PROGRAMFILES'] || 'C:\\Program Files', 'VOICEVOX'),
                path_1.default.join(os_1.default.homedir(), 'AppData\\Local\\Programs\\VOICEVOX'),
            ];
            voicevox_path = search_paths.find(function (p) { return fs_1.default.existsSync(path_1.default.join(p, 'voicevox_core.dll')); }) || "";
            if (voicevox_path) {
                var kernel32 = ffi_napi_1.default.Library("kernel32.dll", {
                    'SetDllDirectoryW': ['bool', ['uint16*']],
                });
                kernel32.SetDllDirectoryW(Buffer.from(voicevox_path + "\0", 'utf16le'));
            }
        }
        else if (os_1.default.platform() == 'darwin') {
            // macOS の場合は
            // * /Applications/VOICEVOX/VOICEVOX.app/Contents/MacOS
            // * $HOME/Applications/VOICEVOX/VOICEVOX.app/Contents/MacOS
            // のいずれか
            var search_paths = voicevox_path ? [voicevox_path] : [
                '/Applications/VOICEVOX/VOICEVOX.app/Contents/MacOS',
                path_1.default.join(os_1.default.homedir(), '/Applications/VOICEVOX/VOICEVOX.app/Contents/MacOS'),
            ];
            voicevox_path = search_paths.find(function (p) { return fs_1.default.existsSync(path_1.default.join(p, 'libvoicevox_core.dylib')); }) || "";
        }
        try {
            this.voicevox_core = ffi_napi_1.default.Library('voicevox_core', {
                'voicevox_initialize': ['int', [VoicevoxInitializeOptions]],
                'voicevox_get_metas_json': ['string', []],
                'voicevox_audio_query': ['int', ['string', 'uint32', VoicevoxAudioQueryOptions, 'char**']],
                'voicevox_audio_query_json_free': ['void', ['char*']],
                'voicevox_synthesis': ['int', ['string', 'uint32', VoicevoxSynthesisOptions, ref_napi_1.default.sizeof.pointer == 8 ? 'uint64*' : 'uint32*', 'uint8**']],
                'voicevox_tts': ['int', ['string', 'uint32', VoicevoxTtsOptions, ref_napi_1.default.sizeof.pointer == 8 ? 'uint64*' : 'uint32*', 'uint8**']],
                'voicevox_wav_free': ['void', ['uint8*']],
                'voicevox_is_model_loaded': ['bool', ['uint32']],
                'voicevox_load_model': ['int', ['uint32']],
            });
            var opts = new VoicevoxInitializeOptions();
            opts.accelerationMode = 0; // 利用モードは自動(GPUが使えれば使う)
            opts.cpuNumThreads = 0;
            opts.loadAllModels = false;
            // 辞書ファイルの場所は今のところ固定(VOICEVOXインストール先/pyopenjtalk/open_jtalk_dic_utf_8-1.11)
            opts.openJTalkDictDir = path_1.default.join(voicevox_path, 'pyopenjtalk', 'open_jtalk_dic_utf_8-1.11');
            if (this.voicevox_core.voicevox_initialize(opts) == 0) {
                var metas = JSON.parse(this.voicevox_core.voicevox_get_metas_json());
                this.speakers = metas;
                this.available = true;
                this.path = voicevox_path;
            }
            else {
                this.speakers = [];
                this.available = false;
                this.path = options === null || options === void 0 ? void 0 : options.path;
            }
        }
        catch (_d) {
            this.available = false;
            this.voicevox_core = null;
            this.speakers = [];
            this.path = options === null || options === void 0 ? void 0 : options.path;
        }
        this.speaker = (_a = options === null || options === void 0 ? void 0 : options.speaker) !== null && _a !== void 0 ? _a : '';
        this.volume = (_b = options === null || options === void 0 ? void 0 : options.volume) !== null && _b !== void 0 ? _b : 50;
        this.prefix = (_c = options === null || options === void 0 ? void 0 : options.prefix) !== null && _c !== void 0 ? _c : '';
    }
    /**
     * 読み上げを開始します。
     * @param message VOICEVOX に読み上げてもらう文章
     */
    VoiceVoxClient.prototype.speak = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var concatMessage, speakerAndStyle, speaker, style, query_option, audio_query, audio_query_json, audio_query_obj, opts, len, wav, result, buf;
            return __generator(this, function (_a) {
                concatMessage = this.prefix.concat(message);
                speakerAndStyle = this.speaker.split('\\');
                speaker = this.speakers.find(function (speaker) { return speaker.name === speakerAndStyle[0]; }) || this.speakers[0];
                if (!speaker) {
                    return [2 /*return*/, false];
                }
                style = speaker.styles.find(function (style) { return style.name === speakerAndStyle[1]; }) || speaker.styles[0];
                if (!style) {
                    return [2 /*return*/, false];
                }
                if (!this.voicevox_core.voicevox_is_model_loaded(style.id)) {
                    this.voicevox_core.voicevox_load_model(style.id);
                }
                query_option = VoicevoxAudioQueryOptions();
                query_option.kana = false;
                audio_query = ref_napi_1.default.alloc('char*');
                if (this.voicevox_core.voicevox_audio_query(concatMessage, style.id, query_option, audio_query) == 0) {
                    audio_query_json = audio_query.deref().readCString();
                    this.voicevox_core.voicevox_audio_query_json_free(audio_query.deref());
                    audio_query_obj = JSON.parse(audio_query_json);
                    audio_query_obj.speed_scale = this.speed;
                    audio_query_obj.pitch_scale = this.pitch;
                    audio_query_obj.intonation_scale = this.intonation;
                    audio_query_json = JSON.stringify(audio_query_obj);
                    opts = VoicevoxSynthesisOptions();
                    opts.enable_interrogative_upspeak = true;
                    len = ref_napi_1.default.alloc(ref_napi_1.default.sizeof.pointer == 8 ? 'uint64' : 'uint32');
                    wav = ref_napi_1.default.alloc('uint8*');
                    result = this.voicevox_core.voicevox_synthesis(audio_query_json, style.id, opts, len, wav);
                    if (result == 0) {
                        buf = new Uint8Array(len.readUInt32LE());
                        wav.readPointer(0, len.readUInt32LE()).copy(buf);
                        this.voicevox_core.voicevox_wav_free(wav.deref());
                        // VOICEVOX は WAV のデータを出力してくるので実際の再生は renderer プロセスにお願いする。
                        globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.SPEAK_WAV, { wavblob: buf, volume: this.volume, deviceId: undefined });
                    }
                }
                return [2 /*return*/, true];
            });
        });
    };
    /**
     * 読み上げを中断します。
     */
    VoiceVoxClient.prototype.abort = function () {
        globalThis.electron.mainWindow.webContents.send(const_1.electronEvent.ABORT_WAV);
    };
    return VoiceVoxClient;
}());
exports.default = VoiceVoxClient;


/***/ }),

/***/ "./src/main/youtube-chat/index.ts":
/*!****************************************!*\
  !*** ./src/main/youtube-chat/index.ts ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveChat = void 0;
var live_chat_1 = __webpack_require__(/*! ./live-chat */ "./src/main/youtube-chat/live-chat.ts");
Object.defineProperty(exports, "LiveChat", { enumerable: true, get: function () { return live_chat_1.LiveChat; } });


/***/ }),

/***/ "./src/main/youtube-chat/live-chat.ts":
/*!********************************************!*\
  !*** ./src/main/youtube-chat/live-chat.ts ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveChat = void 0;
var events_1 = __webpack_require__(/*! events */ "events");
var axios_1 = __importDefault(__webpack_require__(/*! axios */ "axios"));
var parser_1 = __webpack_require__(/*! ./parser */ "./src/main/youtube-chat/parser.ts");
var util_1 = __webpack_require__(/*! ../util */ "./src/main/util.ts");
var electron_log_1 = __importDefault(__webpack_require__(/*! electron-log */ "electron-log"));
var log = electron_log_1.default.scope('Youtube-chat');
/**
 * YouTubeライブチャット取得イベント
 */
var LiveChat = /** @class */ (function (_super) {
    __extends(LiveChat, _super);
    function LiveChat(options, interval) {
        if (interval === void 0) { interval = 5000; }
        var _this = _super.call(this) || this;
        _this.interval = interval;
        /** コメントAPIKey */
        _this.commentApiKey = '';
        /** 自分の取得位置を表すID */
        _this.continuation = '';
        /** 表示済みのコメントID */
        _this.displayedId = {};
        _this.isFirst = true;
        /** 停止要求をされた */
        _this.isStop = false;
        if ('channelId' in options) {
            _this.channelId = options.channelId;
        }
        else if ('liveId' in options) {
            _this.liveId = options.liveId;
        }
        else {
            throw TypeError('Required channelId or liveId.');
        }
        return _this;
    }
    LiveChat.prototype.start = function () {
        this.isFirst = true;
        this.isStop = false;
        this.commentApiKey = '';
        this.continuation = '';
        this.fetchLiveId();
    };
    LiveChat.prototype.fetchLiveId = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var url, liveRes, e_1, init, e_2;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.isStop)
                            return [2 /*return*/];
                        if (!this.channelId) return [3 /*break*/, 6];
                        url = "https://www.youtube.com/channel/" + this.channelId + "/live";
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, axios_1.default.get(url, { headers: LiveChat.headers })];
                    case 2:
                        liveRes = _b.sent();
                        if (!!liveRes.data.match(/liveChatHeaderRenderer/)) return [3 /*break*/, 4];
                        // 配信が開始してないパターンが考えられるのでリトライ
                        this.emit('error', new Error('Live stream not found'));
                        return [4 /*yield*/, util_1.sleep(2000)];
                    case 3:
                        _b.sent();
                        this.fetchLiveId();
                        return [2 /*return*/];
                    case 4:
                        this.liveId = (_a = liveRes.data.match(/videoId":"(.+?)"/)) === null || _a === void 0 ? void 0 : _a[1];
                        return [3 /*break*/, 6];
                    case 5:
                        e_1 = _b.sent();
                        // チャンネルID自体が違うのはもうどうしようもないので止める
                        this.emit('error', new Error("connection error url = " + url));
                        return [2 /*return*/];
                    case 6:
                        if (!this.liveId) return [3 /*break*/, 15];
                        _b.label = 7;
                    case 7:
                        _b.trys.push([7, 12, , 14]);
                        return [4 /*yield*/, this.getInitParam()];
                    case 8:
                        init = _b.sent();
                        if (!(init.api && init.continuation)) return [3 /*break*/, 9];
                        this.commentApiKey = init.api;
                        this.continuation = init.continuation;
                        this.observer = setInterval(function () { return _this.fetchChat(); }, this.interval);
                        this.emit('start', this.liveId);
                        return [3 /*break*/, 11];
                    case 9:
                        // 配信ページはあるのに何らかの理由でAPIKeyが取れなかった
                        this.emit('error', new Error("failed fetch apikey liveId=" + this.liveId));
                        return [4 /*yield*/, util_1.sleep(2000)];
                    case 10:
                        _b.sent();
                        this.fetchLiveId();
                        _b.label = 11;
                    case 11: return [3 /*break*/, 14];
                    case 12:
                        e_2 = _b.sent();
                        // 考えられるのは、LiveIdを指定していて、ページが取れたが、isLiveNowがfalseだった時
                        this.emit('error', new Error(e_2.message));
                        return [4 /*yield*/, util_1.sleep(2000)];
                    case 13:
                        _b.sent();
                        this.fetchLiveId();
                        return [3 /*break*/, 14];
                    case 14: return [3 /*break*/, 17];
                    case 15:
                        // 配信が開始してないパターンが考えられるのでリトライ
                        this.emit('error', new Error('Live stream not found'));
                        return [4 /*yield*/, util_1.sleep(2000)];
                    case 16:
                        _b.sent();
                        this.fetchLiveId();
                        _b.label = 17;
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    LiveChat.prototype.stop = function (reason) {
        this.isStop = true;
        if (this.observer) {
            clearInterval(this.observer);
            this.emit('end', reason);
        }
        this.displayedId = {};
    };
    LiveChat.prototype.getInitParam = function () {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var url, res, isLiveNow, key, continuation;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        url = "https://www.youtube.com/watch?v=" + this.liveId;
                        return [4 /*yield*/, axios_1.default.get(url)];
                    case 1:
                        res = _d.sent();
                        try {
                            // 配信中か確認。配信中でなければエラーとみなす
                            isLiveNow = (_a = res.data
                                .match(/isLiveNow":.*?,/)) === null || _a === void 0 ? void 0 : _a[0].split(':')[1].replace(/"/g, '').replace(/,/g, '');
                            log.debug(isLiveNow);
                        }
                        catch (e) {
                            log.error(e.message);
                            return [2 /*return*/, { api: '', continuation: '' }];
                        }
                        if (isLiveNow === 'false')
                            throw new Error("liveId = " + this.liveId + " is not Live Now");
                        try {
                            key = (_b = res.data
                                .match(/innertubeApiKey":".*?"/)) === null || _b === void 0 ? void 0 : _b[0].split(':')[1].replace(/"/g, '');
                            log.debug("key is " + key);
                            continuation = (_c = res.data
                                .match(/continuation":".*?"/)) === null || _c === void 0 ? void 0 : _c[0].split(':')[1].replace(/"/g, '');
                            log.debug("initial continuation is " + continuation);
                            return [2 /*return*/, { api: key, continuation: continuation }];
                        }
                        catch (e) {
                            log.error(e.message);
                            return [2 /*return*/, { api: '', continuation: '' }];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    LiveChat.prototype.fetchChat = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var url, res, reqBody, con, temp, items, e_3;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        url = "https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=" + this.commentApiKey;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        reqBody = {
                            context: {
                                client: {
                                    clientName: 'WEB',
                                    clientVersion: '2.20210126.08.02',
                                    timeZone: 'Asia/Tokyo',
                                    utcOffsetMinutes: 540,
                                    mainAppWebInfo: {
                                        graftUrl: "https://www.youtube.com/live_chat?continuation=",
                                    },
                                },
                                request: {
                                    useSsl: true,
                                },
                            },
                            continuation: this.continuation,
                        };
                        log.debug("POST " + url);
                        return [4 /*yield*/, axios_1.default
                                .post(url, JSON.stringify(reqBody), { headers: LiveChat.headers })
                                .then(function (data) {
                                return data;
                            })
                                .catch(function (err) {
                                throw new Error(err.message);
                            })];
                    case 2:
                        res = _b.sent();
                        con = parser_1.getContinuation(res.data);
                        if (!con)
                            throw new Error('getContinuation error');
                        log.debug("next continuation is " + con);
                        this.continuation = con;
                        temp = (_a = res.data.continuationContents.liveChatContinuation.actions) !== null && _a !== void 0 ? _a : [];
                        if (temp.length === 0)
                            return [2 /*return*/];
                        if (this.isFirst) {
                            // 初回のみ、actions配列の末尾は入室メッセージみたいなやつなので除外する
                            temp = temp.slice(0, -1);
                        }
                        temp = temp.filter(function (v) {
                            var messageRenderer = parser_1.actionToRenderer(v);
                            return messageRenderer !== null && messageRenderer;
                        });
                        items = temp.map(function (v) { return parser_1.parseData(v); });
                        // 初回取得の場合は初期データとして出力
                        items.forEach(function (v) {
                            if (v) {
                                if (_this.isFirst) {
                                    _this.emit('firstComment', v);
                                }
                                else {
                                    // 表示済みならスキップ
                                    if (!_this.displayedId[v.id]) {
                                        _this.emit('comment', v);
                                    }
                                }
                            }
                        });
                        this.isFirst = false;
                        // 末尾のidを取得
                        log.info("items = " + items.length);
                        items.forEach(function (v) {
                            var id = v === null || v === void 0 ? void 0 : v.id;
                            if (id)
                                _this.displayedId[id] = true;
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        e_3 = _b.sent();
                        log.error(e_3);
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        if (res) {
                            log.error(JSON.stringify(res.data));
                        }
                        this.emit('error', new Error("Error occured at fetchchat url=" + url));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LiveChat.prototype.on = function (event, listener) {
        return _super.prototype.on.call(this, event, listener);
    };
    LiveChat.headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36',
        'Content-Type': 'application/json',
    };
    return LiveChat;
}(events_1.EventEmitter));
exports.LiveChat = LiveChat;


/***/ }),

/***/ "./src/main/youtube-chat/parser.ts":
/*!*****************************************!*\
  !*** ./src/main/youtube-chat/parser.ts ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContinuation = exports.parseData = exports.usecToTime = exports.actionToRenderer = void 0;
var electron_log_1 = __importDefault(__webpack_require__(/*! electron-log */ "electron-log"));
var log = electron_log_1.default.scope('Youtube-chat');
var parseThumbnailToImageItem = function (data, alt) {
    var thumbnail = data.pop();
    if (thumbnail) {
        return {
            url: thumbnail.url,
            width: thumbnail.width,
            height: thumbnail.height,
            alt: alt,
        };
    }
    return;
};
var parseEmojiToImageItem = function (data) {
    return parseThumbnailToImageItem(data.emoji.image.thumbnails, data.emoji.shortcuts.shift());
};
var parseMessages = function (runs) {
    return runs.map(function (run) {
        var _a;
        if ('text' in run) {
            if ((_a = run === null || run === void 0 ? void 0 : run.navigationEndpoint) === null || _a === void 0 ? void 0 : _a.urlEndpoint.url) {
                var tubeUrl = run.navigationEndpoint.urlEndpoint.url.replace(/^\/redirect\?/, '');
                var parsed = tubeUrl.split('&').filter(function (str) { return str.match(/^q=/); });
                var orgUrl = decodeURIComponent(parsed[0].replace(/^q=/, ''));
                return { text: orgUrl };
            }
            else {
                return run;
            }
        }
        else {
            // 絵文字を画像に置換
            return parseEmojiToImageItem(run);
        }
    });
};
var actionToRenderer = function (action) {
    if (!action.addChatItemAction) {
        return null;
    }
    var item = action.addChatItemAction.item;
    if (item.liveChatTextMessageRenderer) {
        return item.liveChatTextMessageRenderer;
    }
    else if (item.liveChatPaidMessageRenderer) {
        return item.liveChatPaidMessageRenderer;
    }
    else if (item.liveChatPaidStickerRenderer) {
        return item.liveChatPaidStickerRenderer;
    }
    else {
        return item.liveChatMembershipItemRenderer;
    }
};
exports.actionToRenderer = actionToRenderer;
var usecToTime = function (usec) {
    return Math.floor(Number(usec) / 1000);
};
exports.usecToTime = usecToTime;
var parseData = function (data) {
    var messageRenderer = exports.actionToRenderer(data);
    if (messageRenderer === null) {
        return null;
    }
    var message = [];
    if ('message' in messageRenderer) {
        message = messageRenderer.message.runs;
    }
    else if ('headerSubtext' in messageRenderer) {
        message = messageRenderer.headerSubtext.runs;
    }
    var ret = {
        id: messageRenderer.id,
        author: {
            name: messageRenderer.authorName.simpleText,
            thumbnail: parseThumbnailToImageItem(messageRenderer.authorPhoto.thumbnails, messageRenderer.authorName.simpleText),
            channelId: messageRenderer.authorExternalChannelId,
        },
        message: parseMessages(message),
        membership: Boolean('headerSubtext' in messageRenderer),
        isOwner: false,
        timestamp: exports.usecToTime(messageRenderer.timestampUsec),
    };
    if (messageRenderer.authorBadges) {
        var badge = messageRenderer.authorBadges[0].liveChatAuthorBadgeRenderer;
        if (badge.customThumbnail) {
            ret.author.badge = {
                thumbnail: parseThumbnailToImageItem(badge.customThumbnail.thumbnails, badge.tooltip),
                label: badge.tooltip,
            };
        }
        else {
            ret.isOwner = true;
        }
    }
    if ('sticker' in messageRenderer) {
        ret.superchat = {
            amount: messageRenderer.purchaseAmountText.simpleText,
            color: messageRenderer.backgroundColor,
            sticker: parseThumbnailToImageItem(messageRenderer.sticker.thumbnails, messageRenderer.sticker.accessibility.accessibilityData.label),
        };
    }
    else if ('purchaseAmountText' in messageRenderer) {
        ret.superchat = {
            amount: messageRenderer.purchaseAmountText.simpleText,
            color: messageRenderer.bodyBackgroundColor,
        };
    }
    return ret;
};
exports.parseData = parseData;
var getContinuation = function (body) {
    var _a, _b, _c, _d;
    var continuation = '';
    try {
        continuation = (_b = (_a = body.continuationContents.liveChatContinuation.continuations[0].invalidationContinuationData) === null || _a === void 0 ? void 0 : _a.continuation) !== null && _b !== void 0 ? _b : '';
    }
    catch (e) {
        // なんかまた知らないパターンが来た時用
        log.warn(e);
    }
    if (continuation)
        return continuation;
    try {
        continuation = (_d = (_c = body.continuationContents.liveChatContinuation.continuations[0].timedContinuationData) === null || _c === void 0 ? void 0 : _c.continuation) !== null && _d !== void 0 ? _d : '';
    }
    catch (e) {
        //
        log.warn(e);
    }
    if (continuation)
        return continuation;
    // なんやかんやしても見つからなかった
    if (!continuation)
        throw new Error('continuation not found!');
};
exports.getContinuation = getContinuation;


/***/ }),

/***/ "axios":
/*!************************!*\
  !*** external "axios" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("axios");

/***/ }),

/***/ "body-parser":
/*!******************************!*\
  !*** external "body-parser" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("body-parser");

/***/ }),

/***/ "cheerio":
/*!**************************!*\
  !*** external "cheerio" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("cheerio");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("child_process");

/***/ }),

/***/ "cors":
/*!***********************!*\
  !*** external "cors" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("cors");

/***/ }),

/***/ "dank-twitch-irc":
/*!**********************************!*\
  !*** external "dank-twitch-irc" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("dank-twitch-irc");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("electron");

/***/ }),

/***/ "electron-log":
/*!*******************************!*\
  !*** external "electron-log" ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("electron-log");

/***/ }),

/***/ "electron-window-state":
/*!****************************************!*\
  !*** external "electron-window-state" ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("electron-window-state");

/***/ }),

/***/ "encoding-japanese":
/*!************************************!*\
  !*** external "encoding-japanese" ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("encoding-japanese");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("events");

/***/ }),

/***/ "express":
/*!**************************!*\
  !*** external "express" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("express");

/***/ }),

/***/ "express-ws":
/*!*****************************!*\
  !*** external "express-ws" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("express-ws");

/***/ }),

/***/ "ffi-napi":
/*!***************************!*\
  !*** external "ffi-napi" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("ffi-napi");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),

/***/ "googletrans":
/*!******************************!*\
  !*** external "googletrans" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("googletrans");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("https");

/***/ }),

/***/ "iconv-lite":
/*!*****************************!*\
  !*** external "iconv-lite" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("iconv-lite");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("net");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("os");

/***/ }),

/***/ "paho-mqtt":
/*!****************************!*\
  !*** external "paho-mqtt" ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("paho-mqtt");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),

/***/ "ref-napi":
/*!***************************!*\
  !*** external "ref-napi" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("ref-napi");

/***/ }),

/***/ "ref-struct-napi":
/*!**********************************!*\
  !*** external "ref-struct-napi" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("ref-struct-napi");

/***/ }),

/***/ "ws":
/*!*********************!*\
  !*** external "ws" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("ws");

/***/ })

/******/ });
//# sourceMappingURL=index.js.map