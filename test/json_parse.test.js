/* global describe, it */
import fs from 'fs';
import assert from 'assert';
import {lintJSON} from '../dist/index.mjs';

const isValid = data => {
	assert.strictEqual(lintJSON(data).length, 0, data);
};

const isInvalid = (data, s = 'error', n = 1) => {
	let m;
	if (s !== 'error' && s !== 'warning') {
		m = s;
		s = 'error'; // eslint-disable-line no-param-reassign
	}
	const result = lintJSON(data);
	assert.strictEqual(result.length, n, data);
	const [{severity, message, line, column, position}] = result;
	assert.strictEqual(severity, s);
	if (s === 'error') {
		try {
			JSON.parse(data);
			throw new Error('Should fail JSON.parse()');
		} catch (e) {
			assert.ok(e instanceof SyntaxError);
			if (e.message === message) {
				console.log(`\n${data}\n`);
			}
		}
	}
	if (m) {
		assert.strictEqual(message, m);
	} else {
		assert.strictEqual(typeof message, 'string');
		assert.ok(message.length > 0);
	}
	assert.ok(position > 0 || message === "Unexpected '/'", data);
	const lines = data.slice(0, position).split('\n');
	assert.strictEqual(lines.length, line);
	// eslint-disable-next-line es-x/no-array-prototype-at, es-x/no-string-prototype-at
	assert.strictEqual(lines.at(-1).length + 1, column);
};

describe('JSON parsing passes', () => {
	for (const file of fs.readdirSync('test/passes')) {
		it(file, () => {
			const data = fs.readFileSync(`test/passes/${file}`, 'utf8');
			isValid(data);
		});
	}
});

describe('JSON parsing failures', () => {
	for (const file of fs.readdirSync('test/fails')) {
		it(file, () => {
			const data = fs.readFileSync(`test/fails/${file}`, 'utf8');
			isInvalid(data);
		});
	}
});

describe('vscode-json-languageservice invalid cases', () => {
	it('Invalid body', () => {
		isInvalid(' *', "Unexpected '*'");
		isInvalid('{}[]', 'Syntax error');
	});

	it('Trailing Whitespace', () => {
		isValid('{}\n\n');
	});

	it('No content', () => {
		isValid('');
		isValid('   ');
		isValid('\n\n');
		isInvalid('/*hello*/  ', "Unexpected '/'");
	});

	it('Objects', () => {
		isValid('{}');
		isValid('{"key": "value"}');
		isValid('{"key1": true, "key2": 3, "key3": [null], "key4": { "nested": {}}}');
		isValid('{"constructor": true }');
		isInvalid('{', 'Bad object');
		isInvalid('{3:3}', 'Bad string');
		isInvalid("{'key': 3}", 'Bad string');
		isInvalid('{"key" 3}', "Expected ':' instead of '3'");
		isInvalid('{"key":3 "key2": 4}', `Expected ',' instead of '"'`);
		isInvalid('{"key":42, }', 'Bad string');
		isInvalid('{"key:42', 'Bad string');
	});

	it('Arrays', () => {
		isValid('[]');
		isValid('[1, 2]');
		isValid('[1, "string", false, {}, [null]]');
		isInvalid('[', 'Bad array');
		isInvalid('[,]', "Unexpected ','");
		isInvalid('[1 2]', "Expected ',' instead of '2'");
		isInvalid('[true false]', "Expected ',' instead of 'f'");
		isInvalid('[1, ]', "Unexpected ']'");
		isInvalid('[[]', "Expected ',' instead of ''");
		isInvalid('["something"', "Expected ',' instead of ''");
		isInvalid('[magic]', "Unexpected 'm'");
	});

	it('Strings', () => {
		isValid('["string"]');
		isValid(String.raw`["\"\\\/\b\f\n\r\t\u1234\u12AB"]`);
		isValid(String.raw`["\\"]`);
		isInvalid('["', 'Bad string');
		isInvalid('["]', 'Bad string');
		isInvalid(String.raw`["\z"]`, 'Bad string');
		isInvalid(String.raw`["\u"]`, 'Bad string');
		isInvalid(String.raw`["\u123"]`, 'Bad string');
		isInvalid(String.raw`["\u123Z"]`);
		isInvalid("['string']", "Unexpected '''");
		isInvalid('"\tabc"');
	});

	it('Numbers', () => {
		isValid('[0, -1, 186.1, 0.123, -1.583e+4, 1.583E-4, 5e8]');
		isInvalid('[+1]', "Unexpected '+'");
		isInvalid('[01]');
		isInvalid('[1.]');
		isInvalid('[1.1+3]', "Expected ',' instead of '+'");
		isInvalid('[1.4e]', 'Bad number');
		isInvalid('[-A]', 'Bad number');
	});

	it('Comments', () => {
		isInvalid('/*d*/ { } /*e*/', "Unexpected '/'");
		isInvalid('/*d { }', "Unexpected '/'");
		isInvalid('{ "//": "comment1", "//": "comment2" }', 'warning');
		isInvalid('{ "regularKey": "value1", "regularKey": "value2" }', 'warning');
	});

	it('Simple AST', () => {
		isValid('{}');
		isValid('[null]');
		isValid('{"a":true}');
	});

	it('Nested AST', () => {
		isValid('{\n\t"key" : {\n\t"key2": 42\n\t}\n}');
	});

	it('Nested AST in Array', () => {
		isValid('{"key":[{"key2":42}]}');
	});

	it('Multiline', () => {
		isValid('{\n\t\n}');
		isValid('{\n"first":true\n\n}');
	});

	it('Expand errors to entire tokens', () => {
		isInvalid('{\n"key":32,\nerror\n}', 'Bad string');
	});

	it('Errors at the end of the file', () => {
		isInvalid('{\n"key":32\n ', "Expected ',' instead of ''");
	});

	it('Getting keys out of an object', () => {
		isValid('{\n"key":32,\n\n"key2":45}');
	});

	it('Missing colon', () => {
		isInvalid('{\n"key":32,\n"key2"\n"key3": 4 }', `Expected ':' instead of '"'`);
	});

	it('Missing comma', () => {
		isInvalid('{\n"key":32,\n"key2": 1 \n"key3": 4 }', `Expected ',' instead of '"'`);
	});

	it('Duplicate keys', () => {
		isInvalid('{"a": 1, "a": 2}', 'warning');
		isInvalid('{"a": { "a": 2, "a": 3}}', 'warning');
		isInvalid('[{ "a": 2, "a": 3, "a": 7}]', 'warning', 2);
	});

	it('Strings with spaces', () => {
		isValid('{"key1":"first string", "key2":["second string"]}');
	});

	it('parse with comments', () => {
		isInvalid('// comment\n{\n"far": "boo"\n}', "Unexpected '/'");
		isInvalid('/* comm\nent\nent */\n{\n"far": "boo"\n}', "Unexpected '/'");
		isValid('{\n"far": "boo"\n}');
	});

	it('parse with comments collected', () => {
		isInvalid('// comment\n{\n"far": "boo"\n}', "Unexpected '/'");
		isInvalid('/* comm\nent\nent */\n{\n"far": "boo"\n}', "Unexpected '/'");
		isValid('{\n"far": "boo"\n}');
	});

	it('validate DocumentLanguageSettings: trailingCommas', () => {
		isInvalid('{ "pages": [  "pages/index", "pages/log", ] }', "Unexpected ']'");
	});

	it('validate DocumentLanguageSettings: comments', () => {
		isInvalid('{ "count": 1 /* change */ }', "Expected ',' instead of '/'");
	});
});
