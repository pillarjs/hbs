var path = require('path')
var request = require('supertest')
var utils = require('../support/utils')

// local
var hbs = require('../../')

var app = null

suite('express 4.x template inheritance')

function createApp (instance) {
  var express = require('express')
  var app = express()

  // a reusable base layout registered as a partial, with an override block.
  // see https://github.com/pillarjs/hbs/issues/119
  instance.registerPartial('base', [
    '<html>',
    '<head><title>{{title}}</title></head>',
    '<body><main>{{#> content}}Default content{{/content}}</main></body>',
    '</html>'
  ].join('\n'))

  // a middle layout that inherits from `base`, fills its `content` block and
  // exposes `sidebar` and `main` blocks of its own, so views nest two levels
  instance.registerPartial('two-column', [
    '{{#> base}}',
    '{{#*inline "content"}}',
    '<aside>{{#> sidebar}}Default sidebar{{/sidebar}}</aside>',
    '<section>{{#> main}}{{/main}}</section>',
    '{{/inline}}',
    '{{/base}}'
  ].join(''))

  app.engine('hbs', instance.__express)
  app.set('view engine', 'hbs')
  app.set('views', path.join(__dirname, 'views'))

  app.get('/home', function (req, res) {
    res.render('inherit', { layout: false, name: 'Alan' })
  })

  app.get('/default', function (req, res) {
    res.render('inherit_default', { layout: false })
  })

  app.get('/nested', function (req, res) {
    res.render('inherit_nested', { layout: false, name: 'Alan' })
  })

  // the automatic layout is left on here on purpose, so the inherited page
  // ends up wrapped a second time by views/layout.hbs
  app.get('/wrapped', function (req, res) {
    res.render('inherit', { name: 'Alan' })
  })

  return app
}

before(function () {
  if (utils.nodeVersionCompare(0.10) < 0) {
    this.skip()
    return
  }

  app = createApp(hbs.create())
})

test('a child view overrides a parent block', function (done) {
  request(app)
    .get('/home')
    .expect(200, [
      '<html>',
      '<head><title>Home</title></head>',
      '<body><main><h1>Welcome Alan</h1></main></body>',
      '</html>\n'
    ].join('\n'), done)
})

test('an unoverridden block keeps the parent default', function (done) {
  request(app)
    .get('/default')
    .expect(200, [
      '<html>',
      '<head><title>Plain</title></head>',
      '<body><main>Default content</main></body>',
      '</html>\n'
    ].join('\n'), done)
})

test('layouts nest more than one level deep', function (done) {
  request(app)
    .get('/nested')
    .expect(200, [
      '<html>',
      '<head><title>Docs</title></head>',
      '<body><main><aside><nav>Docs menu</nav></aside><section><h1>Welcome Alan</h1></section></main></body>',
      '</html>\n'
    ].join('\n'), done)
})

test('without layout: false the page is wrapped by the automatic layout too', function (done) {
  request(app)
    .get('/wrapped')
    .expect(200, [
      '<html>',
      '<head>',
      '  <title></title>',
      '  <link rel=\'stylesheet\' href=\'/stylesheets/style.css\'>',
      '</head>',
      '<body>',
      '<html>',
      '<head><title>Home</title></head>',
      '<body><main><h1>Welcome Alan</h1></main></body>',
      '</html>\n',
      '</body>',
      '</html>\n'
    ].join('\n'), done)
})
