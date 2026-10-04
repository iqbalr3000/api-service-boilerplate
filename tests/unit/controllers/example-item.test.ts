import { Request, Response } from 'express';
import { ExampleItemController } from 'src/controllers/example-item';
import { ExampleItemCreatePayload, ExampleItemService } from 'src/services/example-item';
import { StandardError } from 'src/domain/standard-error';
import { ErrorCodes } from 'src/domain/errors';

jest.mock('src/services/example-item');

describe('ExampleItemController', () => {
    const mockedService = ExampleItemService as jest.Mocked<typeof ExampleItemService>;
    let res: Response;

    const createRequest = (name: string) => ({ body: { name } }) as Request<unknown, unknown, ExampleItemCreatePayload>;

    beforeEach(() => {
        jest.clearAllMocks();
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        } as unknown as Response;
    });

    it('create returns 201 with a trimmed name', async () => {
        mockedService.create.mockResolvedValueOnce({
            id: 'id-1',
            name: 'Item A',
            description: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await ExampleItemController.create(createRequest(' Item A '), res);

        expect(mockedService.create).toHaveBeenCalledWith({ name: 'Item A', description: undefined });
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('create rejects a blank name with VALIDATION_ERROR', async () => {
        await expect(ExampleItemController.create(createRequest('  '), res)).rejects.toMatchObject(
            new StandardError(ErrorCodes.VALIDATION_ERROR, 'name is required'),
        );

        expect(mockedService.create).not.toHaveBeenCalled();
    });

    it('getById rejects with ITEM_NOT_FOUND when missing', async () => {
        mockedService.findById.mockResolvedValueOnce(null);

        await expect(
            ExampleItemController.getById({ params: { id: 'missing' } } as unknown as Request<{ id: string }>, res),
        ).rejects.toMatchObject({ error_code: ErrorCodes.ITEM_NOT_FOUND });
    });
});
