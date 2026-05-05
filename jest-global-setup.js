/* eslint no-process-env: "off" */
/* eslint import/no-extraneous-dependencies: "off" */
/* eslint @typescript-eslint/no-var-requires: "off" */

// Why this file is .js and not .ts
// https://github.com/kulshekhar/ts-jest/issues/411

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

module.exports = async () => {
    const db = process.env.PGDATABASE;

    if (db && db !== 'test') {
        // eslint-disable-next-line
        console.error(`

        > jest-global-setup.js
        Running test on a non 'test' db will wipe out your entire db!
        PGDATABASE is specified as '${db}' and not 'test'. Aborting...

        `);
        throw new Error();
    }
};
