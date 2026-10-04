import { resolve } from 'path';
import { addAlias } from 'module-alias';

addAlias('src', resolve(__dirname, './'));
