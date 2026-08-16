import assert from 'assert';
import {describe, it} from '@bhsd/test-util/mocha';
import {rgba} from '../dist/color.js';

const parse = color => {
	const [r, g, b, alpha] = rgba(color);
	return alpha !== undefined && {
		values: [r, g, b],
		alpha,
	};
};

/**
 * @author Dmitry Ivanov <df.creative@gmail.com>
 * @license MIT
 * @see https://github.com/colorjs/color-parse/blob/master/test.js
 */
describe('color-parse tests', () => {
	it('#ffa500', () => {
		assert.deepStrictEqual(parse('#ffa500'), {
			values: [255, 165, 0],
			alpha: 1,
		});
	});
	it('#333', () => {
		assert.deepStrictEqual(parse('#333'), {
			values: [51, 51, 51],
			alpha: 1,
		});
	});
	it('#f98', () => {
		assert.deepStrictEqual(parse('#f98'), {
			values: [255, 153, 136],
			alpha: 1,
		});
	});
	it('lime', () => {
		assert.deepStrictEqual(parse('lime'), {
			values: [0, 255, 0],
			alpha: 1,
		});
		assert.deepStrictEqual(parse('LIME'), {
			values: [0, 255, 0],
			alpha: 1,
		});
	});
	it('hsl(210,50,50)', () => {
		assert.deepStrictEqual(parse('hsl(210,50,50)'), false);
	});
	it('rgba(153,50,204,60%)', () => {
		assert.deepStrictEqual(parse('rgba(153,50,204,60%)'), {
			values: [153, 50, 204],
			alpha: 0.6,
		});
	});

	it('#fef', () => {
		assert.deepStrictEqual(parse('#fef'), {
			values: [255, 238, 255],
			alpha: 1,
		});
	});
	it('#fffFEF', () => {
		assert.deepStrictEqual(parse('#fffFEF'), {
			values: [255, 255, 239],
			alpha: 1,
		});
	});
	it('rgb(244, 233, 100)', () => {
		assert.deepStrictEqual(parse('rgb(244, 233, 100)'), {
			values: [244, 233, 100],
			alpha: 1,
		});
	});
	it('rgb(100%, 30%, 90%)', () => {
		assert.deepStrictEqual(parse('rgb(100%, 30%, 90%)'), {
			values: [255, 77, 230],
			alpha: 1,
		});
	});
	it('transparent', () => {
		assert.deepStrictEqual(parse('transparent'), {
			values: [0, 0, 0],
			alpha: 0,
		});
	});
	it('hsl(240, 100%, 50.5%)', () => {
		assert.deepStrictEqual(parse('hsl(240, 100%, 50.5%)'), {
			values: [3, 3, 255],
			alpha: 1,
		});
	});
	it('hsl(240deg, 100%, 50.5%)', () => {
		assert.deepStrictEqual(parse('hsl(240deg, 100%, 50.5%)'), {
			values: [3, 3, 255],
			alpha: 1,
		});
	});
	it('hwb(240 100% 50.5%)', () => {
		assert.deepStrictEqual(parse('hwb(240 100% 50.5%)'), {
			values: [169, 169, 169],
			alpha: 1,
		});
	});
	it('hwb(240deg 100% 50.5%)', () => {
		assert.deepStrictEqual(parse('hwb(240deg 100% 50.5%)'), {
			values: [169, 169, 169],
			alpha: 1,
		});
	});
	it('blue', () => {
		assert.deepStrictEqual(parse('blue'), {
			values: [0, 0, 255],
			alpha: 1,
		});
		assert.deepStrictEqual(parse('BLUE'), {
			values: [0, 0, 255],
			alpha: 1,
		});
	});
	it('rgba(244, 233, 100, 0.5)', () => {
		assert.deepStrictEqual(parse('rgba(244, 233, 100, 0.5)'), {
			values: [244, 233, 100],
			alpha: 0.5,
		});
	});
	it('hsla(244, 100%, 100%, 0.6)', () => {
		assert.deepStrictEqual(parse('hsla(244, 100%, 100%, 0.6)'), {
			values: [255, 255, 255],
			alpha: 0.6,
		});
	});
	it('hwb(244 100% 100% / 0.6)', () => {
		assert.deepStrictEqual(parse('hwb(244 100% 100% / 0.6)'), {
			values: [128, 128, 128],
			alpha: 0.6,
		});
	});
	it('hwb(244 100% 100%)', () => {
		assert.deepStrictEqual(parse('hwb(244 100% 100%)'), {
			values: [128, 128, 128],
			alpha: 1,
		});
	});
	it('rgba(200, 20, 233, 0.2)', () => {
		assert.deepStrictEqual(parse('rgba(200, 20, 233, 0.2)'), {
			values: [200, 20, 233],
			alpha: 0.2,
		});
	});
	it('rgba(200, 20, 233, 0)', () => {
		assert.deepStrictEqual(parse('rgba(200, 20, 233, 0)'), {
			values: [200, 20, 233],
			alpha: 0,
		});
	});
	it('rgba(100%, 30%, 90%, 0.2)', () => {
		assert.deepStrictEqual(parse('rgba(100%, 30%, 90%, 0.2)'), {
			values: [255, 77, 230],
			alpha: 0.2,
		});
	});
	it('rgba(200 20 233 / 0.2)', () => {
		assert.deepStrictEqual(parse('rgba(200 20 233 / 0.2)'), {
			values: [200, 20, 233],
			alpha: 0.2,
		});
	});
	it('rgba(200 20 233 / 20%)', () => {
		assert.deepStrictEqual(parse('rgba(200 20 233 / 20%)'), {
			values: [200, 20, 233],
			alpha: 0.2,
		});
	});
	it('hsla(200, 20%, 33%, 0.2)', () => {
		assert.deepStrictEqual(parse('hsla(200, 20%, 33%, 0.2)'), {
			values: [67, 90, 101],
			alpha: 0.2,
		});
	});
	it('hwb(200, 20%, 33%, 0.2)', () => {
		assert.deepStrictEqual(parse('hwb(200, 20%, 33%, 0.2)'), false);
	});

	it('rgba(300, 600, 100, 3)', () => {
		assert.deepStrictEqual(parse('rgba(300, 600, 100, 3)'), {
			values: [255, 255, 100],
			alpha: 1,
		});
	});
	it('rgba(8000%, 100%, 333%, 88)', () => {
		assert.deepStrictEqual(parse('rgba(8000%, 100%, 333%, 88)'), {
			values: [255, 255, 255],
			alpha: 1,
		});
	});
	it('hsla(400, 10%, 200%, 10)', () => {
		assert.deepStrictEqual(parse('hsla(400, 10%, 200%, 10)'), {
			values: [255, 255, 255],
			alpha: 1,
		});
	});
	it('hwb(400 10% 200% / 10)', () => {
		assert.deepStrictEqual(parse('hwb(400 10% 200% / 10)'), {
			values: [12, 12, 12],
			alpha: 1,
		});
	});
	it('yellowblue', () => {
		assert.deepStrictEqual(parse('yellowblue'), false);
		assert.deepStrictEqual(parse('YELLOWBLUE'), false);
	});

	it('hsla(101.12, 45.2%, 21.0%, 1.0)', () => {
		assert.deepStrictEqual(parse('hsla(101.12, 45.2%, 21.0%, 1.0)'), {
			values: [45, 78, 29],
			alpha: 1,
		});
	});
	it('hsla(101.12 45.2% 21.0% / 50%)', () => {
		assert.deepStrictEqual(parse('hsla(101.12 45.2% 21.0% / 50%)'), {
			values: [45, 78, 29],
			alpha: 0.5,
		});
	});
	it('hsl(red, 10%, 10%)', () => {
		assert.deepStrictEqual(parse('hsl(red, 10%, 10%)'), false);
	});
	it('hsl(10deg, 10%, 10%)', () => {
		assert.deepStrictEqual(parse('hsl(10deg, 10%, 10%)'), {
			values: [28, 24, 23],
			alpha: 1,
		});
	});
	it('hsl(1.5turn, 10%, 10%)', () => {
		assert.deepStrictEqual(parse('hsl(1.5turn, 10%, 10%)'), {
			values: [23, 28, 28],
			alpha: 1,
		});
	});
	it('lch(5 5 5)', () => {
		assert.deepStrictEqual(parse('lch(5 5 5)'), false);
	});
	it('lch(5 5 5 / .5)', () => {
		assert.deepStrictEqual(parse('lch(5 5 5 / .5)'), false);
	});
	it('lab(25 25 25)', () => {
		assert.deepStrictEqual(parse('lab(25 25 25)'), false);
	});
	it('lab(25 25 25 / 0.5)', () => {
		assert.deepStrictEqual(parse('lab(25 25 25 / 0.5)'), false);
	});

	it('color(...)', () => {
		// --srgb: color(srgb 1 1 1);
		assert.deepStrictEqual(parse('color(srgb-linear 1 1 1)'), false);
		// --srgb-linear: color(srgb-linear 100% 100% 100% / 50%);
		assert.deepStrictEqual(parse('color(srgb-linear 100% 100% 100% / 50%)'), false);
		// --display-p3: color(display-p3 1 1 1);
		assert.deepStrictEqual(parse('color(display-p3 1 1 1)'), false);
		// --rec2020: color(rec2020 0 0 0);
		assert.deepStrictEqual(parse('color(rec2020 0 0 0)'), false);
		// --a98-rgb: color(a98-rgb 1 1 1 / 25%);
		assert.deepStrictEqual(parse('color(a98-rgb 1 1 1 / 25%)'), false);
		// --prophoto: color(prophoto-rgb 0% 0% 0%);
		assert.deepStrictEqual(parse('color(prophoto-rgb 0% 0% 0%)'), false);
		// --xyz: color(xyz 1 1 1);
		assert.deepStrictEqual(parse('color(xyz 1 1 1)'), false);
	});

	it('oklab', () => {
		assert.deepStrictEqual(parse('oklab(40.1% 0.1143 0.045)'), false);
		assert.deepStrictEqual(parse('oklab(59.69% 0.1007 -0.1191 / 0.5)'), false);
		assert.deepStrictEqual(parse('oklab(0.123 100% -100% / 2)'), false);
		assert.deepStrictEqual(parse('oklab(none none none / none)'), false);
	});
	it('oklch', () => {
		assert.deepStrictEqual(parse('oklch(40.1% 0.1143 4.5)'), false);
		assert.deepStrictEqual(parse('oklch(59.69% 10% 49.77 / 0.5)'), false);
		assert.deepStrictEqual(parse('oklch(40.1% 0.156 49.1deg / .5)'), false);
		assert.deepStrictEqual(parse('oklch(none none none / none)'), false);
	});

	it('#afd6', () => {
		assert.deepStrictEqual(parse('#afd6'), {
			values: [170, 255, 221],
			alpha: 0.4,
		});
	});
	it('#AFD6', () => {
		assert.deepStrictEqual(parse('#AFD6'), {
			values: [170, 255, 221],
			alpha: 0.4,
		});
	});
	it('#aaffdd66', () => {
		assert.deepStrictEqual(parse('#aaffdd66'), {
			values: [170, 255, 221],
			alpha: 0.4,
		});
	});
	it('#AAFFDD66', () => {
		assert.deepStrictEqual(parse('#AAFFDD66'), {
			values: [170, 255, 221],
			alpha: 0.4,
		});
	});
});

