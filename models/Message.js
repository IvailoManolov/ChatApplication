const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({

    sender : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'LoginUser'
    },

    recipient : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'LoginUser'
    },

    text : String,

    file : String,

    read : Boolean

},{timestamps : true})


module.exports = mongoose.model("Message",MessageSchema)