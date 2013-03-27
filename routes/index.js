
/*
 * GET home page.
 */

exports.index = function(req, res){
	res.locals.session = req.session;
  res.render('index', { title: 'Pizza Shop '});
};
