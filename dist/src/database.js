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
var mongodb_memory_server_1 = require("mongodb-memory-server");
var mongodb_1 = require("mongodb");
var CloudTasks_1 = require("./CloudTasks");
var crewDb = null;
// Async init function is used to help mock mongodb for functional tests
function initDb() {
    return __awaiter(this, void 0, void 0, function () {
        var uri, mongod, client, db, collections, shouldCreateTaskGroupsCollection, shouldCreateTasksCollection, shouldCreateOperatorsCollection, _i, collections_1, collection, groupCollection, taskCollection, operatorCollection, tasksChangeStream, messenger, taskIndexes, _a, taskIndexes_1, index, idxExists;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (crewDb) {
                        return [2 /*return*/, crewDb];
                    }
                    uri = process.env.CREW_MONGO_URI || 'MEMORY' // mongodb://localhost:27017/?readPreference=primary&ssl=false'
                    ;
                    mongod = null;
                    if (!(uri === 'MEMORY')) return [3 /*break*/, 2];
                    return [4 /*yield*/, mongodb_memory_server_1.MongoMemoryServer.create()];
                case 1:
                    mongod = _b.sent();
                    // Initialize mongodb
                    uri = mongod.getUri();
                    _b.label = 2;
                case 2:
                    client = new mongodb_1.MongoClient(uri);
                    db = client.db(process.env.CREW_MONGO_DB || 'orchard-crew');
                    return [4 /*yield*/, client.connect()
                        // Ensure collections exist
                    ];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, db.listCollections().toArray()];
                case 4:
                    collections = _b.sent();
                    shouldCreateTaskGroupsCollection = true;
                    shouldCreateTasksCollection = true;
                    shouldCreateOperatorsCollection = true;
                    for (_i = 0, collections_1 = collections; _i < collections_1.length; _i++) {
                        collection = collections_1[_i];
                        if (collection.name == 'task_group') {
                            shouldCreateTaskGroupsCollection = false;
                        }
                        if (collection.name == 'task') {
                            shouldCreateTasksCollection = false;
                        }
                        if (collection.name == 'operator') {
                            shouldCreateOperatorsCollection = false;
                        }
                    }
                    if (!shouldCreateTaskGroupsCollection) return [3 /*break*/, 6];
                    console.log('~~ Creating Collection : task_group');
                    return [4 /*yield*/, db.createCollection('task_group')];
                case 5:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 6:
                    console.log('~~ Collection Exists : task_group');
                    _b.label = 7;
                case 7:
                    if (!shouldCreateTasksCollection) return [3 /*break*/, 9];
                    console.log('~~ Creating Collection : task');
                    return [4 /*yield*/, db.createCollection('task')];
                case 8:
                    _b.sent();
                    return [3 /*break*/, 10];
                case 9:
                    console.log('~~ Collection Exists : task');
                    _b.label = 10;
                case 10:
                    if (!shouldCreateOperatorsCollection) return [3 /*break*/, 12];
                    console.log('~~ Creating Collection : operator');
                    return [4 /*yield*/, db.createCollection('operator')];
                case 11:
                    _b.sent();
                    return [3 /*break*/, 13];
                case 12:
                    console.log('~~ Collection Exists : operator');
                    _b.label = 13;
                case 13:
                    groupCollection = db.collection('task_group');
                    taskCollection = db.collection('task');
                    operatorCollection = db.collection('operator');
                    tasksChangeStream = taskCollection.watch();
                    return [4 /*yield*/, (0, CloudTasks_1.getMessenger)()];
                case 14:
                    messenger = _b.sent();
                    tasksChangeStream.on('change', function (change) {
                        if (change.documentKey) {
                            if (change.operationType === 'update' || change.operationType === 'insert') {
                                // console.log('~~ Task Change', change.operationType, (change.documentKey as any)._id)
                                if (change.documentKey && change.documentKey._id) {
                                    messenger.publishExamineTask(change.documentKey._id, 0);
                                }
                            }
                        }
                    });
                    taskIndexes = [{
                            name: 'idxChannel',
                            fields: { channel: 1 }
                        },
                        {
                            name: 'idxIsComplete',
                            fields: { isComplete: 1 }
                        },
                        {
                            name: 'idxTaskGroupId',
                            fields: { taskGroupId: 1 }
                        },
                        {
                            name: 'idxKey',
                            fields: { key: 1 }
                        },
                        {
                            name: 'idxCreatedAt',
                            fields: { createdAt: 1 }
                        },
                        {
                            name: 'idxPriority',
                            fields: { priority: -1 }
                        },
                        {
                            name: 'idxAcquire',
                            fields: {
                                channel: 1,
                                isComplete: 1,
                                isPaused: 1,
                                remainingAttempts: 1,
                                assignedTo: 1,
                                runAfter: 1,
                                parentsComplete: 1,
                                parentIds: 1,
                                priority: -1,
                                createdAt: 1,
                            }
                        }
                    ];
                    _a = 0, taskIndexes_1 = taskIndexes;
                    _b.label = 15;
                case 15:
                    if (!(_a < taskIndexes_1.length)) return [3 /*break*/, 20];
                    index = taskIndexes_1[_a];
                    return [4 /*yield*/, taskCollection.indexExists(index.name)];
                case 16:
                    idxExists = _b.sent();
                    if (!!idxExists) return [3 /*break*/, 18];
                    console.log("~~ Creating Index : " + index.name);
                    return [4 /*yield*/, taskCollection.createIndex(index.fields, { name: index.name })];
                case 17:
                    _b.sent();
                    return [3 /*break*/, 19];
                case 18:
                    console.log("~~ Index Exists : " + index.name);
                    _b.label = 19;
                case 19:
                    _a++;
                    return [3 /*break*/, 15];
                case 20:
                    crewDb = {
                        client: client,
                        db: db,
                        groupCollection: groupCollection,
                        taskCollection: taskCollection,
                        operatorCollection: operatorCollection,
                        close: function () {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!mongod) return [3 /*break*/, 2];
                                            return [4 /*yield*/, mongod.stop()];
                                        case 1:
                                            _a.sent();
                                            _a.label = 2;
                                        case 2: return [4 /*yield*/, client.close()];
                                        case 3:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        }
                    };
                    return [2 /*return*/, crewDb];
            }
        });
    });
}
exports.default = initDb;
//# sourceMappingURL=database.js.map