/* global describe, it */
import fs from 'fs';
import assert from 'assert';
import {lintJSON} from '../dist/index.mjs';

describe('JSON parsing failures', () => {
	for (const file of fs.readdirSync('test/fails')) {
		it(file, () => {
			const data = fs.readFileSync(`test/fails/${file}`, 'utf8'),
				result = lintJSON(data);
			assert.strictEqual(result.length, 1);
			const [{severity, message, line, column, position}] = result;
			assert.strictEqual(severity, 'error');
			assert.strictEqual(typeof message, 'string');
			assert.ok(message.length > 0);
			const lines = data.slice(0, position).split('\n');
			assert.strictEqual(lines.length, line);
			// eslint-disable-next-line es-x/no-array-prototype-at, es-x/no-string-prototype-at
			assert.strictEqual(lines.at(-1).length + 1, column);
		});
	}
});

describe('JSON parsing passes', () => {
	for (const file of fs.readdirSync('test/passes')) {
		it(file, () => {
			const data = fs.readFileSync(`test/passes/${file}`, 'utf8');
			assert.strictEqual(lintJSON(data).length, 0);
		});
	}
});
