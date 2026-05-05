import { logger } from './index';

export const logResponseTime = (req: any, res: any, time: any) => {
    const loggerInstance = logger;
    const method = req.method;
    const url = req.url;
    const status = res.statusCode;

    loggerInstance.info({
        message: `method=${method} url=${url} status=${status} duration=${time}ms`,
        labels: { origin: 'api' },
    });
};
