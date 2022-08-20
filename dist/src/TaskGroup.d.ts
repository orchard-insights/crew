import { ObjectId } from 'mongodb';
/**
 * @openapi
 * components:
 *   schemas:
 *     CreateTaskGroup:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         isPaused:
 *           type: boolean
 *           description: When true, tasks in the group cannot be acquired by workers.
 *           default: false
 *     TaskGroup:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateTaskGroup'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             createdAt:
 *               type: string
 */
export default class TaskGroup {
    _id?: ObjectId;
    name: string;
    isPaused: boolean;
    createdAt: Date;
    constructor(name: string, isPaused: boolean);
    static findAll(limit?: number, skip?: number): Promise<TaskGroup[]>;
    static countAll(): Promise<number>;
    static findById(id: ObjectId): Promise<TaskGroup>;
    static updateById(id: ObjectId, updates: any): Promise<TaskGroup>;
    static fromData(data: any): Promise<TaskGroup>;
    static deleteById(id: ObjectId): Promise<any>;
    static retryById(id: ObjectId, remainingAttempts?: number): Promise<any>;
    static resetById(id: ObjectId, remainingAttempts?: number): Promise<TaskGroup>;
    static syncPauseById(id: ObjectId, isPaused?: boolean): Promise<TaskGroup>;
    static cleanExpired(limit?: number): Promise<TaskGroup[]>;
}
//# sourceMappingURL=TaskGroup.d.ts.map