const path = require('node:path')
const fs = require('node:fs')
const request = require('supertest')
const express = require('express')
const hbs = require('../').create()

const FIXTURES_DIR = path.join(__dirname, 'fixtures')

hbs.registerHelper('make_error', function () {
  throw new TypeError('oops!')
})

hbs.registerHelper('link_to', function (context) {
  return "<a href='" + context.url + "'>" + context.body + "</a>"
})

hbs.registerHelper('link_to2', function (title, context) {
  return "<a href='/posts" + context.url + "'>" + title + "</a>"
})

hbs.registerHelper('list', function (items, context) {
  let out = '<ul class="' + (this.listClassName || '') + '">'

  for (let i = 0; i < items.length; ++i) {
    out = out + '<li>' + context.fn(items[i]) + '</li>'
  }
  return out + '</ul>'
})

hbs.registerPartial('link2', '<a href="/people/{{id}}">{{name}}</a>')
hbs.registerPartials(path.join(__dirname, 'views', 'partials'))

function shouldHaveFirstLineEqual (str) {
  return function (res) {
    expect(res.text.split(/\r?\n/)[0]).toBe(str)
  }
}

function Person (firstName, lastName) {
  this.firstName = firstName
  this.lastName = lastName
}

Person.prototype.toString = function toString () {
  return this.name()
}

Person.prototype.name = function name () {
  return this.firstName
}

