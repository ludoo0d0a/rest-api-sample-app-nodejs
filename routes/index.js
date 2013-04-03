var db = require('../lib/db')();
var paypal = require('paypal-rest-sdk');
var uuid = require('node-uuid');

var http_default_opts = {
	'host': 'api.sandbox.paypal.com',
	'port': '',
	'client_id': 'EBWKjlELKMYqRNQ6sYvFo64FtaRLRR5BdHEESmha49TM',
	'client_secret': 'EO422dn3gQLgDbuwqTjzrFgFtaRLRR5BdHEESmha49TM'
};

exports.index = function(req, res) {
	res.locals.session = req.session;
	var message = (req.flash && req.flash('message')) ? req.flash('message') : [];	
	res.render('index', {message: message});
};


exports.auth = function(req, res, next) {
	if(req.session.authenticated) {
        next();
    } else {
        res.redirect('signin');
    }
};

exports.signup = function(req, res) {
	res.locals.session = req.session;	
	res.render('sign_up', {});
};

exports.completesignup = function(req, res) {
	res.locals.session = req.session;
	
	var user = req.body.user;
	var userCard = user.credit_card;	
	
	if(user.password != user.password_confirmation) {
		res.render('sign_up', {message: [{desc: "Passwords do not match", type: "error"}]});
	} else {
		//TODO: Add card validation		
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
	}	
};


exports.signin = function(req, res) {
	res.locals.session = req.session;
	var message = (req.flash && req.flash('message')) ? req.flash('message') : [];	
	res.render('sign_in', {message: message});
};

exports.dologin = function(req, res) {
	res.locals.session = req.session;
	
	var user = req.body.user;
	db.authenticateUser(user.email, user.password, function(err, response) {
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

exports.signout = function(req, res) {
	res.locals.session = req.session;
	req.session.authenticated = false;
	req.session.email = '';
	res.redirect('/');
};


exports.profile = function(req, res) {
	res.locals.session = req.session;
	db.getUser(req.session.email, function(err, user) {
		if(err || !user) {			
			console.log(err);
			//TODO: Display error message to user
			res.render('profile', { message: [{desc: "Could not retrieve profile information", type: "error"}]});
		} else {		
			paypal.credit_card.get(user.card, http_default_opts, function(card, err) {
				if(err) {						
					res.render('profile', {user: user, message: [{desc: "Could not retrieve card information", type: "error"}]});
				} else {
					console.log("No err");
					res.render('profile', {user: user, card: card});						
				}
			});	
		}
	});	
};

exports.orderconfirm = function(req, res) {
    res.locals.session = req.session;
    var amount = req.query["orderAmount"],
        desc   = req.query["orderDescription"];
        req.session.amount = amount;
        req.session.desc = desc;
    if(req.session.authenticated) {
        res.render('order_confirm', {'amount' : amount, 'desc' : desc, 'credit_card' : 'true'});
    } else {
        res.redirect('signin');
    }  
	
};

exports.orders = function(req, res) {
}

exports.order = function(req, res) {
	res.locals.session = req.session;
    var order_id = uuid.v4();
    
    if(req.query['order_payment_method'] == 'credit_card')
    {
        var savedCard = {
	        "intent": "sale",
	        "payer": {
	            "payment_method": "credit_card",
	            "funding_instruments": [{
	                "credit_card_token": {
	                    "credit_card_id": ""
	                }
	            }]
	        },
	        "transactions": [{
	            "amount": {
	                "currency": "USD",
	                "total": ""
	            },
	            "description": "This is the payment description."
	        }]
	    }
    
		db.getUser(req.session.email, function(err, user) {
			if(err || !user) {			
				console.log(err);
				//TODO: Display error message to user
				res.render('order_detail', { message: [{desc: "Could not retrieve credit card information", type: "error"}]});
			} else {
				savedCard.payer.funding_instruments[0].credit_card_token.credit_card_id = user.card;	
				savedCard.transactions[0].amount.total = req.query['order_amount'];
				console.log(savedCard.transactions[0].amount.total);
				paypal.payment.create(savedCard, http_default_opts, function(resp, err) {
					if (err) {
						throw err;
					} 
					if (resp) {
					    console.log("Create Payment Response");
					    
					    db.insertOrder(order_id, req.session.email, resp.id, resp.state, req.session.amount, req.session.desc, resp.create_time, function(err, order) {
							if(err || !order) {			
								console.log(err);
								//TODO: Display error message to user
								res.render('order_detail', { message: [{desc: "Could not save order details", type: "error"}]});
							} else {
								db.getOrders(req.session.email, function(err, orderList) {
									console.log(orderList);
									res.render('order_detail', {
										title: 'Recent Order Details', 'ordrs' : orderList
									});	
								});		
							}
		    			});           
					}
	        	});    
			}
  		});   	
	} else if(req.query['order_payment_method'] == 'paypal') {
		var paypalPayment = {
	        "intent": "sale",
	        "payer": {
	            "payment_method": "paypal"
	        },
	        "redirect_urls": {
	        "return_url": "",
	        "cancel_url": "http:\/\/localhost\/test\/rest\/rest-api-sdk-php\/sample\/payments\/ExecutePayment.php?success=false"
	        },
	        "transactions": [{
	        "amount": {
	        "currency": "USD",
	        "total": ""
	        },
	        "description": "This is the payment description."
	        }]
	    };
    
	    paypalPayment.transactions[0].amount.total = req.query['order_amount'];
	    paypalPayment.redirect_urls.return_url = "http://localhost:8080/orderExecute?order_id=" + order_id;
	    paypal.payment.create(paypalPayment, http_default_opts, function(resp, err) {
		    if (err) {
		        throw err;
		    }

			if(resp) {
				console.log("Create Payment Response");
				console.log(resp);
				var link = resp.links;
				console.log(link);
				for (var i = 0; i < link.length; i++) {
					if(link[i].rel == 'approval_url') {
						console.log(link[i].href);
						break;
					}			
				}
				db.insertOrder(order_id, req.session.email, resp.id, resp.state, req.session.amount, req.session.desc, '2012', function(err, order) {
					if(err || !order) {			
						console.log(err);
						//TODO: Display error message to user
						res.render('order_detail', { message: [{desc: "Could not save order details", type: "error"}]});
					} else {
						res.redirect(link[i].href);
					}
				});
			}
		});
    
	}
};

exports.orderExecute = function(req, res) {
    res.locals.session = req.session;
    db.getOrder(req.query.order_id, function(err, order) {
        var PayerID = '{ "payer_id" : "'+ req.query.PayerID +'" }'
        paypal.payment.execute(order.payment_id, PayerID, http_default_opts, function(resp, err) {
            if (err) {
                console.log(err);
            } 
            if (resp) {
                console.log("execute Payment Response");
                db.updateOrder(req.query.order_id, resp.state, resp.create_time, function(err, updated) {
                    if(err) {			
	                    console.log(err);
	                    //TODO: Display error message to user
	                    res.render('order_detail', { message: [{desc: "Could not retrieve order information", type: "error"}]});
                    } else {	
                        console.log(updated);
                        db.getOrders(req.session.email, function(err, orderList) {
                            //console.log(orderList);
                            res.render('order_detail', {
                            title: 'Recent Order Details', 'ordrs' : orderList
                            });	
                        });
                    }
                });
            }
        });
    });  
 }; 
 