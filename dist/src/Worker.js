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
var axios_1 = __importDefault(require("axios"));
var uniqid_1 = __importDefault(require("uniqid"));
var async_retry_1 = __importDefault(require("async-retry"));
var dynamic_1 = require("set-interval-async/dynamic");
var Worker = /** @class */ (function () {
    function Worker() {
        // Crew api url and credentials
        this.apiBaseUrl = process.env.CREW_API_BASE_URL || 'http://localhost:3000/';
        // Access token to add to acquire and release tasks
        this.acquireReleaseAxiosRequestConfig = {};
        // Subclasses should set this to the desired delay when they encounter rate limit responses or errors
        this.pauseWorkgroupSeconds = 0;
        // Goes with setInterval to poll for new tasks
        this.workInterval = null;
        // True when the worker has been asked to shutdown and no new tasks should be acquired
        this.shuttingDown = false;
        // How long should the worker wait before polling for new tasks
        this.workIntervalDelay = parseInt(process.env.CREW_WORK_INTERVAL_IN_MILLISECONDS || '15000');
        // When true the worker will look for a new task immediately after finishing a task
        // This helps drain work queues faster but may not be desirable in rate limited workflows
        this.workIntervalRestart = (process.env.CREW_WORK_INTERVAL_RESTART || 'yes') === 'yes';
        this.task = null;
        this.id = (0, uniqid_1.default)();
    }
    // WorkerGroup calls this method to start the worker
    Worker.prototype.startWork = function () {
        return __awaiter(this, void 0, void 0, function () {
            var restart, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.shuttingDown = false;
                        restart = true;
                        _a.label = 1;
                    case 1:
                        if (!(restart && !this.shuttingDown)) return [3 /*break*/, 6];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.doWork()];
                    case 3:
                        restart = _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        console.error('doWork (initial) error', error_1);
                        restart = false;
                        return [3 /*break*/, 5];
                    case 5: return [3 /*break*/, 1];
                    case 6:
                        // Check for new work at a regular interval
                        this.workInterval = (0, dynamic_1.setIntervalAsync)(function () { return __awaiter(_this, void 0, void 0, function () {
                            var error_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        restart = true;
                                        _a.label = 1;
                                    case 1:
                                        if (!(restart && !this.shuttingDown)) return [3 /*break*/, 6];
                                        _a.label = 2;
                                    case 2:
                                        _a.trys.push([2, 4, , 5]);
                                        return [4 /*yield*/, this.doWork()];
                                    case 3:
                                        restart = _a.sent();
                                        return [3 /*break*/, 5];
                                    case 4:
                                        error_2 = _a.sent();
                                        console.error('doWork (interval) error', error_2);
                                        restart = false;
                                        return [3 /*break*/, 5];
                                    case 5: return [3 /*break*/, 1];
                                    case 6: return [2 /*return*/];
                                }
                            });
                        }); }, this.workIntervalDelay);
                        return [2 /*return*/];
                }
            });
        });
    };
    // WorkerGroup calls this method to stop the worker (usually due to SIGINT or SIGTERM)
    Worker.prototype.stopWork = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.shuttingDown = true;
                console.log("~~ " + this.channel + " (" + this.id + ") stopWork");
                // stop looking for new tasks:
                if (this.workInterval) {
                    return [2 /*return*/, (0, dynamic_1.clearIntervalAsync)(this.workInterval)];
                }
                else {
                    return [2 /*return*/, Promise.resolve()];
                }
                return [2 /*return*/];
            });
        });
    };
    // Primary workflow implementation
    Worker.prototype.doWork = function () {
        return __awaiter(this, void 0, void 0, function () {
            var acquireResponse, executeResponse_1, restart, error_3;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.task = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, 9, 10]);
                        console.log("~~ " + this.channel + " (" + this.id + ") asking for task");
                        return [4 /*yield*/, axios_1.default.post(this.apiBaseUrl + ("api/v1/channel/" + this.channel + "/acquire"), {
                                workerId: this.id
                            }, this.acquireReleaseAxiosRequestConfig)];
                    case 2:
                        acquireResponse = _a.sent();
                        if (!acquireResponse.data.task) return [3 /*break*/, 6];
                        this.pauseWorkgroupSeconds = 0;
                        this.task = acquireResponse.data.task;
                        if (!(this.task && this.task._id)) return [3 /*break*/, 5];
                        console.log("~~ " + this.channel + " (" + this.id + ") acquired task " + this.task._id);
                        return [4 /*yield*/, this.executeTask(acquireResponse.data.task.input, acquireResponse.data.parents)
                            // Once the work is completed, let the API know in a resilient way
                        ];
                    case 3:
                        executeResponse_1 = _a.sent();
                        return [4 /*yield*/, (0, async_retry_1.default)(function (bail) { return __awaiter(_this, void 0, void 0, function () {
                                var releaseData;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!(this.task && this.task._id)) return [3 /*break*/, 3];
                                            console.log("~~ " + this.channel + " (" + this.id + ") complete task " + this.task._id + " attempt");
                                            releaseData = {
                                                workerId: this.id,
                                                output: executeResponse_1.output || null,
                                                children: executeResponse_1.children || []
                                            };
                                            if (this.pauseWorkgroupSeconds > 0) {
                                                releaseData.workgroupDelayInSeconds = this.pauseWorkgroupSeconds;
                                            }
                                            if (!this.task) return [3 /*break*/, 2];
                                            return [4 /*yield*/, axios_1.default.post(this.apiBaseUrl + ("api/v1/task/" + this.task._id + "/release"), releaseData, this.acquireReleaseAxiosRequestConfig)];
                                        case 1:
                                            _a.sent();
                                            _a.label = 2;
                                        case 2:
                                            console.log("~~ " + this.channel + " (" + this.id + ") complete task " + this.task._id + " success");
                                            // Signal that we should immediately check for new work
                                            return [2 /*return*/, this.workIntervalRestart];
                                        case 3: 
                                        // Something went wrong, don't immediately check for new work
                                        return [2 /*return*/, false];
                                    }
                                });
                            }); }, {
                                retries: 3,
                                factor: 3,
                                minTimeout: 1 * 1000,
                                maxTimeout: 10 * 1000,
                                randomize: true,
                            })
                            // Return value tells signals if doWork should be re-run immediately or not 
                        ];
                    case 4:
                        restart = _a.sent();
                        // Return value tells signals if doWork should be re-run immediately or not 
                        return [2 /*return*/, restart];
                    case 5:
                        console.log("~~ " + this.channel + " (" + this.id + ") received null task ");
                        _a.label = 6;
                    case 6: return [3 /*break*/, 10];
                    case 7:
                        error_3 = _a.sent();
                        // Something went wrong, usually in executeTask
                        console.error(error_3);
                        // Let the API know about the error in a resilient way
                        return [4 /*yield*/, (0, async_retry_1.default)(function (bail) { return __awaiter(_this, void 0, void 0, function () {
                                var releaseData;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!(this.task && this.task._id)) return [3 /*break*/, 2];
                                            console.log("~~ " + this.channel + " (" + this.id + ") fail task " + this.task._id + " attempt");
                                            releaseData = {
                                                workerId: this.id,
                                                error: error_3 instanceof Error ? error_3.message : error_3 + ''
                                            };
                                            if (this.pauseWorkgroupSeconds > 0) {
                                                releaseData.workgroupDelayInSeconds = this.pauseWorkgroupSeconds;
                                            }
                                            return [4 /*yield*/, axios_1.default.post(this.apiBaseUrl + ("api/v1/task/" + this.task._id + "/release"), releaseData, this.acquireReleaseAxiosRequestConfig)];
                                        case 1:
                                            _a.sent();
                                            console.log("~~ " + this.channel + " (" + this.id + ") fail task " + this.task._id + " success");
                                            _a.label = 2;
                                        case 2: return [2 /*return*/];
                                    }
                                });
                            }); }, {
                                retries: 3,
                                factor: 3,
                                minTimeout: 1 * 1000,
                                maxTimeout: 10 * 1000,
                                randomize: true,
                            })];
                    case 8:
                        // Let the API know about the error in a resilient way
                        _a.sent();
                        return [2 /*return*/, false];
                    case 9:
                        this.task = null;
                        return [7 /*endfinally*/];
                    case 10: return [2 /*return*/, false];
                }
            });
        });
    };
    return Worker;
}());
exports.default = Worker;
//# sourceMappingURL=Worker.js.map