/**
 * @author Dmitry Iv <dfcreative@gmail.com>
 * @license MIT
 * @see https://github.com/colorjs/color-rgba/blob/master/test.js
 */
it('color-rgba tests', () => {
	assert.deepStrictEqual(rgba('rgba(1,2,3,.5)'), [1, 2, 3, 0.5]);
	assert.deepStrictEqual(rgba('rgba(0,0,0,0)'), [0, 0, 0, 0]);
	assert.deepStrictEqual(rgba('hsla(0,0,0,1)'), []);
	assert.deepStrictEqual(rgba('rgba(-300,-300,-300,-1)'), [0, 0, 0, 0]);

	assert.deepStrictEqual(rgba('red'), [255, 0, 0, 1]);
	assert.deepStrictEqual(rgba('rgb(80, 120, 160)'), [80, 120, 160, 1]);
	assert.deepStrictEqual(rgba('rgba(80, 120, 160, .5)'), [80, 120, 160, 0.5]);
	assert.deepStrictEqual(rgba('rgba(80 120 160 / .5)'), [80, 120, 160, 0.5]);
	assert.deepStrictEqual(rgba('hsl(291 80% 50%)'), [199, 25, 230, 1]);
	assert.deepStrictEqual(rgba('hsl(0.8083333333333333turn 80% 50%)'), [199, 25, 230, 1]);
	assert.deepStrictEqual(rgba('hsla(109, 50%, 50%, .75)'), [87, 191, 64, 0.75]);
	assert.deepStrictEqual(rgba('#f00'), [255, 0, 0, 1]);

	assert.deepStrictEqual(rgba('xyz'), []);

	assert.deepStrictEqual(rgba('srgb(0.85098 0.121569 0.160784)'), []);

	// CSS Color 4 spaces — reference coordinates from colorjs.io / IEC 61966-2-1
	const round = v => v.map(x => Math.round(x));
	assert.deepStrictEqual(round(rgba('lab(54.291 80.805 69.891)')), []); // red, Lab D50 (colorjs.io)
	assert.deepStrictEqual(round(rgba('lch(54.291 106.837 40.858)')), []); // red, LCh D50 (colorjs.io)
	assert.deepStrictEqual(round(rgba('oklch(0.62796 0.25768 29.234)')), []); // red (colorjs.io)
	assert.deepStrictEqual(round(rgba('oklab(0.62796 0.22486 0.12585)')), []); // red (colorjs.io)
	assert.deepStrictEqual(rgba('color(srgb 0.5 0.7 0.1)'), [128, 179, 26, 1]);
	assert.deepStrictEqual(round(rgba('color(display-p3 1 1 1)')), []);
	// sRGB red primary (IEC 61966-2-1)
	assert.deepStrictEqual(round(rgba('color(xyz-d65 0.4124 0.2126 0.0193)')), []);
	assert.deepStrictEqual(round(rgba('cmyk(0, 100, 100, 0)')), []);
	assert.deepStrictEqual(round(rgba('hwb(0 0% 0%)')), [255, 0, 0, 1]);

	// hue wraps per CSS Color 4 §7 (hsl(400…) ≡ hsl(40…)), not clamps
	assert.deepStrictEqual(rgba('hsl(400, 100%, 50%)'), rgba('hsl(40, 100%, 50%)'));
	assert.deepStrictEqual(rgba('hsl(-320, 100%, 50%)'), rgba('hsl(40, 100%, 50%)'));

	// channel-starved strings are not colors
	assert.deepStrictEqual(rgba('rgb(1 2)'), []);
});
