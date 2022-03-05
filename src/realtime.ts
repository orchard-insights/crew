import { Server } from 'socket.io'

// This class helps send events to clients via a websocket (and mock unit tests!)
class Realtime {
  io: Server | null

  emit(room: string, event: string, data: any) {
    // console.log('~~ emitting', room, event, data)
    if (this.io) {
      this.io.to(room).emit(event, data)
    }
  }
}

const emitter = new Realtime()

export default emitter
