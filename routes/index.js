
var express = require('express');
var router = express.Router();
var User = require('../models/user');

// Get Homepage
router.get('/', ensureAuthenticated, function(req, res){
	res.render('index');
});

let savedUsers = null;

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){

		//GET USERS TO DYSPLAY FOR THE CONVERSATION SELECT
		if(!savedUsers) {
		User.getUsers(function (err, users) {
				if (err) throw err;
				console.log(users);
				savedUsers = users
		});
	}
		return next();
	} else {
		//give error message
		req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}

module.exports = router;
