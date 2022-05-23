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
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/renderer/imagePreview.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/electron-log/src/catchErrors.js":
/*!******************************************************!*\
  !*** ./node_modules/electron-log/src/catchErrors.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\n/**\n * Some ideas from sindresorhus/electron-unhandled\n */\n\nvar electronApi = __webpack_require__(/*! ./electronApi */ \"./node_modules/electron-log/src/electronApi.js\");\n\nvar isAttached = false;\n\nmodule.exports = function catchErrors(options) {\n  if (isAttached) return { stop: stop };\n  isAttached = true;\n\n  if (process.type === 'renderer') {\n    window.addEventListener('error', onRendererError);\n    window.addEventListener('unhandledrejection', onRendererRejection);\n  } else {\n    process.on('uncaughtException', onError);\n    process.on('unhandledRejection', onRejection);\n  }\n\n  return { stop: stop };\n\n  function onError(e) {\n    try {\n      if (typeof options.onError === 'function') {\n        if (options.onError(e) === false) {\n          return;\n        }\n      }\n\n      options.log(e);\n\n      if (options.showDialog && e.name.indexOf('UnhandledRejection') < 0) {\n        var type = process.type || 'main';\n        electronApi.showErrorBox(\n          'A JavaScript error occurred in the ' + type + ' process',\n          e.stack\n        );\n      }\n    } catch (logError) {\n      // eslint-disable-next-line no-console\n      console.error(e);\n    }\n  }\n\n  function onRejection(reason) {\n    if (reason instanceof Error) {\n      var reasonName = 'UnhandledRejection ' + reason.name;\n\n      var errPrototype = Object.getPrototypeOf(reason);\n      var nameProperty = Object.getOwnPropertyDescriptor(errPrototype, 'name');\n      if (!nameProperty || !nameProperty.writable) {\n        reason = new Error(reason.message);\n      }\n\n      reason.name = reasonName;\n      onError(reason);\n      return;\n    }\n\n    var error = new Error(JSON.stringify(reason));\n    error.name = 'UnhandledRejection';\n    onError(error);\n  }\n\n  function onRendererError(event) {\n    event.preventDefault();\n    onError(event.error);\n  }\n\n  function onRendererRejection(event) {\n    event.preventDefault();\n    onRejection(event.reason);\n  }\n\n  function stop() {\n    isAttached = false;\n\n    if (process.type === 'renderer') {\n      window.removeEventListener('error', onRendererError);\n      window.removeEventListener('unhandledrejection', onRendererRejection);\n    } else {\n      process.removeListener('uncaughtException', onError);\n      process.removeListener('unhandledRejection', onRejection);\n    }\n  }\n};\n\n\n//# sourceURL=webpack:///./node_modules/electron-log/src/catchErrors.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/electronApi.js":
/*!******************************************************!*\
  !*** ./node_modules/electron-log/src/electronApi.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\n/**\n * Split Electron API from the main code\n */\n\nvar electron;\ntry {\n  // eslint-disable-next-line global-require\n  electron = __webpack_require__(/*! electron */ \"electron\");\n} catch (e) {\n  electron = null;\n}\n\nmodule.exports = {\n  getName: getName,\n  getPath: getPath,\n  getVersion: getVersion,\n  isDev: isDev,\n  isElectron: isElectron,\n  isIpcChannelListened: isIpcChannelListened,\n  loadRemoteModule: loadRemoteModule,\n  onIpc: onIpc,\n  sendIpc: sendIpc,\n  showErrorBox: showErrorBox,\n};\n\nfunction getApp() {\n  return getElectronModule('app');\n}\n\nfunction getName() {\n  var app = getApp();\n  if (!app) return null;\n\n  return 'name' in app ? app.name : app.getName();\n}\n\nfunction getElectronModule(name) {\n  if (!electron) {\n    return null;\n  }\n\n  if (electron[name]) {\n    return electron[name];\n  }\n\n  if (electron.remote) {\n    return electron.remote[name];\n  }\n\n  return null;\n}\n\nfunction getIpc() {\n  if (process.type === 'browser' && electron && electron.ipcMain) {\n    return electron.ipcMain;\n  }\n\n  if (process.type === 'renderer' && electron && electron.ipcRenderer) {\n    return electron.ipcRenderer;\n  }\n\n  return null;\n}\n\n\nfunction getPath(name) {\n  var app = getApp();\n  if (!app) return null;\n\n  try {\n    return app.getPath(name);\n  } catch (e) {\n    return null;\n  }\n}\n\nfunction getRemote() {\n  if (electron && electron.remote) {\n    return electron.remote;\n  }\n\n  return null;\n}\n\nfunction getVersion() {\n  var app = getApp();\n  if (!app) return null;\n\n  return 'version' in app ? app.version : app.getVersion();\n}\n\nfunction isDev() {\n  // based on sindresorhus/electron-is-dev\n  var app = getApp();\n  if (!app) return false;\n\n  return !app.isPackaged || process.env.ELECTRON_IS_DEV === '1';\n}\n\nfunction isElectron() {\n  return process.type === 'browser' || process.type === 'renderer';\n}\n\n/**\n * Return true if the process listens for the IPC channel\n * @param {string} channel\n */\nfunction isIpcChannelListened(channel) {\n  var ipc = getIpc();\n  return ipc ? ipc.listenerCount(channel) > 0 : false;\n}\n\n/**\n * Try to load the module in the opposite process\n * @param {string} moduleName\n */\nfunction loadRemoteModule(moduleName) {\n  if (process.type === 'browser') {\n    getApp().on('web-contents-created', function (e, contents) {\n      var promise = contents.executeJavaScript(\n        'try {require(\"' + moduleName + '\")} catch(e){}; void 0;'\n      );\n\n      // Do nothing on error, just prevent Unhandled rejection\n      if (promise && typeof promise.catch === 'function') {\n        promise.catch(function () {});\n      }\n    });\n  } else if (process.type === 'renderer') {\n    try {\n      getRemote().require(moduleName);\n    } catch (e) {\n      // Can't be required. Webpack?\n    }\n  }\n}\n\n/**\n * Listen to async messages sent from opposite process\n * @param {string} channel\n * @param {function} listener\n */\nfunction onIpc(channel, listener) {\n  var ipc = getIpc();\n  if (ipc) {\n    ipc.on(channel, listener);\n  }\n}\n\n/**\n * Sent a message to opposite process\n * @param {string} channel\n * @param {any} message\n */\nfunction sendIpc(channel, message) {\n  if (process.type === 'browser') {\n    sendIpcToRenderer(channel, message);\n  } else if (process.type === 'renderer') {\n    sendIpcToMain(channel, message);\n  }\n}\n\nfunction sendIpcToMain(channel, message) {\n  var ipc = getIpc();\n  if (ipc) {\n    ipc.send(channel, message);\n  }\n}\n\nfunction sendIpcToRenderer(channel, message) {\n  if (!electron || !electron.BrowserWindow) {\n    return;\n  }\n\n  electron.BrowserWindow.getAllWindows().forEach(function (wnd) {\n    wnd.webContents && wnd.webContents.send(channel, message);\n  });\n}\n\nfunction showErrorBox(title, message) {\n  var dialog = getElectronModule('dialog');\n  if (!dialog) return;\n\n  dialog.showErrorBox(title, message);\n}\n\n\n//# sourceURL=webpack:///./node_modules/electron-log/src/electronApi.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/index.js":
/*!************************************************!*\
  !*** ./node_modules/electron-log/src/index.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar catchErrors = __webpack_require__(/*! ./catchErrors */ \"./node_modules/electron-log/src/catchErrors.js\");\nvar electronApi = __webpack_require__(/*! ./electronApi */ \"./node_modules/electron-log/src/electronApi.js\");\nvar log = __webpack_require__(/*! ./log */ \"./node_modules/electron-log/src/log.js\").log;\nvar scopeFactory = __webpack_require__(/*! ./scope */ \"./node_modules/electron-log/src/scope.js\");\nvar transportConsole = __webpack_require__(/*! ./transports/console */ \"./node_modules/electron-log/src/transports/console.js\");\nvar transportFile = __webpack_require__(/*! ./transports/file */ \"./node_modules/electron-log/src/transports/file/index.js\");\nvar transportIpc = __webpack_require__(/*! ./transports/ipc */ \"./node_modules/electron-log/src/transports/ipc.js\");\nvar transportRemote = __webpack_require__(/*! ./transports/remote */ \"./node_modules/electron-log/src/transports/remote.js\");\n\nmodule.exports = create('default');\nmodule.exports.default = module.exports;\n\n/**\n * @param {string} logId\n * @return {ElectronLog.ElectronLog}\n */\nfunction create(logId) {\n  /**\n   * @type {ElectronLog.ElectronLog}\n   */\n  var instance = {\n    catchErrors: function callCatchErrors(options) {\n      var opts = Object.assign({}, {\n        log: instance.error,\n        showDialog: process.type === 'browser',\n      }, options || {});\n\n      catchErrors(opts);\n    },\n    create: create,\n    functions: {},\n    hooks: [],\n    isDev: electronApi.isDev(),\n    levels: ['error', 'warn', 'info', 'verbose', 'debug', 'silly'],\n    logId: logId,\n    variables: {\n      processType: process.type,\n    },\n  };\n\n  instance.scope = scopeFactory(instance);\n\n  instance.transports = {\n    console: transportConsole(instance),\n    file: transportFile(instance),\n    remote: transportRemote(instance),\n    ipc: transportIpc(instance),\n  };\n\n  instance.levels.forEach(function (level) {\n    instance[level] = log.bind(null, instance, { level: level });\n    instance.functions[level] = instance[level];\n  });\n\n  instance.log = log.bind(null, instance, { level: 'info' });\n  instance.functions.log = instance.log;\n\n  return instance;\n}\n\n\n//# sourceURL=webpack:///./node_modules/electron-log/src/index.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/log.js":
/*!**********************************************!*\
  !*** ./node_modules/electron-log/src/log.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nmodule.exports = {\n  compareLevels: compareLevels,\n  log: log,\n  runTransport: runTransport,\n  runTransports: runTransports,\n};\n\nfunction log(electronLog, options) {\n  var transports = electronLog.transports;\n\n  var message = {\n    data: Array.prototype.slice.call(arguments, 2),\n    date: new Date(),\n    level: options.level,\n    scope: options.scope ? options.scope.toJSON() : null,\n    variables: electronLog.variables,\n  };\n\n  runTransports(transports, message, electronLog);\n}\n\nfunction runTransports(transports, message, electronLog) {\n  for (var i in transports) {\n    if (Object.prototype.hasOwnProperty.call(transports, i)) {\n      runTransport(transports[i], message, electronLog);\n    }\n  }\n}\n\nfunction runTransport(transport, message, electronLog) {\n  if (typeof transport !== 'function' || transport.level === false) {\n    return;\n  }\n\n  if (!compareLevels(electronLog.levels, transport.level, message.level)) {\n    return;\n  }\n\n  message = runHooks(electronLog.hooks, transport, message);\n\n  if (message) {\n    transport(message);\n  }\n}\n\nfunction compareLevels(levels, passLevel, checkLevel) {\n  var pass = levels.indexOf(passLevel);\n  var check = levels.indexOf(checkLevel);\n  if (check === -1 || pass === -1) {\n    return true;\n  }\n\n  return check <= pass;\n}\n\nfunction runHooks(hooks, transport, message) {\n  if (!hooks || !hooks.length) {\n    return message;\n  }\n\n  // eslint-disable-next-line no-plusplus\n  for (var i = 0; i < hooks.length; i++) {\n    message = hooks[i](message, transport);\n    if (!message) break;\n  }\n\n  return message;\n}\n\n\n//# sourceURL=webpack:///./node_modules/electron-log/src/log.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/scope.js":
/*!************************************************!*\
  !*** ./node_modules/electron-log/src/scope.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar log = __webpack_require__(/*! ./log */ \"./node_modules/electron-log/src/log.js\").log;\n\nmodule.exports = scopeFactory;\n\n/**\n * @param {ElectronLog.ElectronLog} electronLog\n * @return {ElectronLog.Scope}\n */\nfunction scopeFactory(electronLog) {\n  scope.labelPadding = true;\n  scope.defaultLabel = '';\n\n  /** @private */\n  scope.maxLabelLength = 0;\n\n  /**\n   * @type {typeof getOptions}\n   * @package\n   */\n  scope.getOptions = getOptions;\n\n  return scope;\n\n  function scope(label) {\n    var instance = {\n      label: label,\n      toJSON: function () {\n        return {\n          label: this.label,\n        };\n      },\n    };\n\n    electronLog.levels.forEach(function (level) {\n      instance[level] = log.bind(null, electronLog, {\n        level: level,\n        scope: instance,\n      });\n    });\n\n    instance.log = instance.info;\n\n    scope.maxLabelLength = Math.max(scope.maxLabelLength, label.length);\n\n    return instance;\n  }\n\n  function getOptions() {\n    return {\n      defaultLabel: scope.defaultLabel,\n      labelLength: getLabelLength(),\n    };\n  }\n\n  function getLabelLength() {\n    if (scope.labelPadding === true) {\n      return scope.maxLabelLength;\n    }\n\n    if (scope.labelPadding === false) {\n      return 0;\n    }\n\n    if (typeof scope.labelPadding === 'number') {\n      return scope.labelPadding;\n    }\n\n    return 0;\n  }\n}\n\n\n//# sourceURL=webpack:///./node_modules/electron-log/src/scope.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/transform/index.js":
/*!**********************************************************!*\
  !*** ./node_modules/electron-log/src/transform/index.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar object = __webpack_require__(/*! ./object */ \"./node_modules/electron-log/src/transform/object.js\");\nvar style = __webpack_require__(/*! ./style */ \"./node_modules/electron-log/src/transform/style.js\");\nvar template = __webpack_require__(/*! ./template */ \"./node_modules/electron-log/src/transform/template.js\");\n\nmodule.exports = {\n  applyAnsiStyles: style.applyAnsiStyles,\n  concatFirstStringElements: template.concatFirstStringElements,\n  customFormatterFactory: customFormatterFactory,\n  maxDepthFactory: object.maxDepthFactory,\n  removeStyles: style.removeStyles,\n  toJSON: object.toJSON,\n  toString: object.toString,\n  transform: transform,\n};\n\nfunction customFormatterFactory(customFormat, concatFirst, scopeOptions) {\n  if (typeof customFormat === 'string') {\n    return function customStringFormatter(data, message) {\n      return transform(message, [\n        template.templateVariables,\n        template.templateScopeFactory(scopeOptions),\n        template.templateDate,\n        template.templateText,\n        concatFirst && template.concatFirstStringElements,\n      ], [customFormat].concat(data));\n    };\n  }\n\n  if (typeof customFormat === 'function') {\n    return function customFunctionFormatter(data, message) {\n      var modifiedMessage = Object.assign({}, message, { data: data });\n      var texts = customFormat(modifiedMessage, data);\n      return [].concat(texts);\n    };\n  }\n\n  return function (data) {\n    return [].concat(data);\n  };\n}\n\nfunction transform(message, transformers, initialData) {\n  return transformers.reduce(function (data, transformer) {\n    if (typeof transformer === 'function') {\n      return transformer(data, message);\n    }\n\n    return data;\n  }, initialData || message.data);\n}\n\n\n//# sourceURL=webpack:///./node_modules/electron-log/src/transform/index.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/transform/object.js":
/*!***********************************************************!*\
  !*** ./node_modules/electron-log/src/transform/object.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar util = __webpack_require__(/*! util */ \"util\");\n\nmodule.exports = {\n  maxDepthFactory: maxDepthFactory,\n  serialize: serialize,\n  toJSON: toJSON,\n  toString: toString,\n};\n\nfunction createSerializer() {\n  var seen = createWeakSet();\n\n  return function (key, value) {\n    if (typeof value === 'object' && value !== null) {\n      if (seen.has(value)) {\n        return undefined;\n      }\n\n      seen.add(value);\n    }\n\n    return serialize(key, value);\n  };\n}\n\n/**\n * @return {WeakSet<object>}\n */\nfunction createWeakSet() {\n  if (typeof WeakSet !== 'undefined') {\n    return new WeakSet();\n  }\n\n  var cache = [];\n  this.add = function (value) { cache.push(value) };\n  this.has = function (value) { return cache.indexOf(value) !== -1 };\n\n  return this;\n}\n\nfunction maxDepth(data, depth) {\n  if (!data) {\n    return data;\n  }\n\n  if (depth < 1) {\n    if (data.map) return '[array]';\n    if (typeof data === 'object') return '[object]';\n\n    return data;\n  }\n\n  if (typeof data.map === 'function') {\n    return data.map(function (child) {\n      return maxDepth(child, depth - 1);\n    });\n  }\n\n  if (typeof data !== 'object') {\n    return data;\n  }\n\n  if (data && typeof data.toISOString === 'function') {\n    return data;\n  }\n\n  // noinspection PointlessBooleanExpressionJS\n  if (data === null) {\n    return null;\n  }\n\n  if (data instanceof Error) {\n    return data;\n  }\n\n  var newJson = {};\n  for (var i in data) {\n    if (!Object.prototype.hasOwnProperty.call(data, i)) continue;\n    newJson[i] = maxDepth(data[i], depth - 1);\n  }\n\n  return newJson;\n}\n\nfunction maxDepthFactory(depth) {\n  depth = depth || 6;\n\n  return function maxDepthFunction(data) {\n    return maxDepth(data, depth);\n  };\n}\n\nfunction serialize(key, value) {\n  if (value instanceof Error) {\n    var object = Object.assign(\n      {\n        constructor: (value.constructor && value.constructor.name) || 'Error',\n      },\n      value,\n      { stack: value.stack }\n    );\n\n    if (!object.stack) {\n      object.message = value.message;\n    }\n\n    if (value.constructor && value.constructor.name) {\n      object.constructor = value.constructor.name;\n    }\n\n    return object;\n  }\n\n  if (!value) {\n    return value;\n  }\n\n  if (typeof value.toJSON === 'function') {\n    return value.toJSON();\n  }\n\n  if (typeof value === 'function') {\n    return '[function] ' + value.toString();\n  }\n\n  return value;\n}\n\nfunction toJSON(data) {\n  return JSON.parse(JSON.stringify(data, createSerializer()));\n}\n\nfunction toString(data) {\n  var simplifiedData = data.map(function (item) {\n    if (item === undefined) {\n      return undefined;\n    }\n\n    return JSON.parse(JSON.stringify(item, createSerializer(), '  '));\n  });\n\n  return util.format.apply(util, simplifiedData);\n}\n\n\n//# sourceURL=webpack:///./node_modules/electron-log/src/transform/object.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/transform/style.js":
/*!**********************************************************!*\
  !*** ./node_modules/electron-log/src/transform/style.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nmodule.exports = {\n  applyAnsiStyles: applyAnsiStyles,\n  removeStyles: removeStyles,\n  transformStyles: transformStyles,\n};\n\nvar ANSI_COLORS = {\n  unset: '\\x1b[0m',\n  black: '\\x1b[30m',\n  red: '\\x1b[31m',\n  green: '\\x1b[32m',\n  yellow: '\\x1b[33m',\n  blue: '\\x1b[34m',\n  magenta: '\\x1b[35m',\n  cyan: '\\x1b[36m',\n  white: '\\x1b[37m',\n};\n\nfunction applyAnsiStyles(data) {\n  return transformStyles(data, styleToAnsi, resetAnsiStyle);\n}\n\nfunction styleToAnsi(style) {\n  var color = style.replace(/color:\\s*(\\w+).*/, '$1').toLowerCase();\n  return ANSI_COLORS[color] || '';\n}\n\nfunction resetAnsiStyle(string) {\n  return string + ANSI_COLORS.unset;\n}\n\nfunction removeStyles(data) {\n  return transformStyles(data, function () { return '' });\n}\n\nfunction transformStyles(data, onStyleFound, onStyleApplied) {\n  var foundStyles = {};\n\n  return data.reduce(function (result, item, index, array) {\n    if (foundStyles[index]) {\n      return result;\n    }\n\n    if (typeof item === 'string') {\n      var valueIndex = index;\n      var styleApplied = false;\n\n      item = item.replace(/%[1cdfiOos]/g, function (match) {\n        valueIndex += 1;\n\n        if (match !== '%c') {\n          return match;\n        }\n\n        var style = array[valueIndex];\n        if (typeof style === 'string') {\n          foundStyles[valueIndex] = true;\n          styleApplied = true;\n          return onStyleFound(style, item);\n        }\n\n        return match;\n      });\n\n      if (styleApplied && onStyleApplied) {\n        item = onStyleApplied(item);\n      }\n    }\n\n    result.push(item);\n    return result;\n  }, []);\n}\n\n\n//# sourceURL=webpack:///./node_modules/electron-log/src/transform/style.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/transform/template.js":
