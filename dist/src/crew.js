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
exports.WorkerServer = exports.TaskError = exports.HttpWorkerGroup = exports.WorkerGroup = exports.HttpWorker = exports.Worker = exports.Task = exports.TaskGroup = exports.crew = void 0;
var express_1 = __importDefault(require("express"));
var terminus_1 = __importDefault(require("@godaddy/terminus"));
var mongodb_1 = require("mongodb");
var database_1 = __importDefault(require("./database"));
var TaskGroup_1 = __importDefault(require("./TaskGroup"));
exports.TaskGroup = TaskGroup_1.default;
var Task_1 = __importDefault(require("./Task"));
exports.Task = Task_1.default;
var Worker_1 = __importDefault(require("./Worker"));
exports.Worker = Worker_1.default;
var HttpWorker_1 = __importDefault(require("./HttpWorker"));
exports.HttpWorker = HttpWorker_1.default;
var WorkerGroup_1 = __importDefault(require("./WorkerGroup"));
exports.WorkerGroup = WorkerGroup_1.default;
var HttpWorkerGroup_1 = __importDefault(require("./HttpWorkerGroup"));
exports.HttpWorkerGroup = HttpWorkerGroup_1.default;
var WorkerServer_1 = __importDefault(require("./WorkerServer"));
exports.WorkerServer = WorkerServer_1.default;
var TaskError_1 = __importDefault(require("./TaskError"));
exports.TaskError = TaskError_1.default;
var node_cron_1 = __importDefault(require("node-cron"));
var socket_io_1 = require("socket.io");
var cors_1 = __importDefault(require("cors"));
var swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
var swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
var path_1 = __importDefault(require("path"));
var realtime_1 = __importDefault(require("./realtime"));
var Operator_1 = __importDefault(require("./Operator"));
function crew(options) {
    var _this = this;
    var _a;
    // Crew uses its own router
    var router = express_1.default.Router();
    router.use((0, cors_1.default)());
    router.use(express_1.default.json({ limit: '10MB' }));
    var swaggerSpec = (0, swagger_jsdoc_1.default)({
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Crew API',
                version: '1.0.0',
            },
        },
        apis: [
            // dev
            path_1.default.resolve(__dirname, '*.ts'),
            // release
            path_1.default.resolve(__dirname, '../../src/*.ts')
        ]
    });
    router.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
    // Create websocket server if one wasn't provided
    if (!options.io) {
        var io = new socket_io_1.Server(options.server, {
            cors: {
                origin: '*',
                methods: ["GET", "POST"]
            }
        });
        options.io = io;
        realtime_1.default.io = io;
    }
    else {
        realtime_1.default.io = options.io;
    }
    (_a = options.io) === null || _a === void 0 ? void 0 : _a.on('connection', function (socket) {
        socket.on('watchTaskGroup', function (msg) { return __awaiter(_this, void 0, void 0, function () {
            var socketAuthenticated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        socketAuthenticated = false;
                        if (!options.authenticateSocket) return [3 /*break*/, 2];
                        return [4 /*yield*/, options.authenticateSocket(socket, msg)];
                    case 1:
                        socketAuthenticated = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        socketAuthenticated = true;
                        _a.label = 3;
                    case 3:
                        if (socketAuthenticated) {
                            socket.join(msg.taskGroupId);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        socket.on('unwatchTaskGroup', function (msg) {
            socket.leave(msg.taskGroupId);
        });
        // socket.on('disconnect', () => {    
        //   console.log('socket disconnected')
        // })
    });
    // Keep track of mongo connection status (for healthcheck)
    var databaseConnected = false;
    // This function helps return nice error messages for all our async route handlers
    function unhandledExceptionsHandler(asyncFunction) {
        var _this = this;
        return function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, asyncFunction(req, res)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error(error_1);
                        if (error_1 instanceof Error) {
                            res.status(500).json({ message: error_1.message });
                        }
                        else {
                            res.status(500).json({ message: error_1 + '' });
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
    }
    function authorizeCloudTaskEndpoint(req, res, next) {
        if (req.query.accessToken = process.env.CREW_CLOUD_TASK_ACCESS_TOKEN || '') {
            return next();
        }
        return res.status(401).send({ error: 'Access token is invalid!' });
    }
    var client = null;
    // Connect to mongdb and then setup the routes
    (0, database_1.default)().then(function (database) {
        databaseConnected = true;
        client = database.client;
        // Watch for database connection loss
        database.client.on('close', function () {
            databaseConnected = false;
            console.log('Database connection closed!');
        });
        database.client.on('topologyClosed', function () {
            databaseConnected = false;
            console.log('Database connection closed!');
        });
        // Bootstrap operators (also done in cron below)
        Operator_1.default.bootstrapAll().then(function () {
            console.log("~~ bootstraped operators");
        });
        // Home
        router.get('/', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!req.originalUrl.endsWith('/')) {
                    return [2 /*return*/, res.redirect(req.originalUrl + '/')];
                }
                res.send("<html><body>Hi!  I'm Crew.  You'll need to use my <a href=\"./api-docs\">API</a> or my UI to see what is going on.</body></html>");
                return [2 /*return*/];
            });
        }); }));
        /**
         * @openapi
         * /healthz:
         *   get:
         *     description: Check if the crew API server is healthy.
         *     tags:
         *       - devops
         *     responses:
         *       200:
         *         description: Health check result.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 healthy:
         *                   type: boolean
         */
        router.get('/healthz', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, database.client.db().admin().listDatabases()];
                    case 1:
                        _a.sent();
                        if (!databaseConnected) {
                            res.status(500);
                        }
                        res.json({ healthy: databaseConnected });
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task_groups:
         *   get:
         *     description: Retrieve a list of task groups.
         *     tags:
         *       - task_group
         *     parameters:
         *       - in: query
         *         name: limit
         *         required: false
         *         description: Maximum number of task groups to retrieve.
         *         default: 50
         *         schema:
         *           type: integer
         *       - in: query
         *         name: skip
         *         required: false
         *         description: How many task groups to skip.
         *         default: 0
         *         schema:
         *           type: integer
         *     responses:
         *       200:
         *         description: An array of task groups.
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 type: object
         *                 $ref: '#/components/schemas/TaskGroup'
         */
        router.get('/api/v1/task_groups', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var limit, skip, groups;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        limit = parseInt(req.query.limit || '50');
                        skip = parseInt(req.query.skip || '0');
                        return [4 /*yield*/, TaskGroup_1.default.findAll(limit, skip)];
                    case 1:
                        groups = _a.sent();
                        res.json(groups);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task_groups/count:
         *   get:
         *     description: Retrieve the total count of task groups.
         *     tags:
         *       - task_group
         *     responses:
         *       200:
         *         description: The total count of task groups.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 count:
         *                   type: integer
         */
        router.get('/api/v1/task_groups/count', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var count;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, TaskGroup_1.default.countAll()];
                    case 1:
                        count = _a.sent();
                        res.json({ count: count });
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task_group/{id}:
         *   get:
         *     description: Retrieve a single task group.
         *     tags:
         *       - task_group
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the task group to retrieve.
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: A task group.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/TaskGroup'
         */
        router.get('/api/v1/task_group/:id', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var group;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, TaskGroup_1.default.findById(new mongodb_1.ObjectId(req.params.id))];
                    case 1:
                        group = _a.sent();
                        if (group) {
                            res.json(group);
                        }
                        else {
                            res.status(404).json({ message: "TaskGroup with id " + req.params.id + " not found!" });
                        }
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task/{id}:
         *   get:
         *     description: Retrieve a single task.
         *     tags:
         *       - task
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the task to retrieve.
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: A task.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/Task'
         */
        router.get('/api/v1/task/:id', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Task_1.default.findById(new mongodb_1.ObjectId(req.params.id))];
                    case 1:
                        task = _a.sent();
                        if (task) {
                            res.json(task);
                        }
                        else {
                            res.status(404).json({ message: "Task with id " + req.params.id + " not found!" });
                        }
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task_group/{id}/tasks:
         *   get:
         *     description: Retrieve a list of tasks within a group.
         *     tags:
         *       - task
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the task group.
         *         schema:
         *           type: string
         *       - in: query
         *         name: limit
         *         required: false
         *         description: Maximum number of tasks to retrieve.  Set to -1 to retrieve all.
         *         default: -1
         *         schema:
         *           type: integer
         *       - in: query
         *         name: skip
         *         required: false
         *         description: How many tasks to skip.
         *         default: 0
         *         schema:
         *           type: integer
         *     responses:
         *       200:
         *         description: An array of tasks.
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 type: object
         *                 $ref: '#/components/schemas/Task'
         */
        router.get('/api/v1/task_group/:id/tasks', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var limit, skip, tasks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        limit = parseInt(req.query.limit || '-1');
                        skip = parseInt(req.query.skip || '0');
                        return [4 /*yield*/, Task_1.default.findAllInGroup(new mongodb_1.ObjectId(req.params.id), limit, skip)];
                    case 1:
                        tasks = _a.sent();
                        res.json(tasks);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/channel/{channel}/tasks:
         *   get:
         *     description: Retrieve a list of tasks with the same channel.
         *     tags:
         *       - task
         *     parameters:
         *       - in: path
         *         name: channel
         *         required: true
         *         description: The channel.
         *         schema:
         *           type: string
         *       - in: query
         *         name: limit
         *         required: false
         *         description: Maximum number of tasks to retrieve.
         *         default: 50
         *         schema:
         *           type: integer
         *       - in: query
         *         name: skip
         *         required: false
         *         description: How many tasks to skip.
         *         default: 0
         *         schema:
         *           type: integer
         *     responses:
         *       200:
         *         description: An array of tasks.
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 type: object
         *                 $ref: '#/components/schemas/Task'
         */
        router.get('/api/v1/channel/:id/tasks', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var limit, skip, tasks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        limit = parseInt(req.query.limit || '50');
                        skip = parseInt(req.query.skip || '0');
                        return [4 /*yield*/, Task_1.default.findAllInChannel(limit, skip, req.params.id)];
                    case 1:
                        tasks = _a.sent();
                        res.json(tasks);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/channels:
         *   get:
         *     description: Retrieve a list of channels.  Note that channels are a created as a side effect of creating tasks.
         *     tags:
         *       - channel
         *     responses:
         *       200:
         *         description: An array of channels.
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 type: string
         */
        router.get('/api/v1/channels', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var channelStats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Task_1.default.getChannels()];
                    case 1:
                        channelStats = _a.sent();
                        res.json(channelStats);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task_groups:
         *   post:
         *     description: Create a new task group.
         *     tags:
         *       - task_group
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             $ref: '#/components/schemas/CreateTaskGroup'
         *     responses:
         *       200:
         *         description: The new task group.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/TaskGroup'
         */
        router.post('/api/v1/task_groups', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var group;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, TaskGroup_1.default.fromData(req.body)];
                    case 1:
                        group = _a.sent();
                        res.json(group);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task_group/{id}/tasks:
         *   post:
         *     description: Create a new task within a group.
         *     tags:
         *       - task
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the task group.
         *         schema:
         *           type: string
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             $ref: '#/components/schemas/CreateTask'
         *     responses:
         *       200:
         *         description: The new task.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/Task'
         */
        router.post('/api/v1/task_group/:id/tasks', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Task_1.default.fromData(new mongodb_1.ObjectId(req.params.id), req.body)];
                    case 1:
                        task = _a.sent();
                        res.json(task);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task_group/{id}:
         *   delete:
         *     description: Delete a task group.
         *     tags:
         *       - task_group
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the task group to delete.
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: MongoDB delete result.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         */
        router.delete('/api/v1/task_group/:id', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var deleteResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, TaskGroup_1.default.deleteById(new mongodb_1.ObjectId(req.params.id))];
                    case 1:
                        deleteResult = _a.sent();
                        res.json(deleteResult);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task/{id}:
         *   delete:
         *     description: Delete a task.
         *     tags:
         *       - task
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the task to delete.
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: MongoDB delete result.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         */
        router.delete('/api/v1/task/:id', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var deleteResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Task_1.default.deleteById(new mongodb_1.ObjectId(req.params.id))];
                    case 1:
                        deleteResult = _a.sent();
                        res.json(deleteResult);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task_group/{id}/reset:
         *   post:
         *     description: Reset a task group.  If the group has seed tasks, all non-seed tasks are removed.  Then all remaining tasks within the group are reset.
         *     tags:
         *       - task_group
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the task group to reset.
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: The task group.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/TaskGroup'
         */
        router.post('/api/v1/task_group/:id/reset', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var resetResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, TaskGroup_1.default.resetById(new mongodb_1.ObjectId(req.params.id))];
                    case 1:
                        resetResult = _a.sent();
                        res.json(resetResult);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task_group/{id}/retry:
         *   post:
         *     description: Force a retry all incomplete tasks in a task group by incrementing their remainingAttempts value.
         *     tags:
         *       - task_group
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the task group to retry.
         *         schema:
         *           type: string
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               remainingAttempts:
         *                 type: integer
         *                 description: How much to increment each incomplete task's remainingAttempts.
         *                 default: 2
         *     responses:
         *       200:
         *         description: The task group.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/TaskGroup'
         */
        router.post('/api/v1/task_group/:id/retry', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var remainingAttempts, retryResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        remainingAttempts = parseInt(req.body.remainingAttempts || '2');
                        return [4 /*yield*/, TaskGroup_1.default.retryById(new mongodb_1.ObjectId(req.params.id), remainingAttempts)];
                    case 1:
                        retryResult = _a.sent();
                        res.json(retryResult);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task_group/{id}/pause:
         *   post:
         *     description: Pause a task group.  All tasks within the task group are also paused.
         *     tags:
         *       - task_group
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the task group to pause.
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: The task group.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/TaskGroup'
         */
        router.post('/api/v1/task_group/:id/pause', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var resetResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, TaskGroup_1.default.syncPauseById(new mongodb_1.ObjectId(req.params.id), true)];
                    case 1:
                        resetResult = _a.sent();
                        res.json(resetResult);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task_group/{id}/resume:
         *   post:
         *     description: Resume a task group.  All tasks within the task group are also un-paused.
         *     tags:
         *       - task_group
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the task group to resume.
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: The task group.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/TaskGroup'
         */
        router.post('/api/v1/task_group/:id/resume', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var resetResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, TaskGroup_1.default.syncPauseById(new mongodb_1.ObjectId(req.params.id), false)];
                    case 1:
                        resetResult = _a.sent();
                        res.json(resetResult);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task/{id}/reset:
         *   post:
         *     description: Reset a task as if it had never been run.
         *     tags:
         *       - task
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the task to reset.
         *         schema:
         *           type: string
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               remainingAttempts:
         *                 type: integer
         *                 description: How to set each task's remainingAttempts.
         *                 default: 2
         *     responses:
         *       200:
         *         description: The task.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/Task'
         */
        router.post('/api/v1/task/:id/reset', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var remainingAttempts, resetResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        remainingAttempts = parseInt(req.body.remainingAttempts || '2');
                        return [4 /*yield*/, Task_1.default.resetById(new mongodb_1.ObjectId(req.params.id), remainingAttempts)];
                    case 1:
                        resetResult = _a.sent();
                        res.json(resetResult);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task/{id}/retry:
         *   post:
         *     description: Force a retry of a task incrementing its remainingAttempts value.
         *     tags:
         *       - task
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the task to retry.
         *         schema:
         *           type: string
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               remainingAttempts:
         *                 type: integer
         *                 description: How to much to increment each task's remainingAttempts.
         *                 default: 2
         *     responses:
         *       200:
         *         description: The task.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/Task'
         */
        router.post('/api/v1/task/:id/retry', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var remainingAttempts, resetResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        remainingAttempts = parseInt(req.body.remainingAttempts || '2');
                        return [4 /*yield*/, Task_1.default.retryById(new mongodb_1.ObjectId(req.params.id), remainingAttempts)];
                    case 1:
                        resetResult = _a.sent();
                        res.json(resetResult);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task/{id}/pluck:
         *   post:
         *     description: Take the given task and create a (reset) clone of it in a new task group.  Useful for debugging workers.
         *     tags:
         *       - task
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the task to pluck.
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: The cloned task.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/Task'
         */
        router.post('/api/v1/task/:id/pluck', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Task_1.default.pluckById(new mongodb_1.ObjectId(req.params.id))];
                    case 1:
                        task = _a.sent();
                        res.json(task);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task/{id}:
         *   put:
         *     description: Update a task.
         *     tags:
         *       - task
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the task to update.
         *         schema:
         *           type: string
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             $ref: '#/components/schemas/CreateTask'
         *     responses:
         *       200:
         *         description: The updated task.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/Task'
         */
        router.put('/api/v1/task/:id', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Task_1.default.updateById(new mongodb_1.ObjectId(req.params.id), req.body)];
                    case 1:
                        task = _a.sent();
                        res.json(task);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task_group/{id}:
         *   put:
         *     description: Update a task group.
         *     tags:
         *       - task_group
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the task group to update.
         *         schema:
         *           type: string
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             $ref: '#/components/schemas/CreateTaskGroup'
         *     responses:
         *       200:
         *         description: The updated task group.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/TaskGroup'
         */
        router.put('/api/v1/task_group/:id', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var group;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, TaskGroup_1.default.updateById(new mongodb_1.ObjectId(req.params.id), req.body)];
                    case 1:
                        group = _a.sent();
                        res.json(group);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/channel/{channel}/acquire:
         *   post:
         *     description: Workers use this endpoint to ask for a task to complete.
         *     tags:
         *       - task
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               workerId:
         *                 type: string
         *                 description: Unique id of the worker requesting a task.
         *     parameters:
         *       - in: path
         *         name: channel
         *         required: true
         *         description: Channel to fetch task from.
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: The acquired task.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 task:
         *                   type: object
         *                   $ref: '#/components/schemas/Task'
         *                   description: The task to perform.  Will be null if no tasks are available.
         *                 parents:
         *                   type: array
         *                   description: Information about each task's parent.  Includes parent's input and output so child tasks can inherit data.
         *                   items:
         *                     type: object
         *                     $ref: '#/components/schemas/TaskParentData'
         */
        router.post('/api/v1/channel/:id/acquire', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var workerId, task, parents;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!req.body.workerId) {
                            throw new Error('workerId is required!');
                        }
                        workerId = req.body.workerId;
                        return [4 /*yield*/, Task_1.default.acquireInChannel(req.params.id, workerId)];
                    case 1:
                        task = _a.sent();
                        if (!task) return [3 /*break*/, 3];
                        return [4 /*yield*/, Task_1.default.getParentsData(task)];
                    case 2:
                        parents = _a.sent();
                        res.json({ task: task, parents: parents });
                        return [3 /*break*/, 4];
                    case 3:
                        res.json({ task: null });
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task/{id}/examine:
         *   post:
         *     description: Orchestration uses this enpoint to examine a task to find out if it is eligible for execution.
         *     tags:
         *       - task
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of task to examine
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Examine result.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         */
        router.post('/api/v1/task/:id/examine', authorizeCloudTaskEndpoint, unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Task_1.default.findById(new mongodb_1.ObjectId(req.params.id))];
                    case 1:
                        task = _a.sent();
                        if (!task) return [3 /*break*/, 3];
                        return [4 /*yield*/, Task_1.default.examine(new mongodb_1.ObjectId(task._id))];
                    case 2:
                        _a.sent();
                        res.json({ success: true });
                        return [3 /*break*/, 4];
                    case 3:
                        res.json({ task: null });
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task/{id}/execute:
         *   post:
         *     description: Orchestration uses this enpoint to execute a task to find out if it is eligible for execution.
         *     tags:
         *       - task
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of task to execute
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Execute result.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         */
        router.post('/api/v1/task/:id/execute', authorizeCloudTaskEndpoint, unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Task_1.default.findById(new mongodb_1.ObjectId(req.params.id))];
                    case 1:
                        task = _a.sent();
                        if (!task) return [3 /*break*/, 3];
                        return [4 /*yield*/, Operator_1.default.execute(new mongodb_1.ObjectId(task._id))];
                    case 2:
                        _a.sent();
                        res.json({ success: true });
                        return [3 /*break*/, 4];
                    case 3:
                        res.json({ task: null });
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/task/{id}/release:
         *   post:
         *     description: Workers use this endpoint to return the result of completing or failing a task.
         *     tags:
         *       - task
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             $ref: '#/components/schemas/ReleaseTask'
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of task to release.
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: The released task.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/Task'
         */
        router.post('/api/v1/task/:id/release', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var error, output, children, workerId, workgroupDelayInSeconds, releaseResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        error = req.body.error || null;
                        output = req.body.output || null;
                        children = req.body.children || [];
                        if (!req.body.workerId) {
                            throw new Error('workerId is required!');
                        }
                        workerId = req.body.workerId;
                        workgroupDelayInSeconds = req.body.workgroupDelayInSeconds || 0;
                        return [4 /*yield*/, Task_1.default.release(new mongodb_1.ObjectId(req.params.id), workerId, error, output, children, workgroupDelayInSeconds)];
                    case 1:
                        releaseResult = _a.sent();
                        res.json(releaseResult);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/operators:
         *   get:
         *     description: Retrieve a list of operators.
         *     tags:
         *       - operator
         *     parameters:
         *       - in: query
         *         name: limit
         *         required: false
         *         description: Maximum number of operators to retrieve.
         *         default: 50
         *         schema:
         *           type: integer
         *       - in: query
         *         name: skip
         *         required: false
         *         description: How many operators to skip.
         *         default: 0
         *         schema:
         *           type: integer
         *     responses:
         *       200:
         *         description: An array of operators.
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 type: object
         *                 $ref: '#/components/schemas/Operator'
         */
        router.get('/api/v1/operators', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var limit, skip, operators;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        limit = parseInt(req.query.limit || '50');
                        skip = parseInt(req.query.skip || '0');
                        return [4 /*yield*/, Operator_1.default.findAll(limit, skip)];
                    case 1:
                        operators = _a.sent();
                        res.json(operators);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/operators/count:
         *   get:
         *     description: Retrieve the total count of operators.
         *     tags:
         *       - task_group
         *     responses:
         *       200:
         *         description: The total count of operators.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 count:
         *                   type: integer
         */
        router.get('/api/v1/operators/count', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var count;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Operator_1.default.countAll()];
                    case 1:
                        count = _a.sent();
                        res.json({ count: count });
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/operator/{id}:
         *   get:
         *     description: Retrieve a single operator.
         *     tags:
         *       - operator
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the operator to retrieve.
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: An operator.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/Operator'
         */
        router.get('/api/v1/operator/:id', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var operator;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Operator_1.default.findById(new mongodb_1.ObjectId(req.params.id))];
                    case 1:
                        operator = _a.sent();
                        if (operator) {
                            res.json(operator);
                        }
                        else {
                            res.status(404).json({ message: "Operator with id " + req.params.id + " not found!" });
                        }
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/operators:
         *   post:
         *     description: Create a new operator.
         *     tags:
         *       - operator
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             $ref: '#/components/schemas/CreateOperator'
         *     responses:
         *       200:
         *         description: The new operator.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/Operator'
         */
        router.post('/api/v1/operators', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var operator;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Operator_1.default.fromData(req.body)];
                    case 1:
                        operator = _a.sent();
                        res.json(operator);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/operator/{id}:
         *   put:
         *     description: Update an operator.
         *     tags:
         *       - operator
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the operator to update.
         *         schema:
         *           type: string
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             $ref: '#/components/schemas/CreateOperator'
         *     responses:
         *       200:
         *         description: The updated operator.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/Operator'
         */
        router.put('/api/v1/operator/:id', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var operator;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Operator_1.default.updateById(new mongodb_1.ObjectId(req.params.id), req.body)];
                    case 1:
                        operator = _a.sent();
                        res.json(operator);
                        return [2 /*return*/];
                }
            });
        }); }));
        /**
         * @openapi
         * /api/v1/operator/{id}:
         *   delete:
         *     description: Delete an operator.
         *     tags:
         *       - operator
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Id of the operator to delete.
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: MongoDB delete result.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         */
        router.delete('/api/v1/operator/:id', unhandledExceptionsHandler(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var deleteResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Operator_1.default.deleteById(new mongodb_1.ObjectId(req.params.id))];
                    case 1:
                        deleteResult = _a.sent();
                        res.json(deleteResult);
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    var bootstrapOperatorsCron = node_cron_1.default.schedule('*/5 * * * *', function () {
        Operator_1.default.bootstrapAll().then(function () {
            console.log("~~ bootstraped operators");
        });
    });
    var cleanExpiredGroupsCron = node_cron_1.default.schedule('30 3 * * *', function () {
        if ((process.env.CREW_CLEAN_EXPIRED_GROUPS || 'yes') === 'yes') {
            TaskGroup_1.default.cleanExpired().then(function (result) {
                if (result.length > 0) {
                    console.log("~~ removed " + result.length + " expired task groups");
                }
            });
        }
    });
    var syncParentsCompleteCron = node_cron_1.default.schedule('*/5 * * * *', function () {
        Task_1.default.syncParents().then(function (count) {
            console.log("~~ syncd " + count + " task's parentsComplete");
        });
    });
    // Graceful shutdown for use within render.com or kubernetes - can be disabled with an env var
    if (process.env.CREW_GRACEFUL_SHUTDOWN !== 'no') {
        console.log('~~ Enabling graceful shutdown');
        terminus_1.default.createTerminus(options.server, {
            signal: 'SIGINT',
            signals: ['SIGUSR1', 'SIGUSR2'],
            timeout: 29000,
            onSignal: function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // Cleanup all resources
                            console.log('~~ Terminus signal : cleaning up...');
                            cleanExpiredGroupsCron.stop();
                            syncParentsCompleteCron.stop();
                            bootstrapOperatorsCron.stop();
                            // Close database connection
                            console.log('~~ Closing database connection');
                            if (!client) return [3 /*break*/, 2];
                            return [4 /*yield*/, client.close()];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2:
                            databaseConnected = false;
                            return [2 /*return*/];
                    }
                });
            }); },
            onShutdown: function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    console.log('~~ Terminus shutdown complete.');
                    return [2 /*return*/];
                });
            }); }
        });
    }
    return router;
}
exports.crew = crew;
exports.default = crew;
//# sourceMappingURL=crew.js.map