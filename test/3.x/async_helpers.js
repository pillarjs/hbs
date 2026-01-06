const path = require('path')
const request = require('supertest')
const utils = require('../support/utils')

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures')

// builtin
const fs = require('fs');

let app = null

suite('express 3.x async helpers')

before(function () {
  if (utils.nodeVersionCompare(10.0) >= 0) {
    this.skip()
    return
  }

  const express = require('express')
  const hbs = require('../../').create()

  app = express()

  // manually set render engine, under normal circumstances this
  // would not be needed as hbs would be installed through npm
  app.engine('hbs', hbs.__express)

  // set the view engine to use handlebars
  app.set('view engine', 'hbs')
  app.set('views', path.join(__dirname, 'views'))

  app.use(express.static(path.join(__dirname, 'public')))

  // value for async helper
  // it will be called a few times from the template
  const vals = ['foo', 'bar', 'baz']
  hbs.registerAsyncHelper('async', function (context, cb) {
    const prefix = this.prefix || ''

    process.nextTick(function () {
      cb(prefix + vals.shift())
    })
  })

  // fake async helper, returns immediately
  // although a regular helper could have been used we should support this use case
  let count = 0
  hbs.registerAsyncHelper('fake-async', function (context, cb) {
    const val = 'instant' + count++
    cb(val)
  })

  app.get('/', function (req, res) {
    res.render('async', {
      layout: false,
      prefix: '* '
    })
  })

  app.get('/fake-async', function (req, res) {
    res.render('fake-async', {
      layout: false
    })
  })
})

test('index', function (done) {
  request(app)
    .get('/')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'async.html'), 'utf8'))
    .end(done)
});

test('async', function(done) {
  request(app)
    .get('/fake-async')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'fake-async.html'), 'utf8'))
    .end(done)
});
