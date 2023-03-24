const mongoose = require('mongoose')

const LoginUserSchema = new mongoose.Schema({
    username : {
        type : String,
        unique : true
    },

    password : String
},{timestamps:true})

export const LoginUserModel = mongoose.model('User',LoginUserSchema)