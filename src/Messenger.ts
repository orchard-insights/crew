import InlineMessenger from "./messengers/InlineMessenger"

export default interface Messenger {
  publishExamineTask(taskId: string, delayInSeconds: number) : Promise<string | null>

  publishExecuteTask(taskId: string) : Promise<string | null>

  isExaminePending(messageId : string | null) : Promise<boolean>

  isExecutePending(messageId : string | null) : Promise<boolean>
}

let messenger = new InlineMessenger()

export const getMessenger = function () : Promise<Messenger> {
  return Promise.resolve(messenger)
}

export const setMessenger = function (msgr : Messenger) {
  messenger = msgr
}