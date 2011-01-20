# hbs #

[Express.js](http://github.com/visionmedia/express) view engine wrapper for
[handlebars.js](http://github.com/wycats/handlebars.js), an extension of
[Mustache](http://mustache.github.com/) template language.

## Why ##

While Handlbars.js is already a Node.js module, it cannot be used directly as
an Express.js view engine. This module will fill that role until Handlebars.js
adds Express.js view engine support directly.
	
## Installation ##

	npm install hbs

## Usage ##

To set *hbs* as default view engine:
	
    app.set("view engine", "hbs");
	
To your own version of Handlebars:

    require('hbs').handlebars = require('/path/to/handlebars');

or

    require('hbs').handlebarsPath = '/path/to/handlebars';

## Tricks ##

Handlebars support view helper functions which comes in handy. For example, following
code allow view templates to affect head section which is typically rendered from layout
template.

### layout.hbs ###
	
	<html>
		<head>
			<title>{{page_title}}</title>
			<script src="js/common.js" type="text/javascript" charset="utf-8"></script>
			<script src="js/{{app_name}}.js" type="text/javascript" charset="utf-8"></script>
			<link type="text/css" rel="stylesheet" href="common.css">
			<link type="text/css" rel="stylesheet" href="{{app_name}}.css">
		</head>
		<body>
		{{{body}}}
		</body>
	</html>
		
### myview.hbs ###
	
	{{#properties}}
		"app_name": "myapp",
		"page_title": "My View"
	{{/properties}}
	<div>blah</div>
	...
		
### view rendering code ###
  
	var options = {
		cache: true,
		compile: true,
		locals {
			...
		},
		blockHelpers: {
			properties: function (context, fn) {
					var props = JSON.parse("{" + fn(this) + "}");
					for (var prop in props) {
							if (props.hasOwnProperty(prop)) {
									context[prop] = props[prop];
							}
					}
					return "";
			}
		}
	};
	res.render("myview", options);

## Migrating from 0.0.3 from 0.0.2 ##

Handlebars' block-helpers now needs to be in `blockHelpers` (see example above) instead of `locals`.
