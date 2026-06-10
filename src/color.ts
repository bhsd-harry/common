import {useMode, modeRgb, modeHsl} from 'culori/fn';
export {colorsNamed} from 'culori/fn';

const parseRGB = /* #__PURE__ */ useMode(modeRgb),
	parseHSL = /* #__PURE__ */ useMode(modeHsl);

const normalizeRGB = (component: number): number =>
		Math.min(255, Math.max(0, Math.round(component * 255))),
	normalizeAlpha = (alpha: number): number => Math.round(alpha * 1e3) / 1e3;

/**
 * 将颜色字符串转换为 RGBA 数组
 * @param color 颜色字符串
 */
export const rgba = (color: string): [number, number, number, number] | [] => {
	const result = parseRGB(color.trim().toLowerCase());
	if (!result) {
		return [];
	}
	const {r, g, b, alpha = 1} = result;
	return [...[r, g, b].map(normalizeRGB), normalizeAlpha(alpha)] as [number, number, number, number];
};

/**
 * 将颜色字符串转换为 HSLA 数组
 * @param color 颜色字符串
 */
export const hsla = (color: string): [number, number, number, number] | [] => {
	const result = parseHSL(color.trim().toLowerCase());
	if (!result) {
		return [];
	}
	const {h = 0, s, l, alpha = 1} = result;
	return [...[h, s * 100, l * 100].map(Math.round), normalizeAlpha(alpha)] as [number, number, number, number];
};
