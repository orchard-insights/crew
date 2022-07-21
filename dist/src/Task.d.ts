import { ObjectId } from "mongodb";
import TaskChild from "./TaskChild";
/**
 * @openapi
 * components:
 *   schemas:
 *     ReleaseTask:
 *       type: object
 *       properties:
 *         workerId:
 *           type: string
 *           description: The id of the worker releasing the task.  Must match the id of the worker that acquired the task.
 *         output:
 *           type: object
 *           description: Output data returned by the worker upon completing the task.
 *         error:
 *           type: object
 *           description: Error data.  Task will not get isComplete = true when present.
 *         workgroupDelayInSeconds:
 *           type: integer
 *           description: When present all tasks with the same workgroup will be paused for this many seconds.  Used to manage rate limits in 3rd party APIs.
 *         children:
 *           type: array
 *           items:
 *             type: object
 *             $ref: '#/components/schemas/TaskChild'
 *     TaskParentData:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Task id
 *         channel:
 *           type: string
 *         input:
 *           type: object
 *           description: Input data that the worker will need to complete the task.
 *         output:
 *           type: object
 *           description: Output data returned by the worker upon completing the task.
 *     CreateTask:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           required: true
 *         channel:
 *           type: string
 *           required: true
 *           description: Tasks of the same type will have the same channel.
 *         workgroup:
 *           type: string
 *           description: Use workgroups to manage tasks that may need to be paused together (to wait for rate limits).
 *         key:
 *           type: string
 *           description: A unique identifier for a task. Used to prevent duplicate tasks from being exectued more than once.
 *         remainingAttempts:
 *           type: integer
 *           default: 5
 *         isPaused:
 *           type: boolean
 *           description: When true, tasks in the group cannot be acquired by workers.
 *           default: false
 *         priority:
 *           type: integer
 *           description: Tasks with a higher priority get acquired before tasks with a lower priority.
 *           default: 0
 *         runAfter:
 *           type: integer
 *           description: Task cannot be acquired until this date and time has passed.
 *         progressWeight:
 *           type: integer
 *           description: Relative amount that this task contributes to the overall task group progress.
 *           default: 1
 *         isSeed:
 *           type: boolean
 *           description: When true, the task will not be removed when the task group is reset.  Seed tasks are usually responsible for creating child tasks.
 *           default: false
 *         errorDelayInSeconds:
 *           type: integer
 *           description: The task cannot be acquired for this many seconds after a failure.
 *           default: 30
 *         input:
 *           type: object
 *           description: Input data that the worker will need to complete the task.
 *         parentIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Ids of the task's parents.
 *     TaskChild:
 *       type: object
 *       properties:
 *         _child_id:
 *           type: string
 *           description: Unique pseudo-id for this child.  Will be re-assigned to a real _id by database upon creation.
 *         _parent_ids:
 *           type: array
 *           description: Pseudo-ids for the child's parents.  Used when returning a directed acyclic graph of child tasks.
 *           items:
 *             type: string
 *         name:
 *           type: string
 *           required: true
 *         channel:
 *           type: string
 *           required: true
 *           description: Tasks of the same type will have the same channel.
 *         workgroup:
 *           type: string
 *           description: Use workgroups to manage tasks that may need to be paused together (to wait for rate limits).
 *         key:
 *           type: string
 *           description: A unique identifier for a task. Used to prevent duplicate tasks from being exectued more than once.
 *         remainingAttempts:
 *           type: integer
 *           default: 5
 *         priority:
 *           type: integer
 *           description: Tasks with a higher priority get acquired before tasks with a lower priority.
 *           default: 0
 *         runAfter:
 *           type: integer
 *           description: Task cannot be acquired until this date and time has passed.
 *         progressWeight:
 *           type: integer
 *           description: Relative amount that this task contributes to the overall task group progress.
 *           default: 1
 *         errorDelayInSeconds:
 *           type: integer
 *           description: The task cannot be acquired for this many seconds after a failure.
 *           default: 30
 *         input:
 *           type: object
 *           description: Input data that the worker will need to complete the task.
 *     Task:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateTask'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             taskGroupId:
 *               type: string
 *               required: true
 *             parentsComplete:
 *               type: boolean
 *               description: When true, all parents of the task have been completed.
 *             isComplete:
 *               type: boolean
 *               description: When true, the task has been completed.
 *             output:
 *               type: object
 *               description: Output data returned by the worker upon completing the task.
 *             errors:
 *               type: array
 *               items:
 *                 type: object
 *               description: Error data recieved for each failed attempt.
 *             createdAt:
 *               type: string
 *             assignedTo:
 *               type: string
 *               description: Id of the worker that acquired this task. Workers self-report their own ids when acquiring.
 *             assignedAt:
 *               type: string
 *               description: The timestamp when the task was acquired.
 */
export default class Task {
    _id?: ObjectId;
    taskGroupId: ObjectId;
    name: string;
    channel: string;
    workgroup: string | null;
    key: string | null;
    remainingAttempts: number;
    isPaused: boolean;
    parentsComplete: boolean;
    isComplete: boolean;
    priority: number;
    runAfter: Date | null;
    progressWeight: number;
    isSeed: boolean;
    errorDelayInSeconds: number;
    input: object | null;
    output: object | null;
    errors: object[];
    createdAt: Date;
    parentIds: ObjectId[];
    assignedTo: string | null;
    assignedAt: Date | null;
    constructor(taskGroupId: ObjectId, name: string, channel: string, input?: object | null, parentIds?: ObjectId[], isPaused?: boolean, workgroup?: string | null, key?: string | null, remainingAttempts?: number, priority?: number, progressWeight?: number, isSeed?: boolean);
    static findById(id: ObjectId): Promise<Task>;
    static updateById(id: ObjectId, updates: any): Promise<Task>;
    static findAllInGroup(taskGroupId: ObjectId, limit?: number, skip?: number): Promise<Task[]>;
    static findAllInChannel(limit: number | undefined, skip: number | undefined, channel: string): Promise<Task[]>;
    static getChannels(): Promise<any[]>;
    static fromData(taskGroupId: ObjectId, data: any): Promise<Task>;
    static findChildren(id: ObjectId): Promise<Task[]>;
    static findParents(id: ObjectId): Promise<Task[]>;
    static deleteById(id: ObjectId): Promise<any>;
    static resetById(id: ObjectId, remainingAttempts?: number): Promise<Task>;
    static retryById(id: ObjectId, remainingAttempts?: number): Promise<Task>;
    static pluckById(id: ObjectId): Promise<Task>;
    static acquireInChannel(channel: string, workerId: string): Promise<Task | null>;
    static release(id: ObjectId, workerId: string, error?: any, output?: any, children?: TaskChild[], workgroupDelayInSeconds?: number): Promise<Task>;
    static syncParentsComplete(task: Task): Promise<void>;
    static getParentsData(task: Task): Promise<any>;
    static syncParents(): Promise<number>;
    static operatorAcquire(id: ObjectId, workerId: string): Promise<Task | null>;
    static examine(id: ObjectId): Promise<any>;
}
//# sourceMappingURL=Task.d.ts.map