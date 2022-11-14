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
Object.defineProperty(exports, "__esModule", { value: true });
var HttpWorker = /** @class */ (function () {
    function HttpWorker() {
        // Subclasses should set this to the desired delay when they encounter rate limit responses or errors
        this.pauseWorkgroupSeconds = 0;
        // True when the worker has been asked to shutdown and no new tasks should be acquired
        this.shuttingDown = false;
        // Provide workers access to their workgroup so that they can access express
        this.group = null;
    }
    // Subclasses override this method to initialize any resources prior to work starting (add express routes in worker group)
    HttpWorker.prototype.prepare = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve()];
            });
        });
    };
    HttpWorker.prototype.serve = function () {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_c) {
                (_b = (_a = this.group) === null || _a === void 0 ? void 0 : _a.server) === null || _b === void 0 ? void 0 : _b.app.post('/execute/' + this.channel, this.authMiddleware, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                    var input, parents, taskId, executeResponse, err_1, response;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                this.pauseWorkgroupSeconds = 0;
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, , 4]);
                                input = req.body.input;
                                parents = req.body.parents;
                                taskId = req.body.taskId;
                                return [4 /*yield*/, this.executeTask(input, parents, taskId)];
                            case 2:
                                executeResponse = _a.sent();
                                if (this.pauseWorkgroupSeconds > 0) {
                                    executeResponse.workgroupDelayInSeconds = this.pauseWorkgroupSeconds;
                                }
                                if (req.body.childrenDelayInSeconds) {
                                    executeResponse.childrenDelayInSeconds = parseInt(req.body.childrenDelayInSeconds);
                                }
                                res.send(executeResponse);
                                return [3 /*break*/, 4];
                            case 3:
                                err_1 = _a.sent();
                                response = {};
                                if (err_1 instanceof Error) {
                                    response = { error: err_1.message };
                                }
                                else {
                                    response = { error: err_1 };
                                }
                                if (this.pauseWorkgroupSeconds > 0) {
                                    response.workgroupDelayInSeconds = this.pauseWorkgroupSeconds;
                                }
                                res.send(response);
                                return [3 /*break*/, 4];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        });
    };
    // Subclasses override this method to cleanup any resources they use (database connections)
    HttpWorker.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve()];
            });
        });
    };
    // Subclasses override this method to protect the task execution route provided by serve() above
    HttpWorker.prototype.authMiddleware = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var requiredToken, providedToken;
            return __generator(this, function (_a) {
                requiredToken = process.env.CREW_VIRTUAL_OPERATOR_AUTH_TOKEN;
                if (requiredToken) {
                    providedToken = req.query.accessToken;
                    if (!providedToken) {
                        providedToken = req.body.accessToken;
                    }
                    if (!providedToken && req.headers && req.headers.authorization) {
                        providedToken = req.headers.authorization.replace('Bearer ', '');
                    }
                    if (providedToken === requiredToken) {
                        return [2 /*return*/, next()];
                    }
                    return [2 /*return*/, res.status(401).send({ error: 'Access token is invalid!' })];
                }
                else {
                    return [2 /*return*/, next()];
                }
                return [2 /*return*/];
            });
        });
    };
    // Sublclasses override this method to let worker group know if we are healthy or not
    HttpWorker.prototype.isHealthy = function () {
        return Promise.resolve(true);
    };
    return HttpWorker;
}());
exports.default = HttpWorker;
//# sourceMappingURL=HttpWorker.js.map