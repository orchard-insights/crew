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
var Task_1 = __importDefault(require("./Task"));
var TaskGroup_1 = __importDefault(require("./TaskGroup"));
var realtime_1 = __importDefault(require("./realtime"));
var uniqid_1 = __importDefault(require("uniqid"));
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
// test('adds 1 + 2 to equal 3', () => {
//   expect(1 + 2).toBe(3)
// })
test('can create task group and task', function () { return __awaiter(void 0, void 0, void 0, function () {
    var group, task;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                realtime_1.default.emit = jest.fn();
                return [4 /*yield*/, TaskGroup_1.default.fromData({
                        name: 'Test Group'
                    })];
            case 1:
                group = _a.sent();
                expect(group._id).not.toBeNull();
                expect(group._id).not.toBeUndefined();
                if (!group._id) return [3 /*break*/, 3];
                return [4 /*yield*/, Task_1.default.fromData(group._id, {
                        name: 'You can do it',
                        channel: 'test_a'
                    })];
            case 2:
                task = _a.sent();
                expect(task._id).not.toBeNull();
                expect(task._id).not.toBeUndefined();
                _a.label = 3;
            case 3:
                expect(realtime_1.default.emit).toHaveBeenCalledTimes(2);
                return [2 /*return*/];
        }
    });
}); });
test('can update task', function () { return __awaiter(void 0, void 0, void 0, function () {
    var group, task, updated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                realtime_1.default.emit = jest.fn();
                return [4 /*yield*/, TaskGroup_1.default.fromData({
                        name: 'Test Group'
                    })];
            case 1:
                group = _a.sent();
                if (!group || !group._id) {
                    throw new Error('No group!');
                }
                return [4 /*yield*/, Task_1.default.fromData(group._id, {
                        name: 'Wrong task name',
                        channel: 'test_a'
                    })];
            case 2:
                task = _a.sent();
                if (!task || !task._id) {
                    throw new Error('No task!');
                }
                return [4 /*yield*/, Task_1.default.updateById(task._id, { name: 'Right task name' })];
            case 3:
                _a.sent();
                return [4 /*yield*/, Task_1.default.findById(task._id)];
            case 4:
                updated = _a.sent();
                if (!updated || !updated._id) {
                    throw new Error('No updated!');
                }
                expect(updated.name).toEqual('Right task name');
                return [2 /*return*/];
        }
    });
}); });
test('can acquire and complete task', function () { return __awaiter(void 0, void 0, void 0, function () {
    var group, task, workerId, acquired, completed;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                realtime_1.default.emit = jest.fn();
                return [4 /*yield*/, TaskGroup_1.default.fromData({
                        name: 'Test Group'
                    })];
            case 1:
                group = _a.sent();
                if (!group._id) {
                    throw new Error('No group id');
                }
                return [4 /*yield*/, Task_1.default.fromData(group._id, {
                        name: 'You can do it',
                        channel: 'test_a'
                    })];
            case 2:
                task = _a.sent();
                workerId = (0, uniqid_1.default)();
                return [4 /*yield*/, Task_1.default.acquireInChannel('test_a', workerId)];
            case 3:
                acquired = _a.sent();
                if (!acquired || !acquired._id) {
                    throw new Error('No acquired task!');
                }
                expect(acquired._id).toEqual(task._id);
                expect(acquired.assignedTo).toEqual(workerId);
                expect(acquired.assignedAt).not.toBeNull();
                return [4 /*yield*/, Task_1.default.release(acquired._id, workerId, null, { done: 'yes' })];
            case 4:
                completed = _a.sent();
                if (!completed || !completed._id) {
                    throw new Error('No completed task!');
                }
                expect(completed.isComplete).toBeTruthy();
                expect(completed.output.done).toEqual('yes');
                return [2 /*return*/];
        }
    });
}); });
test('new node is paused in paused group', function () { return __awaiter(void 0, void 0, void 0, function () {
    var group, task;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, TaskGroup_1.default.fromData({
                    name: 'Paused Group',
                    isPaused: true
                })];
            case 1:
                group = _a.sent();
                if (!group || !group._id) {
                    throw new Error('No group');
                }
                expect(group.isPaused).toBeTruthy();
                return [4 /*yield*/, Task_1.default.fromData(group._id, {
                        name: 'I should be paused too',
                        channel: 'test_a'
                    })];
            case 2:
                task = _a.sent();
                if (!task || !task._id) {
                    throw new Error('No task');
                }
                expect(task.isPaused).toBeTruthy();
                return [2 /*return*/];
        }
    });
}); });
test('can acquire and complete task with an error', function () { return __awaiter(void 0, void 0, void 0, function () {
    var group, task, workerId, acquired, errored, acquiredAfterError;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                realtime_1.default.emit = jest.fn();
                return [4 /*yield*/, TaskGroup_1.default.fromData({
                        name: 'Error Group'
                    })];
            case 1:
                group = _a.sent();
                if (!group || !group._id) {
                    throw new Error('No group id');
                }
                return [4 /*yield*/, Task_1.default.fromData(group._id, {
                        name: 'You can do it',
                        channel: 'test_a',
                        errorDelayInSeconds: 0
                    })];
            case 2:
                task = _a.sent();
                workerId = (0, uniqid_1.default)();
                return [4 /*yield*/, Task_1.default.acquireInChannel('test_a', workerId)];
            case 3:
                acquired = _a.sent();
                if (!acquired || !acquired._id) {
                    throw new Error('No acquired task!');
                }
                expect(acquired._id).toEqual(task._id);
                expect(acquired.assignedTo).toEqual(workerId);
                expect(acquired.assignedAt).not.toBeNull();
                return [4 /*yield*/, Task_1.default.release(acquired._id, workerId, { oops: 'I died' })];
            case 4:
                errored = _a.sent();
                if (!errored || !errored._id) {
                    throw new Error('No errored task!');
                }
                expect(errored.isComplete).toBeFalsy();
                expect(errored.remainingAttempts).toEqual(4);
                expect(errored.errors).toHaveLength(1);
                return [4 /*yield*/, Task_1.default.acquireInChannel('test_a', workerId)];
            case 5:
                acquiredAfterError = _a.sent();
                if (!acquiredAfterError || !acquiredAfterError._id) {
                    throw new Error('No acquiredAfterError task!');
                }
                expect(acquiredAfterError._id).toEqual(task._id);
                expect(acquiredAfterError.assignedTo).toEqual(workerId);
                expect(acquiredAfterError.assignedAt).not.toBeNull();
                return [2 /*return*/];
        }
    });
}); });
test('can reset task', function () { return __awaiter(void 0, void 0, void 0, function () {
    var group, completedTask, taskCollection, resetTask;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                realtime_1.default.emit = jest.fn();
                return [4 /*yield*/, TaskGroup_1.default.fromData({
                        name: 'Reset Group'
                    })];
            case 1:
                group = _a.sent();
                if (!group || !group._id) {
                    throw new Error('No group!');
                }
                return [4 /*yield*/, Task_1.default.fromData(group._id, {
                        name: 'I am the seed',
                        isSeed: true,
                        channel: 'completed'
                    })];
            case 2:
                completedTask = _a.sent();
                if (!completedTask || !completedTask._id) {
                    throw new Error('No completed task');
                }
                return [4 /*yield*/, (0, database_1.default)()];
            case 3:
                taskCollection = (_a.sent()).taskCollection;
                return [4 /*yield*/, taskCollection.updateOne({ _id: completedTask._id }, { $set: {
                            assignedTo: null,
                            assignedAt: null,
                            output: { done: 'yes' },
                            isComplete: true,
                            remainingAttempts: 0,
                            runAfter: null
                        } })];
            case 4:
                _a.sent();
                return [4 /*yield*/, Task_1.default.resetById(completedTask._id, 2)];
            case 5:
                _a.sent();
                return [4 /*yield*/, Task_1.default.findById(completedTask._id)];
            case 6:
                resetTask = _a.sent();
                expect(resetTask._id).toEqual(completedTask._id);
                expect(resetTask.isComplete).toBeFalsy();
                expect(resetTask.remainingAttempts).toEqual(2);
                return [2 /*return*/];
        }
    });
}); });
test('can retry task', function () { return __awaiter(void 0, void 0, void 0, function () {
    var group, failedTask, taskCollection, retriedTask;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                realtime_1.default.emit = jest.fn();
                return [4 /*yield*/, TaskGroup_1.default.fromData({
                        name: 'Retry Group'
                    })];
            case 1:
                group = _a.sent();
                if (!group || !group._id) {
                    throw new Error('No group!');
                }
                return [4 /*yield*/, Task_1.default.fromData(group._id, {
                        name: 'I need to be retried',
                        channel: 'retry'
                    })];
            case 2:
                failedTask = _a.sent();
                if (!failedTask || !failedTask._id) {
                    throw new Error('No completed task');
                }
                return [4 /*yield*/, (0, database_1.default)()];
            case 3:
                taskCollection = (_a.sent()).taskCollection;
                return [4 /*yield*/, taskCollection.updateOne({ _id: failedTask._id }, { $set: {
                            errors: [{ oops: 'I died' }],
                            remainingAttempts: 0,
                        } })];
            case 4:
                _a.sent();
                return [4 /*yield*/, Task_1.default.retryById(failedTask._id, 3)];
            case 5:
                _a.sent();
                return [4 /*yield*/, Task_1.default.findById(failedTask._id)];
            case 6:
                retriedTask = _a.sent();
                expect(retriedTask._id).toEqual(failedTask._id);
                expect(retriedTask.isComplete).toBeFalsy();
                expect(retriedTask.remainingAttempts).toEqual(3);
                return [2 /*return*/];
        }
    });
}); });
test('can complete with children', function () { return __awaiter(void 0, void 0, void 0, function () {
    var group, task, workerId, acquired, completed, tasks, acquiredChild, parents;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                realtime_1.default.emit = jest.fn();
                return [4 /*yield*/, TaskGroup_1.default.fromData({
                        name: 'Test Group'
                    })];
            case 1:
                group = _a.sent();
                if (!group._id) {
                    throw new Error('No group id');
                }
                return [4 /*yield*/, Task_1.default.fromData(group._id, {
                        name: 'You can do it',
                        channel: 'test_a'
                    })];
            case 2:
                task = _a.sent();
                workerId = (0, uniqid_1.default)();
                return [4 /*yield*/, Task_1.default.acquireInChannel('test_a', workerId)];
            case 3:
                acquired = _a.sent();
                if (!acquired || !acquired._id) {
                    throw new Error('No acquired task!');
                }
                expect(acquired._id).toEqual(task._id);
                expect(acquired.assignedTo).toEqual(workerId);
                expect(acquired.assignedAt).not.toBeNull();
                return [4 /*yield*/, Task_1.default.release(acquired._id, workerId, null, { done: 'yep!' }, [
                        {
                            _child_id: 0,
                            name: 'Continuation Child A',
                            channel: 'continuation',
                            input: { foo: 'bar ' }
                        },
                        {
                            _child_id: 1,
                            _parent_ids: [0],
                            name: 'Continuation Grandchild B',
                            channel: 'continuation',
                            input: { foo: 'baz ' }
                        }
                    ])];
            case 4:
                completed = _a.sent();
                if (!completed || !completed._id) {
                    throw new Error('No completed task!');
                }
                expect(completed.isComplete).toBeTruthy();
                expect(completed.output.done).toEqual('yep!');
                return [4 /*yield*/, Task_1.default.findAllInGroup(group._id)];
            case 5:
                tasks = _a.sent();
                expect(tasks).toHaveLength(3);
                return [4 /*yield*/, Task_1.default.acquireInChannel('continuation', workerId)];
            case 6:
                acquiredChild = _a.sent();
                if (!acquiredChild || !acquiredChild._id) {
                    throw new Error('No acquiredChild task!');
                }
                expect(acquiredChild.name).toEqual('Continuation Child A');
                return [4 /*yield*/, Task_1.default.getParentsData(acquiredChild)];
            case 7:
                parents = _a.sent();
                expect(parents).toHaveLength(1);
                expect(parents[0]._id).toEqual(acquired._id);
                expect(parents[0].output.done).toEqual('yep!');
                return [2 /*return*/];
        }
    });
}); });
/*
A, the seed node creates a continuation that forms a DAG diamond.
Task E should not be executed till C and D are completed

    A
    |
    B
   / \
  C   D
   \ /
    E
*/
test('can complete with dag children', function () { return __awaiter(void 0, void 0, void 0, function () {
    var group, task, workerId, acquired, completed, acquireB, acquireC, acquireD, acquireE, tasks, _i, tasks_1, task_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                realtime_1.default.emit = jest.fn();
                return [4 /*yield*/, TaskGroup_1.default.fromData({
                        name: 'DAG Group'
                    })];
            case 1:
                group = _a.sent();
                if (!group._id) {
                    throw new Error('No group id');
                }
                return [4 /*yield*/, Task_1.default.fromData(group._id, {
                        name: 'Task A',
                        isSeed: true,
                        channel: 'dag'
                    })];
            case 2:
                task = _a.sent();
                workerId = (0, uniqid_1.default)();
                return [4 /*yield*/, Task_1.default.acquireInChannel('dag', workerId)];
            case 3:
                acquired = _a.sent();
                if (!acquired || !acquired._id) {
                    throw new Error('No acquired task!');
                }
                return [4 /*yield*/, Task_1.default.release(acquired._id, workerId, null, { done: 'yep!' }, [
                        {
                            _child_id: 0,
                            name: 'Task B',
                            channel: 'dag',
                            input: { foo: 'bar ' }
                        },
                        {
                            _child_id: 1,
                            _parent_ids: [0],
                            name: 'Task C',
                            priority: 1,
                            channel: 'dag',
                            input: { foo: 'baz ' }
                        },
                        {
                            _child_id: 2,
                            _parent_ids: [0],
                            name: 'Task D',
                            priority: 0,
                            channel: 'dag',
                            input: { ding: 'dong' }
                        },
                        {
                            _child_id: 3,
                            _parent_ids: [1, 2],
                            name: 'Task E',
                            channel: 'dag',
                            input: { whoa: 'there' }
                        }
                    ])];
            case 4:
                completed = _a.sent();
                if (!completed || !completed._id) {
                    throw new Error('No completed task!');
                }
                return [4 /*yield*/, Task_1.default.acquireInChannel('dag', workerId)];
            case 5:
                acquireB = _a.sent();
                if (!acquireB || !acquireB._id) {
                    throw new Error('No acquireB');
                }
                expect(acquireB.name).toEqual('Task B');
                return [4 /*yield*/, Task_1.default.release(acquireB._id, workerId, null, { done: 'B' })];
            case 6:
                _a.sent();
                return [4 /*yield*/, Task_1.default.acquireInChannel('dag', workerId)];
            case 7:
                acquireC = _a.sent();
                if (!acquireC || !acquireC._id) {
                    throw new Error('No acquireC');
                }
                expect(acquireC.name).toEqual('Task C');
                return [4 /*yield*/, Task_1.default.release(acquireC._id, workerId, null, { done: 'C' })];
            case 8:
                _a.sent();
                return [4 /*yield*/, Task_1.default.acquireInChannel('dag', workerId)];
            case 9:
                acquireD = _a.sent();
                if (!acquireD || !acquireD._id) {
                    throw new Error('No acquireD');
                }
                expect(acquireD.name).toEqual('Task D');
                return [4 /*yield*/, Task_1.default.release(acquireD._id, workerId, null, { done: 'D' })];
            case 10:
                _a.sent();
                return [4 /*yield*/, Task_1.default.acquireInChannel('dag', workerId)];
            case 11:
                acquireE = _a.sent();
                if (!acquireE || !acquireE._id) {
                    throw new Error('No acquireE');
                }
                expect(acquireE.name).toEqual('Task E');
                return [4 /*yield*/, Task_1.default.release(acquireE._id, workerId, null, { done: 'E' })];
            case 12:
                _a.sent();
                return [4 /*yield*/, Task_1.default.findAllInGroup(group._id)];
            case 13:
                tasks = _a.sent();
                expect(tasks).toHaveLength(5);
                for (_i = 0, tasks_1 = tasks; _i < tasks_1.length; _i++) {
                    task_1 = tasks_1[_i];
                    expect(task_1.isComplete).toBeTruthy();
                }
                return [2 /*return*/];
        }
    });
}); });
test('can complete task with workgroup delay', function () { return __awaiter(void 0, void 0, void 0, function () {
    var group, task, taskA, taskB, workerId, acquired, timestamp, taskADelayed, taskBDelayed;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                realtime_1.default.emit = jest.fn();
                return [4 /*yield*/, TaskGroup_1.default.fromData({
                        name: 'Test Group'
                    })];
            case 1:
                group = _c.sent();
                if (!group._id) {
                    throw new Error('No group id');
                }
                return [4 /*yield*/, Task_1.default.fromData(group._id, {
                        name: 'Over the limit',
                        workgroup: 'rateLimitMe',
                        channel: 'test_a'
                    })];
            case 2:
                task = _c.sent();
                return [4 /*yield*/, Task_1.default.fromData(group._id, {
                        name: 'In Workgroup A',
                        workgroup: 'rateLimitMe',
                        channel: 'test_a'
                    })];
            case 3:
                taskA = _c.sent();
                return [4 /*yield*/, Task_1.default.fromData(group._id, {
                        name: 'In Workgroup B',
                        workgroup: 'rateLimitMe',
                        channel: 'test_b'
                    })];
            case 4:
                taskB = _c.sent();
                workerId = (0, uniqid_1.default)();
                return [4 /*yield*/, Task_1.default.acquireInChannel('test_a', workerId)];
            case 5:
                acquired = _c.sent();
                if (!acquired || !acquired._id) {
                    throw new Error('No acquired task!');
                }
                if (!taskA || !taskA._id) {
                    throw new Error('No taskA task!');
                }
                if (!taskB || !taskB._id) {
                    throw new Error('No taskB task!');
                }
                timestamp = new Date().getTime();
                return [4 /*yield*/, Task_1.default.release(acquired._id, workerId, null, { delay: 'me' }, [], 35)];
            case 6:
                _c.sent();
                return [4 /*yield*/, Task_1.default.findById(taskA._id)];
            case 7:
                taskADelayed = _c.sent();
                return [4 /*yield*/, Task_1.default.findById(taskB._id)];
            case 8:
                taskBDelayed = _c.sent();
                if (!taskADelayed || !taskADelayed._id) {
                    throw new Error('No taskADelayed task!');
                }
                if (!taskBDelayed || !taskBDelayed._id) {
                    throw new Error('No taskBDelayed task!');
                }
                expect(taskADelayed.runAfter).toBeDefined();
                expect(taskBDelayed.runAfter).toBeDefined();
                expect((_a = taskADelayed.runAfter) === null || _a === void 0 ? void 0 : _a.getTime()).toBeGreaterThan(timestamp);
                expect((_b = taskBDelayed.runAfter) === null || _b === void 0 ? void 0 : _b.getTime()).toBeGreaterThan(timestamp);
                return [2 /*return*/];
        }
    });
}); });
test('sync parents complete', function () { return __awaiter(void 0, void 0, void 0, function () {
    var group, taskA, taskCollection, taskB, count, refreshTaskB;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                realtime_1.default.emit = jest.fn();
                return [4 /*yield*/, TaskGroup_1.default.fromData({
                        name: 'Out of Sync Parents Group'
                    })];
            case 1:
                group = _a.sent();
                if (!group._id) {
                    throw new Error('No group id');
                }
                return [4 /*yield*/, Task_1.default.fromData(group._id, {
                        name: 'Task A',
                        isSeed: true,
                        channel: 'dag'
                    })];
            case 2:
                taskA = _a.sent();
                if (!taskA._id) {
                    throw new Error('No taskA id');
                }
                return [4 /*yield*/, (0, database_1.default)()];
            case 3:
                taskCollection = (_a.sent()).taskCollection;
                return [4 /*yield*/, taskCollection.updateOne({ _id: taskA._id }, { $set: {
                            assignedTo: null,
                            assignedAt: null,
                            output: { done: 'yes' },
                            isComplete: true,
                            remainingAttempts: 0,
                            runAfter: null
                        } })];
            case 4:
                _a.sent();
                return [4 /*yield*/, Task_1.default.fromData(group._id, {
                        name: 'Task A',
                        isSeed: true,
                        channel: 'dag',
                        parentIds: [taskA._id + '']
                    })];
            case 5:
                taskB = _a.sent();
                if (!taskB._id) {
                    throw new Error('No taskB id');
                }
                return [4 /*yield*/, taskCollection.updateOne({ _id: taskB._id }, { $set: {
                            parentsComplete: false
                        } })];
            case 6:
                _a.sent();
                return [4 /*yield*/, Task_1.default.syncParents()];
            case 7:
                count = _a.sent();
                expect(count).toEqual(1);
                return [4 /*yield*/, Task_1.default.findById(taskB._id)];
            case 8:
                refreshTaskB = _a.sent();
                if (!refreshTaskB._id) {
                    throw new Error('No refreshTaskB id');
                }
                expect(refreshTaskB.parentsComplete).toBeTruthy();
                return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=task.test.js.map