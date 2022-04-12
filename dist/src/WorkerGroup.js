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
var WorkerServer_1 = __importDefault(require("./WorkerServer"));
function finalizeShutdown(app, workers, killTimeout) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, workers_1, worker;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, workers_1 = workers;
                    _a.label = 1;
                case 1:
                    if (!(_i < workers_1.length)) return [3 /*break*/, 4];
                    worker = workers_1[_i];
                    console.log("Shutdown cleanup worker " + worker.name + " (" + worker.id + ")");
                    return [4 /*yield*/, worker.cleanup()];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    // Stop express
                    if (app) {
                        app.server.close();
                    }
                    // If necessary, prevent the default timeout process.exit interval from running
                    if (killTimeout) {
                        clearTimeout(killTimeout);
                    }
                    console.log('Worker cleanup complete - exit!');
                    // Shutdown
                    process.exit(1);
                    return [2 /*return*/];
            }
        });
    });
}
var WorkerGroup = /** @class */ (function () {
    function WorkerGroup(workers) {
        var _this = this;
        this.shuttingDown = false;
        this.killTimeout = null;
        this.workers = workers;
        var signals = ['SIGTERM', 'SIGINT'];
        if (process.platform === "win32") {
            console.warn('Graceful shutdown for workers is not supported on Windows!');
        }
        for (var _i = 0, signals_1 = signals; _i < signals_1.length; _i++) {
            var signal = signals_1[_i];
            process.once(signal, function (signalOrEvent) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            console.info('~~ Got ' + signalOrEvent + '. Graceful shutdown started.', new Date().toISOString());
                            return [4 /*yield*/, this.startShutdown()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        }
        if (process.env.CREW_WORKER_DISABLE_EXPRESS !== 'yes') {
            this.server = new WorkerServer_1.default();
            this.server.app.get("/healthcheck", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var isHealthy, _i, _a, worker, isWorkerHealthy;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            isHealthy = true;
                            _i = 0, _a = this.workers;
                            _b.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3 /*break*/, 4];
                            worker = _a[_i];
                            return [4 /*yield*/, worker.isHealthy()];
                        case 2:
                            isWorkerHealthy = _b.sent();
                            if (!isWorkerHealthy) {
                                isHealthy = false;
                                return [3 /*break*/, 4];
                            }
                            _b.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4:
                            if (isHealthy) {
                                res.json({ healthy: true });
                            }
                            else {
                                res.status(500).json({ healthy: false });
                            }
                            return [2 /*return*/];
                    }
                });
            }); });
            this.server.app.get('/readycheck', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    res.json({ ready: true });
                    return [2 /*return*/];
                });
            }); });
            this.server.app.get('/', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var results, _i, _a, worker;
                return __generator(this, function (_b) {
                    results = [];
                    for (_i = 0, _a = this.workers; _i < _a.length; _i++) {
                        worker = _a[_i];
                        if (worker.id) {
                            results.push({ id: worker.id, name: worker.name, channel: worker.channel, working: worker.task ? true : false });
                        }
                        else {
                            results.push({ id: null, name: worker.name, channel: worker.channel, working: null });
                        }
                    }
                    res.json(results);
                    return [2 /*return*/];
                });
            }); });
        }
        for (var _a = 0, workers_2 = workers; _a < workers_2.length; _a++) {
            var worker = workers_2[_a];
            worker.startWork();
        }
    }
    WorkerGroup.prototype.startShutdown = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stopPromises, _i, _a, worker, stopPromise, e_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        if (this.shuttingDown) {
                            return [2 /*return*/];
                        }
                        this.shuttingDown = true;
                        stopPromises = [];
                        // Ask each worker to gracefully shutdown
                        for (_i = 0, _a = this.workers; _i < _a.length; _i++) {
                            worker = _a[_i];
                            stopPromise = worker.stopWork();
                            console.log('~~ ask stop', worker.name, stopPromise);
                            stopPromises.push(stopPromise);
                        }
                        // Set a timeout to force process to exit if workers take too long to shutdown
                        this.killTimeout = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        console.warn('~~ Group graceful shutdown failed - force shutdown!');
                                        return [4 /*yield*/, finalizeShutdown(this.server, this.workers, null)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, (parseInt(process.env.CREW_SHUTDOWN_TIMEOUT_IN_MILLISECONDS || '30000')));
                        return [4 /*yield*/, Promise.all(stopPromises)];
                    case 1:
                        _b.sent();
                        console.log('~~ All workers stopped.');
                        return [4 /*yield*/, finalizeShutdown(this.server, this.workers, this.killTimeout)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _b.sent();
                        console.error('startShutdown failed :', e_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return WorkerGroup;
}());
exports.default = WorkerGroup;
//# sourceMappingURL=WorkerGroup.js.map