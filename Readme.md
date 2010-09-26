# hbs #

[Express.js](http://github.com/visionmedia/express) view engine wrapper for
[handlebars.js](http://github.com/wycats/handlebars.js), an extension of
[Mustache](http://mustache.github.com/) template language.

## Why ##

While Handlbars.js is already a Node.js module, it cannot be used directly as
an Express.js view engine. This module will fill that role until Handlebars.js
adds Express.js view engine support directly.
	
## Installation ##

*hbs* can be added to an Express.js app as a Node.js module or you can use my [fork
of Express.js](http://github.com/donpark/express) which:
	
* contains *hbs* as a submodule
* extends Express.js to support compile phase in view engine.
	
## Usage ##

To set *hbs* as default view engine:
	
	app.set("view engine", "hbs");
	
If you are using my fork of Express.js, compile phase is enabled only in production
mode. To force enable compile phase in non-production mode:

	var options = {
		cache: true,
		compile: true
	};
	
If cache is not enabled, compilation will occur *twice* per render (once for view
and once for layout).
	
## Tricks ##

Handlebars support view helper functions which comes in handy. For example, following
code allow view templates to set page title which is typically rendered from layout
template.

### layout.hbs ###
	
	<html>
		<head>
			<title>{{title}}</title>
		</head>
		<body>
		{{{body}}}
		</body>
	</html>
		
### myview.hbs ###
	
	{{#title}}My View{{/title}}
	...
		
### view rendering code ###
	
	var options = {
		cache: true,
		compile: true,
		locals {
			...
			title: function (context, fn) {
				context.title = fn(this);
				return "";
			}
		}
	};
	res.render("myview", options);
