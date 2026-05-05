import config, {browser} from '@bhsd/code-standard';
import globals from 'globals';

export default [
	...config,
	browser,
	{
		ignores: ['test/**/*.json'],
	},
	{
		rules: {
			camelcase: [
				2,
				{
					allow: [
						'json_parse',
						'jsonc_parse',
					],
				},
			],
		},
	},
	{
		files: ['src/json_parse.ts'],
		rules: {
			'no-unmodified-loop-condition': 0,
			'jsdoc/no-bad-blocks': 0,
			'unicorn/prefer-code-point': 0,
			'@stylistic/multiline-comment-style': 0,
			'@stylistic/padded-blocks': 0,
			'@stylistic/quotes': [
				2,
				'double',
				{
					allowTemplateLiterals: 'avoidEscape',
					avoidEscape: true,
				},
			],
			'@typescript-eslint/no-confusing-void-expression': 0,
			'@typescript-eslint/no-unnecessary-condition': 0,
			'@typescript-eslint/only-throw-error': 0,
		},
	},
	{
		files: ['test/*.js'],
		languageOptions: {
			globals: globals.mocha,
		},
	},
];
