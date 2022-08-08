"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMessenger = exports.getMessenger = void 0;
var InlineMessenger_1 = __importDefault(require("./messengers/InlineMessenger"));
var messenger = new InlineMessenger_1.default();
var getMessenger = function () {
    return Promise.resolve(messenger);
};
exports.getMessenger = getMessenger;
var setMessenger = function (msgr) {
    messenger = msgr;
};
exports.setMessenger = setMessenger;
//# sourceMappingURL=Messenger.js.map