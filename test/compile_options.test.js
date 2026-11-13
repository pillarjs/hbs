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

  app.get('/no-escape', (req, res) => {
    res.render('no_escape', { layout: false, content: '<b>bold</b>' })
  })

  app.get('/strict/present', (req, res) => {
    res.render('strict', { layout: false, value: 'ok' })
  })

  app.get('/strict/missing', (req, res) => {
    res.render('strict', { layout: false })
  })

  app.get('/strict/layout', (req, res) => {
    // `title` is only referenced by the layout, so a failure here proves
    // the layout was compiled with the same options as the view
    res.render('strict', { layout: 'layout', value: 'ok' })
  })

  app.use((err, req, res, next) => {
    res.status(500).send(err.message)
  })

  return app
}

describe('compile options', () => {
  it('compileOptions defaults to an empty object', () => {
    assert.deepStrictEqual(hbsFactory.compileOptions, {})
    assert.deepStrictEqual(hbsFactory.create().compileOptions, {})
    assert.deepStrictEqual(hbsFactory.create(null, {}).compileOptions, {})
  })

  it('compileOptions is taken from create()', () => {
    const instance = hbsFactory.create(null, { compileOptions: { strict: true } })
    assert.deepStrictEqual(instance.compileOptions, { strict: true })
  })

  it('noEscape renders raw html', async () => {
    const app = createApp(hbsFactory.create(null, { compileOptions: { noEscape: true } }))
    await request(app).get('/no-escape').expect(200, '<p><b>bold</b></p>\n')
  })

  it('default instance still escapes html', async () => {
    const app = createApp(hbsFactory.create())
    await request(app).get('/no-escape').expect(200, '<p>&lt;b&gt;bold&lt;/b&gt;</p>\n')
  })

  it('strict renders when the field is present', async () => {
    const app = createApp(hbsFactory.create(null, { compileOptions: { strict: true } }))
    await request(app).get('/strict/present').expect(200, '<p>ok</p>\n')
  })

  it('strict errors when the field is missing', async () => {
    const app = createApp(hbsFactory.create(null, { compileOptions: { strict: true } }))
    await request(app).get('/strict/missing').expect(500, /"value" not defined/)
  })

  it('strict applies to layouts too', async () => {
    const app = createApp(hbsFactory.create(null, { compileOptions: { strict: true } }))
    await request(app).get('/strict/layout').expect(500, /"title" not defined/)
  })
})
