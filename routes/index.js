
var express = require('express');
var router = express.Router();
var User = require('../models/user');

// Get Homepage
router.get('/', ensureAuthenticated, function(req, res){
	 User.getUsers(function (err, users) {
			if (err) throw err;
			All_users = users;
	});
	res.render('index',{
    });
});

/*******************************************
 *  if user is signed in it can show chat page
 *  if not it redirects to home page
 *  *******************************************/
function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
        res.redirect('/users/home');
	}
}

module.exports = router;
