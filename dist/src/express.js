"use strict";
// This file is used for development and as an example of how to embed crew in an existing express application.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Use .env (for development)
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
var express_1 = __importDefault(require("express"));
var http_1 = __importDefault(require("http"));
var crew_1 = require("./crew");
// Setup express
var app = (0, express_1.default)();
var server = http_1.default.createServer(app);
// All your other express stuff goes here!
app.use('/', (0, crew_1.crew)({
    server: server
}));
var port = parseInt(process.env.PORT || '3000');
server.listen(port, function () {
    // tslint:disable-next-line:no-console
    console.log("Server started on port " + port);
    console.log("The crew API is available at /ap1/v1' }");
});
