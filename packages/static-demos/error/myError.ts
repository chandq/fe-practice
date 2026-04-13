export default class MyError<T> extends Error {
  data: T;

  constructor(message: string, data?: T) {
    super(message);
    // 某些经过es6转es5会导致属性丢失
    Object.defineProperty(this, 'message', {
      configurable: true,
      enumerable: false,
      value: message,
      writable: true,
    });

    Object.defineProperty(this, 'name', {
      configurable: true,
      enumerable: false,
      value: this.constructor.name,
      writable: true,
    });

    this.data = data as any;

    if (Object.prototype.hasOwnProperty.call(Error, 'captureStackTrace')) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      Object.defineProperty(this, 'stack', {
        configurable: true,
        enumerable: false,
        value: new Error(message).stack,
        writable: true,
      });
    }
  }
}
