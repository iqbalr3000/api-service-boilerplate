import { IRouter, NextFunction, Request, Response, Router } from 'express';

type ControllerOptions = {
    prefix: string;
};

type Handler = (req: Request, res: Response, next: NextFunction) => unknown;

type RouteItem = {
    path: string;
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    handler: Handler;
    preHandler?: Handler[];
    postHandler?: Handler[];
};

type RouteOptions = {
    path: string;
    method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
    preHandler?: Handler[];
    postHandler?: Handler[];
};

type GetRouteOptions = Omit<RouteOptions, 'method'>;
type PostRouteOptions = Omit<RouteOptions, 'method'>;
type PatchRouteOptions = Omit<RouteOptions, 'method'>;

type ControllerClass = {
    options: ControllerOptions;
    routes: RouteItem[];
};

const controllerList: ControllerClass[] = [];

export function Controller(options: ControllerOptions): ClassDecorator {
    return (target) => {
        Reflect.set(target, 'options', options);
        controllerList.push(target as unknown as ControllerClass);
    };
}

export function Route(options: RouteOptions): MethodDecorator {
    return (target, _key, descriptor) => {
        if (typeof target !== 'function') {
            throw new Error('Route decorator can only be applied to static methods');
        }
        const routes: RouteItem[] = Reflect.get(target, 'routes') || [];

        routes.push({
            ...options,
            method: options.method || 'get',
            handler: descriptor.value as Handler,
        });
        Reflect.set(target, 'routes', routes);
    };
}

export function GET(options: GetRouteOptions): MethodDecorator {
    return Route({ ...options, method: 'get' });
}

export function POST(options: PostRouteOptions): MethodDecorator {
    return Route({ ...options, method: 'post' });
}

export function PATCH(options: PatchRouteOptions): MethodDecorator {
    return Route({ ...options, method: 'patch' });
}

export function DELETE(options: Omit<RouteOptions, 'method'>): MethodDecorator {
    return Route({ ...options, method: 'delete' });
}

export function setupController(parent: IRouter) {
    const score = (path: string) => {
        const paramCount = (path.match(/:/g) || []).length;
        const wildcard = path.includes('*') ? 1000 : 0;
        return paramCount * 100 + wildcard - path.length;
    };

    controllerList.forEach((controller) => {
        const router = Router();
        const options = Reflect.get(controller, 'options') as ControllerOptions;
        const routes = (Reflect.get(controller, 'routes') as RouteItem[]) || [];

        const sortedRoutes = [...routes].sort((a, b) => score(a.path) - score(b.path));
        sortedRoutes.forEach((route) => {
            const { preHandler = [], postHandler = [] } = route;
            router[route.method](route.path, ...preHandler, route.handler, ...postHandler);
        });

        parent.use(options.prefix, router);
    });
}
