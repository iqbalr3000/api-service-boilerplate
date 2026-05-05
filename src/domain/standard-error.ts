export class StandardError extends Error {
    public error_code: string;

    public lastError?: Record<string, unknown> | null;

    public context?: Record<string, unknown> | null;

    constructor(
        errorCode: string,
        message: string,
        lastError?: Record<string, unknown> | null,
        context?: Record<string, unknown> | null,
    ) {
        super(message);

        // So you can do typeof CustomError
        Object.setPrototypeOf(this, new.target.prototype);

        this.name = this.constructor.name;
        this.error_code = errorCode;
        this.lastError = lastError;
        this.context = context;
    }
}