/*!*************************************************************!*\
  !*** ./node_modules/electron-log/src/transform/template.js ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nmodule.exports = {\n  concatFirstStringElements: concatFirstStringElements,\n  formatDate: formatDate,\n  formatTimeZone: formatTimeZone,\n  pad: pad,\n  padString: padString,\n  templateDate: templateDate,\n  templateVariables: templateVariables,\n  templateScopeFactory: templateScopeFactory,\n  templateText: templateText,\n};\n\n/**\n * The first argument of console.log may contain templates. In the library\n * the first element is a string related to transports.console.format. So\n * this function concatenates first two elements to make templates like %d\n * work\n * @param {*[]} data\n * @return {*[]}\n */\nfunction concatFirstStringElements(data) {\n  if (typeof data[0] !== 'string' || typeof data[1] !== 'string') {\n    return data;\n  }\n\n  if (data[0].match(/%[1cdfiOos]/)) {\n    return data;\n  }\n\n  data[1] = data[0] + ' ' + data[1];\n  data.shift();\n\n  return data;\n}\n\nfunction formatDate(template, date) {\n  return template\n    .replace('{y}', String(date.getFullYear()))\n    .replace('{m}', pad(date.getMonth() + 1))\n    .replace('{d}', pad(date.getDate()))\n    .replace('{h}', pad(date.getHours()))\n    .replace('{i}', pad(date.getMinutes()))\n    .replace('{s}', pad(date.getSeconds()))\n    .replace('{ms}', pad(date.getMilliseconds(), 3))\n    .replace('{z}', formatTimeZone(date.getTimezoneOffset()))\n    .replace('{iso}', date.toISOString());\n}\n\nfunction formatTimeZone(minutesOffset) {\n  var m = Math.abs(minutesOffset);\n  return (minutesOffset >= 0 ? '-' : '+')\n    + pad(Math.floor(m / 60)) + ':'\n    + pad(m % 60);\n}\n\nfunction pad(number, zeros) {\n  zeros = zeros || 2;\n  return (new Array(zeros + 1).join('0') + number).substr(-zeros, zeros);\n}\n\nfunction padString(value, length) {\n  length = Math.max(length, value.length);\n  var padValue = Array(length + 1).join(' ');\n  return (value + padValue).substring(0, length);\n}\n\nfunction templateDate(data, message) {\n  var template = data[0];\n  if (typeof template !== 'string') {\n    return data;\n  }\n\n  data[0] = formatDate(template, message.date);\n  return data;\n}\n\n/**\n * @param {{ labelLength: number, defaultLabel: string }} options\n */\nfunction templateScopeFactory(options) {\n  options = options || {};\n  var labelLength = options.labelLength || 0;\n\n  return function templateScope(data, message) {\n    var template = data[0];\n    var label = message.scope && message.scope.label;\n\n    if (!label) {\n      label = options.defaultLabel;\n    }\n\n    var scopeText;\n    if (label === '') {\n      scopeText = labelLength > 0 ? padString('', labelLength + 3) : '';\n    } else if (typeof label === 'string') {\n      scopeText = padString(' (' + label + ')', labelLength + 3);\n    } else {\n      scopeText = '';\n    }\n\n    data[0] = template.replace('{scope}', scopeText);\n    return data;\n  };\n}\n\nfunction templateVariables(data, message) {\n  var template = data[0];\n  var variables = message.variables;\n\n  if (typeof template !== 'string' || !message.variables) {\n    return data;\n  }\n\n  for (var i in variables) {\n    if (!Object.prototype.hasOwnProperty.call(variables, i)) continue;\n    template = template.replace('{' + i + '}', variables[i]);\n  }\n\n  template = template.replace('{level}', message.level);\n\n  data[0] = template;\n  return data;\n}\n\nfunction templateText(data) {\n  var template = data[0];\n  if (typeof template !== 'string') {\n    return data;\n  }\n\n  var textTplPosition = template.lastIndexOf('{text}');\n  if (textTplPosition === template.length - 6) {\n    data[0] = template.replace(/\\s?{text}/, '');\n    if (data[0] === '') {\n      data.shift();\n    }\n\n    return data;\n  }\n\n  var templatePieces = template.split('{text}');\n  var result = [];\n\n  if (templatePieces[0] !== '') {\n    result.push(templatePieces[0]);\n  }\n\n  result = result.concat(data.slice(1));\n\n  if (templatePieces[1] !== '') {\n    result.push(templatePieces[1]);\n  }\n\n  return result;\n}\n\n\n//# sourceURL=webpack:///./node_modules/electron-log/src/transform/template.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/transports/console.js":
