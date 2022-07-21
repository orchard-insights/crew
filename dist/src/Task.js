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
var mongodb_1 = require("mongodb");
var lodash_1 = __importDefault(require("lodash"));
var luxon_1 = require("luxon");
var TaskGroup_1 = __importDefault(require("./TaskGroup"));
var realtime_1 = __importDefault(require("./realtime"));
var database_1 = __importDefault(require("./database"));
var CloudTasks_1 = require("./CloudTasks");
/**
 * @openapi
 * components:
 *   schemas:
 *     ReleaseTask:
 *       type: object
 *       properties:
 *         workerId:
 *           type: string
 *           description: The id of the worker releasing the task.  Must match the id of the worker that acquired the task.
 *         output:
 *           type: object
 *           description: Output data returned by the worker upon completing the task.
 *         error:
 *           type: object
 *           description: Error data.  Task will not get isComplete = true when present.
 *         workgroupDelayInSeconds:
 *           type: integer
 *           description: When present all tasks with the same workgroup will be paused for this many seconds.  Used to manage rate limits in 3rd party APIs.
 *         children:
 *           type: array
 *           items:
 *             type: object
 *             $ref: '#/components/schemas/TaskChild'
 *     TaskParentData:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Task id
 *         channel:
 *           type: string
 *         input:
 *           type: object
 *           description: Input data that the worker will need to complete the task.
 *         output:
 *           type: object
 *           description: Output data returned by the worker upon completing the task.
 *     CreateTask:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           required: true
 *         channel:
 *           type: string
 *           required: true
 *           description: Tasks of the same type will have the same channel.
 *         workgroup:
 *           type: string
 *           description: Use workgroups to manage tasks that may need to be paused together (to wait for rate limits).
 *         key:
 *           type: string
 *           description: A unique identifier for a task. Used to prevent duplicate tasks from being exectued more than once.
 *         remainingAttempts:
 *           type: integer
 *           default: 5
 *         isPaused:
 *           type: boolean
 *           description: When true, tasks in the group cannot be acquired by workers.
 *           default: false
 *         priority:
 *           type: integer
 *           description: Tasks with a higher priority get acquired before tasks with a lower priority.
 *           default: 0
 *         runAfter:
 *           type: integer
 *           description: Task cannot be acquired until this date and time has passed.
 *         progressWeight:
 *           type: integer
 *           description: Relative amount that this task contributes to the overall task group progress.
 *           default: 1
 *         isSeed:
 *           type: boolean
 *           description: When true, the task will not be removed when the task group is reset.  Seed tasks are usually responsible for creating child tasks.
 *           default: false
 *         errorDelayInSeconds:
 *           type: integer
 *           description: The task cannot be acquired for this many seconds after a failure.
 *           default: 30
 *         input:
 *           type: object
 *           description: Input data that the worker will need to complete the task.
 *         parentIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Ids of the task's parents.
 *     TaskChild:
 *       type: object
 *       properties:
 *         _child_id:
 *           type: string
 *           description: Unique pseudo-id for this child.  Will be re-assigned to a real _id by database upon creation.
 *         _parent_ids:
 *           type: array
 *           description: Pseudo-ids for the child's parents.  Used when returning a directed acyclic graph of child tasks.
 *           items:
 *             type: string
 *         name:
 *           type: string
 *           required: true
 *         channel:
 *           type: string
 *           required: true
 *           description: Tasks of the same type will have the same channel.
 *         workgroup:
 *           type: string
 *           description: Use workgroups to manage tasks that may need to be paused together (to wait for rate limits).
 *         key:
 *           type: string
 *           description: A unique identifier for a task. Used to prevent duplicate tasks from being exectued more than once.
 *         remainingAttempts:
 *           type: integer
 *           default: 5
 *         priority:
 *           type: integer
 *           description: Tasks with a higher priority get acquired before tasks with a lower priority.
 *           default: 0
 *         runAfter:
 *           type: integer
 *           description: Task cannot be acquired until this date and time has passed.
 *         progressWeight:
 *           type: integer
 *           description: Relative amount that this task contributes to the overall task group progress.
 *           default: 1
 *         errorDelayInSeconds:
 *           type: integer
 *           description: The task cannot be acquired for this many seconds after a failure.
 *           default: 30
 *         input:
 *           type: object
 *           description: Input data that the worker will need to complete the task.
 *     Task:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateTask'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             taskGroupId:
 *               type: string
 *               required: true
 *             parentsComplete:
 *               type: boolean
 *               description: When true, all parents of the task have been completed.
 *             isComplete:
 *               type: boolean
 *               description: When true, the task has been completed.
 *             output:
 *               type: object
 *               description: Output data returned by the worker upon completing the task.
 *             errors:
 *               type: array
 *               items:
 *                 type: object
 *               description: Error data recieved for each failed attempt.
 *             createdAt:
 *               type: string
 *             assignedTo:
 *               type: string
 *               description: Id of the worker that acquired this task. Workers self-report their own ids when acquiring.
 *             assignedAt:
 *               type: string
 *               description: The timestamp when the task was acquired.
 */
