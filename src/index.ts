export type RegexGetter<T = string> = (s: T) => RegExp;

export const wmf = 'wiktionary|wiki(?:pedia|books|news|quote|source|versity|voyage)';

/**
 * PHP的`rawurldecode`函数的JavaScript实现
 * @param str 要解码的字符串
 */
export const rawurldecode = (str: string): string =>
	decodeURIComponent(str.replace(/%(?![\da-f]{2})/giu, '%25'));

/**
 * 将0~1之间的数字转换为十六进制
 * @param d 0~1之间的数字
 */
export const numToHex = (d: number): string =>
	Math.round(d * 255).toString(16).padStart(2, '0');

const regex = /* #__PURE__ */ (() => {
	const hexColor = String.raw`#(?:[\da-f]{3,4}|(?:[\da-f]{2}){3,4})(?![\p{L}\p{N}_])`,
		rgbValue = String.raw`(?:\d*\.)?\d+%?`,
		hue = String.raw`(?:\d*\.)?\d+(?:deg|grad|rad|turn)?`,
		rgbColor = String.raw`rgba?\(\s*(?:${
			String.raw`${new Array(3).fill(rgbValue).join(String.raw`\s+`)}(?:\s*\/\s*${rgbValue})?`
		}|${
			String.raw`${new Array(3).fill(rgbValue).join(String.raw`\s*,\s*`)}(?:\s*,\s*${rgbValue})?`
		})\s*\)`,
		hslColor = String.raw`hsla?\(\s*(?:${
			String.raw`${hue}\s+${rgbValue}\s+${rgbValue}(?:\s*\/\s*${rgbValue})?`
		}|${
			String.raw`${hue}${String.raw`\s*,\s*(?:\d*\.)?\d+%`.repeat(2)}(?:\s*,\s*${rgbValue})?`
		})\s*\)`;
	return {
		full: new RegExp(String.raw`(^|[^\p{L}\p{N}_])(${hexColor}|${rgbColor}|${hslColor})`, 'giu'),
		rgb: new RegExp(String.raw`(^|[^\p{L}\p{N}_])(${hexColor}|${rgbColor})`, 'giu'),
	};
})();

/**
 * 包含颜色时断开字符串
 * @param str 字符串
 * @param hsl 是否包含 HSL
 */
export const splitColors = (str: string, hsl = true): [string, number, number, boolean][] => {
	const pieces: [string, number, number, boolean][] = [],
		re = regex[hsl ? 'full' : 'rgb'];
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
	style.replace(/[{}]/gu, p => p === '{' ? '｛' : '｝');

/**
 * 缓存生成的正则表达式
 * @param f 生成正则表达式的函数
 */
/* eslint-disable jsdoc/require-jsdoc */
export function getRegex(f: RegexGetter): RegexGetter;
export function getRegex<T extends object>(f: RegexGetter<T>): RegexGetter<T>;
export function getRegex<T extends string | object = string>(f: RegexGetter<T>): RegexGetter<T> {
/* eslint-enable jsdoc/require-jsdoc */
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
 */
export const getObjRegex = getRegex;