/*!*************************************************************!*\
  !*** ./node_modules/electron-log/src/transports/console.js ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\n/* eslint-disable no-multi-spaces, no-console */\n\nvar transform = __webpack_require__(/*! ../transform */ \"./node_modules/electron-log/src/transform/index.js\");\n\nvar original = {\n  context: console,\n  error:   console.error,\n  warn:    console.warn,\n  info:    console.info,\n  verbose: console.verbose,\n  debug:   console.debug,\n  silly:   console.silly,\n  log:     console.log,\n};\n\nmodule.exports = consoleTransportFactory;\nmodule.exports.transformRenderer = transformRenderer;\nmodule.exports.transformMain = transformMain;\n\nvar separator = process.platform === 'win32' ? '>' : '›';\nvar DEFAULT_FORMAT = {\n  browser: '%c{h}:{i}:{s}.{ms}{scope}%c ' + separator + ' {text}',\n  renderer: '{h}:{i}:{s}.{ms}{scope} › {text}',\n  worker: '{h}:{i}:{s}.{ms}{scope} › {text}',\n};\n\nfunction consoleTransportFactory(electronLog) {\n  transport.level  = 'silly';\n  transport.useStyles = process.env.FORCE_STYLES;\n  transport.format = DEFAULT_FORMAT[process.type] || DEFAULT_FORMAT.browser;\n\n  return transport;\n\n  function transport(message) {\n    var scopeOptions = electronLog.scope.getOptions();\n\n    var data;\n    if (process.type === 'renderer' || process.type === 'worker') {\n      data = transformRenderer(message, transport, scopeOptions);\n    } else {\n      data = transformMain(message, transport, scopeOptions);\n    }\n\n    consoleLog(message.level, data);\n  }\n}\n\nfunction transformRenderer(message, transport, scopeOptions) {\n  return transform.transform(message, [\n    transform.customFormatterFactory(transport.format, true, scopeOptions),\n  ]);\n}\n\nfunction transformMain(message, transport, scopeOptions) {\n  var useStyles = canUseStyles(transport.useStyles, message.level);\n\n  return transform.transform(message, [\n    addTemplateColorFactory(transport.format),\n    transform.customFormatterFactory(transport.format, false, scopeOptions),\n    useStyles ? transform.applyAnsiStyles : transform.removeStyles,\n    transform.concatFirstStringElements,\n    transform.maxDepthFactory(4),\n    transform.toJSON,\n  ]);\n}\n\nfunction addTemplateColorFactory(format) {\n  return function addTemplateColors(data, message) {\n    if (format !== DEFAULT_FORMAT.browser) {\n      return data;\n    }\n\n    return ['color:' + levelToStyle(message.level), 'color:unset'].concat(data);\n  };\n}\n\nfunction canUseStyles(useStyleValue, level) {\n  if (useStyleValue === true || useStyleValue === false) {\n    return useStyleValue;\n  }\n\n  var useStderr = level === 'error' || level === 'warn';\n  var stream = useStderr ? process.stderr : process.stdout;\n  return stream && stream.isTTY;\n}\n\nfunction consoleLog(level, args) {\n  if (original[level]) {\n    original[level].apply(original.context, args);\n  } else {\n    original.log.apply(original.context, args);\n  }\n}\n\nfunction levelToStyle(level) {\n  switch (level) {\n    case 'error': return 'red';\n    case 'warn':  return 'yellow';\n    case 'info':  return 'cyan';\n    default:      return 'unset';\n  }\n}\n\n\n//# sourceURL=webpack:///./node_modules/electron-log/src/transports/console.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/transports/file/file.js":
/*!***************************************************************!*\
  !*** ./node_modules/electron-log/src/transports/file/file.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar EventEmitter = __webpack_require__(/*! events */ \"events\");\nvar fs = __webpack_require__(/*! fs */ \"fs\");\nvar os = __webpack_require__(/*! os */ \"os\");\nvar path = __webpack_require__(/*! path */ \"path\");\nvar util = __webpack_require__(/*! util */ \"util\");\n\nmodule.exports = {\n  File: File,\n  FileRegistry: FileRegistry,\n  NullFile: NullFile,\n};\n\n/**\n * File manipulations on filesystem\n * @class\n * @extends EventEmitter\n * @property {number} size\n *\n * @constructor\n * @param {string} filePath\n * @param {WriteOptions} [writeOptions]\n * @param {boolean} [writeAsync]\n */\nfunction File(filePath, writeOptions, writeAsync) {\n  EventEmitter.call(this);\n\n  /**\n   * @type {string}\n   * @readonly\n   */\n  this.path = filePath;\n\n  /**\n   * @type {number}\n   * @private\n   */\n  this.initialSize = undefined;\n\n  /**\n   * @type {number}\n   * @readonly\n   */\n  this.bytesWritten = 0;\n\n  /**\n   * @type {boolean}\n   * @private\n   */\n  this.writeAsync = Boolean(writeAsync);\n\n  /**\n   * @type {string[]}\n   * @private\n   */\n  this.asyncWriteQueue = [];\n\n  /**\n   * @type {WriteOptions}\n   * @private\n   */\n  this.writeOptions = writeOptions || {\n    flag: 'a',\n    mode: 438, // 0666\n    encoding: 'utf8',\n  };\n\n  Object.defineProperty(this, 'size', {\n    get: this.getSize.bind(this),\n  });\n}\n\nutil.inherits(File, EventEmitter);\n\nFile.prototype.clear = function () {\n  try {\n    fs.writeFileSync(this.path, '', {\n      mode: this.writeOptions.mode,\n      flag: 'w',\n    });\n    this.reset();\n    return true;\n  } catch (e) {\n    if (e.code === 'ENOENT') {\n      return true;\n    }\n\n    this.emit('error', e, this);\n    return false;\n  }\n};\n\nFile.prototype.crop = function (bytesAfter) {\n  try {\n    var content = readFileSyncFromEnd(this.path, bytesAfter || 4096);\n    this.clear();\n    this.writeLine('[log cropped]' + os.EOL + content);\n  } catch (e) {\n    this.emit(\n      'error',\n      new Error('Couldn\\'t crop file ' + this.path + '. ' + e.message),\n      this\n    );\n  }\n};\n\nFile.prototype.toString = function () {\n  return this.path;\n};\n\n/**\n * @package\n */\nFile.prototype.reset = function () {\n  this.initialSize = undefined;\n  this.bytesWritten = 0;\n};\n\n/**\n * @package\n */\nFile.prototype.writeLine = function (text) {\n  text += os.EOL;\n\n  if (this.writeAsync) {\n    this.asyncWriteQueue.push(text);\n    this.nextAsyncWrite();\n    return;\n  }\n\n  try {\n    fs.writeFileSync(this.path, text, this.writeOptions);\n    this.increaseBytesWrittenCounter(text);\n  } catch (e) {\n    this.emit(\n      'error',\n      new Error('Couldn\\'t write to ' + this.path + '. ' + e.message),\n      this\n    );\n  }\n};\n\n/**\n * @return {number}\n * @protected\n */\nFile.prototype.getSize = function () {\n  if (this.initialSize === undefined) {\n    try {\n      var stats = fs.statSync(this.path);\n      this.initialSize = stats.size;\n    } catch (e) {\n      this.initialSize = 0;\n    }\n  }\n\n  return this.initialSize + this.bytesWritten;\n};\n\n/**\n * @return {boolean}\n * @package\n */\nFile.prototype.isNull = function () {\n  return false;\n};\n\n/**\n * @private\n */\nFile.prototype.increaseBytesWrittenCounter = function (text) {\n  this.bytesWritten += Buffer.byteLength(text, this.writeOptions.encoding);\n};\n\n/**\n * @private\n */\nFile.prototype.nextAsyncWrite = function () {\n  var file = this;\n\n  if (this.asyncWriteQueue.length < 1) {\n    return;\n  }\n\n  var text = this.asyncWriteQueue.shift();\n\n  fs.writeFile(this.path, text, this.writeOptions, function (e) {\n    if (e) {\n      file.emit(\n        'error',\n        new Error('Couldn\\'t write to ' + file.path + '. ' + e.message),\n        this\n      );\n    } else {\n      file.increaseBytesWrittenCounter(text);\n    }\n\n    file.nextAsyncWrite();\n  });\n};\n\n/**\n * File manipulations on filesystem\n * @class\n * @property {number} size\n *\n * @constructor\n * @param {string} filePath\n */\nfunction NullFile(filePath) {\n  File.call(this, filePath);\n}\n\nutil.inherits(NullFile, File);\n\nNullFile.prototype.clear = function () {};\nNullFile.prototype.crop = function () {};\nNullFile.prototype.writeLine = function () {};\nNullFile.prototype.getSize = function () { return 0 };\nNullFile.prototype.isNull = function () { return true };\n\n/**\n * Collection, key is a file path, value is a File instance\n * @class\n *\n * @constructor\n */\nfunction FileRegistry() {\n  EventEmitter.call(this);\n  this.store = {};\n\n  this.emitError = this.emitError.bind(this);\n}\n\nutil.inherits(FileRegistry, EventEmitter);\n\n/**\n * Provide a File object corresponding to the filePath\n * @param {string} filePath\n * @param {WriteOptions} [writeOptions]\n * @param {boolean} [async]\n * @return {File}\n */\nFileRegistry.prototype.provide = function (filePath, writeOptions, async) {\n  var file;\n  try {\n    filePath = path.resolve(filePath);\n\n    if (this.store[filePath]) {\n      return this.store[filePath];\n    }\n\n    file = this.createFile(filePath, writeOptions, Boolean(async));\n  } catch (e) {\n    file = new NullFile(filePath);\n    this.emitError(e, file);\n  }\n\n  file.on('error', this.emitError);\n  this.store[filePath] = file;\n  return file;\n};\n\n/**\n * @param {string} filePath\n * @param {WriteOptions} writeOptions\n * @param {boolean} async\n * @return {File}\n * @private\n */\nFileRegistry.prototype.createFile = function (filePath, writeOptions, async) {\n  this.testFileWriting(filePath);\n  return new File(filePath, writeOptions, async);\n};\n\n/**\n * @param {Error} error\n * @param {File} file\n * @private\n */\nFileRegistry.prototype.emitError = function (error, file) {\n  this.emit('error', error, file);\n};\n\n/**\n * @param {string} filePath\n * @private\n */\nFileRegistry.prototype.testFileWriting = function (filePath) {\n  mkDir(path.dirname(filePath));\n  fs.writeFileSync(filePath, '', { flag: 'a' });\n};\n\nfunction mkDir(dirPath) {\n  if (checkNodeJsVersion(10.12)) {\n    fs.mkdirSync(dirPath, { recursive: true });\n    return true;\n  }\n\n  try {\n    fs.mkdirSync(dirPath);\n    return true;\n  } catch (error) {\n    if (error.code === 'ENOENT') {\n      return mkDir(path.dirname(dirPath)) && mkDir(dirPath);\n    }\n\n    try {\n      if (fs.statSync(dirPath).isDirectory()) {\n        return true;\n      }\n\n      // noinspection ExceptionCaughtLocallyJS\n      throw error;\n    } catch (e) {\n      throw e;\n    }\n  }\n}\n\nfunction checkNodeJsVersion(version) {\n  if (!process.versions) {\n    return false;\n  }\n\n  var nodeVersion = Number(\n    process.version.match(/^v(\\d+\\.\\d+)/)[1].replace(/\\.(\\d)$/, '.0$1')\n  );\n\n  return nodeVersion >= version;\n}\n\nfunction readFileSyncFromEnd(filePath, bytesCount) {\n  var buffer = Buffer.alloc(bytesCount);\n  var stats = fs.statSync(filePath);\n\n  var readLength = Math.min(stats.size, bytesCount);\n  var offset = Math.max(0, stats.size - bytesCount);\n\n  var fd = fs.openSync(filePath, 'r');\n  var totalBytes = fs.readSync(fd, buffer, 0, readLength, offset);\n  fs.closeSync(fd);\n\n  return buffer.toString('utf8', 0, totalBytes);\n}\n\n\n//# sourceURL=webpack:///./node_modules/electron-log/src/transports/file/file.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/transports/file/index.js":
/*!****************************************************************!*\
  !*** ./node_modules/electron-log/src/transports/file/index.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar fs = __webpack_require__(/*! fs */ \"fs\");\nvar path = __webpack_require__(/*! path */ \"path\");\nvar util = __webpack_require__(/*! util */ \"util\");\nvar transform = __webpack_require__(/*! ../../transform */ \"./node_modules/electron-log/src/transform/index.js\");\nvar FileRegistry = __webpack_require__(/*! ./file */ \"./node_modules/electron-log/src/transports/file/file.js\").FileRegistry;\nvar variables = __webpack_require__(/*! ./variables */ \"./node_modules/electron-log/src/transports/file/variables.js\");\n\nmodule.exports = fileTransportFactory;\n\n// Shared between multiple file transport instances\nvar globalRegistry = new FileRegistry();\n\nfunction fileTransportFactory(electronLog, customRegistry) {\n  var pathVariables = variables.getPathVariables(process.platform);\n\n  var registry = customRegistry || globalRegistry;\n  registry.on('error', function (e, file) {\n    logConsole('Can\\'t write to ' + file, e);\n  });\n\n  /* eslint-disable no-multi-spaces */\n  transport.archiveLog   = archiveLog;\n  transport.fileName     = getDefaultFileName();\n  transport\n    .format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}';\n  transport.getFile      = getFile;\n  transport.level        = 'silly';\n  transport.maxSize      = 1024 * 1024;\n  transport.resolvePath  = resolvePath;\n  transport.sync         = true;\n  transport.writeOptions = {\n    flag: 'a',\n    mode: 438, // 0666\n    encoding: 'utf8',\n  };\n\n  initDeprecated();\n\n  return transport;\n\n  function transport(message) {\n    var file = getFile(message);\n\n    var needLogRotation = transport.maxSize > 0\n      && file.size > transport.maxSize;\n\n    if (needLogRotation) {\n      transport.archiveLog(file);\n      file.reset();\n    }\n\n    var scopeOptions = electronLog.scope.getOptions();\n    var content = transform.transform(message, [\n      transform.removeStyles,\n      transform.customFormatterFactory(transport.format, false, scopeOptions),\n      transform.concatFirstStringElements,\n      transform.maxDepthFactory(),\n      transform.toString,\n    ]);\n\n    file.writeLine(content);\n  }\n\n  function archiveLog(file) {\n    var oldPath = file.toString();\n    var inf = path.parse(oldPath);\n    try {\n      fs.renameSync(oldPath, path.join(inf.dir, inf.name + '.old' + inf.ext));\n    } catch (e) {\n      logConsole('Could not rotate log', e);\n      var quarterOfMaxSize = Math.round(transport.maxSize / 4);\n      file.crop(Math.min(quarterOfMaxSize, 256 * 1024));\n    }\n  }\n\n  function logConsole(message, error) {\n    var data = ['electron-log.transports.file: ' + message];\n\n    if (error) {\n      data.push(error);\n    }\n\n    electronLog.transports.console({\n      data: data,\n      date: new Date(),\n      level: 'warn',\n    });\n  }\n\n  function getFile(msg) {\n    var vars = Object.assign({}, pathVariables, {\n      fileName: transport.fileName,\n    });\n\n    var filePath = transport.resolvePath(vars, msg);\n    return registry.provide(filePath, transport.writeOptions, !transport.sync);\n  }\n\n  /**\n   * @param {PathVariables} vars\n   */\n  function resolvePath(vars) {\n    return path.join(vars.libraryDefaultDir, vars.fileName);\n  }\n\n  function initDeprecated() {\n    var isDeprecatedText = ' is deprecated and will be removed in v5.';\n    var isDeprecatedProp = ' property' + isDeprecatedText;\n\n    Object.defineProperties(transport, {\n      bytesWritten: {\n        get: util.deprecate(getBytesWritten, 'bytesWritten' + isDeprecatedProp),\n      },\n\n      file: {\n        get: util.deprecate(getLogFile, 'file' + isDeprecatedProp),\n        set: util.deprecate(setLogFile, 'file' + isDeprecatedProp),\n      },\n\n      fileSize: {\n        get: util.deprecate(getFileSize, 'file' + isDeprecatedProp),\n      },\n    });\n\n    transport.clear = util.deprecate(clear, 'clear()' + isDeprecatedText);\n    transport.findLogPath = util.deprecate(\n      getLogFile,\n      'findLogPath()' + isDeprecatedText\n    );\n    transport.init = util.deprecate(init, 'init()' + isDeprecatedText);\n\n    function getBytesWritten() {\n      return getFile().bytesWritten;\n    }\n\n    function getLogFile() {\n      return getFile().path;\n    }\n\n    function setLogFile(filePath) {\n      transport.resolvePath = function () {\n        return filePath;\n      };\n    }\n\n    function getFileSize() {\n      return getFile().size;\n    }\n\n    function clear() {\n      getFile().clear();\n    }\n\n    function init() {}\n  }\n}\n\nfunction getDefaultFileName() {\n  switch (process.type) {\n    case 'renderer': return 'renderer.log';\n    case 'worker': return 'worker.log';\n    default: return 'main.log';\n  }\n}\n\n\n//# sourceURL=webpack:///./node_modules/electron-log/src/transports/file/index.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/transports/file/packageJson.js":
/*!**********************************************************************!*\
  !*** ./node_modules/electron-log/src/transports/file/packageJson.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\n/* eslint-disable consistent-return */\n\nvar fs = __webpack_require__(/*! fs */ \"fs\");\nvar path = __webpack_require__(/*! path */ \"path\");\n\nmodule.exports = {\n  readPackageJson: readPackageJson,\n  tryReadJsonAt: tryReadJsonAt,\n};\n\n/**\n * @return {{ name?: string, version?: string}}\n */\nfunction readPackageJson() {\n  return tryReadJsonAt(__webpack_require__.c[__webpack_require__.s] && __webpack_require__.c[__webpack_require__.s].filename)\n    || tryReadJsonAt(process.resourcesPath, 'app.asar')\n    || tryReadJsonAt(process.cwd())\n    || { name: null, version: null };\n}\n\n/**\n * @param {...string} searchPath\n * @return {{ name?: string, version?: string } | null}\n */\nfunction tryReadJsonAt(searchPath) {\n  try {\n    searchPath = path.join.apply(path, arguments);\n    var fileName = findUp('package.json', searchPath);\n    if (!fileName) {\n      return null;\n    }\n\n    var json = JSON.parse(fs.readFileSync(fileName, 'utf8'));\n    var name = json.productName || json.name;\n    if (!name || name.toLowerCase() === 'electron') {\n      return null;\n    }\n\n    if (json.productName || json.name) {\n      return {\n        name: name,\n        version: json.version,\n      };\n    }\n  } catch (e) {\n    return null;\n  }\n}\n\n/**\n * @param {string} fileName\n * @param {string} [cwd]\n * @return {string | null}\n */\nfunction findUp(fileName, cwd) {\n  var currentPath = cwd;\n  // eslint-disable-next-line no-constant-condition\n  while (true) {\n    var parsedPath = path.parse(currentPath);\n    var root = parsedPath.root;\n    var dir = parsedPath.dir;\n\n    if (fs.existsSync(path.join(currentPath, fileName))) {\n      return path.resolve(path.join(currentPath, fileName));\n    }\n\n    if (currentPath === root) {\n      return null;\n    }\n\n    currentPath = dir;\n  }\n}\n\n\n//# sourceURL=webpack:///./node_modules/electron-log/src/transports/file/packageJson.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/transports/file/variables.js":
/*!********************************************************************!*\
  !*** ./node_modules/electron-log/src/transports/file/variables.js ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar os = __webpack_require__(/*! os */ \"os\");\nvar path = __webpack_require__(/*! path */ \"path\");\nvar electronApi = __webpack_require__(/*! ../../electronApi */ \"./node_modules/electron-log/src/electronApi.js\");\nvar packageJson = __webpack_require__(/*! ./packageJson */ \"./node_modules/electron-log/src/transports/file/packageJson.js\");\n\nmodule.exports = {\n  getAppData: getAppData,\n  getLibraryDefaultDir: getLibraryDefaultDir,\n  getLibraryTemplate: getLibraryTemplate,\n  getNameAndVersion: getNameAndVersion,\n  getPathVariables: getPathVariables,\n  getUserData: getUserData,\n};\n\nfunction getAppData(platform) {\n  var appData = electronApi.getPath('appData');\n  if (appData) {\n    return appData;\n  }\n\n  var home = getHome();\n\n  switch (platform) {\n    case 'darwin': {\n      return path.join(home, 'Library/Application Support');\n    }\n\n    case 'win32': {\n      return process.env.APPDATA || path.join(home, 'AppData/Roaming');\n    }\n\n    default: {\n      return process.env.XDG_CONFIG_HOME || path.join(home, '.config');\n    }\n  }\n}\n\nfunction getHome() {\n  return os.homedir ? os.homedir() : process.env.HOME;\n}\n\nfunction getLibraryDefaultDir(platform, appName) {\n  if (platform === 'darwin') {\n    return path.join(getHome(), 'Library/Logs', appName);\n  }\n\n  return path.join(getUserData(platform, appName), 'logs');\n}\n\nfunction getLibraryTemplate(platform) {\n  if (platform === 'darwin') {\n    return path.join(getHome(), 'Library/Logs', '{appName}');\n  }\n\n  return path.join(getAppData(platform), '{appName}', 'logs');\n}\n\nfunction getNameAndVersion() {\n  var name = electronApi.getName();\n  var version = electronApi.getVersion();\n\n  if (name && version) {\n    return { name: name, version: version };\n  }\n\n  var packageValues = packageJson.readPackageJson();\n  if (!name) {\n    name = packageValues.name;\n  }\n\n  if (!version) {\n    version = packageValues.version;\n  }\n\n  return { name: name, version: version };\n}\n\n/**\n * @param {string} platform\n * @return {PathVariables}\n */\nfunction getPathVariables(platform) {\n  var nameAndVersion = getNameAndVersion();\n  var appName = nameAndVersion.name;\n  var appVersion = nameAndVersion.version;\n\n  return {\n    appData: getAppData(platform),\n    appName: appName,\n    appVersion: appVersion,\n    electronDefaultDir: electronApi.getPath('logs'),\n    home: getHome(),\n    libraryDefaultDir: getLibraryDefaultDir(platform, appName),\n    libraryTemplate: getLibraryTemplate(platform),\n    temp: electronApi.getPath('temp') || os.tmpdir(),\n    userData: getUserData(platform, appName),\n  };\n}\n\nfunction getUserData(platform, appName) {\n  return electronApi.getPath('userData')\n    || path.join(getAppData(platform), appName);\n}\n\n\n//# sourceURL=webpack:///./node_modules/electron-log/src/transports/file/variables.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/transports/ipc.js":
/*!*********************************************************!*\
  !*** ./node_modules/electron-log/src/transports/ipc.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar transform = __webpack_require__(/*! ../transform */ \"./node_modules/electron-log/src/transform/index.js\");\nvar electronApi = __webpack_require__(/*! ../electronApi */ \"./node_modules/electron-log/src/electronApi.js\");\nvar log = __webpack_require__(/*! ../log.js */ \"./node_modules/electron-log/src/log.js\");\n\nmodule.exports = ipcTransportFactory;\n\nfunction ipcTransportFactory(electronLog) {\n  transport.eventId = '__ELECTRON_LOG_IPC_' + electronLog.logId + '__';\n  transport.level = electronLog.isDev ? 'silly' : false;\n\n  // Prevent problems when there are multiple instances after webpack\n  if (electronApi.isIpcChannelListened(transport.eventId)) {\n    return function () {};\n  }\n\n  electronApi.onIpc(transport.eventId, function (_, message) {\n    message.date = new Date(message.date);\n\n    log.runTransport(\n      electronLog.transports.console,\n      message,\n      electronLog\n    );\n  });\n\n  electronApi.loadRemoteModule('electron-log');\n\n  return electronApi.isElectron() ? transport : null;\n\n  function transport(message) {\n    var ipcMessage = Object.assign({}, message, {\n      data: transform.transform(message, [\n        transform.removeStyles,\n        transform.toJSON,\n        transform.maxDepthFactory(3),\n      ]),\n    });\n\n    electronApi.sendIpc(transport.eventId, ipcMessage);\n  }\n}\n\n\n//# sourceURL=webpack:///./node_modules/electron-log/src/transports/ipc.js?");

/***/ }),

