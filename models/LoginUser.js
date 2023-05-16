const mongoose = require('mongoose')

const LoginUserSchema = new mongoose.Schema({
    username : {
        type : String,
        unique : true
    },

    password : String
},{timestamps:true})

module.exports = mongoose.model("LoginUser",LoginUserSchema)