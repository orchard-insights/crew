import InlineMessenger from "./messengers/InlineMessenger"

export default interface Messenger {
  publishExamineTask(taskId: string, delayInSeconds: number) : Promise<any>

  publishExecuteTask(taskId: string) : Promise<any>
}

let messenger = new InlineMessenger()

export const getMessenger = function () : Promise<Messenger> {
  return Promise.resolve(messenger)
}

export const setMessenger = function (msgr : Messenger) {
  messenger = msgr
}
