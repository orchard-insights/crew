"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var http_1 = __importDefault(require("http"));
var WorkerServer = /** @class */ (function () {
    function WorkerServer() {
        // Setup express (with cors and json bodyparser)
        this.app = (0, express_1.default)();
        this.server = http_1.default.createServer(this.app);
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json());
        var port = parseInt(process.env.CREW_WORKER_PORT || '3001');
        this.app.listen(port, function () { return console.log("worker server listening on port " + port + "!"); });
    }
    return WorkerServer;
}());
exports.default = WorkerServer;
