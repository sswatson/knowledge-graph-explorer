const path = require('path');

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
    sourceType: 'module',
    babelOptions: {
      configFile: './babel.config.js',
    },
  },
  plugins: [
    'jest-dom',
    'testing-library',
    '@typescript-eslint',
    'react',
    'react-hooks',
    'simple-import-sort',
    'unicorn',
    'prettier',
  ],
  env: {
    browser: true,
    node: true,
    commonjs: true,
    jest: true,
  },
  globals: {
    JSX: true,
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:jsx-a11y/recommended',
    'plugin:prettier/recommended',
    'plugin:unicorn/recommended',
    'prettier',
    'prettier/react',
    'prettier/unicorn',
  ],
  settings: {
    react: {
      pragma: 'React',
      version: 'detect',
    },
    propWrapperFunctions: [
      'forbidExtraProps',
      { property: 'freeze', object: 'Object' },
    ],
    next: {
      rootDir: ['console', 'apps/*/', 'packages/*/'],
    },
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        'no-undef': 'off',
      },
    },
  ],
  rules: {
    "testing-library/await-async-query": "error",
		"testing-library/no-await-sync-query": "error",
		"testing-library/no-debugging-utils": "warn",
		"testing-library/no-dom-import": "off",
    "jest-dom/prefer-checked": "error",
    "jest-dom/prefer-enabled-disabled": "error",
    "jest-dom/prefer-required": "error",
    "jest-dom/prefer-to-have-attribute": "error",
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { varsIgnorePattern: '^_$', argsIgnorePattern: '^_+$' },
    ],
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-types': 'off',
    'no-console': 'error',
    'no-empty-function': 'off',
    'no-unused-vars': [
      'error',
      { varsIgnorePattern: '^_$', argsIgnorePattern: '^_+$' },
    ],
    'padding-line-between-statements': [
      'error',
      // Ensure there's an empty line after variable declarations
      { blankLine: 'always', prev: ['const', 'let'], next: '*' },
      { blankLine: 'any', prev: ['const', 'let'], next: ['const', 'let'] },
      // Ensure there's an empty line before return statements
      { blankLine: 'always', prev: '*', next: 'return' },
      // Ensure there's an empty line between function declarations
      { blankLine: 'always', prev: 'function', next: '*' },
      { blankLine: 'any', prev: 'function', next: 'function' },
      // Ensure there's an empty line between multiline block-like statements
      { blankLine: 'always', prev: 'multiline-block-like', next: '*' },
      { blankLine: 'any', prev: 'multiline-block-like', next: 'multiline-block-like' },
      // Ensure there's an empty line before block statements
      { blankLine: 'always', prev: '*', next: 'block' },
      // Ensure there's an empty line before block-like statements
      { blankLine: 'always', prev: '*', next: 'block-like' },
    ],
    'prettier/prettier': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react/display-name': 'off',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'simple-import-sort/exports': 'error',
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          // Side effect imports.
          ["^\\u0000"],
          // Packages.
          // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
          ["^@?\\w"],
          // Internal packages.
          ["^(@|@relationalai)(/.*|$)"],
          // Absolute imports and other imports such as Vue-style `@/foo`.
          // Anything not matched in another group.
          ["^"],
          // Relative imports.
          // Anything that starts with a dot.
          ["^\\."],
        ]
      }
    ],
    'import/no-named-as-default': 'off',
    'import/no-unresolved': [
      'error',
      { ignore: ['^@relationalai/rai-sdk-javascript', '^overlayscrollbars'] },
    ],
    'import/no-extraneous-dependencies': [
        'error',
        {
            // deps used in the code should be included in "dependencies"
            // not in "devDependencies" except for these formats.
          devDependencies: [
                '**/*.test.ts',
                '**/*.test.tsx',
                '**/playwright/**',
                '**/*.config.js',
                '**/*.config.ts',
                '**/.eslintrc.*',
            ],
          packageDir: [path.join(__dirname, '..'), './']
        },
    ],
    'unicorn/consistent-function-scoping': [
      'error',
      {
        checkArrowFunctions: false,
      },
    ],
    'unicorn/filename-case': [
      'error',
      {
        cases: {
          camelCase: true,
          pascalCase: true,
        },
        ignore: ['next-env.d.ts'],
      },
    ],
    'unicorn/explicit-length-check': 'off',
    'unicorn/no-array-callback-reference': 'off',
    'unicorn/no-array-for-each': 'off',
    'unicorn/no-array-reduce': 'off',
    'unicorn/no-fn-reference-in-iterator': 'off',
    'unicorn/no-null': 'off',
    'unicorn/no-reduce': 'off',
    'unicorn/no-useless-undefined': 'off',
    'unicorn/prefer-spread': 'off',
    'unicorn/prefer-ternary': 'off',
    'unicorn/prevent-abbreviations': 'off',
  },
};
