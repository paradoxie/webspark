module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // General rules
    'no-console': 'off',
    'no-unused-vars': 'off',
    'prefer-const': 'off',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',

    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',

    // Best practices
    'eqeqeq': ['error', 'always'],
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    'require-await': 'off',
    '@typescript-eslint/require-await': 'off',
    'no-return-await': 'off',

    // Code style (keep lightweight for existing codebase)
    'indent': 'off',
    'quotes': 'off',
    'semi': ['error', 'always'],
    'comma-dangle': 'off',
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': 'off',
    'prefer-template': 'off',
    'object-shorthand': 'off',
    'no-case-declarations': 'off',
    'no-useless-escape': 'off',
    'no-control-regex': 'off',

    // TypeScript specific overrides
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-var-requires': 'off',
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.js',
    'prisma/migrations/',
  ],
};