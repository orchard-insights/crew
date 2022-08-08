
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

  async publishExamineTask(taskId: string, delayInSeconds = 0): Promise<any> {
    const url = this.baseUrl + `api/v1/task/${taskId}/examine?accessToken=${this.accessToken}`
    console.log('~~ publishExamineTask', url, delayInSeconds)
    await this.enqueue(this.examineQueueName, url, {taskId, action: 'examine'}, delayInSeconds)
  }

  async publishExecuteTask(taskId: string): Promise<any> {
    const url = this.baseUrl + `api/v1/task/${taskId}/execute?accessToken=${this.accessToken}`
    console.log('~~ publishExecuteTask', url)
    await this.enqueue(this.executeQueueName, url, {taskId, action: 'execute'})
  }

  async enqueue(queue: string, url: string, payload: any, delayInSeconds = 0) {

    const location = process.env.CREW_QUEUE_LOCATION || '';
    const project = process.env.CREW_QUEUE_PROJECT || '';

    if (!location || !project) {
      console.warn('Unable to dispatch cloud task - CREW_QUEUE_LOCATION or CREW_QUEUE_PROJECT environment variable not set!')
      return
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
      console.log("Creating cloud task:");
      console.log(task);
      const queueRequest = {parent: parent, task: task};
      const [queueResponse] = await cloudTasksClient.createTask(queueRequest);
      console.log(`Created cloud task ${queueResponse.name}`);
    } catch (error) {
      console.error('Failed to create cloud task!', error)
    }
  }
}
