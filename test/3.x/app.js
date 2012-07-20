// builtin
var fs = require('fs');
var assert = require('assert');

// 3rd party
var express = require('express');
var request = require('request');

// local
var hbs = require('../../');

var app = express();

// manually set render engine, under normal circumstances this
// would not be needed as hbs would be installed through npm
app.engine('hbs', hbs.__express);

// render html files using hbs as well
// tests detecting the view engine extension
app.engine('html', hbs.__express);

// set the view engine to use handlebars
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));

hbs.registerHelper('link_to', function(context) {
  return "<a href='" + context.url + "'>" + context.body + "</a>";
});

hbs.registerHelper('link_to2', function(title, context) {
  return "<a href='/posts" + context.url + "'>" + title + "</a>"
});

hbs.registerHelper('list', function(items, fn) {
  var out = "<ul>";
  for(var i=0, l=items.length; i<l; i++) {
    out = out + "<li>" + fn(items[i]) + "</li>";
  }
  return out + "</ul>";
});

hbs.registerPartial('link2', '<a href="/people/{{id}}">{{name}}</a>');

function getOptions(options) {
  var opts = {
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
  };

  if (!options) return opts;

  for (var opt in options) {
    opts[opt] = options[opt];
  }

  return opts;
}

app.get('/', function(req, res){
  res.render('index', getOptions());
});

app.get('/html', function(req, res) {
  res.render('index.html', getOptions());
});

app.get('/layouts/:format?', function(req, res) {
  var template = 'index';
  var options = getOptions({
    layout: 'layouts/' + req.query.file
  });

  if (req.params.format) {
    template += '.' + req.params.format;
  }

  res.render(template, options);
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

suite('layouts');

test('hbs layout without extension', function(done) {
  var server = app.listen(3000, function() {
    var expected = fs.readFileSync(__dirname + '/../fixtures/layouts.html', 'utf8');
    var testUrl = 'http://localhost:3000/layouts?file=custom_hbs';

    request(testUrl, function(err, res, body) {
      assert.equal(body, expected);
      server.close();
    });
  });

  server.on('close', done);
});

test('html layout without extension', function(done) {
  var server = app.listen(3000, function() {
    var expected = fs.readFileSync(__dirname + '/../fixtures/layouts.html', 'utf8');
    var testUrl = 'http://localhost:3000/layouts/html?file=custom_html';

    request(testUrl, function(err, res, body) {
      assert.equal(body, expected);
      server.close();
    });
  });

  server.on('close', done);
});

test('hbs layout with extension', function(done) {
  var server = app.listen(3000, function() {
    var expected = fs.readFileSync(__dirname + '/../fixtures/layouts.html', 'utf8');
    var testUrl = 'http://localhost:3000/layouts/hbs?file=custom_hbs.hbs';

    request(testUrl, function(err, res, body) {
      assert.equal(body, expected);
      server.close();
    });
  });

  server.on('close', done);
});

test('html layout with extension', function(done) {
  var server = app.listen(3000, function() {
    var expected = fs.readFileSync(__dirname + '/../fixtures/layouts.html', 'utf8');
    var testUrl = 'http://localhost:3000/layouts/html?file=custom_html.html';

    request(testUrl, function(err, res, body) {
      assert.equal(body, expected);
      server.close();
    });
  });

  server.on('close', done);
});
