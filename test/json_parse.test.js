import fs from 'fs';
import path from 'path';
import assert from 'assert';
import {jsonLanguage, jsoncLanguage} from '@bhsd/lezer-json';
import {lintJSON, lintJSONNative, lintJSONC} from '../dist/index.js';

const offsetMsg = new Set(['Bad escaped character', 'Bad control character']),
	jsonParser = jsonLanguage.parser.configure({strict: true}),
	jsoncParser = jsoncLanguage.parser.configure({strict: true});

const isValidForLezer = (data, jsonc) => {
	if ((jsonc ? data.replaceAll(/\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/gu, '') : data).trim()) {
		(jsonc ? jsoncParser : jsonParser).parse(data);
	}
};

const isValid = (data, jsonc = false) => {
	assert.strictEqual(typeof jsonc, 'boolean');
	assert.strictEqual((jsonc ? lintJSONC : lintJSON)(data).length, 0, data);
	isValidForLezer(data, jsonc);
};

const match = (data, from, line, column) => {
	const lines = data.slice(0, from).split('\n');
	assert.strictEqual(lines.length, line);
	assert.strictEqual(lines.at(-1).length + 1, column);
};

const isInvalid = (data, s = 'error', jsonc = false, n = 1) => {
	assert.strictEqual(typeof s, 'string');
	assert.strictEqual(typeof jsonc, 'boolean');
	assert.strictEqual(typeof n, 'number');
	let m;
	if (s === 'error') {
		throw new RangeError('Missing error message');
	} else if (s !== 'warning') {
		m = s;
		s = 'error'; // eslint-disable-line no-param-reassign
	}
	const result = (jsonc ? lintJSONC : lintJSON)(data);
	assert.strictEqual(result.length, n, data);
	const [{severity, message, line, column, from, to = from, endLine = line, endColumn = column}] = result;
	assert.strictEqual(severity, s, data);
	if (!jsonc && s === 'error') {
		const [e] = lintJSONNative(data);
		assert.ok(e, data);
		assert.notStrictEqual(e.message, message, data);
		if (e.from) {
			if (message.startsWith('Trailing comma in ')) {
				assert.ok(e.from >= to, data);
				assert.strictEqual(data.slice(to, e.from).trim(), '', data);
			} else {
				const offset = offsetMsg.has(message) ? 1 : 0,
					newline = data[e.from] === '\n' ? offset : 0;
				assert.strictEqual(e.from + offset, to, data);
				assert.strictEqual(e.line + newline, endLine, data);
				assert.strictEqual(newline ? 1 : e.column + offset, endColumn, data);
			}
		}
	}
	if (m) {
		assert.strictEqual(message, m, data);
	} else {
		assert.strictEqual(typeof message, 'string');
		assert.ok(message.length > 0);
	}
	assert.ok(to > 0 || message === 'Unexpected "/"', data);
	match(data, from, line, column);
	match(data, to, endLine, endColumn);
	if (s === 'warning') {
		isValidForLezer(data, jsonc);
	} else if (jsonc) {
		try {
			jsoncParser.parse(data);
			assert.fail('Expected Lezer parser to fail');
		} catch (e) {
			assert.ok(e instanceof SyntaxError, data);
		}
	}
};

