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
module.exports.find = function() {
}
