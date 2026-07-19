import config, {browser} from '@bhsd/code-standard';

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
			'unicorn/prefer-string-replace-all': 0,
		},
	},
	{
		files: ['src/json_parse.ts'],
		rules: {
			'no-unmodified-loop-condition': 0,
			'@typescript-eslint/no-unnecessary-condition': 0,
			'@typescript-eslint/only-throw-error': 0,
		},
	},
];