describe('JSON Lint', () => {
	for (const file of fs.globSync('test/passes/*.json')) {
		it(path.basename(file), () => {
			const data = fs.readFileSync(file, 'utf8');
			isValid(data);
		});
	}

	it('JSON parsing failures', () => {
		isInvalid('["Unclosed array"', 'Expected "," or "]" instead of end of input');
		isInvalid('{unquoted_key: "keys must be quoted"}', `Expected '"' instead of "u"`);
		isInvalid('["extra comma",]', 'Trailing comma in array');
		isInvalid('["double extra comma",,]', 'Unexpected ","');
		isInvalid('[   , "<-- missing value"]', 'Unexpected ","');
		isInvalid('["Comma after the close"],', 'Syntax error');
		isInvalid('["Extra close"]]', 'Syntax error');
		isInvalid('{"Extra comma": true,}', 'Trailing comma in object');
		isInvalid('{"Extra value after close": true} "misplaced quoted value"', 'Syntax error');
		isInvalid('{"Illegal expression": 1 + 2}', 'Expected "," or "}" instead of "+"');
		isInvalid('{"Illegal invocation": alert()}', 'Unexpected "a"');
		isInvalid('{"Numbers cannot have leading zeroes": 013}', 'Bad number');
		isInvalid('{"Numbers cannot be hex": 0x14}', 'Expected "," or "}" instead of "x"');
		isInvalid(String.raw`["Illegal backslash escape: \x15"]`, 'Bad escaped character');
		isInvalid(String.raw`[\naked]`, String.raw`Unexpected "\\"`);
		isInvalid(String.raw`["Illegal backslash escape: \017"]`, 'Bad escaped character');
		isInvalid('{"Missing colon" null}', 'Expected ":" instead of "n"');
		isInvalid('{"Double colon":: null}', 'Unexpected ":"');
		isInvalid('{"Comma instead of colon", null}', 'Expected ":" instead of ","');
		isInvalid('["Colon instead of comma": false]', 'Expected "," or "]" instead of ":"');
		isInvalid('["Bad value", truth]', 'Expected "e" instead of "t"');
		isInvalid("['single quote']", `Unexpected "'"`);
		// eslint-disable-next-line @stylistic/no-tabs
		isInvalid('["	tab	character	in	string	"]', 'Bad control character');
		isInvalid(String.raw`["tab\   character\   in\  string\  "]`, 'Bad escaped character');
		isInvalid('["line\nbreak"]', 'Bad control character');
		isInvalid(
			String.raw`["line\
break"]`,
			'Bad escaped character',
		);
		isInvalid('[0e]', 'Bad number');
		isInvalid('[0e+]', 'Bad number');
		isInvalid('[0e+-1]', 'Bad number');
		isInvalid('{"Comma instead if closing brace": true,', `Expected '"'`);
		isInvalid('["mismatch"}', 'Expected "," or "]" instead of "}"');
		isInvalid('{"extra brace": 1}}', 'Syntax error');
	});
});

