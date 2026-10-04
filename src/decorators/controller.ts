import { IRouter, NextFunction, Request, Response, Router } from 'express';

type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

type ControllerOptions = {
    prefix: string;
};

type Handler = (req: Request, res: Response, next: NextFunction) => unknown;

type RouteOptions = {
    path: string;
    preHandler?: Handler[];
    postHandler?: Handler[];
};

type RouteItem = RouteOptions & {
    method: HttpMethod;
    handler: Handler;
};

// Keyed by the controller class itself (route decorators on static methods receive the class as `target`).
const routesByController = new Map<object, RouteItem[]>();
const controllers: { target: object; options: ControllerOptions }[] = [];

export function Controller(options: ControllerOptions): ClassDecorator {
    return (target) => {
        controllers.push({ target, options });
    };
}

function Route(method: HttpMethod, options: RouteOptions): MethodDecorator {
    return (target, _key, descriptor) => {
        if (typeof target !== 'function' || typeof descriptor.value !== 'function') {
            throw new Error('Route decorators can only be applied to static methods');
        }

        const routes = routesByController.get(target) ?? [];
        routes.push({ ...options, method, handler: descriptor.value as Handler });
        routesByController.set(target, routes);
    };
}

export const GET = (options: RouteOptions) => Route('get', options);
export const POST = (options: RouteOptions) => Route('post', options);
export const PATCH = (options: RouteOptions) => Route('patch', options);
export const DELETE = (options: RouteOptions) => Route('delete', options);

// Static paths before `:params` before wildcards, so a specific route is never shadowed.
function specificity(path: string) {
    const paramCount = (path.match(/:/g) ?? []).length;
    const wildcard = path.includes('*') ? 1000 : 0;
    return paramCount * 100 + wildcard - path.length;
}

export function setupController(parent: IRouter) {
    controllers.forEach(({ target, options }) => {
        const router = Router();
        const routes = routesByController.get(target) ?? [];

        [...routes]
            .sort((a, b) => specificity(a.path) - specificity(b.path))
            .forEach(({ method, path, preHandler = [], handler, postHandler = [] }) => {
                router[method](path, ...preHandler, handler, ...postHandler);
            });

        parent.use(options.prefix, router);
    });
}
