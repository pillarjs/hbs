const path = require('node:path')
const request = require('supertest')
const express = require('express')
const hbsFactory = require('../')

// https://github.com/pillarjs/hbs/issues/119
describe('template inheritance (#119)', () => {
  let app

  before(() => {
    const hbs = hbsFactory.create()

    // a reusable base layout registered as a partial, with an override block
    hbs.registerPartial('base', [
      '<html>',
      '<head><title>{{title}}</title></head>',
      '<body><main>{{#> content}}Default content{{/content}}</main></body>',
      '</html>',
    ].join('\n'))

    // a middle layout that inherits from `base`, fills its `content` block and
    // exposes `sidebar` and `main` blocks of its own, so views nest two levels
    hbs.registerPartial('two-column', [
      '{{#> base}}',
      '{{#*inline "content"}}',
      '<aside>{{#> sidebar}}Default sidebar{{/sidebar}}</aside>',
      '<section>{{#> main}}{{/main}}</section>',
      '{{/inline}}',
      '{{/base}}',
    ].join(''))

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

    app.get('/nested', (req, res) => {
      res.render('inherit_nested', { layout: false, name: 'Alan' })
    })

    // the automatic layout is left on here on purpose, so the inherited page
    // ends up wrapped a second time by views/layout.hbs
    app.get('/wrapped', (req, res) => {
      res.render('inherit', { name: 'Alan' })
    })
  })

  it('a child view overrides a parent block', async () => {
    await request(app)
      .get('/home')
      .expect(200, [
        '<html>',
        '<head><title>Home</title></head>',
        '<body><main><h1>Welcome Alan</h1></main></body>',
        '</html>\n',
      ].join('\n'))
  })

  it('an unoverridden block keeps the parent default', async () => {
    await request(app)
      .get('/default')
      .expect(200, [
        '<html>',
        '<head><title>Plain</title></head>',
        '<body><main>Default content</main></body>',
        '</html>\n',
      ].join('\n'))
  })

  it('layouts nest more than one level deep', async () => {
    await request(app)
      .get('/nested')
      .expect(200, [
        '<html>',
        '<head><title>Docs</title></head>',
        '<body><main><aside><nav>Docs menu</nav></aside><section><h1>Welcome Alan</h1></section></main></body>',
        '</html>\n',
      ].join('\n'))
  })

  it('without layout: false the page is wrapped by the automatic layout too', async () => {
    await request(app)
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
        '</html>\n',
      ].join('\n'))
  })
})
