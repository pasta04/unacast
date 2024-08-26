/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/electron-log/src/core/Logger.js":
/*!******************************************************!*\
  !*** ./node_modules/electron-log/src/core/Logger.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nconst scopeFactory = __webpack_require__(/*! ./scope */ \"./node_modules/electron-log/src/core/scope.js\");\n\n/**\n * @property {Function} error\n * @property {Function} warn\n * @property {Function} info\n * @property {Function} verbose\n * @property {Function} debug\n * @property {Function} silly\n */\nclass Logger {\n  static instances = {};\n\n  dependencies = {};\n  errorHandler = null;\n  eventLogger = null;\n  functions = {};\n  hooks = [];\n  isDev = false;\n  levels = null;\n  logId = null;\n  scope = null;\n  transports = {};\n  variables = {};\n\n  constructor({\n    allowUnknownLevel = false,\n    dependencies = {},\n    errorHandler,\n    eventLogger,\n    initializeFn,\n    isDev = false,\n    levels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'],\n    logId,\n    transportFactories = {},\n    variables,\n  } = {}) {\n    this.addLevel = this.addLevel.bind(this);\n    this.create = this.create.bind(this);\n    this.initialize = this.initialize.bind(this);\n    this.logData = this.logData.bind(this);\n    this.processMessage = this.processMessage.bind(this);\n\n    this.allowUnknownLevel = allowUnknownLevel;\n    this.dependencies = dependencies;\n    this.initializeFn = initializeFn;\n    this.isDev = isDev;\n    this.levels = levels;\n    this.logId = logId;\n    this.transportFactories = transportFactories;\n    this.variables = variables || {};\n    this.scope = scopeFactory(this);\n\n    this.addLevel('log', false);\n    for (const name of this.levels) {\n      this.addLevel(name, false);\n    }\n\n    this.errorHandler = errorHandler;\n    errorHandler?.setOptions({ ...dependencies, logFn: this.error });\n\n    this.eventLogger = eventLogger;\n    eventLogger?.setOptions({ ...dependencies, logger: this });\n\n    for (const [name, factory] of Object.entries(transportFactories)) {\n      this.transports[name] = factory(this, dependencies);\n    }\n\n    Logger.instances[logId] = this;\n  }\n\n  static getInstance({ logId }) {\n    return this.instances[logId] || this.instances.default;\n  }\n\n  addLevel(level, index = this.levels.length) {\n    if (index !== false) {\n      this.levels.splice(index, 0, level);\n    }\n\n    this[level] = (...args) => this.logData(args, { level });\n    this.functions[level] = this[level];\n  }\n\n  catchErrors(options) {\n    this.processMessage(\n      {\n        data: ['log.catchErrors is deprecated. Use log.errorHandler instead'],\n        level: 'warn',\n      },\n      { transports: ['console'] },\n    );\n    return this.errorHandler.startCatching(options);\n  }\n\n  create(options) {\n    if (typeof options === 'string') {\n      options = { logId: options };\n    }\n\n    return new Logger({\n      dependencies: this.dependencies,\n      errorHandler: this.errorHandler,\n      initializeFn: this.initializeFn,\n      isDev: this.isDev,\n      transportFactories: this.transportFactories,\n      variables: { ...this.variables },\n      ...options,\n    });\n  }\n\n  compareLevels(passLevel, checkLevel, levels = this.levels) {\n    const pass = levels.indexOf(passLevel);\n    const check = levels.indexOf(checkLevel);\n    if (check === -1 || pass === -1) {\n      return true;\n    }\n\n    return check <= pass;\n  }\n\n  initialize(options = {}) {\n    this.initializeFn({ logger: this, ...this.dependencies, ...options });\n  }\n\n  logData(data, options = {}) {\n    this.processMessage({ data, ...options });\n  }\n\n  processMessage(message, { transports = this.transports } = {}) {\n    if (message.cmd === 'errorHandler') {\n      this.errorHandler.handle(message.error, {\n        errorName: message.errorName,\n        processType: 'renderer',\n        showDialog: Boolean(message.showDialog),\n      });\n      return;\n    }\n\n    let level = message.level;\n    if (!this.allowUnknownLevel) {\n      level = this.levels.includes(message.level) ? message.level : 'info';\n    }\n\n    const normalizedMessage = {\n      date: new Date(),\n      ...message,\n      level,\n      variables: {\n        ...this.variables,\n        ...message.variables,\n      },\n    };\n\n    for (const [transName, transFn] of this.transportEntries(transports)) {\n      if (typeof transFn !== 'function' || transFn.level === false) {\n        continue;\n      }\n\n      if (!this.compareLevels(transFn.level, message.level)) {\n        continue;\n      }\n\n      try {\n        // eslint-disable-next-line arrow-body-style\n        const transformedMsg = this.hooks.reduce((msg, hook) => {\n          return msg ? hook(msg, transFn, transName) : msg;\n        }, normalizedMessage);\n\n        if (transformedMsg) {\n          transFn({ ...transformedMsg, data: [...transformedMsg.data] });\n        }\n      } catch (e) {\n        this.processInternalErrorFn(e);\n      }\n    }\n  }\n\n  processInternalErrorFn(_e) {\n    // Do nothing by default\n  }\n\n  transportEntries(transports = this.transports) {\n    const transportArray = Array.isArray(transports)\n      ? transports\n      : Object.entries(transports);\n\n    return transportArray\n      .map((item) => {\n        switch (typeof item) {\n          case 'string':\n            return this.transports[item] ? [item, this.transports[item]] : null;\n          case 'function':\n            return [item.name, item];\n          default:\n            return Array.isArray(item) ? item : null;\n        }\n      })\n      .filter(Boolean);\n  }\n}\n\nmodule.exports = Logger;\n\n\n//# sourceURL=webpack://unacast/./node_modules/electron-log/src/core/Logger.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/core/scope.js":
