const path = require('node:path')
const request = require('supertest')
const express = require('express')
const hbsFactory = require('../')

// Regression test for https://github.com/pillarjs/hbs/issues/153
describe('settings collision (#153)', () => {
  let app

  before(() => {
    const hbs = hbsFactory.create()

    app = express()
    app.engine('hbs', hbs.__express)
    app.set('view engine', 'hbs')
    app.set('views', path.join(__dirname, 'views'))

    // a "settings" property in the render data shadows Express's reserved
    // "settings" local
    app.get('/collision', (req, res) => {
      res.render('blank', { settings: { foo: 'bar' } })
    })

    app.get('/no-layout', (req, res) => {
      res.render('blank', { settings: { foo: 'bar' }, layout: false })
    })

    app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
      res.status(500).send(err.message)
    })
  })

  it('a "settings" local yields a descriptive error when a layout is needed', async () => {
    await request(app).get('/collision').expect(500, /reserved "settings"/)
  })

  it('a "settings" local still renders when no layout is used', async () => {
    await request(app).get('/no-layout').expect(200, '  index body :)')
  })
})
