/// <reference types="node" />
import express from 'express';
import TaskGroup from './TaskGroup';
import Task from './Task';
import TaskChild from './TaskChild';
import Worker from './Worker';
import HttpWorker from './HttpWorker';
import WorkerGroup from './WorkerGroup';
import HttpWorkerGroup from './HttpWorkerGroup';
import TaskResponse from './TaskResponse';
import WorkerServer from './WorkerServer';
import WorkerServerInterface from './WorkerServerInterface';
import TaskError from './TaskError';
import { Socket, Server } from 'socket.io';
import http from 'http';
import Messenger from './Messenger';
import GoogleCloudTasksMessenger from './messengers/GoogleCloudTasksMessenger';
import InlineMessenger from './messengers/InlineMessenger';
interface CrewOptions {
    server: http.Server;
    io?: Server;
    authenticateSocket?: (socket: Socket, message: any) => boolean;
    messenger?: Messenger;
}
declare function crew(options: CrewOptions): express.Router;
export default crew;
export { crew, TaskGroup, Task, Worker, HttpWorker, WorkerGroup, HttpWorkerGroup, TaskResponse, TaskChild, TaskError, WorkerServer, WorkerServerInterface, Messenger, GoogleCloudTasksMessenger, InlineMessenger };
//# sourceMappingURL=crew.d.ts.map