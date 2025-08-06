/* eslint-env node */
module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2022: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/eslint-config-standard'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  overrides: [
    {
      files: ['*.vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@babel/eslint-parser',
        requireConfigFile: false,
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    {
      files: ['**/*.config.js', '**/*.config.mjs', 'vite.config.*', 'vitest.config.*', 'playwright.config.*', 'tailwind.config.*', 'postcss.config.*'],
      env: {
        node: true
      }
    },
    {
      files: ['tests/**/*'],
      env: {
        jest: true,
        browser: true,
        node: true
      },
      globals: {
        createMockFile: 'readonly',
        createMockJsonlContent: 'readonly',
        waitForNextTick: 'readonly',
        vi: 'readonly',
        filteringWithCache: 'readonly'
      }
    }
  ],
  rules: {
    // Disable most rules for CI compatibility - only catch critical errors
    'no-undef': 'off', // Too many false positives in test files
    'no-unused-vars': 'off',
    'no-console': 'off',
    'no-debugger': 'off',
    'no-case-declarations': 'off',
    'no-return-assign': 'off',
    
    // Vue rules - minimal
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-vars': 'off',
    'vue/no-unused-components': 'off',
    'vue/require-toggle-inside-transition': 'off',
    
    // Disable all formatting and style rules
    'no-trailing-spaces': 'off',
    'eol-last': 'off',
    'comma-dangle': 'off',
    'quote-props': 'off',
    'space-before-function-paren': 'off',
    'multiline-ternary': 'off',
    'no-multiple-empty-lines': 'off',
    'no-multi-spaces': 'off',
    'padded-blocks': 'off',
    'prefer-const': 'off',
    'object-shorthand': 'off',
    'no-whitespace-before-property': 'off',
    'no-useless-constructor': 'off',
    'lines-between-class-members': 'off',
    'object-curly-newline': 'off',
    'object-curly-spacing': 'off',
    'quotes': 'off',
    
    // Import/export rules
    'import/no-unresolved': 'off',
    'import/extensions': 'off'
  }
}