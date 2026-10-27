import config, {browser, browserES10, getOxlintConfig} from '@bhsd/code-standard';

const oxlintConfig = getOxlintConfig([
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
		files: ['src/*.ts'],
		rules: browserES10.rules,
	},
	{
		files: ['src/json_parse.ts'],
		rules: {
			'no-unmodified-loop-condition': 0,
			'@typescript-eslint/no-unnecessary-condition': 0,
			'@typescript-eslint/only-throw-error': 0,
		},
	},
]);

export default oxlintConfig;