/***/ "./node_modules/electron-log/src/transports/remote.js":
/*!************************************************************!*\
  !*** ./node_modules/electron-log/src/transports/remote.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar http = __webpack_require__(/*! http */ \"http\");\nvar https = __webpack_require__(/*! https */ \"https\");\nvar url = __webpack_require__(/*! url */ \"url\");\nvar log = __webpack_require__(/*! ../log */ \"./node_modules/electron-log/src/log.js\");\nvar transform = __webpack_require__(/*! ../transform */ \"./node_modules/electron-log/src/transform/index.js\");\n\nmodule.exports = remoteTransportFactory;\n\nfunction remoteTransportFactory(electronLog) {\n  transport.client = { name: 'electron-application' };\n  transport.depth = 6;\n  transport.level = false;\n  transport.requestOptions = {};\n  transport.url = null;\n\n  return transport;\n\n  function transport(message) {\n    if (!transport.url) return;\n\n    var request = post(transport.url, transport.requestOptions, {\n      client: transport.client,\n      data: transform.transform(message, [\n        transform.removeStyles,\n        transform.toJSON,\n        transform.maxDepthFactory(transport.depth + 1),\n      ]),\n      date: message.date.getTime(),\n      level: message.level,\n      variables: message.variables,\n    });\n\n    request.on('error', function (error) {\n      var errorMessage = {\n        data: [\n          'electron-log.transports.remote:'\n          + ' cannot send HTTP request to ' + transport.url,\n          error,\n        ],\n        date: new Date(),\n        level: 'warn',\n      };\n\n      var transports = [\n        electronLog.transports.console,\n        electronLog.transports.ipc,\n        electronLog.transports.file,\n      ];\n\n      log.runTransports(transports, errorMessage, electronLog);\n    });\n  }\n}\n\nfunction post(serverUrl, requestOptions, data) {\n  var urlObject = url.parse(serverUrl);\n  var httpTransport = urlObject.protocol === 'https:' ? https : http;\n\n  var body = JSON.stringify(data);\n\n  var options = {\n    hostname: urlObject.hostname,\n    port:     urlObject.port,\n    path:     urlObject.path,\n    method:   'POST',\n    headers:  {\n      'Content-Length': body.length,\n      'Content-Type':   'application/json',\n    },\n  };\n\n  Object.assign(options, requestOptions);\n\n  var request = httpTransport.request(options);\n  request.write(body);\n  request.end();\n\n  return request;\n}\n\n\n//# sourceURL=webpack:///./node_modules/electron-log/src/transports/remote.js?");

