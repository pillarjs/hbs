const path = require('path')
const fs = require('fs')
const request = require('supertest')
const express = require('express')
const hbs = require('../')

const FIXTURES_DIR = path.join(__dirname, 'fixtures')

describe('express 4.x view engine', () => {
  let app

  beforeAll(() => {
    app = express()

    // manually set render engine, under normal circumstances this
    // would not be needed as hbs would be installed through npm
    app.engine('html', hbs.__express)

    // set the view engine to use handlebars
    app.set('view engine', 'html')
    app.set('views', path.join(__dirname, 'views_view_engine'))

    app.set('view options', {
      layout: false
    })

    app.get('/', function (req, res) {
      res.render('no_layout', {
        title: 'Express Handlebars Test'
      })
    })

    app.get('/with_layout', function (req, res) {
      res.render('blank', {
        title: 'Express Handlebars Test',
        layout: 'layout'
      })
    })
  })

  test('index', async () => {
    const expected = fs.readFileSync(path.join(FIXTURES_DIR, 'index_no_layout.html'), 'utf8')
    await request(app).get('/').expect(expected)
  })

  test('index w/layout', async () => {
    const expected = fs.readFileSync(path.join(FIXTURES_DIR, 'index_no_layout.html'), 'utf8')
    await request(app).get('/with_layout').expect(expected)
  })
})
