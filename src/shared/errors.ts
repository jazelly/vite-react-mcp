export class InvalidFiberRootError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidFiberRootError';
  }
}
