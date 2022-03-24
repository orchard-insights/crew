"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// This class helps send events to clients via a websocket (and mock unit tests!)
var Realtime = /** @class */ (function () {
    function Realtime() {
    }
    Realtime.prototype.emit = function (room, event, data) {
        // console.log('~~ emitting', room, event, data)
        if (this.io) {
            this.io.to(room).emit(event, data);
        }
    };
    return Realtime;
}());
var emitter = new Realtime();
exports.default = emitter;
