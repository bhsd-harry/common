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
			const [error] = result;
			if ('severity' in error) {
				assert.strictEqual(result[0].severity, 'error');
				assert.strictEqual(result[0].line, undefined);
				assert.strictEqual(result[0].column, undefined);
			} else {
				console.log(`\n${data}\n`);
			}
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
