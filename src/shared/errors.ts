export class InvalidFiberRootError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidFiberRootError';
  }
}

export class FiberRootsNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FiberRootsNotFoundError';
  }
}

export class ComponentNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ComponentNotFoundError';
  }
}

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
  }
}
