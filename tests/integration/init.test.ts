import { getDB } from 'src/data-source';
import { init } from 'src/init';

describe('init()', () => {
    it('is successful', async () => {
        await init();
        const dataSource = getDB();
        expect(dataSource).toBeDefined();
        await dataSource.destroy();
    });
});
