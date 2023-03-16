const express = require('express')
const mongoose = require('mongoose')
const User = require('./models/LoginUser')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const application = express()


mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log("Successfully connected to the DB.")
})

application.get('/test',(req,res) => {
    res.json("test ok")
})

application.post('/register',async(req,res) => {
    const{username,password} = req.body

    const createdUser = await User.create({
        username,
        password
    })

    jwt.sign({userId : createdUser._id},process.env.JWT_SECRET, (err,token) => {
        if(err)
        {
            throw err
        }

        res.cookie('token',token).status(201).json('ok')
    })
})

application.listen(5000,() => {
    console.log("Listening to port 5000 ")
})