/*!*****************************************************!*\
  !*** ./node_modules/electron-log/src/core/scope.js ***!
  \*****************************************************/
/***/ ((module) => {

eval("\n\nmodule.exports = scopeFactory;\n\nfunction scopeFactory(logger) {\n  return Object.defineProperties(scope, {\n    defaultLabel: { value: '', writable: true },\n    labelPadding: { value: true, writable: true },\n    maxLabelLength: { value: 0, writable: true },\n    labelLength: {\n      get() {\n        switch (typeof scope.labelPadding) {\n          case 'boolean': return scope.labelPadding ? scope.maxLabelLength : 0;\n          case 'number': return scope.labelPadding;\n          default: return 0;\n        }\n      },\n    },\n  });\n\n  function scope(label) {\n    scope.maxLabelLength = Math.max(scope.maxLabelLength, label.length);\n\n    const newScope = {};\n    for (const level of [...logger.levels, 'log']) {\n      newScope[level] = (...d) => logger.logData(d, { level, scope: label });\n    }\n    return newScope;\n  }\n}\n\n\n//# sourceURL=webpack://unacast/./node_modules/electron-log/src/core/scope.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/renderer/index.js":
/*!*********************************************************!*\
  !*** ./node_modules/electron-log/src/renderer/index.js ***!
  \*********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nconst Logger = __webpack_require__(/*! ../core/Logger */ \"./node_modules/electron-log/src/core/Logger.js\");\nconst RendererErrorHandler = __webpack_require__(/*! ./lib/RendererErrorHandler */ \"./node_modules/electron-log/src/renderer/lib/RendererErrorHandler.js\");\nconst transportConsole = __webpack_require__(/*! ./lib/transports/console */ \"./node_modules/electron-log/src/renderer/lib/transports/console.js\");\nconst transportIpc = __webpack_require__(/*! ./lib/transports/ipc */ \"./node_modules/electron-log/src/renderer/lib/transports/ipc.js\");\n\nmodule.exports = createLogger();\nmodule.exports.Logger = Logger;\nmodule.exports[\"default\"] = module.exports;\n\nfunction createLogger() {\n  const logger = new Logger({\n    allowUnknownLevel: true,\n    errorHandler: new RendererErrorHandler(),\n    initializeFn: () => {},\n    logId: 'default',\n    transportFactories: {\n      console: transportConsole,\n      ipc: transportIpc,\n    },\n    variables: {\n      processType: 'renderer',\n    },\n  });\n\n  logger.errorHandler.setOptions({\n    logFn({ error, errorName, showDialog }) {\n      logger.transports.console({\n        data: [errorName, error].filter(Boolean),\n        level: 'error',\n      });\n      logger.transports.ipc({\n        cmd: 'errorHandler',\n        error: {\n          cause: error?.cause,\n          code: error?.code,\n          name: error?.name,\n          message: error?.message,\n          stack: error?.stack,\n        },\n        errorName,\n        logId: logger.logId,\n        showDialog,\n      });\n    },\n  });\n\n  if (typeof window === 'object') {\n    window.addEventListener('message', (event) => {\n      const { cmd, logId, ...message } = event.data || {};\n      const instance = Logger.getInstance({ logId });\n\n      if (cmd === 'message') {\n        instance.processMessage(message, { transports: ['console'] });\n      }\n    });\n  }\n\n  // To support custom levels\n  return new Proxy(logger, {\n    get(target, prop) {\n      if (typeof target[prop] !== 'undefined') {\n        return target[prop];\n      }\n\n      return (...data) => logger.logData(data, { level: prop });\n    },\n  });\n}\n\n\n//# sourceURL=webpack://unacast/./node_modules/electron-log/src/renderer/index.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/renderer/lib/RendererErrorHandler.js":
/*!****************************************************************************!*\
  !*** ./node_modules/electron-log/src/renderer/lib/RendererErrorHandler.js ***!
  \****************************************************************************/
/***/ ((module) => {

eval("\n\n// eslint-disable-next-line no-console\nconst consoleError = console.error;\n\nclass RendererErrorHandler {\n  logFn = null;\n  onError = null;\n  showDialog = false;\n  preventDefault = true;\n\n  constructor({ logFn = null } = {}) {\n    this.handleError = this.handleError.bind(this);\n    this.handleRejection = this.handleRejection.bind(this);\n    this.startCatching = this.startCatching.bind(this);\n    this.logFn = logFn;\n  }\n\n  handle(error, {\n    logFn = this.logFn,\n    errorName = '',\n    onError = this.onError,\n    showDialog = this.showDialog,\n  } = {}) {\n    try {\n      if (onError?.({ error, errorName, processType: 'renderer' }) !== false) {\n        logFn({ error, errorName, showDialog });\n      }\n    } catch {\n      consoleError(error);\n    }\n  }\n\n  setOptions({ logFn, onError, preventDefault, showDialog }) {\n    if (typeof logFn === 'function') {\n      this.logFn = logFn;\n    }\n\n    if (typeof onError === 'function') {\n      this.onError = onError;\n    }\n\n    if (typeof preventDefault === 'boolean') {\n      this.preventDefault = preventDefault;\n    }\n\n    if (typeof showDialog === 'boolean') {\n      this.showDialog = showDialog;\n    }\n  }\n\n  startCatching({ onError, showDialog } = {}) {\n    if (this.isActive) {\n      return;\n    }\n\n    this.isActive = true;\n    this.setOptions({ onError, showDialog });\n\n    window.addEventListener('error', (event) => {\n      this.preventDefault && event.preventDefault?.();\n      this.handleError(event.error || event);\n    });\n    window.addEventListener('unhandledrejection', (event) => {\n      this.preventDefault && event.preventDefault?.();\n      this.handleRejection(event.reason || event);\n    });\n  }\n\n  handleError(error) {\n    this.handle(error, { errorName: 'Unhandled' });\n  }\n\n  handleRejection(reason) {\n    const error = reason instanceof Error\n      ? reason\n      : new Error(JSON.stringify(reason));\n    this.handle(error, { errorName: 'Unhandled rejection' });\n  }\n}\n\nmodule.exports = RendererErrorHandler;\n\n\n//# sourceURL=webpack://unacast/./node_modules/electron-log/src/renderer/lib/RendererErrorHandler.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/renderer/lib/transports/console.js":
/*!**************************************************************************!*\
  !*** ./node_modules/electron-log/src/renderer/lib/transports/console.js ***!
  \**************************************************************************/
/***/ ((module) => {

eval("\n\n/* eslint-disable no-console */\n\nmodule.exports = consoleTransportRendererFactory;\n\nconst consoleMethods = {\n  error: console.error,\n  warn: console.warn,\n  info: console.info,\n  verbose: console.info,\n  debug: console.debug,\n  silly: console.debug,\n  log: console.log,\n};\n\nfunction consoleTransportRendererFactory(logger) {\n  return Object.assign(transport, {\n    format: '{h}:{i}:{s}.{ms}{scope} › {text}',\n\n    formatDataFn({\n      data = [],\n      date = new Date(),\n      format = transport.format,\n      logId = logger.logId,\n      scope = logger.scopeName,\n      ...message\n    }) {\n      if (typeof format === 'function') {\n        return format({ ...message, data, date, logId, scope });\n      }\n\n      if (typeof format !== 'string') {\n        return data;\n      }\n\n      data.unshift(format);\n\n      // Concatenate first two data items to support printf-like templates\n      if (typeof data[1] === 'string' && data[1].match(/%[1cdfiOos]/)) {\n        data = [`${data[0]} ${data[1]}`, ...data.slice(2)];\n      }\n\n      data[0] = data[0]\n        .replace(/\\{(\\w+)}/g, (substring, name) => {\n          switch (name) {\n            case 'level': return message.level;\n            case 'logId': return logId;\n            case 'scope': return scope ? ` (${scope})` : '';\n            case 'text': return '';\n\n            case 'y': return date.getFullYear().toString(10);\n            case 'm': return (date.getMonth() + 1).toString(10)\n              .padStart(2, '0');\n            case 'd': return date.getDate().toString(10).padStart(2, '0');\n            case 'h': return date.getHours().toString(10).padStart(2, '0');\n            case 'i': return date.getMinutes().toString(10).padStart(2, '0');\n            case 's': return date.getSeconds().toString(10).padStart(2, '0');\n            case 'ms': return date.getMilliseconds().toString(10)\n              .padStart(3, '0');\n            case 'iso': return date.toISOString();\n\n            default: {\n              return message.variables?.[name] || substring;\n            }\n          }\n        })\n        .trim();\n\n      return data;\n    },\n\n    writeFn({ message: { level, data } }) {\n      const consoleLogFn = consoleMethods[level] || consoleMethods.info;\n\n      // make an empty call stack\n      setTimeout(() => consoleLogFn(...data));\n    },\n\n  });\n\n  function transport(message) {\n    transport.writeFn({\n      message: { ...message, data: transport.formatDataFn(message) },\n    });\n  }\n}\n\n\n//# sourceURL=webpack://unacast/./node_modules/electron-log/src/renderer/lib/transports/console.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/renderer/lib/transports/ipc.js":
/*!**********************************************************************!*\
  !*** ./node_modules/electron-log/src/renderer/lib/transports/ipc.js ***!
  \**********************************************************************/
/***/ ((module) => {

eval("\n\nmodule.exports = ipcTransportRendererFactory;\n\nconst RESTRICTED_TYPES = new Set([Promise, WeakMap, WeakSet]);\n\nfunction ipcTransportRendererFactory(logger) {\n  return Object.assign(transport, {\n    depth: 5,\n\n    serializeFn(data, { depth = 5, seen = new WeakSet() } = {}) {\n      if (seen.has(data)) {\n        return '[Circular]';\n      }\n\n      if (depth < 1) {\n        if (isPrimitive(data)) {\n          return data;\n        }\n\n        if (Array.isArray(data)) {\n          return '[Array]';\n        }\n\n        return `[${typeof data}]`;\n      }\n\n      if (['function', 'symbol'].includes(typeof data)) {\n        return data.toString();\n      }\n\n      if (isPrimitive(data)) {\n        return data;\n      }\n\n      // Object types\n\n      if (RESTRICTED_TYPES.has(data.constructor)) {\n        return `[${data.constructor.name}]`;\n      }\n\n      if (Array.isArray(data)) {\n        return data.map((item) => transport.serializeFn(\n          item,\n          { depth: depth - 1, seen },\n        ));\n      }\n\n      if (data instanceof Date) {\n        return data.toISOString();\n      }\n\n      if (data instanceof Error) {\n        return data.stack;\n      }\n\n      if (data instanceof Map) {\n        return new Map(\n          Array\n            .from(data)\n            .map(([key, value]) => [\n              transport.serializeFn(key, { depth: depth - 1, seen }),\n              transport.serializeFn(value, { depth: depth - 1, seen }),\n            ]),\n        );\n      }\n\n      if (data instanceof Set) {\n        return new Set(\n          Array.from(data).map(\n            (val) => transport.serializeFn(val, { depth: depth - 1, seen }),\n          ),\n        );\n      }\n\n      seen.add(data);\n\n      return Object.fromEntries(\n        Object.entries(data).map(\n          ([key, value]) => [\n            key,\n            transport.serializeFn(value, { depth: depth - 1, seen }),\n          ],\n        ),\n      );\n    },\n  });\n\n  function transport(message) {\n    if (!window.__electronLog) {\n      logger.processMessage(\n        {\n          data: ['electron-log: logger isn\\'t initialized in the main process'],\n          level: 'error',\n        },\n        { transports: ['console'] },\n      );\n      return;\n    }\n\n    try {\n      __electronLog.sendToMain(transport.serializeFn(message, {\n        depth: transport.depth,\n      }));\n    } catch (e) {\n      logger.transports.console({\n        data: ['electronLog.transports.ipc', e, 'data:', message.data],\n        level: 'error',\n      });\n    }\n  }\n}\n\n/**\n * Is type primitive, including null and undefined\n * @param {any} value\n * @returns {boolean}\n */\nfunction isPrimitive(value) {\n  return Object(value) !== value;\n}\n\n\n//# sourceURL=webpack://unacast/./node_modules/electron-log/src/renderer/lib/transports/ipc.js?");

/***/ }),

/***/ "./src/main/const.ts":
/*!***************************!*\
  !*** ./src/main/const.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.electronEvent = void 0;\nexports.electronEvent = {\n    /** サーバー起動 */\n    START_SERVER: 'start-server',\n    /** サーバー停止 */\n    STOP_SERVER: 'stop-server',\n    /** Config適用 */\n    APPLY_CONFIG: 'apply-config',\n    /** アラート表示 */\n    SHOW_ALERT: 'show-alert',\n    SAVE_CONFIG: 'save-config',\n    /** 棒読み再生 */\n    PLAY_TAMIYASU: 'play-tamiyasu',\n    /** レス着信音再生 */\n    PLAY_SOUND_START: 'play-sound-start',\n    PLAY_SOUND_END: 'play-sound-end',\n    WAIT_YOMIKO_TIME: 'wait-yomiko-time',\n    SPEAK_WAV: 'speak-wav',\n    ABORT_WAV: 'abort-wav',\n    SPEAKING_END: 'speaking-end',\n    // VOICEVOX の読み込み renderer → main\n    LOAD_VOICEVOX: 'load-voicevox',\n    // VOICEVOX の状態更新 renderer ← main\n    UPDATE_VOICEVOX_CONFIG: 'update-voicevox-config',\n    /** コメント表示 */\n    SHOW_COMMENT: 'show-comment',\n    /** コメント欄初期化 */\n    CLEAR_COMMENT: 'clear-comment',\n    /** 翻訳コメント表示 */\n    SHOW_COMMENT_TL: 'show_comment_translate',\n    /** サーバー起動の返信 */\n    START_SERVER_REPLY: 'start-server-reply',\n    /** 強制的に端にスクロール */\n    FORCE_SCROLL: 'FORCE_SCROLL',\n    /** ステータス更新 */\n    UPDATE_STATUS: 'UPDATE_STATUS',\n    /** コメントテスト */\n    COMMENT_TEST: 'COMMENT_TEST',\n    /** 画像プレビュー */\n    PREVIEW_IMAGE: 'PREVIEW_IMAGE',\n    /** Azure Speech To text **/\n    AZURE_STT_START: 'azure-stt-start',\n    AZURE_STT_STOP: 'azure-stt-stop',\n    AZURE_STT_EVENT: 'azure-stt-event',\n};\n\n\n//# sourceURL=webpack://unacast/./src/main/const.ts?");

/***/ }),

/***/ "./src/renderer/imagePreview.ts":
/*!**************************************!*\
  !*** ./src/renderer/imagePreview.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

eval("\nvar __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    var desc = Object.getOwnPropertyDescriptor(m, k);\n    if (!desc || (\"get\" in desc ? !m.__esModule : desc.writable || desc.configurable)) {\n      desc = { enumerable: true, get: function() { return m[k]; } };\n    }\n    Object.defineProperty(o, k2, desc);\n}) : (function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    o[k2] = m[k];\n}));\nvar __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {\n    Object.defineProperty(o, \"default\", { enumerable: true, value: v });\n}) : function(o, v) {\n    o[\"default\"] = v;\n});\nvar __importStar = (this && this.__importStar) || function (mod) {\n    if (mod && mod.__esModule) return mod;\n    var result = {};\n    if (mod != null) for (var k in mod) if (k !== \"default\" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);\n    __setModuleDefault(result, mod);\n    return result;\n};\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nconst electron_1 = __importStar(__webpack_require__(/*! electron */ \"electron\"));\nconst electron_log_1 = __importDefault(__webpack_require__(/*! electron-log */ \"./node_modules/electron-log/src/renderer/index.js\"));\nconst path_1 = __importDefault(__webpack_require__(/*! path */ \"path\"));\nconst log = electron_log_1.default.scope('renderer-imagePreview');\nconst const_1 = __webpack_require__(/*! ../main/const */ \"./src/main/const.ts\");\nconst crypto_1 = __importDefault(__webpack_require__(/*! crypto */ \"crypto\"));\nconst ipcRenderer = electron_1.default.ipcRenderer;\ndocument.addEventListener('DOMContentLoaded', () => {\n    log.debug('DOM Content Loaded');\n});\nipcRenderer.on(const_1.electronEvent.PREVIEW_IMAGE, (event, url) => {\n    document.title = `preview ${url}`;\n    log.info('[preview-image] ' + url);\n    const md5 = crypto_1.default.createHash('md5');\n    const id = 'a' + md5.update(url).digest('hex'); // 英文字先頭じゃないとクエリ的に怒られる\n    log.info('[preview-image] ' + id);\n    const tabname = path_1.default.basename(url);\n    const tabBartDom = document.getElementById('tab-bar');\n    const tabContentDom = document.getElementById('tab-content');\n    let existsTabdom = tabBartDom.querySelector(`#tab_${id}`);\n    const existsContentdom = tabContentDom.querySelector(`#${id}`);\n    // アクティブ状態を解除\n    let existsdom2 = tabBartDom.querySelector(`.is-active`);\n    if (existsdom2)\n        existsdom2.classList.remove('is-active');\n    existsdom2 = tabContentDom.querySelector(`.is-active`);\n    if (existsdom2)\n        existsdom2.classList.remove('is-active');\n    // 既に開いてる場合は、アクティブにするだけ\n    if (existsTabdom && existsContentdom) {\n        existsTabdom.classList.add('is-active');\n        existsContentdom.classList.add('is-active');\n        return;\n    }\n    tabBartDom.insertAdjacentHTML('beforeend', `<a id=\"tab_${id}\" href=\"#${id}\" class=\"\" data-type=\"tab\">${tabname}</a>`);\n    tabContentDom.insertAdjacentHTML('beforeend', `<div class=\"mdl-tabs__panel is-active\" id=\"${id}\"><div class=\"content\"><img src=\"${url}\" data-type=\"content\" /></div></div>`);\n    existsTabdom = tabBartDom.querySelector(`#tab_${id}`);\n    if (existsTabdom) {\n        existsTabdom.classList.add('mdl-tabs__tab');\n        existsTabdom.classList.add('is-active');\n        existsTabdom.addEventListener('click', activeTab(url, id));\n    }\n});\nconst activeTab = (url, id) => () => {\n    document.title = `preview ${url}`;\n    const tabBartDom = document.getElementById('tab-bar');\n    const tabContentDom = document.getElementById('tab-content');\n    const existsTabdom = tabBartDom.querySelector(`#tab_${id}`);\n    const existsContentdom = tabContentDom.querySelector(`#${id}`);\n    // アクティブ状態を解除\n    let existsdom2 = tabBartDom.querySelector(`.is-active`);\n    if (existsdom2)\n        existsdom2.classList.remove('is-active');\n    existsdom2 = tabContentDom.querySelector(`.is-active`);\n    if (existsdom2)\n        existsdom2.classList.remove('is-active');\n    if (existsTabdom && existsContentdom) {\n        existsTabdom.classList.add('is-active');\n        existsContentdom.classList.add('is-active');\n        return;\n    }\n};\n/** タブ右クリック時の処理 */\nconst handleTabRightClick = (e, id) => {\n    const contextMenu = new electron_1.remote.Menu();\n    contextMenu.append(new electron_1.remote.MenuItem({\n        label: 'Close',\n        type: 'normal',\n        click: (menu, browser, event) => {\n            var _a, _b;\n            // 要素取得\n            const tabBarDom = document.getElementById('tab-bar');\n            const tabContentDom = document.getElementById('tab-content');\n            const existsTabdom = tabBarDom.querySelector(`#tab_${id}`);\n            const existsContentdom = tabContentDom.querySelector(`#${id}`);\n            // クローズ対象の位置取得\n            const tabIdList = [];\n            tabBarDom.querySelectorAll('a').forEach((value, key) => {\n                tabIdList.push(value.getAttribute('id'));\n            });\n            const tabIndex = tabIdList.indexOf(`tab_${id}`);\n            // クローズ\n            if (existsTabdom)\n                existsTabdom.remove();\n            if (existsContentdom)\n                existsContentdom.remove();\n            // 他に要素があればそっちにフォーカスを移す\n            // 最後の1個だったらそのまま終了\n            if (tabIdList.length <= 1)\n                return;\n            // 一番後ろの要素なら1個前のやつ、それ以外の要素なら1個後ろのやつをアクティブ化対象にする\n            const activeTargetId = tabIdList.length === tabIndex + 1 ? tabIdList[tabIndex - 1] : tabIdList[tabIndex + 1];\n            (_a = document.getElementById(`${activeTargetId}`)) === null || _a === void 0 ? void 0 : _a.classList.add('is-active');\n            (_b = document.getElementById(`${activeTargetId.replace('tab_', '')}`)) === null || _b === void 0 ? void 0 : _b.classList.add('is-active');\n        },\n    }));\n    // ブラウザで画像開く\n    contextMenu.append(new electron_1.remote.MenuItem({\n        label: 'Open By Browser',\n        type: 'normal',\n        click: (menu, browser, event) => {\n            const imageDom = document.querySelector(`#${id} > div > img`);\n            if (imageDom) {\n                const src = imageDom.getAttribute('src');\n                electron_1.shell.openExternal(src);\n            }\n        },\n    }));\n    contextMenu.popup({ window: electron_1.remote.getCurrentWindow(), x: e.x, y: e.y });\n};\n// // 右クリックメニュー\ndocument.oncontextmenu = (e) => {\n    e.preventDefault();\n    const target = e.target;\n    if (!target)\n        return;\n    const dataType = target.getAttribute('data-type');\n    if (dataType === 'tab') {\n        const domId = target.getAttribute('id').replace('tab_', '');\n        // タブ右クリックメニュー\n        handleTabRightClick(e, domId);\n    }\n    else if (dataType === 'content') {\n        // const src = target.getAttribute('src');\n        const parentNode = target.parentNode.parentNode;\n        const domId = parentNode.getAttribute('id').replace('tab_', '');\n        // 画像右クリックメニュー\n        // とりあえずタブと挙動一緒にしておく\n        handleTabRightClick(e, domId);\n    }\n};\n\n\n//# sourceURL=webpack://unacast/./src/renderer/imagePreview.ts?");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("electron");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/renderer/imagePreview.ts");
/******/ 	
/******/ })()
;