var fs = require('fs');
var path = require('path')

// 3rd party
var express = require('express');
var hbs = require('hbs');

var app = express();

hbs.registerPartial('partial', fs.readFileSync(path.join(__dirname, 'views', 'partial.hbs'), 'utf8'))
hbs.registerPartials(path.join(__dirname, 'views', 'partials'))

// set the view engine to use handlebars
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', function(req, res) {

    res.locals = {
        some_value: 'foo bar',
        list: ['cat', 'dog']
    }

    res.render('index');
});

app.listen(3000);
