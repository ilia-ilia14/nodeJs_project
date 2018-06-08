
var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var io = require('socket.io').listen(4000).sockets;


var User = require('../models/user');
var Message = require('../models/message');
// Register
router.get('/register',  function(req, res){
	res.render('register');
});

// login
router.get('/login',  function(req, res){
	res.render('login');
});



// Register User
router.post('/register', function (req, res) {
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	// Validation
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if (errors) {
		res.render('register', {
			errors: errors
		});
	}else {
					var newUser = new User({
						name: name,
						email: email,
						username: username,
						password: password
					});
					User.createUser(newUser, function (err, user) {
						if (err) throw err;
						console.log(user);
					});

         	req.flash('success_msg', 'Registration successful, please log in');
					res.redirect('/users/login');
				}
});

passport.use(new LocalStrategy(
    function (username, password, done) {
        User.getUserByUsername(username, function (err, user) {
            if (err) throw err;
            if (!user) {
                return done(null, false, { message: 'Unknown User' });
            }

            User.comparePassword(password, user.password, function (err, isMatch) {
                if (err) throw err;
                if (isMatch) {

                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Invalid password' });
                }
            });
        });
    }));

var userobject;
passport.serializeUser(function (user, done) {
		this.userobject = user;
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.getUserById(id, function (err, user) {
        done(err, user);
    });
});

router.post('/login',
    passport.authenticate('local', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true }),
    function (req, res) {
        res.redirect('/');
    });

router.get('/logout', function(req, res){
	req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
});

var connectCounter = null;
var activeUsers = {connectionId:"", userName: "", id: "" };

///////////
// Connect to Socket.io
io.on('connection', function(socket){
	console.log("A Client connected1 " + socket.id + " " + userobject.name);

	socket.on('disconnect', function () {
        console.log('user disconnected');
    });

        let chat = db.collection('chats');
        let messages = db.collection('messages');

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // Get chats from mongo collection
    // messages.find().limit(100).sort({_id:1}).toArray(function(err, res){
    //     if(err){
    //         throw err;
    //     }
    //
    //     // Emit the messages
    //     socket.emit('output', res);
    // });
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            // Check for name and message
            if(name == '' || message == ''){
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Insert message
                messages.insert({sender: name, receiver: 'receiver', text: message, date: Date()});
                chat.insert({name: name, message: message}, function(){
                    io.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });


				//GET ACTIVE USERS AND EMIT TO THE index.handler
    });



///

module.exports = router;
