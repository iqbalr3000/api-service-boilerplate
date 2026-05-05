import { Request, Response, NextFunction } from 'express';
import { ExampleItemController } from 'src/controllers/example-item';
import { ExampleItemService } from 'src/services/example-item';

jest.mock('src/services/example-item');

describe('ExampleItemController', () => {
    const mockedService = ExampleItemService as jest.Mocked<typeof ExampleItemService>;
    const res = { status: undefined, json: undefined, send: undefined } as unknown as Response;
    const next = jest.fn() as NextFunction;

    beforeEach(() => {
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        res.send = jest.fn().mockReturnValue(res);
        jest.clearAllMocks();
    });

    it('create returns 201', async () => {
        mockedService.create.mockResolvedValueOnce({
            id: 'id-1',
            name: 'Item A',
            description: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await ExampleItemController.create({ body: { name: 'Item A' } } as Request, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
    });
});
