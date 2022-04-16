export default class TaskError extends Error {
  output: any = null
  constructor(msg: string, output: any) {
      super(msg);

      this.output = output
  }
}