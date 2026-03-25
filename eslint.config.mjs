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
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly'
      }
    }
  },
  ...markdown.configs.processor
]
