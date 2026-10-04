import { Request, Response } from 'express';
import { Controller, DELETE, GET, PATCH, POST } from 'src/decorators';
import { StandardError } from 'src/domain/standard-error';
import { ErrorCodes } from 'src/domain/errors';
import { ExampleItemCreatePayload, ExampleItemService, ExampleItemUpdatePayload } from 'src/services/example-item';

type IdParams = { id: string };

function notFound() {
    return new StandardError(ErrorCodes.ITEM_NOT_FOUND, 'Example item not found');
}

// Express 5 forwards rejected promises from handlers to the error middleware — no try/catch needed.
@Controller({
    prefix: '/api/v1/example-items',
})
export class ExampleItemController {
    @GET({ path: '' })
    static async list(_req: Request, res: Response) {
        const data = await ExampleItemService.list();
        res.status(200).json({ data });
    }

    @GET({ path: '/:id' })
    static async getById(req: Request<IdParams>, res: Response) {
        const item = await ExampleItemService.findById(req.params.id);
        if (!item) {
            throw notFound();
        }

        res.status(200).json(item);
    }

    @POST({ path: '' })
    static async create(req: Request<unknown, unknown, ExampleItemCreatePayload>, res: Response) {
        const { name, description } = req.body;
        // OpenAPI validation already enforces `name` is a required string; here we additionally
        // reject empty/whitespace-only values, which the schema cannot express.
        if (!name.trim()) {
            throw new StandardError(ErrorCodes.VALIDATION_ERROR, 'name is required');
        }

        const item = await ExampleItemService.create({ name: name.trim(), description });
        res.status(201).json(item);
    }

    @PATCH({ path: '/:id' })
    static async update(req: Request<IdParams, unknown, ExampleItemUpdatePayload>, res: Response) {
        const { name, description } = req.body;
        if (name !== undefined && !name.trim()) {
            throw new StandardError(ErrorCodes.VALIDATION_ERROR, 'name cannot be empty');
        }

        const item = await ExampleItemService.update(req.params.id, { name: name?.trim(), description });
        if (!item) {
            throw notFound();
        }

        res.status(200).json(item);
    }

    @DELETE({ path: '/:id' })
    static async remove(req: Request<IdParams>, res: Response) {
        const deleted = await ExampleItemService.delete(req.params.id);
        if (!deleted) {
            throw notFound();
        }

        res.status(204).send();
    }
}
