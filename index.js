const express = require('express')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const LoginUsers = require('./models/LoginUser')
const Message = require('./models/Message')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const bcrypt = require('bcrypt')
const webSocket = require('ws')
const fs = require('fs')


require('dotenv').config()

const bcryptSalt = bcrypt.genSaltSync(10)

const application = express()
application.use(cookieParser())
application.use(express.json())
application.use('/uploads',express.static(__dirname + '//uploads'))
application.use(cors({
    credentials : true,
    origin : process.env.CLIENT_URL
}))

mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log('\x1b[42m%s\x1b[0m',"[SUCCESS] connected to the DB.")
})

application.get('/test',(req,res) => {
    res.json("test ok")
})

application.post('/register',async(req,res) => {
    const{password,username} = req.body

    try{
    const hashedPass = bcrypt.hashSync(password,bcryptSalt)
    const createdUser = await LoginUsers.create({
        username : username,
        password : hashedPass
    })

    console.log('\x1b[42m%s\x1b[0m',"[SUCCESS]Created the user")
    jwt.sign({userId : createdUser._id,username},process.env.JWT_SECRET,{} ,(err,token) => {
        if(err)
        {
            throw err
        }

        res.cookie('token',token,{sameSite:'none',secure : true}).status(201).json({
            id : createdUser._id
        })
    })
    }
    catch(err)
    {
        console.log('\x1b[41m%s\x1b[0m',"[FAILED]Creating the user")
        console.log(err)
        res.status(500).json('error')
    }
})

application.get('/profile',(req,res) => {
    const token = req.cookies?.token

    if(token) {

    jwt.verify(token,process.env.JWT_SECRET,{},(err,data) => {
        if(err)
        {
            console.log("Problem with JWT from cookie")
            throw err
        }

        console.log("User verified with token")

        res.json(data)
    })  
    }

    console.log("No token found")
    res.status(422).json("No token")
})

application.post('/login',async(req,res) => {
    const{username,password} = req.body

    console.log(req.body)

    const foundUser = await LoginUsers.findOne({username})

    if(foundUser)
    {
        const pass = bcrypt.compareSync(password,foundUser.password)

        console.log('\x1b[42m%s\x1b[0m',"[SUCCESS]Found user")

        if(pass){
            jwt.sign({userId : foundUser._id,username},process.env.JWT_SECRET,{},(err,token) => {
                res.cookie('token',token,{sameSite:'none',secure:true}).json({
                    id:foundUser._id
                })
            })
        }
    }
})

application.get('/messages/:userId',async(req,res) => {
    const {userId} = req.params

    const userData = await getUserDataFromRequest(req)
    
    const messages = await Message.find({
        sender : {$in:[userId,userData.userId]},
        recipient : {$in:[userId,userData.userId]}
    }).sort({createdAt : 1})

    console.log(messages)
    res.json(messages)
})

application.get('/people',async(req,res) => {
    const allUsers = await LoginUsers.find({},{'_id':1,username:1})

    if(allUsers){
        res.json(allUsers)
    }
})

application.post('/messages/read/:userId',async(req,res) => {
    const {userId} = req.params
    try{
        console.log("Flagging messages from user : " + userId + "read")

        const result = await Message.updateMany(
        {sender : userId} , {$set : {read:true}})

        res.json(result)

    }catch(err){
        console.log(err)
    }
})

application.post('/logout',async(req,res) => {
    res.cookie('token','',{sameSite:'none',secure:true}).json('ok')
})

 const server = application.listen(5000,() => {
    console.log('\x1b[42m%s\x1b[0m',"[SUCCESS]Opening port 5000 ")
})

async function getUserDataFromRequest(req){
    return new Promise((resolve,reject) => {
        
    const token = req.cookies?.token

        if(token){
            jwt.verify(token,process.env.JWT_SECRET,{},(err,data) =>{
                if(err) throw err;
                resolve(data)
            })
        }
        else{
            reject('no token')
        }
    })
}

const webSocketServer = new webSocket.WebSocketServer({server})
webSocketServer.on('connection',(connection,reqInfo) => {

    function notifyAboutOnlinePeople(){
        [...webSocketServer.clients].forEach(client => {
            client.send(JSON.stringify({
                online : [...webSocketServer.clients].map(connectedClient => ({userId : connectedClient.userId,username : connectedClient.userName }))
            }))
        })
    }

    connection.isAlive = true

    connection.timer = setInterval(() => {
        connection.ping()

        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false
            clearInterval(connection.timer)
            connection.terminate()
            notifyAboutOnlinePeople()
        },2000)

    },5000)

    connection.on('pong', () => {
        clearTimeout(connection.deathTimer)
    })
    
    // Reading username and id from the cookie from current connection.
    console.log('\x1b[42m%s\x1b[0m',"[SUCCESS]Connected user to web socket")
    const extractedCookie = reqInfo.headers.cookie

    if(extractedCookie){

       tokenCookieString = extractedCookie.split(';').find(str => str.startsWith('token='))
       
       if(tokenCookieString){

        const token = tokenCookieString.split('=')[1]

        if(token){

            console.log('\x1b[42m%s\x1b[0m',"[SUCCESS]Extracted token from cookies on the client")

            jwt.verify(token,process.env.JWT_SECRET,{},(err,userData) => {
                if(err){
                    console.log('\x1b[41m%s\x1b[0m',"[FAILED]Verification of JWT")
                }
                console.log('\x1b[42m%s\x1b[0m',"[SUCCESS]Verification of JWT")

                const{username,userId} = userData
                connection.userId = userId
                connection.userName = username
            })

        }
       }
    }

    // Notifying everyone about online  users.
    notifyAboutOnlinePeople()

    connection.on('message',async (message) => {

        messageData = JSON.parse(message.toString())
        
        console.log('\x1b[42m%s\x1b[0m',"[SUCCESS]Message received")
        console.log(messageData)
        
        const{recipient,text,file,read} = messageData.message

        if(recipient && messageData.message.messageRead){

            console.log('\x1b[42m%s\x1b[0m',"[SUCCESS]Sending message read signal");

            // Message was read so send notification
            [...webSocketServer.clients]
            .filter(client => client.userId === recipient)
            .forEach(client => client.send(JSON.stringify(
                {
                 messageRead : true
                 })));

            return;
        }

        let fileName = null

        if(file){
            const parts = file.name.split('.')
            const fileExtension = parts[parts.length - 1]

            fileName = Date.now() + '.' + fileExtension

            const bufferData = Buffer.from(file.data.split(',')[1],'base64')

            fs.writeFile(__dirname + '//uploads' + '//' + fileName,bufferData, () => {
                console.log('\x1b[42m%s\x1b[0m',"[SUCCESS]File uploaded")
            })
        }

        else if(recipient && (text || file)){ 

            const messageDocument = await Message.create({
                sender : connection.userId,
                recipient,
                text,
                file : file ? fileName : null,
                read : read
            });

            const date = await messageDocument.createdAt.toLocaleString('en-US', { timeZone: 'Europe/Moscow' });
            console.log('DATE : ' + date);
            [...webSocketServer.clients]
            .filter(client => client.userId === recipient)
            .forEach(client => client.send(JSON.stringify(
                {text,
                 sender : connection.userId,
                 recipient,
                 file : file ? fileName : null,
                 date: date,
                 read : read,
                 _id : messageDocument._id})))

            console.log('\x1b[42m%s\x1b[0m',"[SUCCESS]Message passed to recipient")
           
        }
        else{
            console.log('\x1b[41m%s\x1b[0m',"[FAILED]Message passed to recipient")
        }
    })
})

