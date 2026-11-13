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

  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    res.status(500).send(err.message)
  })

  return app
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

  // hbs now keeps handlebars' safe prototype-access defaults (false)
  it('prototype property access is blocked by default', async () => {
    const app = createApp(hbsFactory.create())
    await request(app).get('/proto').expect(200, '<p></p>\n')
  })

  it('runtimeOptions can opt back into prototype property access', async () => {
    const app = createApp(hbsFactory.create(null, {
      runtimeOptions: { allowProtoPropertiesByDefault: true },
    }))
    await request(app).get('/proto').expect(200, '<p>PROTO</p>\n')
  })
})
