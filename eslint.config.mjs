import neostandard from 'neostandard'
import markdown from '@eslint/markdown'

export default [
  {
    ignores: ['coverage/**', '.nyc_output/**']
  },
  ...neostandard(),
  {
    rules: {
      'no-console': 'error'
    }
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly'
      }
    }
  },
  ...markdown.configs.processor
]
