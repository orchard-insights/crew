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
exports.TaskGroup = void 0;
var luxon_1 = require("luxon");
var realtime_1 = __importDefault(require("./realtime"));
var database_1 = __importDefault(require("./database"));
var lodash_1 = __importDefault(require("lodash"));
/**
 * @openapi
 * components:
 *   schemas:
 *     CreateTaskGroup:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         isPaused:
 *           type: boolean
 *           description: When true, tasks in the group cannot be acquired by workers.
 *           default: false
 *     TaskGroup:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateTaskGroup'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             createdAt:
 *               type: string
 */
var TaskGroup = /** @class */ (function () {
    function TaskGroup(name, isPaused) {
        this.name = name;
        this.isPaused = isPaused;
        this.createdAt = luxon_1.DateTime.utc().toJSDate();
    }
    TaskGroup.findAll = function (limit, skip) {
        if (limit === void 0) { limit = 50; }
        if (skip === void 0) { skip = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var groupCollection, groups;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        groupCollection = (_a.sent()).groupCollection;
                        return [4 /*yield*/, groupCollection.find().limit(limit).skip(skip).sort({ createdAt: -1 }).toArray()];
                    case 2:
                        groups = _a.sent();
                        return [2 /*return*/, groups];
                }
            });
        });
    };
    TaskGroup.countAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var groupCollection, count;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        groupCollection = (_a.sent()).groupCollection;
                        return [4 /*yield*/, groupCollection.countDocuments({})];
                    case 2:
                        count = _a.sent();
                        return [2 /*return*/, count];
                }
            });
        });
    };
    TaskGroup.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var groupCollection, group;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        groupCollection = (_a.sent()).groupCollection;
                        return [4 /*yield*/, groupCollection.findOne({ _id: id })];
                    case 2:
                        group = _a.sent();
                        return [2 /*return*/, group];
                }
            });
        });
    };
    TaskGroup.updateById = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var groupCollection, group;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()
                        // Cannot update:
                    ];
                    case 1:
                        groupCollection = (_a.sent()).groupCollection;
                        // Cannot update:
                        delete updates.isPaused;
                        delete updates.createdAt;
                        return [4 /*yield*/, groupCollection.updateOne({ _id: id }, { $set: updates })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, TaskGroup.findById(id)];
                    case 3:
                        group = _a.sent();
                        realtime_1.default.emit(group._id + '', 'task_group:update', group);
                        return [2 /*return*/, group];
                }
            });
        });
    };
    TaskGroup.fromData = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var groupCollection, document, insertResult, group;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        groupCollection = (_a.sent()).groupCollection;
                        document = {
                            name: data.name,
                            isPaused: lodash_1.default.has(data, 'isPaused') ? data.isPaused : false,
                            createdAt: luxon_1.DateTime.utc().toJSDate()
                        };
                        return [4 /*yield*/, groupCollection.insertOne(document)];
                    case 2:
                        insertResult = _a.sent();
                        return [4 /*yield*/, TaskGroup.findById(insertResult.insertedId)];
                    case 3:
                        group = _a.sent();
                        if (group && group._id) {
                            realtime_1.default.emit(group._id + '', 'group:create', group);
                        }
                        return [2 /*return*/, group];
                }
            });
        });
    };
    TaskGroup.deleteById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, groupCollection, taskCollection, group, deleteResult;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        _a = _b.sent(), groupCollection = _a.groupCollection, taskCollection = _a.taskCollection;
                        return [4 /*yield*/, TaskGroup.findById(id)
                            // Delete tasks in group
                        ];
                    case 2:
                        group = _b.sent();
                        // Delete tasks in group
                        return [4 /*yield*/, taskCollection.deleteMany({ taskGroupId: id })
                            // Delete group
                        ];
                    case 3:
                        // Delete tasks in group
                        _b.sent();
                        return [4 /*yield*/, groupCollection.deleteOne({ '_id': id })];
                    case 4:
                        deleteResult = _b.sent();
                        if (group && group._id) {
                            realtime_1.default.emit(group._id + '', 'group:delete', group);
                        }
                        return [2 /*return*/, deleteResult];
                }
            });
        });
    };
    TaskGroup.retryById = function (id, remainingAttempts) {
        if (remainingAttempts === void 0) { remainingAttempts = 2; }
        return __awaiter(this, void 0, void 0, function () {
            var taskCollection, group;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        taskCollection = (_a.sent()).taskCollection;
                        return [4 /*yield*/, TaskGroup.findById(id)];
                    case 2:
                        group = _a.sent();
                        return [4 /*yield*/, taskCollection.updateMany({ remainingAttempts: { $lt: 1 }, isComplete: false, taskGroupId: id }, {
                                $set: {
                                    remainingAttempts: remainingAttempts
                                }
                            })];
                    case 3:
                        _a.sent();
                        realtime_1.default.emit(id + '', 'group:retry', null);
                        return [2 /*return*/, group];
                }
            });
        });
    };
    TaskGroup.resetById = function (id, remainingAttempts) {
        if (remainingAttempts === void 0) { remainingAttempts = 5; }
        return __awaiter(this, void 0, void 0, function () {
            var taskCollection, group, seedCount, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        taskCollection = (_a.sent()).taskCollection;
                        return [4 /*yield*/, TaskGroup.findById(id)];
                    case 2:
                        group = _a.sent();
                        return [4 /*yield*/, taskCollection.countDocuments({ taskGroupId: id, isSeed: true })
                            // If has seed tasks, delete all non-seed tasks
                        ];
                    case 3:
                        seedCount = _a.sent();
                        if (!(seedCount > 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, taskCollection.deleteMany({ taskGroupId: id, isSeed: false })];
                    case 4:
                        res = _a.sent();
                        _a.label = 5;
                    case 5: return [4 /*yield*/, taskCollection.updateMany({ taskGroupId: id }, {
                            $set: {
                                isComplete: false,
                                isPaused: group.isPaused,
                                parentsComplete: false,
                                errors: [],
                                output: null,
                                runAfter: null,
                                assignedTo: null,
                                assignedAt: null,
                                remainingAttempts: remainingAttempts
                            }
                        })];
                    case 6:
                        _a.sent();
                        realtime_1.default.emit(id + '', 'group:reset', null);
                        return [2 /*return*/, group];
                }
            });
        });
    };
    TaskGroup.syncPauseById = function (id, isPaused) {
        if (isPaused === void 0) { isPaused = true; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, groupCollection, taskCollection, group;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        _a = _b.sent(), groupCollection = _a.groupCollection, taskCollection = _a.taskCollection;
                        return [4 /*yield*/, TaskGroup.findById(id)
                            // Pause tasks
                        ];
                    case 2:
                        group = _b.sent();
                        // Pause tasks
                        return [4 /*yield*/, taskCollection.updateMany({ taskGroupId: id }, {
                                $set: {
                                    isPaused: isPaused,
                                }
                            })
                            // Pause task group
                        ];
                    case 3:
                        // Pause tasks
                        _b.sent();
                        // Pause task group
                        return [4 /*yield*/, groupCollection.updateOne({ _id: id }, { $set: { isPaused: isPaused } })];
                    case 4:
                        // Pause task group
                        _b.sent();
                        group.isPaused = isPaused;
                        realtime_1.default.emit(id + '', 'group:syncPause', { isPaused: isPaused });
                        return [2 /*return*/, group];
                }
            });
        });
    };
    TaskGroup.cleanExpired = function () {
        return __awaiter(this, void 0, void 0, function () {
            var groupCollection, expiredGroupIntervalInDays, threshold, oldGroups, deleted, _i, oldGroups_1, oldGroup;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        groupCollection = (_a.sent()).groupCollection;
                        expiredGroupIntervalInDays = parseInt(process.env.CREW_EXPIRED_GROUP_INTERVAL_IN_DAYS || '7');
                        threshold = luxon_1.DateTime.utc().minus({ days: expiredGroupIntervalInDays }).toJSDate();
                        return [4 /*yield*/, groupCollection.find({ createdAt: { $lt: threshold } }).toArray()];
                    case 2:
                        oldGroups = _a.sent();
                        deleted = [];
                        _i = 0, oldGroups_1 = oldGroups;
                        _a.label = 3;
                    case 3:
                        if (!(_i < oldGroups_1.length)) return [3 /*break*/, 7];
                        oldGroup = oldGroups_1[_i];
                        if (!oldGroup._id) return [3 /*break*/, 5];
                        return [4 /*yield*/, TaskGroup.deleteById(oldGroup._id)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        deleted.push(oldGroup);
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 3];
                    case 7: return [2 /*return*/, deleted];
                }
            });
        });
    };
    return TaskGroup;
}());
exports.TaskGroup = TaskGroup;
