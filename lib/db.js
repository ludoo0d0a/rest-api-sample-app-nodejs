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
		createUser: function(emailId, password, savedCard) {
			db.collection(USERS_COLLECTION).find({email: emailId}, function(err, result){
				result.each(function(err, band) {
			        console.log(band);
			    });
			});
		},
		getUser: function() {
		},
		updateUser: function() {
		},
		insertOrder: function() {
		},
		updateOrder: function() {
		},
		getOrders: function() {
		}
	}
}