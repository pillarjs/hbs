// builtin
var fs = require('fs');
var assert = require('assert');

// 3rd party
var express = require('express');
var request = require('request');

// local
var hbs = require('../../').create();

var app = express();

// manually set render engine, under normal circumstances this
// would not be needed as hbs would be installed through npm
app.engine('hbs', hbs.__express);

// render html files using hbs as well
// tests detecting the view engine extension
app.engine('html', hbs.__express);

// set the view engine to use handlebars
app.set('view engine', 'hbs');
app.set('views', [__dirname + '/views', __dirname + '/views_secondary']);

app.use(express.static(__dirname + '/public'));

hbs.registerHelper('link_to', function(context) {
  return "<a href='" + context.url + "'>" + context.body + "</a>";
});

hbs.registerHelper('link_to2', function(title, context) {
  return "<a href='/posts" + context.url + "'>" + title + "</a>"
});

hbs.registerHelper('list', function(items, context) {
  var out = "<ul>";
  for(var i=0; i<items.length; ++i) {
    out = out + "<li>" + context.fn(items[i]) + "</li>";
  }
  return out + "</ul>";
});

hbs.registerPartial('link2', '<a href="/people/{{id}}">{{name}}</a>');
hbs.registerPartials(__dirname + '/views/partials');

// expose app and response locals in views
hbs.localsAsTemplateData(app);
app.locals.father = 'Alan';

app.get('/', function(req, res){
  res.render('index', {
    title: 'Express Handlebars Test',
    // basic test
    name: 'Alan',
    hometown: "Somewhere, TX",
    kids: [{"name": "Jimmy", "age": "12"}, {"name": "Sally", "age": "4"}],
    // path test
    person: { "name": "Alan" }, company: {"name": "Rad, Inc." },
    // escapee test
    escapee: '<jail>escaped</jail>',
    // helper test
    posts: [{url: "/hello-world", body: "Hello World!"}],
    // helper with string
    posts2: [{url: "/hello-world", body: "Hello World!"}],
    // for block helper test
    people: [
      {firstName: "Yehuda", lastName: "Katz"},
      {firstName: "Carl", lastName: "Lerche"},
      {firstName: "Alan", lastName: "Johnson"}
    ],
    people2: [
      { name: { firstName: "Yehuda", lastName: "Katz" } },
      { name: { firstName: "Carl", lastName: "Lerche" } },
      { name: { firstName: "Alan", lastName: "Johnson" } }
    ],
    // for partial test
    people3: [
      { "name": "Alan", "id": 1 },
      { "name": "Yehuda", "id": 2 }
    ]
  });
});

app.get('/html', function(req, res) {
  res.render('index.html', {
    title: 'Express Handlebars Test',
    // basic test
    name: 'Alan',
    hometown: "Somewhere, TX",
    kids: [{"name": "Jimmy", "age": "12"}, {"name": "Sally", "age": "4"}],
    // path test
    person: { "name": "Alan" }, company: {"name": "Rad, Inc." },
    // escapee test
    escapee: '<jail>escaped</jail>',
    // helper test
    posts: [{url: "/hello-world", body: "Hello World!"}],
    // helper with string
    posts2: [{url: "/hello-world", body: "Hello World!"}],
    // for block helper test
    people: [
      {firstName: "Yehuda", lastName: "Katz"},
      {firstName: "Carl", lastName: "Lerche"},
      {firstName: "Alan", lastName: "Johnson"}
    ],
    people2: [
      { name: { firstName: "Yehuda", lastName: "Katz" } },
      { name: { firstName: "Carl", lastName: "Lerche" } },
      { name: { firstName: "Alan", lastName: "Johnson" } }
    ],
    // for partial test
    people3: [
      { "name": "Alan", "id": 1 },
      { "name": "Yehuda", "id": 2 }
    ]
  });
});

app.get('/syntax-error', function(req, res) {
  res.render('syntax-error');
});

app.get('/partials', function(req, res) {
  res.render('partials', { layout: false });
});

app.get('/escape', function(req, res) {
  res.render('escape', { title: 'foobar', layout: false });
});

