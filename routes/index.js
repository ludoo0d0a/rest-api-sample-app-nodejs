
/*
 * GET home page.
 */

exports.index = function(req, res){
	res.locals.session = req.session;
	res.render('index', {});
};


exports.signup = function(req, res){
	res.locals.session = req.session;
	res.render('sign_up', {});
};


exports.signin = function(req, res){
	res.locals.session = req.session;
	res.render('sign_in', {});
};

/*
exports.signout = function(req, res){
	res.locals.session = req.session;
	res.render('sign_in', {});
};
*/

exports.profile = function(req, res){
	res.locals.session = req.session;
	res.render('profile', {});
};