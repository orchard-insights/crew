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
var mongodb_1 = require("mongodb");
var luxon_1 = require("luxon");
var realtime_1 = __importDefault(require("./realtime"));
var database_1 = __importDefault(require("./database"));
var Task_1 = __importDefault(require("./Task"));
var axios_1 = __importDefault(require("axios"));
var CloudTasks_1 = require("./CloudTasks");
/**
 * @openapi
 * components:
 *   schemas:
 *     CreateOperator:
 *       type: object
 *       properties:
 *         channel:
 *           type: string
 *           required: true
 *           description: Which channel this operator can manage tasks for.
 *         url:
 *           type: string
 *           description: Url the operator should POST tasks to.
 *         requestConfig:
 *           type: object
 *           description: Axios request config to use when POSTing the task (for adding Authorization headers).
 *         isPaused:
 *           type: boolean
 *           description: When true, this operator will not proxy requests to url.
 *           default: false
 *     Opeartor:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateOperator'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             createdAt:
 *               type: string
 */
var Operator = /** @class */ (function () {
    function Operator(channel, url, requestConfig, isPaused) {
        if (requestConfig === void 0) { requestConfig = null; }
        if (isPaused === void 0) { isPaused = false; }
        this.channel = channel;
        this.url = url;
        this.requestConfig = requestConfig;
        this.isPaused = isPaused;
        this.createdAt = luxon_1.DateTime.utc().toJSDate();
    }
    Operator.findAll = function (limit, skip) {
        if (limit === void 0) { limit = 50; }
        if (skip === void 0) { skip = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var operatorCollection, operators;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        operatorCollection = (_a.sent()).operatorCollection;
                        return [4 /*yield*/, operatorCollection.find().limit(limit).skip(skip).sort({ createdAt: -1 }).toArray()];
                    case 2:
                        operators = _a.sent();
                        return [2 /*return*/, operators];
                }
            });
        });
    };
    Operator.countAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var operatorCollection, count;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        operatorCollection = (_a.sent()).operatorCollection;
                        return [4 /*yield*/, operatorCollection.countDocuments({})];
                    case 2:
                        count = _a.sent();
                        return [2 /*return*/, count];
                }
            });
        });
    };
    Operator.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var operatorCollection, operator;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        operatorCollection = (_a.sent()).operatorCollection;
                        return [4 /*yield*/, operatorCollection.findOne({ _id: id })];
                    case 2:
                        operator = _a.sent();
                        return [2 /*return*/, operator];
                }
            });
        });
    };
    Operator.updateById = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var operatorCollection, operator;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()
                        // Cannot update:
                    ];
                    case 1:
                        operatorCollection = (_a.sent()).operatorCollection;
                        // Cannot update:
                        delete updates.createdAt;
                        return [4 /*yield*/, operatorCollection.updateOne({ _id: id }, { $set: updates })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, Operator.findById(id)];
                    case 3:
                        operator = _a.sent();
                        realtime_1.default.emit('operators', 'operator:update', operator);
                        return [4 /*yield*/, Operator.bootstrap(operator)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, operator];
                }
            });
        });
    };
    // Helper to create an operator from a POST request
    Operator.fromData = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var operatorCollection, document, insertResult, operator;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        operatorCollection = (_a.sent()).operatorCollection;
                        document = {
                            channel: data.channel,
                            url: data.url,
                            requestConfig: data.requestConfig || null,
                            isPaused: data.isPaused,
                            createdAt: luxon_1.DateTime.utc().toJSDate()
                        };
                        return [4 /*yield*/, operatorCollection.insertOne(document)];
                    case 2:
                        insertResult = _a.sent();
                        return [4 /*yield*/, Operator.findById(insertResult.insertedId)];
                    case 3:
                        operator = _a.sent();
                        realtime_1.default.emit('operators', 'operator:create', operator);
                        return [2 /*return*/, operator];
                }
            });
        });
    };
    Operator.deleteById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var operatorCollection, operator, deleteResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        operatorCollection = (_a.sent()).operatorCollection;
                        return [4 /*yield*/, Operator.findById(id)];
                    case 2:
                        operator = _a.sent();
                        return [4 /*yield*/, operatorCollection.deleteOne({ '_id': id })];
                    case 3:
                        deleteResult = _a.sent();
                        realtime_1.default.emit('operators', 'operator:delete', operator);
                        return [2 /*return*/, deleteResult];
                }
            });
        });
    };
    Operator.bootstrapAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var operatorCollection, operators, _i, operators_1, operator;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        operatorCollection = (_a.sent()).operatorCollection;
                        return [4 /*yield*/, operatorCollection.find().sort({ createdAt: -1 }).toArray()];
                    case 2:
                        operators = _a.sent();
                        _i = 0, operators_1 = operators;
                        _a.label = 3;
                    case 3:
                        if (!(_i < operators_1.length)) return [3 /*break*/, 6];
                        operator = operators_1[_i];
                        return [4 /*yield*/, Operator.bootstrap(operator)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    Operator.bootstrap = function (operator) {
        return __awaiter(this, void 0, void 0, function () {
            var limit, skip, hasMore, tasks, messenger, _i, tasks_1, task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!operator.isPaused) return [3 /*break*/, 4];
                        limit = 100;
                        skip = 0;
                        hasMore = true;
                        _a.label = 1;
                    case 1:
                        if (!hasMore) return [3 /*break*/, 4];
                        return [4 /*yield*/, Task_1.default.findAllInChannel(limit, skip, operator.channel)];
                    case 2:
                        tasks = _a.sent();
                        return [4 /*yield*/, (0, CloudTasks_1.getMessenger)()];
                    case 3:
                        messenger = _a.sent();
                        for (_i = 0, tasks_1 = tasks; _i < tasks_1.length; _i++) {
                            task = tasks_1[_i];
                            if (task._id) {
                                messenger.publishExamineTask(task._id.toString(), 0);
                            }
                        }
                        skip = skip + limit;
                        if (tasks.length < limit) {
                            hasMore = false;
                        }
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Operator.execute = function (taskId) {
        return __awaiter(this, void 0, void 0, function () {
            var executeTask, channel, operatorCollection, operator, operatorRequestConfig, workerId, task, parents, config, response, _a, error, output, children, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Task_1.default.findById(taskId)];
                    case 1:
                        executeTask = _b.sent();
                        if (!executeTask) return [3 /*break*/, 18];
                        channel = executeTask.channel;
                        return [4 /*yield*/, (0, database_1.default)()];
                    case 2:
                        operatorCollection = (_b.sent()).operatorCollection;
                        operator = void 0;
                        if (!process.env.CREW_VIRTUAL_OPERATOR_BASE_URL) return [3 /*break*/, 3];
                        operatorRequestConfig = {};
                        if (process.env.CREW_VIRTUAL_OPERATOR_AUTH_TOKEN) {
                            operatorRequestConfig.headers = {
                                'Authorization': 'Bearer ' + process.env.CREW_VIRTUAL_OPERATOR_AUTH_TOKEN
                            };
                        }
                        // Create the virtual operator
                        operator = new Operator(channel, process.env.CREW_VIRTUAL_OPERATOR_BASE_URL + channel, operatorRequestConfig, false);
                        operator._id = mongodb_1.ObjectId.createFromTime(new Date().getTime() / 1000);
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, operatorCollection.findOne({ channel: channel })];
                    case 4:
                        operator = (_b.sent());
                        _b.label = 5;
                    case 5:
                        if (!operator) return [3 /*break*/, 18];
                        workerId = "operator_" + operator._id;
                        if (operator.isPaused) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, Task_1.default.operatorAcquire(taskId, workerId)];
                    case 6:
                        task = _b.sent();
                        if (!(task && task._id)) return [3 /*break*/, 18];
                        console.log('~~ execute task ' + task._id + ' (operator)');
                        return [4 /*yield*/, Task_1.default.getParentsData(task)
                            // Prepare axios request config
                        ];
                    case 7:
                        parents = _b.sent();
                        config = __assign({}, operator.requestConfig);
                        _b.label = 8;
                    case 8:
                        _b.trys.push([8, 11, , 18]);
                        // Send request to operator's url
                        console.log('~~ Operator making call to : ' + operator.url);
                        return [4 /*yield*/, axios_1.default.post(operator.url, { input: task.input, parents: parents, taskId: task._id }, config)
                            // Unpack response
                        ];
                    case 9:
                        response = _b.sent();
                        _a = response.data, error = _a.error, output = _a.output, children = _a.children;
                        // Release the task
                        return [4 /*yield*/, Task_1.default.release(task._id, workerId, error, output, children)];
                    case 10:
                        // Release the task
                        _b.sent();
                        return [3 /*break*/, 18];
                    case 11:
                        error_1 = _b.sent();
                        console.error('~~ Operator error', error_1);
                        if (!(axios_1.default.isAxiosError(error_1) && error_1.response && error_1.response.data && error_1.response.data.error)) return [3 /*break*/, 13];
                        console.error('~~ Operator http call error', error_1.response.data.error);
                        return [4 /*yield*/, Task_1.default.release(task._id, workerId, error_1.response.data.error)];
                    case 12:
                        _b.sent();
                        return [3 /*break*/, 17];
                    case 13:
                        if (!(axios_1.default.isAxiosError(error_1) && error_1.response && error_1.response.data && error_1.response.data.message)) return [3 /*break*/, 15];
                        console.error('~~ Operator http call error', error_1.response.data.message);
                        return [4 /*yield*/, Task_1.default.release(task._id, workerId, error_1.response.data.message)];
                    case 14:
                        _b.sent();
                        return [3 /*break*/, 17];
                    case 15:
                        console.error('~~ Operator http call error', error_1.message);
                        return [4 /*yield*/, Task_1.default.release(task._id, workerId, error_1.message)];
                    case 16:
                        _b.sent();
                        _b.label = 17;
                    case 17: return [3 /*break*/, 18];
                    case 18: return [2 /*return*/];
                }
            });
        });
    };
    return Operator;
}());
exports.default = Operator;
//# sourceMappingURL=Operator.js.map