import antfu from '@antfu/eslint-config';

export default antfu(
  {
    ignores: [
      '**/shims-uni-app.d.ts',
    ],
  },
  {
    // style
    rules: {
      'style/quote-props': ['error', 'as-needed'],
      'style/semi': ['error', 'always'],
      'style/max-statements-per-line': ['error', { max: 1 }],
      curly: ['warn', 'all'],
      'style/member-delimiter-style': ['warn', {
        multiline: { delimiter: 'semi', requireLast: true },
        singleline: { delimiter: 'semi', requireLast: false },
        multilineDetection: 'brackets',
      }],
      'import/order': [
        'warn',
        {
          groups: ['type', 'builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'],
          alphabetize: { order: 'asc', caseInsensitive: true },
          warnOnUnassignedImports: false,
        },
      ],
    },
  },
  {
    files: [
      'packages/playground/**/*.vue',
      'packages/playground/**/*.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/manifest.json', '**/pages.json'],
    rules: {
      indent: ['error', 4],
      'jsonc/indent': ['error', 4],
    },
  },
);