describe('vscode-json-languageservice for JSON', () => {
	it('Invalid body', () => {
		isInvalid(' *', 'Unexpected "*"');
		isInvalid('{}[]', 'Syntax error');
	});

	it('Trailing Whitespace', () => {
		isValid('{}\n\n');
	});

	it('No content', () => {
		isValid('');
		isValid(' '.repeat(3));
		isValid('\n\n');
		isInvalid('/*hello*/  ', 'Unexpected "/"');
	});

	it('Objects', () => {
		isValid('{}');
		isValid('{"key": "value"}');
		isValid('{"key1": true, "key2": 3, "key3": [null], "key4": { "nested": {}}}');
		isValid('{"constructor": true }');
		isInvalid('{', `Expected '"'`);
		isInvalid('{3:3}', `Expected '"' instead of "3"`);
		isInvalid("{'key': 3}", `Expected '"' instead of "'"`);
		isInvalid('{"key" 3}', 'Expected ":" instead of "3"');
		isInvalid('{"key":3 "key2": 4}', `Expected "," or "}" instead of '"'`);
		isInvalid('{"key":42, }', 'Trailing comma in object');
		isInvalid('{"key:42', 'Unterminated string');
	});

	it('Arrays', () => {
		isValid('[]');
		isValid('[1, 2]');
		isValid('[1, "string", false, {}, [null]]');
		isInvalid('[', 'Unterminated array');
		isInvalid('[,]', 'Unexpected ","');
		isInvalid('[1 2]', 'Expected "," or "]" instead of "2"');
		isInvalid('[true false]', 'Expected "," or "]" instead of "f"');
		isInvalid('[1, ]', 'Trailing comma in array');
		isInvalid('[[]', 'Expected "," or "]" instead of end of input');
		isInvalid('["something"', 'Expected "," or "]" instead of end of input');
		isInvalid('[magic]', 'Unexpected "m"');
	});

	it('Strings', () => {
		isValid('["string"]');
		isValid(String.raw`["\"\\\/\b\f\n\r\t\u1234\u12AB"]`);
		isValid(String.raw`["\\"]`);
		isInvalid('["', 'Unterminated string');
		isInvalid('["]', 'Unterminated string');
		isInvalid(String.raw`["\z"]`, 'Bad escaped character');
		isInvalid(String.raw`["\u"]`, 'Bad unicode escape');
		isInvalid(String.raw`["\u123"]`, 'Bad unicode escape');
		isInvalid(String.raw`["\u123Z"]`, 'Bad unicode escape');
		isInvalid("['string']", `Unexpected "'"`);
		isInvalid('"\tabc"', 'Bad control character');
	});

	it('Numbers', () => {
		isValid('[0, -1, 186.1, 0.123, -1.583e+4, 1.583E-4, 5e8]');
		isInvalid('[+1]', 'Unexpected "+"');
		isInvalid('[01]', 'Bad number');
		isInvalid('[1.]', 'Unterminated fractional number');
		isInvalid('[1.1+3]', 'Expected "," or "]" instead of "+"');
		isInvalid('[1.4e]', 'Bad number');
		isInvalid('[-A]', 'No number after minus sign');
	});

	it('Comments', () => {
		isInvalid('/*d*/ { } /*e*/', 'Unexpected "/"');
		isInvalid('/*d { }', 'Unexpected "/"');
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
		isInvalid('{\n"key":32,\nerror\n}', `Expected '"' instead of "e"`);
	});

	it('Errors at the end of the file', () => {
		isInvalid('{\n"key":32\n ', 'Expected "," or "}" instead of end of input');
	});

	it('Getting keys out of an object', () => {
		isValid('{\n"key":32,\n\n"key2":45}');
	});

	it('Missing colon', () => {
		isInvalid('{\n"key":32,\n"key2"\n"key3": 4 }', `Expected ":" instead of '"'`);
	});

	it('Missing comma', () => {
		isInvalid('{\n"key":32,\n"key2": 1 \n"key3": 4 }', `Expected "," or "}" instead of '"'`);
	});

	it('Duplicate keys', () => {
		isInvalid('{"a": 1, "a": 2}', 'warning');
		isInvalid('{"a": { "a": 2, "a": 3}}', 'warning');
		isInvalid('[{ "a": 2, "a": 3, "a": 7}]', 'warning', false, 2);
	});

	it('Strings with spaces', () => {
		isValid('{"key1":"first string", "key2":["second string"]}');
	});

	it('parse with comments', () => {
		isInvalid('// comment\n{\n"far": "boo"\n}', 'Unexpected "/"');
		isInvalid('/* comm\nent\nent */\n{\n"far": "boo"\n}', 'Unexpected "/"');
		isValid('{\n"far": "boo"\n}');
	});

	it('parse with comments collected', () => {
		isInvalid('// comment\n{\n"far": "boo"\n}', 'Unexpected "/"');
		isInvalid('/* comm\nent\nent */\n{\n"far": "boo"\n}', 'Unexpected "/"');
		isValid('{\n"far": "boo"\n}');
	});

	it('validate DocumentLanguageSettings: trailingCommas', () => {
		isInvalid('{ "pages": [  "pages/index", "pages/log", ] }', 'Trailing comma in array');
	});

	it('validate DocumentLanguageSettings: comments', () => {
		isInvalid('{ "count": 1 /* change */ }', 'Expected "," or "}" instead of "/"');
	});
});

