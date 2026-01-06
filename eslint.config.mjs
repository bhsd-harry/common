import config, {browser} from '@bhsd/code-standard';

export default [
	...config,
	browser,
	{
		rules: {
			camelcase: [
				2,
				{
					allow: ['json_parse'],
				},
			],
		},
	},
	{
		files: ['vendor/*.js'],
		rules: {
			'consistent-return': 0,
			'default-case': 0,
			'no-implicit-coercion': 0,
			'no-throw-literal': 0,
			'no-unmodified-loop-condition': 0,
			'object-shorthand': 0,
			'prefer-const': 0,
			'prefer-template': 0,
			'jsdoc/no-bad-blocks': 0,
			'unicorn/no-negated-condition': 0,
			'unicorn/prefer-code-point': 0,
			'@stylistic/arrow-parens': [
				2,
				'always',
			],
			'@stylistic/comma-dangle': [
				2,
				'never',
			],
			'@stylistic/indent': [
				2,
				4,
				{
					SwitchCase: 0,
				},
			],
			'@stylistic/multiline-comment-style': 0,
			'@stylistic/no-extra-parens': 0,
			'@stylistic/no-multi-spaces': 0,
			'@stylistic/padded-blocks': 0,
			'@stylistic/quotes': [
				2,
				'double',
			],
		},
	},
];
