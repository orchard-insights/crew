
import { CloudTasksClient } from '@google-cloud/tasks'
const cloudTasksClient = new CloudTasksClient();
import Messenger from '../Messenger';

export default class CloudTasksMessenger implements Messenger {

  accessToken = ""
  baseUrl = ""
  examineQueueName = "crew-examine"
  executeQueueName = "crew-execute"
  constructor (_accessToken = process.env.CREW_CLOUD_TASK_ACCESS_TOKEN || '', _baseUrl = process.env.CREW_API_PUBLIC_BASE_URL || '', _examineQueueName = "crew-examine", _executeQueueName = "crew-execute") {
    this.accessToken = _accessToken
    this.baseUrl = _baseUrl
    this.examineQueueName = _examineQueueName
    this.executeQueueName = _executeQueueName
  }

  async publishExamineTask(taskId: string, delayInSeconds = 0): Promise<string | null> {
    const url = this.baseUrl + `api/v1/task/${taskId}/examine?accessToken=${this.accessToken}`
    console.log('~~ publishExamineTask', url, delayInSeconds)
    const messageId = await this.enqueue(this.examineQueueName, url, {taskId, action: 'examine'}, delayInSeconds)
    return messageId
  }

  async publishExecuteTask(taskId: string): Promise<string | null> {
    const url = this.baseUrl + `api/v1/task/${taskId}/execute?accessToken=${this.accessToken}`
    console.log('~~ publishExecuteTask', url)
    const messageId = await this.enqueue(this.executeQueueName, url, {taskId, action: 'execute'})
    return messageId
  }

  async enqueue(queue: string, url: string, payload: any, delayInSeconds = 0) : Promise<string | null> {

    const location = process.env.CREW_QUEUE_LOCATION || '';
    const project = process.env.CREW_QUEUE_PROJECT || '';

    if (!location || !project) {
      console.warn('Unable to dispatch cloud task - CREW_QUEUE_LOCATION or CREW_QUEUE_PROJECT environment variable not set!')
      return null
    }

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
    try {
      const queueRequest = {parent: parent, task: task};
      const [queueResponse] = await cloudTasksClient.createTask(queueRequest);
      console.log(`Created cloud task ${queueResponse.name}`);
      return queueResponse.name || null
    } catch (error) {
      console.error('Failed to create cloud task!', error)
    }
    return null
  }

  async _isTaskPending(taskId: string | null): Promise<boolean> {
    if (!taskId) {
      return false
    }
    try {
      const res = await cloudTasksClient.getTask({name: taskId})
    } catch (error) {
      // Cloud tasks returns the following error when a task no longer exists:
      /*
      {
        code: 5,
        details: 'The task no longer exists, though a task with this name existed recently. The task either successfully completed or was deleted.',
        metadata: Metadata {
          internalRepr: Map(1) { 'grpc-server-stats-bin' => [Array] },
          options: {}
        },
        note: 'Exception occurred in retry method that was not classified as transient'
      }
      */
      if ((error as any).code === 5) {
        return false
      }
    }
    return true
  }

  async isExaminePending(messageId: string | null): Promise<boolean> {
    return this._isTaskPending(messageId)
  }

  async isExecutePending(messageId: string | null): Promise<boolean> {
    return this._isTaskPending(messageId)
  }
}
