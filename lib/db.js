/* Copyright 2013 PayPal */
"use strict";

var mongo= require('mongoskin');

var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : '27017';

console.log("Connecting to " + host + ":" + port);

module.exports = function() {

	var USERS_COLLECTION = 'users';
	var ORDERS_COLLECTION = 'orders';	
	var db = mongo.db(host + ':' + port + '/paypal_pizza');
	
	function getConnection() {
	}
	
	return {
		createUser: function(emailId, password, cardId, callback) {
			console.log("searching for " +  emailId);
			db.collection(USERS_COLLECTION).count( {email : emailId}, function(err, count) {
				if(err) {
					console.log("error creating user:" + err);
					callback(new Error(err));
				} else if (count !== 0) {
					console.log( emailId + " already exists");
					callback(new Error(emailId + " already exists"));
				} else {			
					db.collection(USERS_COLLECTION).insert({email: emailId, password: password, card: cardId}, function(err, result) {					
					    if(err) {
					    	console.log("User insertion error: " + err);
					    	callback(new Error(err));
					    } else {
					    	callback(null, "User created");
					    }			   
					});
				}					
			});
		},
		authenticateUser: function(emailId, password, callback) {
			db.collection(USERS_COLLECTION).count( {email : emailId, password: password}, function(err, count) {
				if(err) {
					console.log("error authenticating user:" + err);
					callback(new Error(err));
				} else if (count === 0) {					
					callback(new Error("emailid/password did not match"));
				}
				callback(null);				
			});
		},
		getUser: function(emailId, callback) {
			db.collection(USERS_COLLECTION).findOne( {email : emailId}, function(err, user) {
				if(err) {
					console.log("error retrieving user:" + err);
					callback(new Error(err));
				} else {
					console.log(user);
					callback(null, user);
				}					
			});
		},
		updateUser: function() {
		},
		insertOrder: function(order_id, user_id, payment_id, state, amount, description, created_time) {
            db.collection(ORDERS_COLLECTION).insert({_id: order_id, user_id: user_id, payment_id: payment_id, state: state, amount: amount, description: description, created_time:created_time}, function(err, result) {					
			  if(err) {
			  	console.log("Order insertion error: " + err);
                    callback(new Error(err));
					} else {
					  	console.log("SUCCESS");
					}			   
                });			
		},
		updateOrder: function() {
		},
		getOrders: function() {
		}
	}
}