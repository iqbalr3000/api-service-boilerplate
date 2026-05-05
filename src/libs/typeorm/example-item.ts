import { getDB } from 'src/data-source';
import { ExampleItem } from 'src/domain/example-item';

export function getExampleItemRepository() {
    return getDB().getRepository(ExampleItem);
}

export type ExampleItemRepository = ReturnType<typeof getExampleItemRepository>;