/***/ }),

/***/ "./src/main/const.ts":
/*!***************************!*\
  !*** ./src/main/const.ts ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.electronEvent = void 0;\nexports.electronEvent = {\n    /** サーバー起動 */\n    START_SERVER: 'start-server',\n    /** サーバー停止 */\n    STOP_SERVER: 'stop-server',\n    /** Config適用 */\n    APPLY_CONFIG: 'apply-config',\n    /** アラート表示 */\n    SHOW_ALERT: 'show-alert',\n    SAVE_CONFIG: 'save-config',\n    /** 棒読み再生 */\n    PLAY_TAMIYASU: 'play-tamiyasu',\n    /** レス着信音再生 */\n    PLAY_SOUND_START: 'play-sound-start',\n    PLAY_SOUND_END: 'play-sound-end',\n    WAIT_YOMIKO_TIME: 'wait-yomiko-time',\n    SPEAKING_END: 'speaking-end',\n    /** コメント表示 */\n    SHOW_COMMENT: 'show-comment',\n    /** コメント欄初期化 */\n    CLEAR_COMMENT: 'clear-comment',\n    /** 翻訳コメント表示 */\n    SHOW_COMMENT_TL: 'show_comment_translate',\n    /** サーバー起動の返信 */\n    START_SERVER_REPLY: 'start-server-reply',\n    /** 強制的に端にスクロール */\n    FORCE_SCROLL: 'FORCE_SCROLL',\n    /** ステータス更新 */\n    UPDATE_STATUS: 'UPDATE_STATUS',\n    /** コメントテスト */\n    COMMENT_TEST: 'COMMENT_TEST',\n    /** 画像プレビュー */\n    PREVIEW_IMAGE: 'PREVIEW_IMAGE',\n};\n\n\n//# sourceURL=webpack:///./src/main/const.ts?");

