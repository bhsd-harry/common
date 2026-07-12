import {json_parse, jsonc_parse} from './json_parse.js';
import type {JsonSyntaxError, ExtendedJsonSyntaxError} from './json_parse';

declare interface JsonError {
	severity: 'error' | 'warning';
	message: string;
	line: number;
	column: number;
	endLine?: number;
	endColumn?: number;
	from: number;
	to?: number;
	/** @deprecated */
	position: number;
}

export type RegexGetter<T = string> = (s: T) => RegExp;

export const wmf = 'wiktionary|wiki(?:pedia|books|news|quote|source|versity|voyage)';

/**
 * PHP的`rawurldecode`函数的JavaScript实现
 * @param str 要解码的字符串
 */
export const rawurldecode = (str: string): string =>
	// eslint-disable-next-line unicorn/prefer-string-replace-all
	decodeURIComponent(str.replace(/%(?![\da-f]{2})/giu, '%25'));

/**
 * 将0~255之间的整数转换为十六进制
 * @param d 0~255之间的整数
 * @param len 十六进制数的最小长度，默认为2
 */
export const intToHex = (d: number, len = 2): string =>
	Math.round(d).toString(16).padStart(len, '0');

/**
 * 将0~1之间的数字转换为十六进制
 * @param d 0~1之间的数字
 */
export const numToHex = (d: number): string => intToHex(d * 255);

const regex = /* #__PURE__ */ (() => {
	const wordChar = String.raw`\p{L}\p{N}_`,
		wordBoundary = `(?![${wordChar}])`,
		hex = String.raw`[\da-f]`,
		hexColor = `#(?:${hex}{3,4}|(?:${hex}{2}){3,4})${wordBoundary}`,
		num = String.raw`[+-]?(?:\d*\.)?\d+`,
		per = `${num}%`,
		rgbValue = `${per}?`,
		rgbArr = Array.from({length: 3}, () => rgbValue),
		space = String.raw`\s+`,
		comma = String.raw`\s*,\s*`,
		slash = String.raw`\s*\/\s*`,
		rgbColor = String.raw`rgba?\(\s*(?:${
			`${rgbArr.join(space)}(?:${slash}${rgbValue})?`
		}|${
			`${rgbArr.join(comma)}(?:${comma}${rgbValue})?`
		})\s*\)`,
		hslColor = String.raw`hsla?\(\s*${num}(?:deg|g?rad|turn)?(?:${
			`${(space + rgbValue).repeat(2)}(?:${slash}${rgbValue})?`
		}|${
			`${(comma + per).repeat(2)}(?:${comma}${rgbValue})?`
		})\s*\)`,
		source = `(^|[^${wordChar}])(${hexColor}|${rgbColor}|${hslColor}`;
	return {
		full: new RegExp(`${source})`, 'giu'),
		names: `${source}|(?:transparent|$1)${wordBoundary})`,
	};
})();

/**
 * 包含颜色时断开字符串
 * @param str 字符串
 * @param names 颜色名称列表，如果提供则也会匹配这些名称，否则只匹配十六进制代码和函数
 */
