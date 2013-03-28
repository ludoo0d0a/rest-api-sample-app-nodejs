var db = require('../lib/db')();
var paypal = require('../lib/paypal-rest-api')();


var http_default_opts = {
	'host': 'api.sandbox.paypal.com',
	'port': '',
	'headers': {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'Authorization': ''
	}
};
var client_id = 'EBWKjlELKMYqRNQ6sYvFo64FtaRLRR5BdHEESmha49TM';
var client_secret = 'EO422dn3gQLgDbuwqTjzrFgFtaRLRR5BdHEESmha49TM';
paypal.configure(http_default_opts);

exports.index = function(req, res){
	res.locals.session = req.session;
	var message = (req.flash && req.flash('message')) ? req.flash('message') : [];	
	res.render('index', {message: message});
};


exports.auth = function(req, res, next){
	if(req.session.authenticated) {
        next();
    } else {
        res.redirect('signin');
    }
};

exports.signup = function(req, res){
	res.locals.session = req.session;	
	res.render('sign_up', {});
};

exports.completesignup = function(req, res){
	res.locals.session = req.session;
	
	var user = req.body.user;
	var userCard = user.credit_card;	
	
	if(user.password != user.password_confirmation) {
		res.render('sign_up', {message: [{desc: "Passwords do not match", type: "error"}]});
	} else {
		//TODO: Add card validation	
		
		paypal.generateToken(client_id, client_secret, function(generatedToken) {
			token = generatedToken;	
			http_default_opts.headers['Authorization'] = token;
			card = {type: userCard.type, number: userCard.number, cvv2: userCard.cvv2, expire_month: userCard.expire_month, expire_year: userCard.expire_year };			
			//TODO: Create user even when card details are not given
			paypal.credit_card.create(card, http_default_opts, function(card, err) {
				console.log(card);
				cardId = (err) ? "" : card.id; 
				db.createUser(user.email, user.password, card.id, function(dbErr, response) {
					if(dbErr) {
						res.render('sign_up', {message: [{desc: err, type: "error"}]});
					} else {
						if(err) {						
							res.render('', {message: [{desc: "You have been signed up but we had trouble saving your card information.", type: "error"}]});
						} else {
							req.session.authenticated = true;
							req.session.email = user.email;
							req.flash('message', [{desc: "You have been signed up successfully", type: "info"}]);			
							res.redirect('');						
						}
					}
				});			
			});	
		});
	}	
};


exports.signin = function(req, res){
	res.locals.session = req.session;
	var message = (req.flash && req.flash('message')) ? req.flash('message') : [];	
	res.render('sign_in', {message: message});
};

exports.dologin = function(req, res){
	res.locals.session = req.session;
	
	var user = req.body.user;
	db.authenticateUser(user.email, user.password, function(err, response){
		if(err) {
			req.flash('message', [{desc: err, type: "error"}]);			
			res.redirect('signin');
		} else {
			req.session.authenticated = true;
			req.session.email = user.email;			
			res.render('index', {});
		}
	});	
};

exports.signout = function(req, res){
	res.locals.session = req.session;
	req.session.authenticated = false;
	req.session.email = '';
	res.redirect('/');
};


exports.profile = function(req, res){
	res.locals.session = req.session;
	db.getUser(req.session.email, function(err, user) {
		if(err || !user) {			
			console.log(err);
			//TODO: Display error message to user
			res.render('profile', { message: [{desc: "Could not retrieve profile information", type: "error"}]});
		} else {		
			paypal.generateToken(client_id, client_secret, function(generatedToken) {
				token = generatedToken;	
				http_default_opts.headers['Authorization'] = token;			
				paypal.credit_card.get(user.card, http_default_opts, function(card, err) {
					if(err) {						
						res.render('profile', {user: user, message: [{desc: "Could not retrieve card information", type: "error"}]});
					} else {
						console.log("No err");
						res.render('profile', {user: user, card: card});						
					}
				});	
			});			
		}
	});	
};