describe('express 4.x', () => {
  let app

  beforeAll(() => {
    app = express()

    // manually set render engine, under normal circumstances this
    // would not be needed as hbs would be installed through npm
    app.engine('hbs', hbs.__express)

    // render html files using hbs as well
    // tests detecting the view engine extension
    app.engine('html', hbs.__express)

    // set the view engine to use handlebars
    app.set('view engine', 'hbs')
    app.set('views', [
      path.join(__dirname, 'views'),
      path.join(__dirname, 'views_secondary')
    ])

    app.use(express.static(path.join(__dirname, 'public')))

    // expose app and response locals in views
    hbs.localsAsTemplateData(app)
    app.locals.father = 'Alan'

    app.get('/', function (req, res) {
      res.render('index', {
        title: 'Express Handlebars Test',
        // basic test
        name: 'Alan',
        hometown: 'Somewhere, TX',
        kids: [
          { name: 'Jimmy', age: '12' },
          { name: 'Sally', age: '4' }
        ],
        // path test
        person: { name: 'Alan' },
        company: { name: 'Rad, Inc.' },
        // escapee test
        escapee: '<jail>escaped</jail>',
        // helper test
        listClassName: 'my-list',
        posts: [{ url: '/hello-world', body: 'Hello World!' }],
        // helper with string
        posts2: [{ url: '/hello-world', body: 'Hello World!' }],
        // for block helper test
        people: [
          { firstName: 'Yehuda', lastName: 'Katz' },
          { firstName: 'Carl', lastName: 'Lerche' },
          { firstName: 'Alan', lastName: 'Johnson' }
        ],
        people2: [
          { name: { firstName: 'Yehuda', lastName: 'Katz' } },
          { name: { firstName: 'Carl', lastName: 'Lerche' } },
          { name: { firstName: 'Alan', lastName: 'Johnson' } }
        ],
        // for partial test
        people3: [
          { name: 'Alan', id: 1 },
          { name: 'Yehuda', id: 2 }
        ]
      })
    })

    app.get('/html', function (req, res) {
      res.render('index.html', {
        title: 'Express Handlebars Test',
        name: 'Alan',
        hometown: 'Somewhere, TX',
        kids: [
          { name: 'Jimmy', age: '12' },
          { name: 'Sally', age: '4' }
        ],
        person: { name: 'Alan' },
        company: { name: 'Rad, Inc.' },
        escapee: '<jail>escaped</jail>',
        listClassName: 'my-list',
        posts: [{ url: '/hello-world', body: 'Hello World!' }],
        posts2: [{ url: '/hello-world', body: 'Hello World!' }],
        people: [
          { firstName: 'Yehuda', lastName: 'Katz' },
          { firstName: 'Carl', lastName: 'Lerche' },
          { firstName: 'Alan', lastName: 'Johnson' }
        ],
        people2: [
          { name: { firstName: 'Yehuda', lastName: 'Katz' } },
          { name: { firstName: 'Carl', lastName: 'Lerche' } },
          { name: { firstName: 'Alan', lastName: 'Johnson' } }
        ],
        people3: [
          { name: 'Alan', id: 1 },
          { name: 'Yehuda', id: 2 }
        ]
      })
    })

    app.get('/helper-error', function (req, res) {
      res.render('error')
    })

    app.get('/syntax-error', function (req, res) {
      res.render('syntax-error', {
        cache: true
      })
    })

    app.get('/syntax-error-layout', function (req, res) {
      res.render('blank', { layout: 'bad_layout' })
    })

    app.get('/partials', function (req, res) {
      res.render('partials', { layout: false })
    })

    app.get('/escape', function (req, res) {
      res.render('escape', { title: 'foobar', layout: false })
    })

    app.get('/locals', function (req, res) {
      res.locals.person = 'Alan'
      res.render('locals', {
        layout: false,
        kids: [{ name: 'Jimmy' }, { name: 'Sally' }]
      })
    })

    app.get('/locals-cached', function (req, res) {
      res.locals.person = 'Alan'
      res.render('locals', {
        layout: false,
        cache: true,
        kids: [{ name: 'Jimmy' }, { name: 'Sally' }]
      })
    })

    app.get('/locals-model', function (req, res) {
      res.locals.person = new Person('Alan', 'Smith')
      res.render('locals', {
        layout: false,
        kids: [new Person('Jimmy', 'Smith'), new Person('Sally', 'Smith')]
      })
    })

    app.get('/globals', function (req, res) {
      res.render('globals', {
        layout: 'layout_globals',
        kids: [{ name: 'Jimmy' }, { name: 'Sally' }]
      })
    })

    app.get('/secondary', function (req, res) {
      res.render('secondary', {
        text: '  index body :)',
        title: 'Express Handlebars Test'
      })
    })

    app.get('/layout-no-exist', function (req, res) {
      res.render('blank', {
        layout: 'noexist_layout'
      })
    })

    app.use(function (err, req, res, next) {
      res.status(500).send(err.stack.toString())
    })
  })

  test('index', async () => {
    const expected = fs.readFileSync(path.join(FIXTURES_DIR, 'index.html'), 'utf8')
    await request(app).get('/').expect(expected)
  })

  test('helper error', async () => {
    await request(app)
      .get('/helper-error')
      .expect(500)
      .expect(shouldHaveFirstLineEqual('TypeError: ' + path.join(__dirname, 'views', 'error.hbs') + ': oops!'))
  })

  test('partials', async () => {
    await request(app)
      .get('/partials')
      .expect(shouldHaveFirstLineEqual('Test Partial 1Test Partial 2Test Partial 3Test Partial 4Test Partial 5'))
  })

  test('html extension', async () => {
    const expected = fs.readFileSync(path.join(FIXTURES_DIR, 'index.html'), 'utf8')
    await request(app).get('/html').expect(expected)
  })

  test('syntax error', async () => {
    await request(app)
      .get('/syntax-error')
      .expect(500)
      .expect(shouldHaveFirstLineEqual('Error: ' + path.join(__dirname, 'views', 'syntax-error.hbs') + ': Parse error on line 1:'))
  })

  test('syntax error cached', async () => {
    await request(app)
      .get('/syntax-error')
      .expect(500)
      .expect(shouldHaveFirstLineEqual('Error: ' + path.join(__dirname, 'views', 'syntax-error.hbs') + ': Parse error on line 1:'))
  })

  test('syntax error layout', async () => {
    await request(app)
      .get('/syntax-error-layout')
      .expect(500)
      .expect(shouldHaveFirstLineEqual('Error: ' + path.join(__dirname, 'views', 'bad_layout.hbs') + ': Parse error on line 3:'))
  })

  test('escape for frontend', async () => {
    const expected = fs.readFileSync(path.join(FIXTURES_DIR, 'escape.html'), 'utf8')
    await request(app).get('/escape').expect(expected)
  })

  test('response locals', async () => {
    const expected = fs.readFileSync(path.join(FIXTURES_DIR, 'locals.html'), 'utf8')
    await request(app).get('/locals').expect(expected)
  })

  test('response locals cached', async () => {
    const expected = fs.readFileSync(path.join(FIXTURES_DIR, 'locals.html'), 'utf8')
    await request(app).get('/locals-cached').expect(expected)
    await request(app).get('/locals-cached').expect(expected)
  })

  test('response locals model', async () => {
    const expected = fs.readFileSync(path.join(FIXTURES_DIR, 'locals.html'), 'utf8')
    await request(app).get('/locals-model').expect(expected)
  })

  test('response globals', async () => {
    const expected = fs.readFileSync(path.join(FIXTURES_DIR, 'globals.html'), 'utf8')
    await request(app).get('/globals').expect(expected)
  })

  test('multiple views directories', async () => {
    const expected = fs.readFileSync(path.join(FIXTURES_DIR, 'index_no_layout.html'), 'utf8')
    await request(app).get('/secondary').expect(expected)
  })

  test('layout does not exist', async () => {
    await request(app)
      .get('/layout-no-exist')
      .expect(500)
      .expect(/Error: ENOENT.*noexist_layout\.hbs/)
  })

  test('app.render', async () => {
    const str = await new Promise((resolve, reject) => {
      app.render('blank', (err, str) => {
        if (err) return reject(err)
        resolve(str)
      })
    })
    expect(str).toMatch(/  index body :\)/)
  })
})
