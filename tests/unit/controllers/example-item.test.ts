import { Request, Response, NextFunction } from 'express';
import { ExampleItemController } from 'src/controllers/example-item';
import { ExampleItemService } from 'src/services/example-item';
import { StandardError } from 'src/domain/standard-error';
import { ErrorCodes } from 'src/domain/errors';

jest.mock('src/services/example-item');

describe('ExampleItemController', () => {
    const mockedService = ExampleItemService as jest.Mocked<typeof ExampleItemService>;
    const res = { status: undefined, json: undefined, send: undefined } as unknown as Response;
    const next = jest.fn() as jest.MockedFunction<NextFunction>;

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
        expect(next).not.toHaveBeenCalled();
    });

    it('create forwards a VALIDATION_ERROR StandardError when name is blank', async () => {
        await ExampleItemController.create({ body: { name: '  ' } } as Request, res, next);

        expect(mockedService.create).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0][0] as unknown as StandardError;
        expect(error).toBeInstanceOf(StandardError);
        expect(error.error_code).toBe(ErrorCodes.VALIDATION_ERROR);
    });

    it('getById forwards an ITEM_NOT_FOUND StandardError when missing', async () => {
        mockedService.findById.mockResolvedValueOnce(null);

        await ExampleItemController.getById({ params: { id: 'missing' } } as unknown as Request, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0][0] as unknown as StandardError;
        expect(error).toBeInstanceOf(StandardError);
        expect(error.error_code).toBe(ErrorCodes.ITEM_NOT_FOUND);
    });
});
