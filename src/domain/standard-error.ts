import { ErrorCode } from './errors';

export class StandardError extends Error {
    public error_code: ErrorCode;

    public context?: Record<string, unknown> | null;

    constructor(errorCode: ErrorCode, message: string, context?: Record<string, unknown> | null) {
        super(message);

        // So you can do typeof CustomError
        Object.setPrototypeOf(this, new.target.prototype);

        this.name = this.constructor.name;
        this.error_code = errorCode;
        this.context = context;
    }
}