describe('vscode-json-languageservice for JSONC', () => {
	it('Invalid body', () => {
		isInvalid(' *', 'Unexpected "*"', true);
		isInvalid('{}[]', 'Syntax error', true);
	});

	it('No content', () => {
		isValid('/*hello*/  ', true);
	});

	it('Objects', () => {
		isInvalid('{', `Expected '"'`, true);
		isInvalid('{3:3}', `Expected '"' instead of "3"`, true);
		isInvalid("{'key': 3}", `Expected '"' instead of "'"`, true);
		isInvalid('{"key" 3}', 'Expected ":" instead of "3"', true);
		isInvalid('{"key":3 "key2": 4}', `Expected "," or "}" instead of '"'`, true);
		isValid('{"key":42, }', true);
		isInvalid('{"key:42', 'Unterminated string', true);
	});

	it('Arrays', () => {
		isInvalid('[', 'Unterminated array', true);
		isValid('[,]', true);
		isInvalid('[1 2]', 'Expected "," or "]" instead of "2"', true);
		isInvalid('[true false]', 'Expected "," or "]" instead of "f"', true);
		isValid('[1, ]', true);
		isInvalid('[[]', 'Expected "," or "]" instead of end of input', true);
		isInvalid('["something"', 'Expected "," or "]" instead of end of input', true);
		isInvalid('[magic]', 'Unexpected "m"', true);
	});

	it('Strings', () => {
		isInvalid('["', 'Unterminated string', true);
		isInvalid('["]', 'Unterminated string', true);
		isInvalid(String.raw`["\z"]`, 'Bad escaped character', true);
		isInvalid(String.raw`["\u"]`, 'Bad unicode escape', true);
		isInvalid(String.raw`["\u123"]`, 'Bad unicode escape', true);
		isInvalid(String.raw`["\u123Z"]`, 'Bad unicode escape', true);
		isInvalid("['string']", `Unexpected "'"`, true);
		isInvalid('"\tabc"', 'Bad control character', true);
	});

	it('Numbers', () => {
		isInvalid('[+1]', 'Unexpected "+"', true);
		isInvalid('[01]', 'Bad number', true);
		isInvalid('[1.]', 'Unterminated fractional number', true);
		isInvalid('[1.1+3]', 'Expected "," or "]" instead of "+"', true);
		isInvalid('[1.4e]', 'Bad number', true);
		isInvalid('[-A]', 'No number after minus sign', true);
	});

	it('Comments', () => {
		isValid('/*d*/ { } /*e*/', true);
		isValid('/*d { }', true);
		isInvalid('{ "//": "comment1", "//": "comment2" }', 'warning');
		isInvalid('{ "regularKey": "value1", "regularKey": "value2" }', 'warning', true);
	});

	it('Expand errors to entire tokens', () => {
		isInvalid('{\n"key":32,\nerror\n}', `Expected '"' instead of "e"`, true);
	});

	it('Errors at the end of the file', () => {
		isInvalid('{\n"key":32\n ', 'Expected "," or "}" instead of end of input', true);
	});

	it('Missing colon', () => {
		isInvalid('{\n"key":32,\n"key2"\n"key3": 4 }', `Expected ":" instead of '"'`, true);
	});

	it('Missing comma', () => {
		isInvalid('{\n"key":32,\n"key2": 1 \n"key3": 4 }', `Expected "," or "}" instead of '"'`, true);
	});

	it('Duplicate keys', () => {
		isInvalid('{"a": 1, "a": 2}', 'warning', true);
		isInvalid('{"a": { "a": 2, "a": 3}}', 'warning', true);
		isInvalid('[{ "a": 2, "a": 3, "a": 7}]', 'warning', true, 2);
	});

	it('parse with comments', () => {
		isValid('// comment\n{\n"far": "boo"\n}', true);
		isValid('/* comm\nent\nent */\n{\n"far": "boo"\n}', true);
	});

	it('parse with comments collected', () => {
		isValid('// comment\n{\n"far": "boo"\n}', true);
		isValid('/* comm\nent\nent */\n{\n"far": "boo"\n}', true);
	});

	it('validate DocumentLanguageSettings: trailingCommas', () => {
		isValid('{ "pages": [  "pages/index", "pages/log", ] }', true);
	});

	it('validate DocumentLanguageSettings: comments', () => {
		isValid('{ "count": 1 /* change */ }', true);
	});
});

