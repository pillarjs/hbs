const path = require('node:path')
const request = require('supertest')
const express = require('express')
const hbsFactory = require('../')

// https://github.com/pillarjs/hbs/issues/119
describe('template inheritance (#119)', () => {
  let app

  beforeAll(() => {
    const hbs = hbsFactory.create()

    // a reusable base layout registered as a partial, with an override block
    hbs.registerPartial('base', [
      '<html>',
      '<head><title>{{title}}</title></head>',
      '<body><main>{{#> content}}Default content{{/content}}</main></body>',
      '</html>',
    ].join('\n'))

    app = express()
    app.engine('hbs', hbs.__express)
    app.set('view engine', 'hbs')
    app.set('views', path.join(__dirname, 'views'))

    app.get('/home', (req, res) => {
      res.render('inherit', { layout: false, name: 'Alan' })
    })

    app.get('/default', (req, res) => {
      res.render('inherit_default', { layout: false })
    })
  })

  test('a child view overrides a parent block', async () => {
    await request(app)
      .get('/home')
      .expect(/<title>Home<\/title>/)
      .expect(/<main><h1>Welcome Alan<\/h1><\/main>/)
  })

  test('an unoverridden block keeps the parent default', async () => {
    await request(app)
      .get('/default')
      .expect(/<main>Default content<\/main>/)
  })
})
