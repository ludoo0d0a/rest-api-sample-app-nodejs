var db = require('../lib/db')();
var paypal = require('../lib/paypal-rest-api')();

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
	if(user.password != user.password_confirmation) {
		res.render('sign_up', {message: [{desc: "Passwords do not match", type: "error"}]});
	}
	// save credit card
	creditCardId = "";
	db.createUser(user.email, user.password, creditCardId, function(err, response){
		if(err) {
			res.render('sign_up', {message: [{desc: err, type: "error"}]});
		} else {
			req.session.authenticated = true;
			req.flash('message', [{desc: "You have been signed up successfully", type: "info"}]);			
			res.redirect('');
		}
	});
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
			res.render('index', {});
		}
	});	
};

exports.signout = function(req, res){
	res.locals.session = req.session;
	req.session.authenticated = false;
	res.redirect('/');
};


exports.profile = function(req, res){
	res.locals.session = req.session;
	res.render('profile', {});
};