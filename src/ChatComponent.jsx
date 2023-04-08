import React, { useContext, useEffect, useRef, useState } from 'react'

import Logo from './Logo'
import {uniqBy} from 'lodash'
import { UserContext } from './UserContext'
import axios from 'axios'
import Contact from './Contact'

const ChatComponent = () => {

  const[ws,setWs] = useState(null)
  const[onlinePeople,setOnlinePeople] = useState({})
  const[offlinePeople,setOfflinePeople] = useState({})
  const[selectedUserId,setSelectedUserId] = useState(null)
  const[newMessage,setNewMessage] = useState('')
  const[messages,setMessages] = useState([])

  const divUnderMessage = useRef()

  const {username,id,setId,setUsername} = useContext(UserContext)

  useEffect(() => {
    if(ws){
      ws.close()
      setWs(null)
    }
    connectToWs()
  },[selectedUserId])

  function connectToWs(){
    console.log("Connecting to WS ");
    const ws = new WebSocket('ws://localhost:5000')
    setWs(ws)
    ws.addEventListener('message',handleMessage)
  }

  async function sendFile(ev){
    const reader = new FileReader()

    reader.readAsDataURL(ev.target.files[0])

    reader.onload = () => {
      sendMessage(null,{
        name : ev.target.files[0].name,
        data : reader.result
      })
    }
  }

  function showOnlinePeople(peopleArray){
    const people = {}

    peopleArray.forEach(({userId,username}) => {
      people[userId] = username
    })

    setOnlinePeople(people)
  }

  async function logout(){
    const response = await axios.post('/logout')
    setWs(null)
    setId(null)
    setUsername(null)
  }

  function handleMessage(e){
    const message = JSON.parse(e.data)

    if(message.online){
      showOnlinePeople(message.online)
    }
    else if(selectedUserId && (message.text || message.file)){
      if(message.sender === selectedUserId){
        
        // Let them know that message is received.
        ws.send(JSON.stringify({
          messageReceived : {
            read : true
          }
        }));
        
        setMessages(prev => ([...prev,{...message}]))
      }
    }
  }

  function formatAMPM(date){
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const strTime = `${hours}:${minutes}:${date.getSeconds()} ${ampm}`;
    return strTime;
  }

  function sendMessage(e,file = null){

    const date = new Date()

    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}, ${formatAMPM(date)}`;

    if(e) e.preventDefault()

    //Send the message among the file and initial flag read to false.
    console.log("Sending message to " + selectedUserId)
    ws.send(JSON.stringify({
      message : {
        recipient : selectedUserId,
        text : newMessage,
        file,
        read : false
      }
    }));
    
      if(file){
        axios.get('/messages/' + selectedUserId).then(res => {
          let currentResponse = res

          if(!currentResponse.data.date){
            currentResponse.data.forEach(message => {
              let tempDate = new Date(message.createdAt)
              const formattedDate = `${tempDate.getMonth() + 1}/${tempDate.getDate()}/${tempDate.getFullYear()}, ${formatAMPM(tempDate)}`;
              message.date = formattedDate
            })
          }

          setMessages(currentResponse.data)
        })

      }
      else{
        setMessages(prev => ([...prev,{
          text : newMessage,
          sender : id,
          recipient : selectedUserId,
          _id : Date.now(),
          date : formattedDate
          }]))    
      }

    setNewMessage('')
  }

  useEffect(() => {
    const div = divUnderMessage.current
    if(div){
      div.scrollIntoView({behavior : 'smooth', block:'end'})
    }

  },[messages])

  useEffect(() => {
    async function getMessages(){

      const messageData = await axios.get('/messages/' + selectedUserId)

      //Change date to be right format
      messageData.data.forEach(message => {
        let tempDate = new Date(message.createdAt)
        const formattedDate = `${tempDate.getMonth() + 1}/${tempDate.getDate()}/${tempDate.getFullYear()}, ${formatAMPM(tempDate)}`;
        message.date = formattedDate
      })


      //Change flags of the messages to indicate they are read.


      //Let the recipient know that the messages are viewed.


      //Set the messages so they will be visible.
      setMessages(messageData.data)
    }

    if(selectedUserId){
      
      console.log("Seleted User ID = " + selectedUserId)
      getMessages()
    }
  },[selectedUserId])

  useEffect(() => {
    axios.get('/people').then(res => {
      const offlinePeopleArray = 
      res.data
      .filter(p => p._id !== id)
      .filter(p => !Object.keys(onlinePeople).includes(p._id))

      const offlinePeople = {}

      offlinePeopleArray.forEach(p => {
        offlinePeople[p._id] = p
      })
      setOfflinePeople(offlinePeople)
    })
  },[onlinePeople])

  const excludedMe = {...onlinePeople}

  delete excludedMe[id]

  let messageWithoutDupe = uniqBy(messages,'_id')

  return (
    <div className='flex h-screen'>

        <div className='bg-white w-1/3 flex flex-col'>
          <div className='flex-grow'>
          <Logo/>
          
          {Object.keys(excludedMe).map(userId => (
            <div>
              <Contact 
              userId = {userId} 
              username = {excludedMe[userId]}
              onClick={() => {setSelectedUserId(userId)}}
              selected = {userId === selectedUserId}
              online = {true}
              />
             </div>
          ))}

          {Object.keys(offlinePeople).map(userId => (
            <div>
              <Contact 
              userId = {userId} 
              username = {offlinePeople[userId].username}
              onClick={() => {setSelectedUserId(userId)}}
              selected = {userId === selectedUserId}
              online = {false}
             />
            </div>
            
          ))}

          </div>
          <div className='p-5 text-center '>
            <button className='text-sm bg-blue-100 py-1 px-2 border rounded-sm text-gray-500'
            onClick={() => logout()}
            >
              Logout
            </button>
          </div>
        </div>

        <div className = 'flex flex-col bg-blue-50 w-2/3 p-2'>

            <div className='flex-grow'>
              {!selectedUserId && (
                <div className='flex h-full items-center justify-center'>
                  <div className='text-gray-400'>
                   &larr; Select a conversation!
                  </div>
                </div>
              )}

              {selectedUserId && (
                  <div className="relative h-full">
                  <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                    {messageWithoutDupe.map(message => (
                      <div key={message._id} className={(message.sender === id ? 'text-right': 'text-left')}>
                        <div className={"text-left inline-block p-2 my-2 rounded-md text-sm " + (message.sender === id ? 'bg-green-500 text-white':'bg-white text-gray-500')}>
                          <div className='flex flex-col'>
                            {message.text}
                            {message.file && (
                            <div className='flex items-center gap-2'>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                              </svg>
                                <a target='_blank' className='items-center underline' href ={axios.defaults.baseURL + '/uploads/' + message.file}>
                                  {message.file}
                                </a>
                            </div>
                          )}
                            <div className='flex -bottom-1 p-2 my-0.5 right-1 h-4 w-15 text-xs text-gray-300 '>
                                {message.date}
                                <div className={message.read ? 'text-blue-600' : ''}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 35" stroke-width="1.2" stroke="currentColor" class="w-5 h-5">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                                </div>
                            </div>
                          </div>
                          
                        </div>
                      </div>
                    ))}
                    <div ref={divUnderMessage}></div>
                  </div>
                </div>
              )}
            </div>
            {selectedUserId && (
              <form className="flex gap-2 mx-2" onSubmit={sendMessage}>
              <input type="text"
              value = {newMessage}
              onChange = {ev => setNewMessage(ev.target.value)}
               placeholder='Type your message here'
                className='bg-white flex-grow border rounded-sm p-2' />

                <label type='button' className='bg-gray-300 p-2 text-gray-600 cursor-pointer rounded-sm border border-blue-200'>
                  <input type='file' className='hidden' onChange={sendFile}/>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                </label>

                <button className='bg-blue-500 p-2 text-white rounded-sm'>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>

          </form>
            )}
            
        </div>
    </div>
  )
}

export default ChatComponent