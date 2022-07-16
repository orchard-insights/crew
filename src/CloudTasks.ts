// import { PubSub, Subscription, Topic } from '@google-cloud/pubsub'
// import { times } from 'lodash'
// import { ObjectId } from "mongodb"
// import Operator from "./Operator"
// import Task from "./Task"

import { CloudTasksClient } from '@google-cloud/tasks'
const cloudTasksClient = new CloudTasksClient();

interface Messenger {
  publishExamineTask(taskId: string) : Promise<any>

  publishExecuteTask(taskId: string) : Promise<any>
}

class CloudTasksMessenger implements Messenger {

  async publishExamineTask(taskId: string): Promise<any> {
    const url = process.env.CREW_API_PUBLIC_BASE_URL + `api/v1/task/${taskId}/examine?accessToken=${process.env.CREW_CLOUD_TASK_ACCESS_TOKEN || ''}`
    console.log('~~ publishExamineTask', url)
    await this.enqueue('crew-examine', url, {taskId, action: 'examine'})
  }

  async publishExecuteTask(taskId: string): Promise<any> {
    const url = process.env.CREW_API_PUBLIC_BASE_URL + `api/v1/task/${taskId}/execute?accessToken=${process.env.CREW_CLOUD_TASK_ACCESS_TOKEN || ''}`
    console.log('~~ publishExecuteTask', url)
    await this.enqueue('crew-execute', url, {taskId, action: 'execute'})
  }

  async enqueue(queue: string, url: string, payload: any, delayInSeconds = 0) {

    const location = process.env.CREW_QUEUE_LOCATION || '';
    const project = process.env.CREW_QUEUE_PROJECT || '';

    // Construct the fully qualified queue name.
    const parent = cloudTasksClient.queuePath(project, location, queue);

    const task : any = {
      httpRequest: {
        httpMethod: "POST",
        url,
      },
      // Provide a name to enforce task de-duplication
      // NOTE - even once task is complete you must wait
      // at least one hour before sending a task
      // with the same name!
      // Uncomment next line to disable de-duplication
      // eslint-disable-next-line max-len
      // name: `projects/${project}/locations/${location}/queues/${queue}/tasks/job_c`
    };

    if (payload) {
      task.httpRequest.body = Buffer.from(JSON.stringify(payload)).toString("base64");
    }

    if (delayInSeconds) {
      // The time when the task is scheduled to be attempted.
      task.scheduleTime = {
        seconds: delayInSeconds + Date.now() / 1000,
      };
    }

    // Send create task request.
    console.log("Creating cloud task:");
    console.log(task);
    const queueRequest = {parent: parent, task: task};
    const [queueResponse] = await cloudTasksClient.createTask(queueRequest);
    console.log(`Created cloud task ${queueResponse.name}`);
  }
}

export const getMessenger = function () : Promise<Messenger> {
  const messenger = new CloudTasksMessenger()
  return Promise.resolve(messenger)
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


// class GoogleCloudMessenger {
//   examineTopic: Topic
//   executeTopic: Topic

//   constructor(examineTopic: Topic, executeTopic: Topic) {
//     this.examineTopic = examineTopic
//     this.executeTopic = executeTopic
//   }

//   async publishExamineTask(taskId: string) : Promise<any> {
//     this.examineTopic.publish(Buffer.from(JSON.stringify({taskId})))
//   }

//   async publishExecuteTask(taskId: string) : Promise<any> {
//     this.executeTopic.publish(Buffer.from(JSON.stringify({taskId})))
//   }
// }

// let messengerP : Promise<GoogleCloudMessenger>

// export const getMessenger = function () : Promise<Messenger> {
//   if (messengerP) {
//     return messengerP
//   }
//   messengerP = new Promise<GoogleCloudMessenger>(async (resolve) => {
//     const projectId = "dose-board-aaron-dev"
//     const examineTopicName = "examineTask"
//     const examineSubscriptionName = "examineTaskSub"
//     let examineTopic : Topic | null = null
//     let examineSubscription : Subscription | null = null

//     const executeTopicName = "executeTask"
//     const executeSubscriptionName = "executeTaskSub"
//     let executeTopic : Topic | null = null
//     let executeSubscription : Subscription | null = null

//     const pubsub = new PubSub({projectId})

//     const [existingTopics] = await pubsub.getTopics()
//     for (const existingTopic of existingTopics) {
//       if (existingTopic.name.endsWith('/' + examineTopicName)) {
//         examineTopic = existingTopic
//       }
//       if (existingTopic.name.endsWith('/' + executeTopicName)) {
//         executeTopic = existingTopic
//       }
//     }

//     const [existingSubscriptions] = await pubsub.getSubscriptions()
//     for (const existingSubscription of existingSubscriptions) {
//       if (existingSubscription.name.endsWith('/' + examineSubscriptionName)) {
//         examineSubscription = existingSubscription
//       }
//       if (existingSubscription.name.endsWith('/' + executeSubscriptionName)) {
//         executeSubscription = existingSubscription
//       }
//     }

//     if (!examineTopic) {
//       [examineTopic] = await pubsub.createTopic(examineTopicName);
//       console.log(`Topic ${examineTopic.name} created.`)
//     } else {
//       console.log(`Topic ${examineTopic.name} existed.`)
//     }
//     if (!examineSubscription) {
//       [examineSubscription] = await examineTopic.createSubscription(examineSubscriptionName);
//       console.log(`Subscription ${examineSubscription.name} created.`)
//     } else {
//       console.log(`Subscription ${examineSubscription.name} existed.`)
//     }
//     examineSubscription.on('message', message => {
//       const payload = JSON.parse(message.data.toString())
//       console.log('~~ examine message', payload.taskId)
//       Task.examine(new ObjectId(payload.taskId))
//       message.ack()
//     })

//     if (!executeTopic) {
//       [executeTopic] = await pubsub.createTopic(executeTopicName);
//       console.log(`Topic ${executeTopic.name} created.`)
//     } else {
//       console.log(`Topic ${executeTopic.name} existed.`)
//     }
//     if (!executeSubscription) {
//       // https://cloud.google.com/pubsub/docs/samples/pubsub-subscriber-flow-settings
//       [executeSubscription] = await executeTopic.createSubscription(executeSubscriptionName, {
//         ackDeadlineSeconds: 60
//       });
//       console.log(`Subscription ${executeSubscription.name} created.`)
//     } else {
//       console.log(`Subscription ${executeSubscription.name} existed.`)
//     }
//     executeSubscription.on('message', message => {
//       const payload = JSON.parse(message.data.toString())
//       console.log('~~ execute message', payload.taskId)
//       Operator.execute(new ObjectId(payload.taskId))
//       message.ack()
//     })

//     const messenger = new GoogleCloudMessenger(examineTopic, executeTopic)
//     resolve(messenger)
//   })
//   return messengerP
// }
