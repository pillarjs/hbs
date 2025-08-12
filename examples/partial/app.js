const fs = require('fs');
const path = require('path')

// 3rd party
const express = require('express');
const hbs = require('hbs');

const app = express();

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
