"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
var WorkerGroup_1 = __importDefault(require("../../src/WorkerGroup"));
var WorkerA_1 = __importDefault(require("./WorkerA"));
var WorkerB_1 = __importDefault(require("./WorkerB"));
var WorkerC_1 = __importDefault(require("./WorkerC"));
new WorkerGroup_1.default([
    new WorkerA_1.default(),
    new WorkerB_1.default(),
    new WorkerC_1.default()
]);
//# sourceMappingURL=workers.js.map