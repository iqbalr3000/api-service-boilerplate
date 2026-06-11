import { NextFunction, Request, Response } from 'express';
import { Controller, DELETE, GET, PATCH, POST } from 'src/decorators';
import { IDParams } from 'src/libs/shared';
import { StandardError } from 'src/domain/standard-error';
import { ErrorCodes } from 'src/domain/errors';
import { ExampleItemService } from 'src/services/example-item';

@Controller({
    prefix: '/api/v1/example-items',
})
export class ExampleItemController {
    @GET({ path: '' })
    static async list(_req: Request, res: Response, next: NextFunction) {
        try {
            const data = await ExampleItemService.list();
            return res.status(200).json({ data });
        } catch (error) {
            return next(error);
        }
    }

    @GET({ path: '/:id' })
    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params as IDParams;
            const item = await ExampleItemService.findById(id);
            if (!item) {
                throw new StandardError(ErrorCodes.ITEM_NOT_FOUND, 'Example item not found');
            }

            return res.status(200).json(item);
        } catch (error) {
            return next(error);
        }
    }

    @POST({ path: '' })
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, description } = req.body as { name?: string; description?: string };
            // OpenAPI validation already enforces `name` is a required string; here we additionally
            // reject empty/whitespace-only values, which the schema cannot express.
            if (!name || !name.trim()) {
                throw new StandardError(ErrorCodes.VALIDATION_ERROR, 'name is required');
            }

            const item = await ExampleItemService.create({ name: name.trim(), description });
            return res.status(201).json(item);
        } catch (error) {
            return next(error);
        }
    }

    @PATCH({ path: '/:id' })
    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params as IDParams;
            const { name, description } = req.body as { name?: string; description?: string };
            if (name !== undefined && !name.trim()) {
                throw new StandardError(ErrorCodes.VALIDATION_ERROR, 'name cannot be empty');
            }

            const item = await ExampleItemService.update(id, {
                name: name?.trim(),
                description,
            });

            if (!item) {
                throw new StandardError(ErrorCodes.ITEM_NOT_FOUND, 'Example item not found');
            }

            return res.status(200).json(item);
        } catch (error) {
            return next(error);
        }
    }

    @DELETE({ path: '/:id' })
    static async remove(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params as IDParams;
            const deleted = await ExampleItemService.delete(id);
            if (!deleted) {
                throw new StandardError(ErrorCodes.ITEM_NOT_FOUND, 'Example item not found');
            }

            return res.status(204).send();
        } catch (error) {
            return next(error);
        }
    }
}
