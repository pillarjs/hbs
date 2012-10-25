
// builtin
var fs = require('fs');
var assert = require('assert');

// 3rd party
var express = require('express');
var request = require('request');

// local
var hbs = require('../../');

var app = express.createServer();

// doesn't need to happen if hbs is installed through npm
// only here for testing
app.register('hbs', hbs);

app.set('views', __dirname + '/views');
app.set('view engine', 'hbs');

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

app.get('/syntax-error', function(req, res) {
  res.render('syntax-error');
});

test('index', function(done) {
  app.listen(3000, function() {

    var expected = fs.readFileSync(__dirname + '/../fixtures/index.html', 'utf8');

    request('http://localhost:3000', function(err, res, body) {
      assert.equal(body, expected);
      app.close();
    });
  });

  app.once('close', function() {
    done();
  });
});

test('syntax error', function(done) {
  app.listen(3000, function() {

    request('http://localhost:3000/syntax-error', function(err, res, body) {
      assert.equal(res.statusCode, 500);
      assert.equal(body.split('\n')[0], 'Error: Parse error on line 1:');
      app.close();
    });
  });

  app.once('close', function() {
    done();
  });
});
