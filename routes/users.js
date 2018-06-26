/**
 * Created by Simon on 6/10/2018.
 */

var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var io = require('socket.io').listen(4000).sockets;


var User = require('../models/user');
var Message = require('../models/message');
var userobject =null;
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


passport.serializeUser(function (user, done) {
    userobject = user;
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


var activeUsers = [];
//HANDLE USERS
function handleUsers(socket, activeUsers, allusers){
    var found = false;
    for (var i = activeUsers.length - 1; i >= 0; --i) {
        if (activeUsers[i].userName === userobject.username) {
            found = true;
        }
    }
    if(!found){
        console.log("poped in");
        activeUsers.push({connectionId: socket.id, userName: userobject.username});
        io.emit('userOnline', userobject.username);
        console.log('user online');
        console.log(activeUsers);
        console.log("END!");
    }
}

function handleClientDisconnections(socket, activeUsers, allUsers){
    console.log('user disconnected');
    for (var i = activeUsers.length - 1; i >= 0; --i) {
        if (activeUsers[i].userName == userobject.username) {
            activeUsers.splice(i,1);
            console.log("poped out");
        }
    }
    console.log(activeUsers);
    console.log("HERE");
    return activeUsers;
}

function hanglePrivateMessages(data, privateMessages) {
    let sender = data.sender;
    let receiver = data.receiver;
    let privateMsg = data.privateMessage;

    console.log(data);
    let receiverObject = activeUsers.find(o => o.userName === receiver);
    let senderObject = activeUsers.find(o => o.userName === sender);


    try {
        Message.getMsgs(receiverObject.userName, function (err, msgs) {
            io.to(receiverObject.connectionId).emit('broadcastPrivateMsgs', msgs);
        });
    }
    catch(err) {
        console.error(err);
        console.log(data +" in users.js:152");
    }


    // send messages to sender
    try {
        Message.getMsgs(senderObject.userName, function (err, msgs) {
            io.to(senderObject.connectionId).emit('broadcastPrivateMsgs', msgs);
        });
    }
    catch(err) {
            console.error(err);
            console.log(data +" in users.js:152");
        }



    //Insert message
    privateMessages.insert({sender: sender, receiver: receiver, text: privateMsg, date: Date()}, function () {
    });

}

// THIS GETS USERS ONLY FIRST TIME WHEN SIGN IN HAPPENS
function getPrivateMessages() {
    let individual = activeUsers.find(o => o.userName === userobject.username);
    Message.getMsgs(userobject.username, function (err, msgs) {
        //console.log(msgs);

        try {
            io.to(individual.connectionId).emit('broadcastPrivateMsgs', msgs);
        }
        catch(err) {
            console.error(err);
        }
    });
}

///////////
// Connect to Socket.io
io.on('connection', function(socket){

    //Update user list evey time new user signs in
    let users = db.collection('users');
    users.find().sort({_id:1}).toArray(function(err, res) {

        //  socket.emit('Allusers', activeUsers, res);
        io.emit('Allusers', activeUsers, res);
        console.log(activeUsers );
        console.log("END");
    });

    socket.on('disconnect', function () {
       activeUsers =  handleClientDisconnections(socket, activeUsers);
        users.find().sort({_id:1}).toArray(function(err, res) {

            //  socket.emit('Allusers', activeUsers, res);
            io.emit('Allusers', activeUsers, res);
            console.log(activeUsers);
            console.log("end1");
        });

    });

    // GET ACTIVE USERS AND SEND IT TO THE VIEW
    handleUsers(socket, activeUsers);


    let chatMessages = db.collection('chats');
    let PrivateMessages = db.collection('messages');


    // Create function to send status
    sendStatus = function(s){
        socket.emit('status', s);
    }

    chatMessages.find().limit(100).sort({date:1}).toArray(function(err, res){
        if(err){
            throw err;
        }

        // Emit the messages
        socket.emit('outputChatMessage', res);
    });

    //Handle private messages
    socket.on('sendPrivateMessage', function (data) {
        hanglePrivateMessages(data, PrivateMessages);
        //getPrivateMessages();
        sendStatus({
            message: 'Message sent',
            clear: true
        });
    });
    getPrivateMessages();




    // Handle sendMessage events
    socket.on('inputChatMessage', function(data){
        let name = data.name;
        let message = data.message;

        // Check for name and message
        if(name == '' || message == ''){
            // Send error status
            sendStatus('Please enter a name and message');
        } else {

            chatMessages.insert({name: name, message: message}, function(){
                io.emit('outputChatMessage', [data]);

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
        chatMessages.remove({}, function(){
            // Emit cleared
            socket.emit('cleared');
        });
    });
});



///

module.exports = router;
