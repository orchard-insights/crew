/// <reference types="node" />
import express from 'express';
import TaskGroup from './TaskGroup';
import Task from './Task';
import TaskChild from './TaskChild';
import Worker from './Worker';
import WorkerGroup from './WorkerGroup';
import TaskResponse from './TaskResponse';
import TaskError from './TaskError';
import { Socket, Server } from 'socket.io';
import http from 'http';
interface CrewOptions {
    server: http.Server;
    io?: Server;
    authenticateSocket?: (socket: Socket, message: any) => boolean;
}
declare function crew(options: CrewOptions): express.Router;
export default crew;
export { crew, TaskGroup, Task, Worker, WorkerGroup, TaskResponse, TaskChild, TaskError };
//# sourceMappingURL=crew.d.ts.map