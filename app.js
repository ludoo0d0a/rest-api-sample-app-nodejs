
/**
 * Module dependencies.
 */

var template_engine = 'dust'
	, domain = 'localhost';

var express = require('express')
  , routes = require('./routes')
  , db = require('./lib/db')
  , http = require('http')
	, store = new express.session.MemoryStore
  , path = require('path');

var app = express();

if ( template_engine == 'dust' ) {
	var dust = require('dustjs-linkedin')
	, cons = require('consolidate');

	app.engine('dust', cons.dust);

} 
app.configure(function(){

  app.set('template_engine', template_engine);
  app.set('domain', domain);
  app.set('port', process.env.PORT || 8080);
  app.set('views', __dirname + '/views');
  app.set('view engine', template_engine);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('wigglybits'));
	app.use(express.session({ secret: 'whatever', store: store }));
  app.use(express.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));

	//middleware
	app.use(function(req, res, next){
		if ( req.session.user ) {
			req.session.logged_in = true;
		}
		res.locals.message = req.flash();
		res.locals.session = req.session;
		res.locals.q = req.body;
		res.locals.err = false; 
		next();
	});

});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.locals.inspect = require('util').inspect;

app.get('/', routes.index);
app.get('/signup', routes.signup);
app.get('/signin', routes.signin);
app.get('/profile', routes.profile);

var paypal_api = require('./lib/paypal-rest-api.js')();

var token = null;

var http_default_opts = {
	'host': 'api.sandbox.paypal.com',
	'port': '',
	'headers': {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'Authorization': ''
	}
};

paypal_api.configure(http_default_opts);

var client_id = 'EBWKjlELKMYqRNQ6sYvFo64FtaRLRR5BdHEESmha49TM';
var client_secret = 'EO422dn3gQLgDbuwqTjzrFgFtaRLRR5BdHEESmha49TM';

app.get('/order', function(req, res) {

//console.log(req.query["id"]);
paypal_api.generateToken(client_id, client_secret, function(generatedToken) {
	token = generatedToken;
	console.log("The Generated Token is " + token);

	http_default_opts.headers['Authorization'] = token;

	paypal_api.payment.create(create_payment_json, http_default_opts, function(resp, err) {
		if (err) {
			throw err;
		}

		if (resp) {
			console.log("Create Payment Response");
			console.log(resp);
            res.render('index', {
            title: 'Testing out dust.js server-side rendering'
            });
		}
	});

});

var create_payment_json = {
	"intent": "sale",
	"payer": {
		"payment_method": "credit_card",
		"funding_instruments": [{
			"credit_card": {
				"type": "visa",
				"number": "4417119669820331",
				"expire_month": "11",
				"expire_year": "2018",
				"cvv2": "874",
				"first_name": "Joe",
				"last_name": "Shopper",
				"billing_address": {
					"line1": "52 N Main ST",
					"city": "Johnstown",
					"state": "OH",
					"postal_code": "43210",
					"country_code": "US"
				}
			}
		}]
	},
	"transactions": [{
		"amount": {
			"total": "7",
			"currency": "USD",
			"details": {
				"subtotal": "5",
				"tax": "1",
				"shipping": "1"
			}
		},
		"description": "This is the payment transaction description."
	}]
};

});
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
