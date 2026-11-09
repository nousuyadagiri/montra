const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'tests/**', 'scripts/**'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
