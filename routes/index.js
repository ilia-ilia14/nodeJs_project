
var express = require('express');
var router = express.Router();
var User = require('../models/user');

var All_users = null;
// Get Homepage
router.get('/', ensureAuthenticated, function(req, res){
	 User.getUsers(function (err, users) {
			if (err) throw err;
			//console.log(users);
			All_users = users;
	});
	res.render('index',{
        All_users
    });
		//console.log(All_users);
});

var savedUsers = null;

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//give error message
		req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}

module.exports = router;
