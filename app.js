var template_engine = 'dust', 
	domain = 'localhost';

var express = require('express'), 
	routes = require('./routes'),	
	http = require('http'),
	store = new express.session.MemoryStore,
	path = require('path'),
	flash = require('connect-flash');

var app = express();

if ( template_engine == 'dust' ) {
	var dust = require('dustjs-linkedin'),
		cons = require('consolidate');
	app.engine('dust', cons.dust);
} 
app.configure(function() {
	app.set('template_engine', template_engine);
	app.set('domain', domain);
	app.set('port', process.env.PORT || 8080);
	app.set('views', __dirname + '/views');
	app.set('view engine', template_engine);
	app.use(express.favicon());
	app.use(express.logger('dev'));	
	app.use(express.bodyParser());	
	app.use(express.cookieParser());
	app.use(express.session({ secret: 'whatever', store: store }));
	app.use(express.session());
	app.use(flash());	
	app.use(app.router);	
	app.use(express.static(path.join(__dirname, 'public')));	
});

app.configure('development', function(){
	app.use(express.errorHandler());
	app.locals.inspect = require('util').inspect;
});


app.get('/', routes.index);

app.get('/signup', routes.signup);
app.post('/signup', routes.completesignup);

app.get('/signin', routes.signin);
app.post('/login', routes.dologin);

app.get('/signout', routes.signout);
app.get('/profile', routes.auth, routes.profile);

app.get('/order', routes.order);
app.get('/orderList', routes.orderList);
app.get('/orderConfirm', routes.orderconfirm);
app.get('/orderExecute', routes.orderExecute);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});