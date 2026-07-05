export class DurableObject<Env = unknown> {
  protected readonly ctx: DurableObjectState;
  protected readonly env: Env;

  constructor(ctx: DurableObjectState, env: Env) {
    this.ctx = ctx;
    this.env = env;
  }
}

export class WorkflowEntrypoint<Env = unknown, Payload = unknown> {
  protected readonly env: Env;

  constructor(_ctx: unknown, env: Env) {
    this.env = env;
  }

  async run(_event: WorkflowEvent<Payload>, _step: WorkflowStep): Promise<void> {}
}

export interface WorkflowEvent<Payload = unknown> {
  payload: Payload;
}

export interface WorkflowStep {
  do?<T>(name: string, callback: () => Promise<T> | T): Promise<T>;
}
