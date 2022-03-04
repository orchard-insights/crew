"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crew_1 = require("./crew");
// This is a helper function that makes it easy to send events to clients via a websocket (and mock unit tests!)
exports.default = {
    emit: function (room, event, data) {
        // console.log('~~ emitting', room, event, data)
        if (crew_1.io) {
            crew_1.io.to(room).emit(event, data);
        }
    }
};
