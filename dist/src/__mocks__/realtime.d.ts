import { Server } from 'socket.io';
declare class Realtime {
    io: Server | null;
    emit(room: string, event: string, data: any): void;
}
declare const emitter: Realtime;
export default emitter;
//# sourceMappingURL=realtime.d.ts.map