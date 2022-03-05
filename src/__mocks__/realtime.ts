import { Server } from 'socket.io'

// This class helps send events to clients via a websocket (and mock unit tests!)
class Realtime {
  io: Server | null

  emit(room: string, event: string, data: any) {
    // I should be mocked!
  }
}

const emitter = new Realtime()

export default emitter