var Task = /** @class */ (function () {
    function Task(taskGroupId, name, channel, input, parentIds, isPaused, workgroup, key, remainingAttempts, priority, progressWeight, isSeed) {
        if (input === void 0) { input = null; }
        if (parentIds === void 0) { parentIds = []; }
        if (isPaused === void 0) { isPaused = false; }
        if (workgroup === void 0) { workgroup = null; }
        if (key === void 0) { key = null; }
        if (remainingAttempts === void 0) { remainingAttempts = 5; }
        if (priority === void 0) { priority = 0; }
        if (progressWeight === void 0) { progressWeight = 1; }
        if (isSeed === void 0) { isSeed = false; }
        this.taskGroupId = taskGroupId;
        this.name = name;
        this.channel = channel;
        this.workgroup = workgroup;
        this.key = key;
        this.remainingAttempts = remainingAttempts;
        this.isPaused = isPaused;
        this.parentsComplete = !(parentIds.length > 0);
        this.isComplete = false;
        this.priority = priority;
        this.runAfter = null;
        this.progressWeight = progressWeight;
        this.isSeed = isSeed;
        this.errorDelayInSeconds = 30;
        this.input = input;
        this.errors = [];
        this.output = null;
        this.createdAt = luxon_1.DateTime.utc().toJSDate();
        this.parentIds = parentIds;
        this.assignedTo = null;
        this.assignedAt = null;
    }
    Task.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var taskCollection, task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        taskCollection = (_a.sent()).taskCollection;
                        return [4 /*yield*/, taskCollection.findOne({ _id: id })];
                    case 2:
                        task = _a.sent();
                        return [2 /*return*/, task];
                }
            });
        });
    };
    Task.updateById = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var taskCollection, task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()
                        // Cannot update:
                    ];
                    case 1:
                        taskCollection = (_a.sent()).taskCollection;
                        // Cannot update:
                        delete updates.taskGroupId;
                        delete updates.isPaused;
                        delete updates.parentsComplete;
                        delete updates.isComplete;
                        delete updates.assignedTo;
                        delete updates.assignedAt;
                        delete updates.output;
                        delete updates.errors;
                        delete updates.createdAt;
                        if (lodash_1.default.has(updates, 'runAfter') && updates.runAfter) {
                            updates.runAfter = luxon_1.DateTime.fromISO(updates.runAfter).toJSDate();
                        }
                        return [4 /*yield*/, taskCollection.updateOne({ _id: id }, { $set: updates })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, Task.findById(id)];
                    case 3:
                        task = _a.sent();
                        realtime_1.default.emit(task.taskGroupId + '', 'task:update', task);
                        return [2 /*return*/, task];
                }
            });
        });
    };
    // limit less than 0 means return all
    Task.findAllInGroup = function (taskGroupId, limit, skip) {
        if (limit === void 0) { limit = -1; }
        if (skip === void 0) { skip = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var taskCollection, q, tasks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        taskCollection = (_a.sent()).taskCollection;
                        q = taskCollection.find({ taskGroupId: taskGroupId });
                        if (limit > 0) {
                            q.limit(limit);
                        }
                        return [4 /*yield*/, q.skip(skip).sort({ createdAt: -1 }).toArray()];
                    case 2:
                        tasks = _a.sent();
                        return [2 /*return*/, tasks];
                }
            });
        });
    };
    Task.findAllInChannel = function (limit, skip, channel) {
        if (limit === void 0) { limit = 50; }
        if (skip === void 0) { skip = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var taskCollection, tasks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        taskCollection = (_a.sent()).taskCollection;
                        return [4 /*yield*/, taskCollection.find({ channel: channel }).limit(limit).skip(skip).sort({ createdAt: -1 }).toArray()];
                    case 2:
                        tasks = _a.sent();
                        return [2 /*return*/, tasks];
                }
            });
        });
    };
    Task.getChannels = function () {
        return __awaiter(this, void 0, void 0, function () {
            var taskCollection, channels, channelStats, _i, channels_1, channel, totalCount, completedCount, assignedCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        taskCollection = (_a.sent()).taskCollection;
                        return [4 /*yield*/, taskCollection.distinct('channel')];
                    case 2:
                        channels = _a.sent();
                        channelStats = [];
                        _i = 0, channels_1 = channels;
                        _a.label = 3;
                    case 3:
                        if (!(_i < channels_1.length)) return [3 /*break*/, 8];
                        channel = channels_1[_i];
                        return [4 /*yield*/, taskCollection.count({ channel: channel })];
                    case 4:
                        totalCount = _a.sent();
                        return [4 /*yield*/, taskCollection.count({ channel: channel, isComplete: true })];
                    case 5:
                        completedCount = _a.sent();
                        return [4 /*yield*/, taskCollection.count({ channel: channel, assignedTo: { $ne: null } })];
                    case 6:
                        assignedCount = _a.sent();
                        channelStats.push({
                            name: channel,
                            totalCount: totalCount,
                            completedCount: completedCount,
                            assignedCount: assignedCount
                        });
                        _a.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 3];
                    case 8: return [2 /*return*/, channelStats];
                }
            });
        });
    };
    // Helper to create a task from a POST request
    Task.fromData = function (taskGroupId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var taskCollection, group, document, allParentsAreComplete, parentObjectIds, _i, _a, parentId, parentObjectId, parent_1, insertResult, task;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        taskCollection = (_b.sent()).taskCollection;
                        return [4 /*yield*/, TaskGroup_1.default.findById(taskGroupId)];
                    case 2:
                        group = _b.sent();
                        document = {
                            taskGroupId: taskGroupId,
                            name: data.name,
                            channel: data.channel,
                            workgroup: data.workgroup || null,
                            key: data.key || null,
                            remainingAttempts: data.remainingAttempts || 5,
                            isPaused: group.isPaused,
                            parentsComplete: false,
                            isComplete: false,
                            priority: data.priority || 0,
                            runAfter: data.runAfter ? luxon_1.DateTime.fromISO(data.runAfter).toJSDate() : null,
                            progressWeight: data.progressWeight || 1,
                            isSeed: data.isSeed || false,
                            errorDelayInSeconds: lodash_1.default.has(data, 'errorDelayInSeconds') ? data.errorDelayInSeconds : 30,
                            input: data.input || null,
                            errors: [],
                            output: null,
                            createdAt: luxon_1.DateTime.utc().toJSDate(),
                            parentIds: [],
                            assignedTo: null,
                            assignedAt: null
                        };
                        if (!data.parentIds) return [3 /*break*/, 7];
                        allParentsAreComplete = true;
                        parentObjectIds = [];
                        _i = 0, _a = data.parentIds;
                        _b.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        parentId = _a[_i];
                        parentObjectId = new mongodb_1.ObjectId(parentId);
                        parentObjectIds.push(parentObjectId);
                        return [4 /*yield*/, Task.findById(parentObjectId)];
                    case 4:
                        parent_1 = _b.sent();
                        if (!parent_1) {
                            throw new Error('Cannot create task with missing parent : ' + parentId);
                        }
                        if (!parent_1.isComplete) {
                            allParentsAreComplete = false;
                        }
                        _b.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        document.parentIds = parentObjectIds;
                        // Set parentsComplete based on check of each parent's current status
                        document.parentsComplete = allParentsAreComplete;
                        _b.label = 7;
                    case 7: return [4 /*yield*/, taskCollection.insertOne(document)];
                    case 8:
                        insertResult = _b.sent();
                        return [4 /*yield*/, Task.findById(insertResult.insertedId)];
                    case 9:
                        task = _b.sent();
                        realtime_1.default.emit(task.taskGroupId + '', 'task:create', task);
                        return [2 /*return*/, task];
                }
            });
        });
    };
    Task.findChildren = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var taskCollection, children;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        taskCollection = (_a.sent()).taskCollection;
                        return [4 /*yield*/, taskCollection.find({ parentIds: { $in: [id] } }).toArray()];
                    case 2:
                        children = _a.sent();
                        return [2 /*return*/, children];
                }
            });
        });
    };
    Task.findParents = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var task, parents, _i, _a, parentId, parent_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Task.findById(id)];
                    case 1:
                        task = _b.sent();
                        parents = [];
                        _i = 0, _a = task.parentIds;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        parentId = _a[_i];
                        return [4 /*yield*/, Task.findById(parentId)];
                    case 3:
                        parent_2 = _b.sent();
                        if (parent_2) {
                            parents.push(parent_2);
                        }
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, parents];
                }
            });
        });
    };
    Task.deleteById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var taskCollection, task, children, _i, children_1, child, deleteResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        taskCollection = (_a.sent()).taskCollection;
                        return [4 /*yield*/, Task.findById(id)
                            // Delete children
                        ];
                    case 2:
                        task = _a.sent();
                        return [4 /*yield*/, Task.findChildren(id)];
                    case 3:
                        children = _a.sent();
                        _i = 0, children_1 = children;
                        _a.label = 4;
                    case 4:
                        if (!(_i < children_1.length)) return [3 /*break*/, 7];
                        child = children_1[_i];
                        if (!child._id) return [3 /*break*/, 6];
                        return [4 /*yield*/, Task.deleteById(child._id)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 4];
                    case 7: return [4 /*yield*/, taskCollection.deleteOne({ '_id': id })];
                    case 8:
                        deleteResult = _a.sent();
                        realtime_1.default.emit(task.taskGroupId + '', 'task:delete', task);
                        return [2 /*return*/, deleteResult];
                }
            });
        });
    };
    // Resetting a task makes it look like it has never been run
    Task.resetById = function (id, remainingAttempts) {
        if (remainingAttempts === void 0) { remainingAttempts = 5; }
        return __awaiter(this, void 0, void 0, function () {
            var taskCollection, task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        taskCollection = (_a.sent()).taskCollection;
                        return [4 /*yield*/, taskCollection.updateOne({ _id: id }, {
                                $set: {
                                    isComplete: false,
                                    errors: [],
                                    output: null,
                                    runAfter: null,
                                    assignedTo: null,
                                    assignedAt: null,
                                    remainingAttempts: remainingAttempts
                                }
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, Task.findById(id)];
                    case 3:
                        task = _a.sent();
                        realtime_1.default.emit(task.taskGroupId + '', 'task:update', task);
                        return [2 /*return*/, task];
                }
            });
        });
    };
    Task.retryById = function (id, remainingAttempts) {
        if (remainingAttempts === void 0) { remainingAttempts = 2; }
        return __awaiter(this, void 0, void 0, function () {
            var taskCollection, task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        taskCollection = (_a.sent()).taskCollection;
                        return [4 /*yield*/, taskCollection.updateOne({ _id: id }, {
                                $set: {
                                    remainingAttempts: remainingAttempts
                                }
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, Task.findById(id)];
                    case 3:
                        task = _a.sent();
                        realtime_1.default.emit(task.taskGroupId + '', 'task:update', task);
                        return [2 /*return*/, task];
                }
            });
        });
    };
    // "Plucking" a task duplicates a the task into a new task group.
    // Useful for re-running a single task many times while debugging.
    Task.pluckById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var originalTask, group, newTaskData, task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Task.findById(id)];
                    case 1:
                        originalTask = _a.sent();
                        return [4 /*yield*/, TaskGroup_1.default.fromData({
                                name: 'Pluck Task ' + id,
                                isPaused: true
                            })];
                    case 2:
                        group = _a.sent();
                        if (!group || !group._id) {
                            throw new Error('Failed to create task group!');
                        }
                        newTaskData = lodash_1.default.omit(originalTask, [
                            'taskGroupId', 'createdAt', 'errors', 'output', 'remainingAttempts', 'isPaused', 'parentsComplete', 'isComplete', 'runAfter', 'parentIds', 'assignedTo', 'assignedAt'
                        ]);
                        return [4 /*yield*/, Task.fromData(group._id, newTaskData)
                            // Return group
                        ];
                    case 3:
                        task = _a.sent();
                        // Return group
                        return [2 /*return*/, task];
                }
            });
        });
    };
    Task.acquireInChannel = function (channel, workerId) {
        return __awaiter(this, void 0, void 0, function () {
            var taskCollection, now, assignedAt, assignResult, task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        taskCollection = (_a.sent()).taskCollection;
                        now = luxon_1.DateTime.utc().toJSDate();
                        assignedAt = now;
                        return [4 /*yield*/, taskCollection.findOneAndUpdate({
                                channel: channel,
                                isComplete: false,
                                isPaused: false,
                                remainingAttempts: { $gt: 0 },
                                assignedTo: null,
                                $and: [
                                    { $or: [
                                            { runAfter: { $lt: now } },
                                            { runAfter: null }
                                        ] },
                                    { $or: [
                                            { parentsComplete: true },
                                            { parentIds: { $size: 0 } }
                                        ] }
                                ]
                            }, { $set: { assignedTo: workerId, assignedAt: assignedAt } }, { sort: { priority: -1, createdAt: 1 } } // 1 = ascending, -1 = descending
                            )];
                    case 2:
                        assignResult = _a.sent();
                        if (!assignResult.value) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, Task.findById(assignResult.value._id)
                            // Mark tasks with same key and channel as also in progress
                        ];
                    case 3:
                        task = _a.sent();
                        if (!task.key) return [3 /*break*/, 5];
                        return [4 /*yield*/, taskCollection.updateMany({ isComplete: false, channel: task.channel, key: task.key }, {
                                $set: { assignedTo: workerId, assignedAt: assignedAt }
                            })];
                    case 4:
                        _a.sent();
                        realtime_1.default.emit(task.taskGroupId + '', 'task:acquire:key', {
                            channel: task.channel,
                            key: task.key,
                            update: {
                                assignedTo: workerId,
                                assignedAt: assignedAt
                            }
                        });
                        _a.label = 5;
                    case 5:
                        realtime_1.default.emit(task.taskGroupId + '', 'task:update', task);
                        return [2 /*return*/, task];
                }
            });
        });
    };
    Task.release = function (id, workerId, error, output, children, workgroupDelayInSeconds) {
        if (error === void 0) { error = null; }
        if (output === void 0) { output = null; }
        if (children === void 0) { children = []; }
        if (workgroupDelayInSeconds === void 0) { workgroupDelayInSeconds = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var taskCollection, task, update, runAfter, pending_2, _i, children_2, child, _a, pending_1, child, canCreate, parentRealIds, _loop_1, _b, _c, parentId, createData, childTask, lastPendingCount, _d, children_3, child, error_1, randTimeout_1, directChildren, _e, directChildren_1, child, runAfter, resultTask;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        taskCollection = (_f.sent()).taskCollection;
                        return [4 /*yield*/, Task.findById(id)];
                    case 2:
                        task = _f.sent();
                        if (!task) {
                            throw new Error('Unable to find task!');
                        }
                        if (task.isComplete) {
                            console.warn('~~ Received a call to release for a task that is already complete!');
                            return [2 /*return*/, task];
                        }
                        if (task.assignedTo != workerId) {
                            throw new Error('Worker id did not match!');
                        }
                        if (!error) return [3 /*break*/, 6];
                        update = {
                            assignedTo: null,
                            assignedAt: null,
                        };
                        runAfter = luxon_1.DateTime.utc().plus({ seconds: task.errorDelayInSeconds }).toJSDate();
                        if (task.errorDelayInSeconds) {
                            update.runAfter = runAfter;
                        }
                        return [4 /*yield*/, taskCollection.updateOne({ _id: id }, {
                                $set: update,
                                $inc: { remainingAttempts: -1 },
                                $push: { errors: error }
                            })
                            // release (with error) any incomplete tasks with same key in the same channel (duplication prevention)
                        ];
                    case 3:
                        _f.sent();
                        if (!task.key) return [3 /*break*/, 5];
                        return [4 /*yield*/, taskCollection.updateMany({ isComplete: false, channel: task.channel, key: task.key }, {
                                $set: update,
                                $inc: { remainingAttempts: -1 },
                                $push: { errors: error }
                            })];
                    case 4:
                        _f.sent();
                        realtime_1.default.emit(task.taskGroupId + '', 'task:release:key', {
                            channel: task.channel,
                            key: task.key,
                            update: {
                                assignedTo: null,
                                assignedAt: null,
                                error: error,
                                isComplete: false,
                                runAfter: runAfter,
                                remainingAttempts: task.remainingAttempts - 1
                            }
                        });
                        _f.label = 5;
                    case 5: return [3 /*break*/, 23];
                    case 6:
                        _f.trys.push([6, 13, , 15]);
                        if (!(children && children.length > 0)) return [3 /*break*/, 11];
                        pending_2 = [];
                        for (_i = 0, children_2 = children; _i < children_2.length; _i++) {
                            child = children_2[_i];
                            if (!child._id) {
                                pending_2.push(child);
                            }
                        }
                        _a = 0, pending_1 = pending_2;
                        _f.label = 7;
                    case 7:
                        if (!(_a < pending_1.length)) return [3 /*break*/, 10];
                        child = pending_1[_a];
                        canCreate = false;
                        if (child._id) {
                            // Skip children that have been created (this shouldn't happen unless we screw up the way that "pending" is populated)
                            return [3 /*break*/, 9];
                        }
                        // We can create children that are roots (no parent ids)
                        if (!child._parent_ids) {
                            // Override parent_ids with id of creator node (the node who's output we are processing)
                            child.parentIds = [id];
                            canCreate = true;
                        }
                        else {
                            parentRealIds = [];
                            _loop_1 = function (parentId) {
                                var found = lodash_1.default.find(children, function (c) { return c._child_id === parentId && lodash_1.default.has(c, '_id'); });
                                if (found && found._id) {
                                    parentRealIds.push(found._id);
                                }
                            };
                            for (_b = 0, _c = child._parent_ids; _b < _c.length; _b++) {
                                parentId = _c[_b];
                                _loop_1(parentId);
                            }
                            if (parentRealIds.length === child._parent_ids.length) {
                                child.parentIds = parentRealIds;
                                canCreate = true;
                            }
                        }
                        if (!canCreate) return [3 /*break*/, 9];
                        createData = lodash_1.default.cloneDeep(child);
                        delete createData._child_id;
                        delete createData._parent_ids;
                        return [4 /*yield*/, Task.fromData(task.taskGroupId, createData)];
                    case 8:
                        childTask = _f.sent();
                        child.taskGroupId = task.taskGroupId;
                        child._id = childTask._id;
                        _f.label = 9;
                    case 9:
                        _a++;
                        return [3 /*break*/, 7];
                    case 10:
                        lastPendingCount = pending_2.length;
                        pending_2 = [];
                        for (_d = 0, children_3 = children; _d < children_3.length; _d++) {
                            child = children_3[_d];
                            if (!child._id) {
                                pending_2.push(child);
                            }
                        }
                        if (lastPendingCount <= pending_2.length) {
                            throw Error("spawnChildren pending count did not decrease on iteration - something is wrong!");
                        }
                        _f.label = 11;
                    case 11: 
                    // Mark task as complete
                    return [4 /*yield*/, taskCollection.updateOne({ _id: id }, {
                            $set: {
                                assignedTo: null,
                                assignedAt: null,
                                output: output,
                                isComplete: true,
                                remainingAttempts: 0,
                                runAfter: null
                            }
                        })];
                    case 12:
                        // Mark task as complete
                        _f.sent();
                        return [3 /*break*/, 15];
                    case 13:
                        error_1 = _f.sent();
                        // Remove any created children
                        return [4 /*yield*/, taskCollection.deleteMany({ parentIds: { $in: [id] } })];
                    case 14:
                        // Remove any created children
                        _f.sent();
                        throw error_1;
                    case 15:
                        if (!task.key) return [3 /*break*/, 17];
                        return [4 /*yield*/, taskCollection.updateMany({ isComplete: false, channel: task.channel, key: task.key }, {
                                $set: {
                                    assignedTo: null,
                                    assignedAt: null,
                                    output: output,
                                    isComplete: true,
                                    runAfter: null,
                                    remainingAttempts: 0
                                }
                            })];
                    case 16:
                        _f.sent();
                        realtime_1.default.emit(task.taskGroupId + '', 'task:release:key', {
                            channel: task.channel,
                            key: task.key,
                            update: {
                                assignedTo: null,
                                assignedAt: null,
                                output: output,
                                isComplete: true,
                                runAfter: null,
                                remainingAttempts: 0
                            }
                        });
                        _f.label = 17;
                    case 17:
                        randTimeout_1 = Math.floor(Math.random() * 1000);
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, randTimeout_1); })];
                    case 18:
                        _f.sent();
                        return [4 /*yield*/, Task.findChildren(id)];
                    case 19:
                        directChildren = _f.sent();
                        _e = 0, directChildren_1 = directChildren;
                        _f.label = 20;
                    case 20:
                        if (!(_e < directChildren_1.length)) return [3 /*break*/, 23];
                        child = directChildren_1[_e];
                        return [4 /*yield*/, Task.syncParentsComplete(child)];
                    case 21:
                        _f.sent();
                        _f.label = 22;
                    case 22:
                        _e++;
                        return [3 /*break*/, 20];
                    case 23:
                        if (!(workgroupDelayInSeconds && task.workgroup)) return [3 /*break*/, 25];
                        runAfter = luxon_1.DateTime.utc().plus({ seconds: workgroupDelayInSeconds }).toJSDate();
                        return [4 /*yield*/, taskCollection.updateMany({ isComplete: false, workgroup: task.workgroup }, {
                                $set: {
                                    runAfter: runAfter
                                }
                            })];
                    case 24:
                        _f.sent();
                        realtime_1.default.emit(task.taskGroupId + '', 'workgroup:delay', {
                            workgroup: task.workgroup,
                            update: {
                                runAfter: runAfter
                            }
                        });
                        _f.label = 25;
                    case 25: return [4 /*yield*/, Task.findById(id)];
                    case 26:
                        resultTask = _f.sent();
                        realtime_1.default.emit(task.taskGroupId + '', 'task:update', resultTask);
                        return [2 /*return*/, resultTask];
                }
            });
        });
    };
    Task.syncParentsComplete = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var taskCollection, completedParentsCount, _i, _a, parentId, parent_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        taskCollection = (_b.sent()).taskCollection;
                        if (task.parentsComplete) {
                            return [2 /*return*/];
                        }
                        completedParentsCount = 0;
                        _i = 0, _a = task.parentIds;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        parentId = _a[_i];
                        return [4 /*yield*/, Task.findById(parentId)];
                    case 3:
                        parent_3 = _b.sent();
                        if (parent_3.isComplete) {
                            completedParentsCount++;
                        }
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        if (!(completedParentsCount === task.parentIds.length)) return [3 /*break*/, 7];
                        return [4 /*yield*/, taskCollection.updateOne({ _id: task._id }, { $set: {
                                    parentsComplete: true
                                } })];
                    case 6:
                        _b.sent();
                        task.parentsComplete = true;
                        realtime_1.default.emit(task.taskGroupId + '', 'task:update', task);
                        _b.label = 7;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    Task.getParentsData = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var parents, _i, _a, parentId, parent_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        parents = [];
                        _i = 0, _a = task.parentIds;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        parentId = _a[_i];
                        return [4 /*yield*/, Task.findById(parentId)];
                    case 2:
                        parent_4 = _b.sent();
                        if (parent_4) {
                            parents.push({
                                _id: parent_4._id,
                                channel: parent_4.channel,
                                input: parent_4.input,
                                output: parent_4.output
                            });
                        }
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, parents];
                }
            });
        });
    };
    Task.syncParents = function () {
        return __awaiter(this, void 0, void 0, function () {
            var taskCollection, updatedCount, tasks, _i, tasks_1, task, allParentsAreComplete, _a, _b, parentId, parent_5;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        taskCollection = (_c.sent()).taskCollection;
                        updatedCount = 0;
                        return [4 /*yield*/, taskCollection.find({
                                parentIds: { $exists: true, $not: { $size: 0 } },
                                isComplete: false,
                                parentsComplete: false,
                                remainingAttempts: { $gt: 0 }
                            }).toArray()];
                    case 2:
                        tasks = _c.sent();
                        _i = 0, tasks_1 = tasks;
                        _c.label = 3;
                    case 3:
                        if (!(_i < tasks_1.length)) return [3 /*break*/, 10];
                        task = tasks_1[_i];
                        allParentsAreComplete = true;
                        _a = 0, _b = task.parentIds;
                        _c.label = 4;
                    case 4:
                        if (!(_a < _b.length)) return [3 /*break*/, 7];
                        parentId = _b[_a];
                        return [4 /*yield*/, Task.findById(parentId)];
                    case 5:
                        parent_5 = _c.sent();
                        if (!parent_5.isComplete) {
                            allParentsAreComplete = false;
                            return [3 /*break*/, 7];
                        }
                        _c.label = 6;
                    case 6:
                        _a++;
                        return [3 /*break*/, 4];
                    case 7:
                        if (!allParentsAreComplete) return [3 /*break*/, 9];
                        return [4 /*yield*/, taskCollection.updateOne({ _id: task._id }, { $set: { parentsComplete: true } })];
                    case 8:
                        _c.sent();
                        updatedCount++;
                        _c.label = 9;
                    case 9:
                        _i++;
                        return [3 /*break*/, 3];
                    case 10: return [2 /*return*/, updatedCount];
                }
            });
        });
    };
    Task.operatorAcquire = function (id, workerId) {
        return __awaiter(this, void 0, void 0, function () {
            var taskCollection, now, assignedAt, assignedAtCutoff, assignResult, task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        taskCollection = (_a.sent()).taskCollection;
                        now = luxon_1.DateTime.utc().toJSDate();
                        assignedAt = now;
                        assignedAtCutoff = luxon_1.DateTime.utc().minus({ seconds: parseInt(process.env.CREW_ABANDONED_TASK_INTERVAL_IN_SECONDS || '60') }).toJSDate();
                        return [4 /*yield*/, taskCollection.findOneAndUpdate({
                                _id: id,
                                isComplete: false,
                                isPaused: false,
                                remainingAttempts: { $gt: 0 },
                                // Can acquire if
                                // assignedTo is null
                                //   AND runAfter is null OR has passed
                                //   AND parentsComplete is true or size 0
                                // OR
                                // assignedAt + CREW_ABANDONED_TASK_INTERVAL_IN_SECONDS seconds has passed (TODO refreshable lease based on assignedAt - if task exec can update own assignedAt?)
                                //   AND runAfter is null OR has passed
                                //   AND parentsComplete is true or size 0
                                $or: [
                                    { $and: [{
                                                assignedTo: null,
                                                $and: [
                                                    { $or: [
                                                            { runAfter: { $lt: now } },
                                                            { runAfter: null }
                                                        ] },
                                                    { $or: [
                                                            { parentsComplete: true },
                                                            { parentIds: { $size: 0 } }
                                                        ] }
                                                ]
                                            }] },
                                    { $and: [{
                                                assignedAt: { $lt: assignedAtCutoff },
                                                $and: [
                                                    { $or: [
                                                            { runAfter: { $lt: now } },
                                                            { runAfter: null }
                                                        ] },
                                                    { $or: [
                                                            { parentsComplete: true },
                                                            { parentIds: { $size: 0 } }
                                                        ] }
                                                ]
                                            }] }
                                ]
                            }, { $set: { assignedTo: workerId, assignedAt: assignedAt } }, { sort: { priority: -1, createdAt: 1 } } // 1 = ascending, -1 = descending
                            )];
                    case 2:
                        assignResult = _a.sent();
                        if (!assignResult.value) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, Task.findById(assignResult.value._id)
                            // Mark tasks with same key and channel as also in progress
                        ];
                    case 3:
                        task = _a.sent();
                        if (!task.key) return [3 /*break*/, 5];
                        return [4 /*yield*/, taskCollection.updateMany({ isComplete: false, channel: task.channel, key: task.key }, {
                                $set: { assignedTo: workerId, assignedAt: assignedAt }
                            })];
                    case 4:
                        _a.sent();
                        realtime_1.default.emit(task.taskGroupId + '', 'task:acquire:key', {
                            channel: task.channel,
                            key: task.key,
                            update: {
                                assignedTo: workerId,
                                assignedAt: assignedAt
                            }
                        });
                        _a.label = 5;
                    case 5:
                        realtime_1.default.emit(task.taskGroupId + '', 'task:update', task);
                        return [2 /*return*/, task];
                }
            });
        });
    };
    Task.examine = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var operatorCollection, task, messenger, runAfterHasPassed, examineDelay, now, operator;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.default)()];
                    case 1:
                        operatorCollection = (_a.sent()).operatorCollection;
                        return [4 /*yield*/, Task.findById(id)];
                    case 2:
                        task = _a.sent();
                        return [4 /*yield*/, (0, CloudTasks_1.getMessenger)()
                            // If task is
                            // not complete,
                            // not assigned,
                            // has remaining attempts,
                            // and has an operator for its channel
                            // then publish an event on the execute message bus.
                        ];
                    case 3:
                        messenger = _a.sent();
                        runAfterHasPassed = true;
                        examineDelay = 0;
                        if (task.runAfter) {
                            now = new Date();
                            if (now < task.runAfter) {
                                runAfterHasPassed = false;
                                // re-publish examine with a delay that is after runAfter
                                examineDelay = Math.ceil((task.runAfter.getTime() - now.getTime()) / 1000) + 1;
                            }
                        }
                        if (!(!task.isPaused && !task.isComplete && (task.parentsComplete || task.parentIds.length === 0) && task.remainingAttempts > 0 && runAfterHasPassed)) return [3 /*break*/, 7];
                        return [4 /*yield*/, operatorCollection.findOne({ channel: task.channel })];
                    case 4:
                        operator = _a.sent();
                        if (!operator) return [3 /*break*/, 6];
                        return [4 /*yield*/, messenger.publishExecuteTask(id.toString())];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        if (!examineDelay) return [3 /*break*/, 9];
                        return [4 /*yield*/, messenger.publishExamineTask(id.toString(), examineDelay)];
                    case 8:
                        _a.sent();
                        _a.label = 9;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    return Task;
}());
exports.default = Task;
//# sourceMappingURL=Task.js.map