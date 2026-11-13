const path = require('node:path')
const assert = require('node:assert')
const request = require('supertest')
const express = require('express')
const hbsFactory = require('../')

function createApp (instance) {
  const app = express()

  app.engine('hbs', instance.__express)
  app.set('view engine', 'hbs')
  app.set('views', path.join(__dirname, 'views'))

  app.get('/proto', (req, res) => {
    res.render('proto', {
      layout: false,
      value: Object.create({ inherited: 'PROTO' }),
    })
  })

  // Reads an inherited property whose name comes from the URL. handlebars
  // logs its "access denied" warning only once per property name per process,
  // so each warning test needs a property name no other test has used.
  app.get('/proto-lookup/:key', (req, res) => {
    res.render('proto-lookup', {
      layout: false,
      key: req.params.key,
      value: Object.create({ [req.params.key]: 'PROTO' }),
    })
  })

  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    res.status(500).send(err.message)
  })

  return app
}

// Run `fn` while collecting everything handlebars writes to console.error.
async function captureConsoleErrors (fn) {
  const original = console.error
  const messages = []

  console.error = (...args) => { messages.push(args.join(' ')) }

  try {
    await fn()
  } finally {
    console.error = original
  }

  return messages
}

describe('runtime options', () => {
  it('runtimeOptions defaults to an empty object', () => {
    assert.deepStrictEqual(hbsFactory.runtimeOptions, {})
    assert.deepStrictEqual(hbsFactory.create().runtimeOptions, {})
    assert.deepStrictEqual(hbsFactory.create(null, {}).runtimeOptions, {})
  })

  it('runtimeOptions is taken from create()', () => {
    const instance = hbsFactory.create(null, {
      runtimeOptions: { allowProtoPropertiesByDefault: true },
    })
    assert.deepStrictEqual(instance.runtimeOptions, { allowProtoPropertiesByDefault: true })
  })

  // hbs sets no prototype-access options, so handlebars' safe defaults apply
  it('prototype property access is blocked by default', async () => {
    const app = createApp(hbsFactory.create())
    await request(app).get('/proto').expect(200, '<p></p>\n')
  })

  it('a blocked lookup logs the handlebars warning by default', async () => {
    const app = createApp(hbsFactory.create())

    const messages = await captureConsoleErrors(async () => {
      await request(app).get('/proto-lookup/warnedByDefault').expect(200, '<p></p>\n')
    })

    assert.strictEqual(messages.length, 1)
    assert.match(messages[0], /Access has been denied to resolve the property "warnedByDefault"/)
  })

  it('setting the options to false blocks without the warning', async () => {
    const app = createApp(hbsFactory.create(null, {
      runtimeOptions: {
        allowProtoMethodsByDefault: false,
        allowProtoPropertiesByDefault: false,
      },
    }))

    const messages = await captureConsoleErrors(async () => {
      await request(app).get('/proto-lookup/silencedExplicitly').expect(200, '<p></p>\n')
    })

    assert.deepStrictEqual(messages, [])
  })

  // handlebars reads its runtime options with plain property lookups, so an
  // options object with a regular prototype would pick these up.
  it('prototype-access options are not inherited from Object.prototype', async () => {
    const app = createApp(hbsFactory.create())
    const polluted = [
      'allowedProtoProperties',
      'allowProtoPropertiesByDefault',
      'allowProtoMethodsByDefault',
    ]

    /* eslint-disable no-extend-native */
    Object.prototype.allowedProtoProperties = { inherited: true }
    Object.prototype.allowProtoPropertiesByDefault = true
    Object.prototype.allowProtoMethodsByDefault = true
    /* eslint-enable no-extend-native */

    try {
      await request(app).get('/proto').expect(200, '<p></p>\n')
    } finally {
      polluted.forEach((key) => { delete Object.prototype[key] })
    }
  })

  it('runtimeOptions can opt back into prototype property access', async () => {
    const app = createApp(hbsFactory.create(null, {
      runtimeOptions: { allowProtoPropertiesByDefault: true },
    }))
    await request(app).get('/proto').expect(200, '<p>PROTO</p>\n')
  })
})
