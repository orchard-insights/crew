"use strict";
// import { PubSub, Subscription, Topic } from '@google-cloud/pubsub'
// import { times } from 'lodash'
// import { ObjectId } from "mongodb"
// import Operator from "./Operator"
// import Task from "./Task"
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessenger = void 0;
var tasks_1 = require("@google-cloud/tasks");
var cloudTasksClient = new tasks_1.CloudTasksClient();
var CloudTasksMessenger = /** @class */ (function () {
    function CloudTasksMessenger() {
    }
    CloudTasksMessenger.prototype.publishExamineTask = function (taskId, delayInSeconds) {
        if (delayInSeconds === void 0) { delayInSeconds = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var url;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = process.env.CREW_API_PUBLIC_BASE_URL + ("api/v1/task/" + taskId + "/examine?accessToken=" + (process.env.CREW_CLOUD_TASK_ACCESS_TOKEN || ''));
                        console.log('~~ publishExamineTask', url, delayInSeconds);
                        return [4 /*yield*/, this.enqueue('crew-examine', url, { taskId: taskId, action: 'examine' }, delayInSeconds)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CloudTasksMessenger.prototype.publishExecuteTask = function (taskId) {
        return __awaiter(this, void 0, void 0, function () {
            var url;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = process.env.CREW_API_PUBLIC_BASE_URL + ("api/v1/task/" + taskId + "/execute?accessToken=" + (process.env.CREW_CLOUD_TASK_ACCESS_TOKEN || ''));
                        console.log('~~ publishExecuteTask', url);
                        return [4 /*yield*/, this.enqueue('crew-execute', url, { taskId: taskId, action: 'execute' })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CloudTasksMessenger.prototype.enqueue = function (queue, url, payload, delayInSeconds) {
        if (delayInSeconds === void 0) { delayInSeconds = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var location, project, parent, task, queueRequest, queueResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        location = process.env.CREW_QUEUE_LOCATION || '';
                        project = process.env.CREW_QUEUE_PROJECT || '';
                        parent = cloudTasksClient.queuePath(project, location, queue);
                        task = {
                            httpRequest: {
                                httpMethod: "POST",
                                url: url,
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
                        queueRequest = { parent: parent, task: task };
                        return [4 /*yield*/, cloudTasksClient.createTask(queueRequest)];
                    case 1:
                        queueResponse = (_a.sent())[0];
                        console.log("Created cloud task " + queueResponse.name);
                        return [2 /*return*/];
                }
            });
        });
    };
    return CloudTasksMessenger;
}());
var getMessenger = function () {
    var messenger = new CloudTasksMessenger();
    return Promise.resolve(messenger);
};
exports.getMessenger = getMessenger;
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
//# sourceMappingURL=CloudTasks.js.map