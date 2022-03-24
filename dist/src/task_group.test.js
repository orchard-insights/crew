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
jest.mock('./database');
jest.mock('./realtime');
var database_1 = __importDefault(require("./database"));
var Task_1 = require("./Task");
var TaskGroup_1 = require("./TaskGroup");
var realtime_1 = __importDefault(require("./realtime"));
beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, groupCollection, taskCollection;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, database_1.default)()];
            case 1:
                _a = _b.sent(), groupCollection = _a.groupCollection, taskCollection = _a.taskCollection;
                return [4 /*yield*/, groupCollection.deleteMany({})];
            case 2:
                _b.sent();
                return [4 /*yield*/, taskCollection.deleteMany({})];
            case 3:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); });
afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, client, close;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, database_1.default)()];
            case 1:
                _a = _b.sent(), client = _a.client, close = _a.close;
                return [4 /*yield*/, client.close()];
            case 2:
                _b.sent();
                return [4 /*yield*/, close()];
            case 3:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); });
test('can update group', function () { return __awaiter(void 0, void 0, void 0, function () {
    var group, updated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                realtime_1.default.emit = jest.fn();
                return [4 /*yield*/, TaskGroup_1.TaskGroup.fromData({
                        name: 'Wrong Name'
                    })];
            case 1:
                group = _a.sent();
                if (!group || !group._id) {
                    throw new Error('No group!');
                }
                return [4 /*yield*/, TaskGroup_1.TaskGroup.updateById(group._id, { name: 'Right Name' })];
            case 2:
                _a.sent();
                return [4 /*yield*/, TaskGroup_1.TaskGroup.findById(group._id)];
            case 3:
                updated = _a.sent();
                if (!updated || !updated._id) {
                    throw new Error('No updated!');
                }
                expect(updated.name).toEqual('Right Name');
                return [2 /*return*/];
        }
    });
}); });
test('can pause and unpause group', function () { return __awaiter(void 0, void 0, void 0, function () {
    var group, paused, pausedTasks, _i, pausedTasks_1, task, unpaused, unpausedTasks, _a, unpausedTasks_1, task;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                realtime_1.default.emit = jest.fn();
                return [4 /*yield*/, TaskGroup_1.TaskGroup.fromData({
                        name: 'Test Group'
                    })];
            case 1:
                group = _b.sent();
                if (!group || !group._id) {
                    throw new Error('No group!');
                }
                expect(group.isPaused).toBeFalsy();
                return [4 /*yield*/, Task_1.Task.fromData(group._id, {
                        name: 'I am not paused',
                        channel: 'test_a'
                    })];
            case 2:
                _b.sent();
                return [4 /*yield*/, Task_1.Task.fromData(group._id, {
                        name: 'Neither am I',
                        channel: 'test_a'
                    })];
            case 3:
                _b.sent();
                return [4 /*yield*/, TaskGroup_1.TaskGroup.syncPauseById(group._id, true)];
            case 4:
                paused = _b.sent();
                if (!paused || !paused._id) {
                    throw new Error('No paused!');
                }
                expect(paused.isPaused).toBeTruthy();
                return [4 /*yield*/, Task_1.Task.findAllInGroup(paused._id)];
            case 5:
                pausedTasks = _b.sent();
                expect(pausedTasks).toHaveLength(2);
                for (_i = 0, pausedTasks_1 = pausedTasks; _i < pausedTasks_1.length; _i++) {
                    task = pausedTasks_1[_i];
                    expect(task.isPaused).toBeTruthy();
                }
                return [4 /*yield*/, TaskGroup_1.TaskGroup.syncPauseById(group._id, false)];
            case 6:
                unpaused = _b.sent();
                if (!unpaused || !unpaused._id) {
                    throw new Error('No unpaused!');
                }
                expect(unpaused.isPaused).toBeFalsy();
                return [4 /*yield*/, Task_1.Task.findAllInGroup(unpaused._id)];
            case 7:
                unpausedTasks = _b.sent();
                expect(unpausedTasks).toHaveLength(2);
                for (_a = 0, unpausedTasks_1 = unpausedTasks; _a < unpausedTasks_1.length; _a++) {
                    task = unpausedTasks_1[_a];
                    expect(task.isPaused).toBeFalsy();
                }
                return [2 /*return*/];
        }
    });
}); });
test('can reset group - no seed', function () { return __awaiter(void 0, void 0, void 0, function () {
    var group, completedTask, taskCollection, resetTasks, _i, resetTasks_1, task;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                realtime_1.default.emit = jest.fn();
                return [4 /*yield*/, TaskGroup_1.TaskGroup.fromData({
                        name: 'Reset Group'
                    })];
            case 1:
                group = _a.sent();
                if (!group || !group._id) {
                    throw new Error('No group!');
                }
                return [4 /*yield*/, Task_1.Task.fromData(group._id, {
                        name: 'I am completed',
                        channel: 'completed'
                    })];
            case 2:
                completedTask = _a.sent();
                if (!completedTask || !completedTask._id) {
                    throw new Error('No completed task');
                }
                return [4 /*yield*/, Task_1.Task.fromData(group._id, {
                        name: 'I am not completed',
                        channel: 'not_completed'
                    })];
            case 3:
                _a.sent();
                return [4 /*yield*/, (0, database_1.default)()];
            case 4:
                taskCollection = (_a.sent()).taskCollection;
                return [4 /*yield*/, taskCollection.updateOne({ _id: completedTask._id }, { $set: {
                            assignedTo: null,
                            assignedAt: null,
                            output: { done: 'yes' },
                            isComplete: true,
                            remainingAttempts: 0,
                            runAfter: null
                        } })];
            case 5:
                _a.sent();
                return [4 /*yield*/, TaskGroup_1.TaskGroup.resetById(group._id, 2)];
            case 6:
                _a.sent();
                return [4 /*yield*/, Task_1.Task.findAllInGroup(group._id)];
            case 7:
                resetTasks = _a.sent();
                expect(resetTasks).toHaveLength(2);
                for (_i = 0, resetTasks_1 = resetTasks; _i < resetTasks_1.length; _i++) {
                    task = resetTasks_1[_i];
                    expect(task.isComplete).toBeFalsy();
                    expect(task.remainingAttempts).toEqual(2);
                }
                return [2 /*return*/];
        }
    });
}); });
test('can reset group - with seed', function () { return __awaiter(void 0, void 0, void 0, function () {
    var group, completedTask, taskCollection, resetTasks;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                realtime_1.default.emit = jest.fn();
                return [4 /*yield*/, TaskGroup_1.TaskGroup.fromData({
                        name: 'Reset Group'
                    })];
            case 1:
                group = _a.sent();
                if (!group || !group._id) {
                    throw new Error('No group!');
                }
                return [4 /*yield*/, Task_1.Task.fromData(group._id, {
                        name: 'I am the seed',
                        isSeed: true,
                        channel: 'completed'
                    })];
            case 2:
                completedTask = _a.sent();
                if (!completedTask || !completedTask._id) {
                    throw new Error('No completed task');
                }
                return [4 /*yield*/, Task_1.Task.fromData(group._id, {
                        name: 'I am not completed nor a seed',
                        channel: 'not_completed'
                    })];
            case 3:
                _a.sent();
                return [4 /*yield*/, (0, database_1.default)()];
            case 4:
                taskCollection = (_a.sent()).taskCollection;
                return [4 /*yield*/, taskCollection.updateOne({ _id: completedTask._id }, { $set: {
                            assignedTo: null,
                            assignedAt: null,
                            output: { done: 'yes' },
                            isComplete: true,
                            remainingAttempts: 0,
                            runAfter: null
                        } })];
            case 5:
                _a.sent();
                return [4 /*yield*/, TaskGroup_1.TaskGroup.resetById(group._id, 2)];
            case 6:
                _a.sent();
                return [4 /*yield*/, Task_1.Task.findAllInGroup(group._id)];
            case 7:
                resetTasks = _a.sent();
                expect(resetTasks).toHaveLength(1);
                expect(resetTasks[0]._id).toEqual(completedTask._id);
                expect(resetTasks[0].isComplete).toBeFalsy();
                expect(resetTasks[0].remainingAttempts).toEqual(2);
                return [2 /*return*/];
        }
    });
}); });
test('can retry group', function () { return __awaiter(void 0, void 0, void 0, function () {
    var group, completedTask, incompleteTask, taskCollection, completedTasks, incompletedTasks;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                realtime_1.default.emit = jest.fn();
                return [4 /*yield*/, TaskGroup_1.TaskGroup.fromData({
                        name: 'Retry Group'
                    })];
            case 1:
                group = _a.sent();
                if (!group || !group._id) {
                    throw new Error('No group!');
                }
                return [4 /*yield*/, Task_1.Task.fromData(group._id, {
                        name: 'I am the seed',
                        channel: 'completed'
                    })];
            case 2:
                completedTask = _a.sent();
                if (!completedTask || !completedTask._id) {
                    throw new Error('No completed task');
                }
                return [4 /*yield*/, Task_1.Task.fromData(group._id, {
                        name: 'I am not completed',
                        channel: 'not_completed'
                    })];
            case 3:
                incompleteTask = _a.sent();
                if (!incompleteTask || !incompleteTask) {
                    throw new Error('No incomplete task');
                }
                return [4 /*yield*/, (0, database_1.default)()];
            case 4:
                taskCollection = (_a.sent()).taskCollection;
                return [4 /*yield*/, taskCollection.updateOne({ _id: completedTask._id }, { $set: {
                            assignedTo: null,
                            assignedAt: null,
                            output: { done: 'yes' },
                            isComplete: true,
                            remainingAttempts: 0,
                            runAfter: null
                        } })];
            case 5:
                _a.sent();
                return [4 /*yield*/, taskCollection.updateOne({ _id: incompleteTask._id }, { $set: {
                            remainingAttempts: 0,
                        } })];
            case 6:
                _a.sent();
                return [4 /*yield*/, TaskGroup_1.TaskGroup.retryById(group._id, 2)];
            case 7:
                _a.sent();
                return [4 /*yield*/, taskCollection.find({ taskGroupId: group._id, isComplete: true }).toArray()];
            case 8:
                completedTasks = _a.sent();
                return [4 /*yield*/, taskCollection.find({ taskGroupId: group._id, isComplete: false }).toArray()];
            case 9:
                incompletedTasks = _a.sent();
                expect(completedTasks).toHaveLength(1);
                expect(incompletedTasks).toHaveLength(1);
                expect(completedTasks[0].isComplete).toBeTruthy();
                expect(incompletedTasks[0].isComplete).toBeFalsy();
                expect(incompletedTasks[0].remainingAttempts).toEqual(2);
                return [2 /*return*/];
        }
    });
}); });