describe('jsonc-parser', () => {
	it('parse: literals', () => {
		isValid('true', true);
		isValid('false', true);
		isValid('null', true);
		isValid('"foo"', true);
		isValid(String.raw`"\"-\\-\/-\b-\f-\n-\r-\t"`, true);
		isValid(String.raw`"\u00DC"`, true);
		isValid('9', true);
		isValid('-9', true);
		isValid('0.129', true);
		isValid('23e3', true);
		isValid('1.2E+3', true);
		isValid('1.2E-3', true);
		isValid('1.2E-3 // comment', true);
	});

	it('parse: objects', () => {
		isValid('{}', true);
		isValid('{ "foo": true }', true);
		isValid('{ "bar": 8, "xoo": "foo" }', true);
		isValid('{ "hello": [], "world": {} }', true);
		isValid('{ "a": false, "b": true, "c": [ 7.4 ] }', true);
		isValid(
			'{ "lineComment": "//", "blockComment": ["/*", "*/"], "brackets": [ ["{", "}"], ["[", "]"], ["(", ")"] ] }',
			true,
		);
		isValid('{ "hello": [], "world": {} }', true);
		isValid('{ "hello": { "again": { "inside": 5 }, "world": 1 }}', true);
		isValid('{ "foo": /*hello*/true }', true);
		isValid('{ "": true }', true);
	});

	it('parse: arrays', () => {
		isValid('[]', true);
		isValid('[ [],  [ [] ]]', true);
		isValid('[ 1, 2, 3 ]', true);
		isValid('[ { "a": null } ]', true);
	});

	it('parse: objects with errors', () => {
		isValid('{,}', true);
		isValid('{ "foo": true, }', true);
		isInvalid('{ "bar": 8 "xoo": "foo" }', 'Expected "," or "}" instead of \'"\'', true);
		isInvalid('{ ,"bar": 8 }', 'Expected "}" instead of \'"\'', true);
		isInvalid('{ ,"bar": 8, "foo" }', 'Expected "}" instead of \'"\'', true);
		isInvalid('{ "bar": 8, "foo": }', 'Unexpected "}"', true);
		isInvalid('{ 8, "foo": 9 }', 'Expected \'"\' instead of "8"', true);
	});

	it('parse: array with errors', () => {
		isValid('[,]', true);
		isInvalid('[ 1 2, 3 ]', 'Expected "," or "]" instead of "2"', true);
		isInvalid('[ ,1, 2, 3 ]', 'Expected "]" instead of "1"', true);
		isInvalid('[ ,1, 2, 3, ]', 'Expected "]" instead of "1"', true);
	});

	it('parse: errors', () => {
		isValid('', true);
		isInvalid('1,1', 'Syntax error', true);
	});

	it('parse: disallow comments', () => {
		isValid('[ 1, 2, null, "foo" ]');
		isValid('{ "hello": [], "world": {} }');
		isInvalid('{ "foo": /*comment*/ true }', 'Unexpected "/"');
	});

	it('parse: trailing comma', () => {
		isValid('{ "hello": [], }', true);
		isValid('{ "hello": [] }', true);
		isValid('{ "hello": [], "world": {}, }', true);
		isValid('{ "hello": [], "world": {} }', true);
		isValid('[ 1, 2, ]', true);
		isValid('[ 1, 2 ]', true);
		isValid('{ "hello": [], }', true);
		isValid('{ "hello": [], "world": {}, }', true);
		isValid('[ 1, 2, ]', true);
	});
});
