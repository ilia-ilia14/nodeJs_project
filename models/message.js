/**
 * Created by Simon on 6/5/2018.
 */
var mongoose = require('mongoose');

// Messages Schema
var MessageSchema = mongoose.Schema({
    sender: {
        type: String
    },
    receiver: {
        type: String
    },
    text: {
        type: String,
        index:true
    },
    date: {
       type: Date,
        default: Date.now
    }
});
var Message = module.exports = mongoose.model('Message', MessageSchema);

module.exports.insert = function(newMessage, callback){
    newMessage.insert(callback);
}
module.exports.findMsgsReceived = function(receiver, callback){
    var query = {receiver: receiver};
    Message.find(query, callback);
}
module.exports.findMsgsSent = function(sender, callback){
    var query = {sender: sender};
    Message.find(query, callback);
}
module.exports.getMsgs = function(userName, callback){
    var query = {$or: [{sender: userName}, {receiver: userName}]}
    Message.find(query, callback).limit(110).sort({date:1});
}