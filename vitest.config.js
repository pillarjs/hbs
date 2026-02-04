const { defineConfig } = require('vitest/config')

module.exports = defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8'
    }
  }
})