export const splitColors = (str: string, names?: string[] | false): [string, number, number, boolean][] => {
	const pieces: [string, number, number, boolean][] = [],
		re = Array.isArray(names) && names.length > 0
			? new RegExp(regex.names.replace('$1', names.join('|')), 'giu')
			: regex.full;
	re.lastIndex = 0;
	let mt = re.exec(str),
		lastIndex = 0;
	while (mt) {
		const index = mt.index + mt[1]!.length;
		if (index > lastIndex) {
			pieces.push([str.slice(lastIndex, index), lastIndex, index, false]);
		}
		({lastIndex} = re);
		pieces.push([mt[2]!, index, lastIndex, str[index - 1] !== '&' || !/^#\d+$/u.test(mt[2]!)]);
		mt = re.exec(str);
	}
	if (str.length > lastIndex) {
		pieces.push([str.slice(lastIndex), lastIndex, str.length, false]);
	}
	return pieces;
};

/**
 * 清理内联样式中的`{`和`}`
 * @param style 内联样式
 */
export const sanitizeInlineStyle = (style: string): string =>
	style.replaceAll(/[{}]/gu, p => p === '{' ? '｛' : '｝')
		.replace(/^[\s;]+/u, p => p.replaceAll(';', ' '));

/**
 * 缓存生成的正则表达式
 * @param f 生成正则表达式的函数
 */
export function getRegex(f: RegexGetter): RegexGetter;
export function getRegex<T extends object>(f: RegexGetter<T>): RegexGetter<T>;
export function getRegex<T extends string | object = string>(f: RegexGetter<T>): RegexGetter<T> {
	const map = new Map<T, RegExp>(),
		weakMap = new WeakMap<T & object, RegExp>();
	return s => {
		const regexp = typeof s === 'string' ? map : weakMap;
		if (regexp.has(s as T & object)) {
			const re = regexp.get(s as T & object)!;
			re.lastIndex = 0;
			return re;
		}
		const re = f(s);
		regexp.set(s as T & object, re);
		return re;
	};
}

/**
 * 缓存生成的正则表达式
 * @param f 生成正则表达式的函数
 * @deprecated 需要改为使用`getRegex`
 */
export const getObjRegex = getRegex;

/**
 * 按行分割字符串并记录每行的起止位置
 * @param str 字符串
 */
export const splitLines = (str: string): [string, number, number][] => {
	const lines: [string, number, number][] = [];
	let start = 0;
	for (const line of str.split('\n')) {
		const end = start + line.length;
		lines.push([line, start, end]);
		start = end + 1;
	}
	return lines;
};

const mt2num = (mt: RegExpExecArray | null): number | null => mt && Number(mt[1]);

const formatJsonError = (str: string, errors: ExtendedJsonSyntaxError[]): JsonError[] => {
	let lines: [string, number, number][] | undefined;
	const offsetToPosition = (offset: number): {line: number, column: number} => {
		lines ??= splitLines(str);
		const line = lines.findIndex(([,, end]) => offset <= end) + 1;
		return {
			line,
			column: offset - lines[line - 1]![1] + 1,
		};
	};
	for (const error of errors) {
		const {line, column, from, to} = error;
		if (from === null || from === undefined) {
			if (line) {
				lines ??= splitLines(str);
				error.column ??= 1;
				error.from = lines[line - 1]![1] + (error.column - 1);
			} else {
				error.from = 0;
				error.line = 1;
				error.column = 1;
			}
		} else if (!line || !column) {
			Object.assign(error, offsetToPosition(from));
		}
		if (to !== undefined) {
			({line: error.endLine, column: error.endColumn} = offsetToPosition(to));
		}
		error.position = error.from!;
	}
	return errors as JsonError[];
};

/**
 * 使用`JSON.parse()`诊断JSON字符串中的语法错误
 * @param str JSON字符串
 * @param force 是否强制诊断
 */
export const lintJSONNative = (str: string, force?: boolean): JsonError[] => {
	if (force || str.trim()) {
		try {
			JSON.parse(str);
		} catch (e) {
			const {message} = e as SyntaxError,
				line = mt2num(/\bline (\d+)/u.exec(message)),
				column = mt2num(/\bcolumn (\d+)/u.exec(message)),
				from = mt2num(/\bposition (\d+)/u.exec(message));
			return formatJsonError(str, [{message, line, column, from, severity: 'error'}]);
		}
	}
	return [];
};

const lintJSONBase = (str: string, parse: (s: string) => void): JsonError[] => {
	try {
		parse(str);
	} catch (e) {
		if (!(e instanceof Error)) {
			const {warnings, ...error} = e as JsonSyntaxError;
			if (error.message) {
				warnings.push(error as ExtendedJsonSyntaxError);
			}
			return formatJsonError(str, warnings);
		}
	}
	return [];
};

/**
 * 诊断JSON字符串中的语法错误
 * @param str JSON字符串
 */
export const lintJSON = (str: string): JsonError[] => {
	if (!str.trim()) {
		return [];
	}
	const errors = lintJSONBase(str, json_parse);
	// eslint-disable-next-line unicorn/prefer-at
	return errors[errors.length - 1]?.severity === 'error' ? errors : [...errors, ...lintJSONNative(str)];
};

/**
 * 诊断JSONC字符串中的语法错误
 * @param str JSONC字符串
 */
export const lintJSONC = (str: string): JsonError[] => str.trim() ? lintJSONBase(str, jsonc_parse) : [];

/**
 * 获取字符串开头的空白字符数量
 * @param str 字符串
 * @param re 其他正则表达式，默认为匹配非空白字符的正则表达式
 */
export const numLeadingSpaces = (str: string, re = /\S|$/u): number => str.search(re);
