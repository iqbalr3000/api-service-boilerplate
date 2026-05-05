import { NextFunction, Request, Response } from 'express';
import { Controller, DELETE, GET, PATCH, POST } from 'src/decorators';
import { IDParams } from 'src/libs/shared';
import { ExampleItemService } from 'src/services/example-item';

@Controller({
    prefix: '/example-items',
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
                return res.status(404).json({
                    error_code: 'ITEM_NOT_FOUND',
                    message: 'Example item not found',
                });
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
            if (!name || !name.trim()) {
                return res.status(400).json({
                    error_code: 'VALIDATION_ERROR',
                    message: 'name is required',
                });
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
                return res.status(400).json({
                    error_code: 'VALIDATION_ERROR',
                    message: 'name cannot be empty',
                });
            }

            const item = await ExampleItemService.update(id, {
                name: name?.trim(),
                description,
            });

            if (!item) {
                return res.status(404).json({
                    error_code: 'ITEM_NOT_FOUND',
                    message: 'Example item not found',
                });
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
                return res.status(404).json({
                    error_code: 'ITEM_NOT_FOUND',
                    message: 'Example item not found',
                });
            }

            return res.status(204).send();
        } catch (error) {
            return next(error);
        }
    }
}
