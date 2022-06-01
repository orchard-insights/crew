import { PubSub, Subscription, Topic } from '@google-cloud/pubsub'
import { times } from 'lodash'
import { ObjectId } from "mongodb"
import Operator from "./Operator"
import Task from "./Task"

interface Messenger {
  publishExamineTask(taskId: string) : Promise<any>

  publishExecuteTask(taskId: string) : Promise<any>
}

// class InlineMessenger {
//   async publishExamineTask(taskId: string) : Promise<any> {
//     Task.examine(new ObjectId(taskId))
//   }

//   async publishExecuteTask(taskId: string) : Promise<any> {
//     Operator.execute(new ObjectId(taskId))
//   }
// }

// const messenger = new InlineMessenger()
// export const getMessenger = async function () {
//   return messenger
// }

class GoogleCloudMessenger {
  examineTopic: Topic
  executeTopic: Topic

  constructor(examineTopic: Topic, executeTopic: Topic) {
    this.examineTopic = examineTopic
    this.executeTopic = executeTopic
  }

  async publishExamineTask(taskId: string) : Promise<any> {
    this.examineTopic.publish(Buffer.from(JSON.stringify({taskId})))
  }

  async publishExecuteTask(taskId: string) : Promise<any> {
    this.executeTopic.publish(Buffer.from(JSON.stringify({taskId})))
  }
}

let messengerP : Promise<GoogleCloudMessenger>

export const getMessenger = function () : Promise<Messenger> {
  if (messengerP) {
    return messengerP
  }
  messengerP = new Promise<GoogleCloudMessenger>(async (resolve) => {
    const projectId = "dose-board-aaron-dev"
    const examineTopicName = "examineTask"
    const examineSubscriptionName = "examineTaskSub"
    let examineTopic : Topic | null = null
    let examineSubscription : Subscription | null = null

    const executeTopicName = "executeTask"
    const executeSubscriptionName = "executeTaskSub"
    let executeTopic : Topic | null = null
    let executeSubscription : Subscription | null = null

    const pubsub = new PubSub({projectId})

    const [existingTopics] = await pubsub.getTopics()
    for (const existingTopic of existingTopics) {
      if (existingTopic.name.endsWith('/' + examineTopicName)) {
        examineTopic = existingTopic
      }
      if (existingTopic.name.endsWith('/' + executeTopicName)) {
        executeTopic = existingTopic
      }
    }

    const [existingSubscriptions] = await pubsub.getSubscriptions()
    for (const existingSubscription of existingSubscriptions) {
      if (existingSubscription.name.endsWith('/' + examineSubscriptionName)) {
        examineSubscription = existingSubscription
      }
      if (existingSubscription.name.endsWith('/' + executeSubscriptionName)) {
        executeSubscription = existingSubscription
      }
    }

    if (!examineTopic) {
      [examineTopic] = await pubsub.createTopic(examineTopicName);
      console.log(`Topic ${examineTopic.name} created.`)
    } else {
      console.log(`Topic ${examineTopic.name} existed.`)
    }
    if (!examineSubscription) {
      [examineSubscription] = await examineTopic.createSubscription(examineSubscriptionName);
      console.log(`Subscription ${examineSubscription.name} created.`)
    } else {
      console.log(`Subscription ${examineSubscription.name} existed.`)
    }
    examineSubscription.on('message', message => {
      const payload = JSON.parse(message.data.toString())
      console.log('~~ examine message', payload.taskId)
      Task.examine(new ObjectId(payload.taskId))
      message.ack()
    })

    if (!executeTopic) {
      [executeTopic] = await pubsub.createTopic(executeTopicName);
      console.log(`Topic ${executeTopic.name} created.`)
    } else {
      console.log(`Topic ${executeTopic.name} existed.`)
    }
    if (!executeSubscription) {
      // https://cloud.google.com/pubsub/docs/samples/pubsub-subscriber-flow-settings
      [executeSubscription] = await executeTopic.createSubscription(executeSubscriptionName, {
        ackDeadlineSeconds: 60
      });
      console.log(`Subscription ${executeSubscription.name} created.`)
    } else {
      console.log(`Subscription ${executeSubscription.name} existed.`)
    }
    executeSubscription.on('message', message => {
      const payload = JSON.parse(message.data.toString())
      console.log('~~ execute message', payload.taskId)
      Operator.execute(new ObjectId(payload.taskId))
      message.ack()
    })

    const messenger = new GoogleCloudMessenger(examineTopic, executeTopic)
    resolve(messenger)
  })
  return messengerP
}