app.get('/locals', function(req, res) {
  res.locals.person = 'Alan';
  res.render('locals', {
    layout: false,
    kids: [{ name: 'Jimmy' }, { name: 'Sally' }],
  });
});

app.get('/locals-cached', function(req, res) {
  res.locals.person = 'Alan';
  res.render('locals', {
    layout: false,
    cache: true,
    kids: [{ name: 'Jimmy' }, { name: 'Sally' }],
  });
});

app.get('/globals', function(req, res) {
  res.render('globals', {
    layout: 'layout_globals',
    kids: [{ name: 'Jimmy' }, { name: 'Sally' }],
  });
});

app.get('/secondary', function(req, res) {
  res.render('secondary', {
    text: '  index body :)',
    title: 'Express Handlebars Test'
  });
});

app.use(function(err, req, res, next) {
  res.status(500).send(err.stack.toString());
});

test('index', function(done) {
  var server = app.listen(3000, function() {

    var expected = fs.readFileSync(__dirname + '/../fixtures/index.html', 'utf8');

    request('http://localhost:3000', function(err, res, body) {
      assert.equal(body, expected);
      server.close();
    });
  });

  server.on('close', function() {
    done();
  });
});

test('partials', function(done) {
  var server = app.listen(3000, function() {

    var expected = 'Test Partial 1Test Partial 2Test Partial 3';

    request('http://localhost:3000/partials', function(err, res, body) {
      assert.equal(body.trim(), expected.trim());
      server.close();
    });
  });

  server.on('close', function() {
    done();
  });
});

test('html extension', function(done) {
  var server = app.listen(3000, function() {

    var expected = fs.readFileSync(__dirname + '/../fixtures/index.html', 'utf8');

    request('http://localhost:3000/html', function(err, res, body) {
      assert.equal(body, expected);
      server.close();
    });
  });

  server.on('close', function() {
    done();
  });
});

test('syntax error', function(done) {
  var server = app.listen(3000, function() {

    request('http://localhost:3000/syntax-error', function(err, res, body) {
      assert.equal(res.statusCode, 500);
      assert.equal(body.split('\n')[0], 'Error: ' + __dirname + '/views/syntax-error.hbs: Parse error on line 1:');
      //assert.equal(bod);
      server.close();
    });
  });

  server.on('close', function() {
    done();
  });
});

test('escape for frontend', function(done) {
  var server = app.listen(3000, function() {

    var expected = fs.readFileSync(__dirname + '/../fixtures/escape.html', 'utf8');

    request('http://localhost:3000/escape', function(err, res, body) {
      assert.equal(body, expected);
      server.close();
    });
  });

  server.on('close', function() {
    done();
  });
});

test('response locals', function(done) {
  var server = app.listen(3000, function() {

    var expected = fs.readFileSync(__dirname + '/../fixtures/locals.html', 'utf8');

    request('http://localhost:3000/locals', function(err, res, body) {
      assert.equal(body, expected);
      server.close();
    });
  });

  server.on('close', function() {
    done();
  });
});

test('response locals cached', function(done) {
  var server = app.listen(3000, function() {

    var expected = fs.readFileSync(__dirname + '/../fixtures/locals.html', 'utf8');

    request('http://localhost:3000/locals-cached', function(err, res, body) {
      assert.equal(body, expected);

      // Request the second time, so it is cached
      request('http://localhost:3000/locals-cached', function(err, res, body) {
        assert.equal(body, expected);
        server.close();
      });
    });
  });

  server.on('close', function() {
    done();
  });
});

test('response globals', function(done) {
  var server = app.listen(3000, function() {

    var expected = fs.readFileSync(__dirname + '/../fixtures/globals.html', 'utf8');

    request('http://localhost:3000/globals', function(err, res, body) {
      assert.equal(body, expected);
      server.close();
    });
  });

  server.on('close', function() {
    done();
  });
});

test('multiple views directories', function(done) {
  var server = app.listen(3000, function() {

    var expected = fs.readFileSync(__dirname + '/../fixtures/index_no_layout.html', 'utf8');

    request('http://localhost:3000/secondary', function(err, res, body) {
      assert.equal(body, expected);
      server.close();
    });
  });

  server.on('close', function() {
    done();
  });
});