/***/ }),

/***/ "./src/renderer/imagePreview.ts":
/*!**************************************!*\
  !*** ./src/renderer/imagePreview.ts ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nvar electron_1 = __importDefault(__webpack_require__(/*! electron */ \"electron\"));\nvar electron_log_1 = __importDefault(__webpack_require__(/*! electron-log */ \"./node_modules/electron-log/src/index.js\"));\nvar path_1 = __importDefault(__webpack_require__(/*! path */ \"path\"));\nvar log = electron_log_1.default.scope('renderer-imagePreview');\nvar const_1 = __webpack_require__(/*! ../main/const */ \"./src/main/const.ts\");\nvar crypto_1 = __importDefault(__webpack_require__(/*! crypto */ \"crypto\"));\nvar ipcRenderer = electron_1.default.ipcRenderer;\ndocument.addEventListener('DOMContentLoaded', function () {\n    log.debug('DOM Content Loaded');\n});\nipcRenderer.on(const_1.electronEvent.PREVIEW_IMAGE, function (event, url) {\n    document.title = \"preview \" + url;\n    log.info('[preview-image] ' + url);\n    var md5 = crypto_1.default.createHash('md5');\n    var id = 'a' + md5.update(url).digest('hex'); // 英文字先頭じゃないとクエリ的に怒られる\n    log.info('[preview-image] ' + id);\n    var tabname = path_1.default.basename(url);\n    var tabBartDom = document.getElementById('tab-bar');\n    var tabContentDom = document.getElementById('tab-content');\n    var existsTabdom = tabBartDom.querySelector(\"#tab_\" + id);\n    var existsContentdom = tabContentDom.querySelector(\"#\" + id);\n    // アクティブ状態を解除\n    var existsdom2 = tabBartDom.querySelector(\".is-active\");\n    if (existsdom2)\n        existsdom2.classList.remove('is-active');\n    existsdom2 = tabContentDom.querySelector(\".is-active\");\n    if (existsdom2)\n        existsdom2.classList.remove('is-active');\n    // 既に開いてる場合は、アクティブにするだけ\n    if (existsTabdom && existsContentdom) {\n        existsTabdom.classList.add('is-active');\n        existsContentdom.classList.add('is-active');\n        return;\n    }\n    tabBartDom.insertAdjacentHTML('beforeend', \"<a id=\\\"tab_\" + id + \"\\\" href=\\\"#\" + id + \"\\\" class=\\\"\\\">\" + tabname + \"</a>\");\n    tabContentDom.insertAdjacentHTML('beforeend', \"<div class=\\\"mdl-tabs__panel is-active\\\" id=\\\"\" + id + \"\\\"><div class=\\\"content\\\"><img src=\\\"\" + url + \"\\\" /></div></div>\");\n    existsTabdom = tabBartDom.querySelector(\"#tab_\" + id);\n    if (existsTabdom) {\n        existsTabdom.classList.add('mdl-tabs__tab');\n        existsTabdom.classList.add('is-active');\n        existsTabdom.addEventListener('click', activeTab(url, id));\n    }\n});\nvar activeTab = function (url, id) { return function () {\n    document.title = \"preview \" + url;\n    var tabBartDom = document.getElementById('tab-bar');\n    var tabContentDom = document.getElementById('tab-content');\n    var existsTabdom = tabBartDom.querySelector(\"#tab_\" + id);\n    var existsContentdom = tabContentDom.querySelector(\"#\" + id);\n    // アクティブ状態を解除\n    var existsdom2 = tabBartDom.querySelector(\".is-active\");\n    if (existsdom2)\n        existsdom2.classList.remove('is-active');\n    existsdom2 = tabContentDom.querySelector(\".is-active\");\n    if (existsdom2)\n        existsdom2.classList.remove('is-active');\n    if (existsTabdom && existsContentdom) {\n        existsTabdom.classList.add('is-active');\n        existsContentdom.classList.add('is-active');\n        return;\n    }\n}; };\n// window.addEventListener(\n//   'contextmenu',\n//   (e) => {\n//     //\n//   },\n//   false,\n// );\n\n\n//# sourceURL=webpack:///./src/renderer/imagePreview.ts?");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"crypto\");\n\n//# sourceURL=webpack:///external_%22crypto%22?");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"electron\");\n\n//# sourceURL=webpack:///external_%22electron%22?");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"events\");\n\n//# sourceURL=webpack:///external_%22events%22?");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"fs\");\n\n//# sourceURL=webpack:///external_%22fs%22?");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"http\");\n\n//# sourceURL=webpack:///external_%22http%22?");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"https\");\n\n//# sourceURL=webpack:///external_%22https%22?");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"os\");\n\n//# sourceURL=webpack:///external_%22os%22?");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"path\");\n\n//# sourceURL=webpack:///external_%22path%22?");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"url\");\n\n//# sourceURL=webpack:///external_%22url%22?");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"util\");\n\n//# sourceURL=webpack:///external_%22util%22?");

/***/ })

/******/ });