#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = require("commander");
var express_1 = __importDefault(require("express"));
var http_1 = __importDefault(require("http"));
var crew_1 = __importDefault(require("./crew"));
var WorkerGroup_1 = __importDefault(require("../demo/js/WorkerGroup"));
var WorkerA_1 = __importDefault(require("../demo/js/WorkerA"));
var WorkerB_1 = __importDefault(require("../demo/js/WorkerB"));
var WorkerC_1 = __importDefault(require("../demo/js/WorkerC"));
commander_1.program
    .version('0.0.1');
commander_1.program.command('start')
    .description('Run crew API')
    .option('-m, --mongodb <uri>', 'Set the MongoDB connection string', 'MEMORY') // , 'mongodb://localhost:27017/orchard-crew?readPreference=primary&ssl=false')
    .option('-p, --port <port>', 'Which port to attach to [3000]', '3000')
    .action(function (options) {
    process.env.CREW_MONGO_URI = options.mongodb;
    process.env.PORT = options.port;
    console.log('Starting server...');
    // Setup express
    var app = (0, express_1.default)();
    var server = http_1.default.createServer(app);
    // Add crew with no auth
    app.use('/', (0, crew_1.default)({
        server: server
    }));
    var port = parseInt(process.env.PORT || '3000');
    server.listen(port, function () {
        // tslint:disable-next-line:no-console
        console.log("Server started on port " + port);
    });
});
commander_1.program.command('work')
    .description('Run crew demo workers')
    .option('-u, --url <url>', 'Which url should the workers use to access the API [http://localhost:3000/]')
    .action(function (options) {
    process.env.CREW_API_BASE_URL = options.url || 'http://localhost:3000/';
    process.env.CREW_WORKER_DISABLE_EXPRESS = 'yes';
    new WorkerGroup_1.default([
        new WorkerA_1.default(),
        new WorkerB_1.default(),
        new WorkerC_1.default()
    ]);
});
commander_1.program.parse(process.argv);
