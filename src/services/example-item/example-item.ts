import { Initializer } from 'src/decorators';
import { ExampleItem } from 'src/domain/example-item';
import { getExampleItemRepository, ExampleItemRepository } from 'src/libs/typeorm/example-item';
import { ExampleItemCreatePayload, ExampleItemUpdatePayload } from './types';

export class ExampleItemService {
    private static exampleItemRepository: ExampleItemRepository;

    @Initializer()
    static init() {
        this.exampleItemRepository = getExampleItemRepository();
    }

    static async list(): Promise<ExampleItem[]> {
        return this.exampleItemRepository.find({ order: { createdAt: 'DESC' } });
    }

    static async findById(id: string): Promise<ExampleItem | null> {
        return this.exampleItemRepository.findOneBy({ id });
    }

    static async create(payload: ExampleItemCreatePayload): Promise<ExampleItem> {
        return this.exampleItemRepository.save(
            this.exampleItemRepository.create({
                name: payload.name,
                description: payload.description ?? null,
            }),
        );
    }

    static async update(id: string, payload: ExampleItemUpdatePayload): Promise<ExampleItem | null> {
        const existing = await this.exampleItemRepository.findOneBy({ id });
        if (!existing) {
            return null;
        }

        this.exampleItemRepository.merge(existing, {
            ...(payload.name !== undefined ? { name: payload.name } : {}),
            ...(payload.description !== undefined ? { description: payload.description } : {}),
        });

        return this.exampleItemRepository.save(existing);
    }

    static async delete(id: string): Promise<boolean> {
        const result = await this.exampleItemRepository.delete({ id });
        return (result.affected ?? 0) > 0;
    }
}
