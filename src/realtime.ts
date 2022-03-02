import { io } from './crew'

// This is a helper function that makes it easy to send events to clients via a websocket (and mock unit tests!)
export default {
  emit(room: string, event: string, data: any) {
    // console.log('~~ emitting', room, event, data)
    if (io) {
      io.to(room).emit(event, data)
    }
  }
}
