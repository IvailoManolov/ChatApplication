import React, { useContext, useEffect, useRef, useState } from 'react'
import Avatar from './Avatar'
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

  const {username,id} = useContext(UserContext)

  useEffect(() => {
    connectToWs()
  },[])

  function connectToWs(){
    const ws = new WebSocket('ws://localhost:5000')
    setWs(ws)
    
    ws.addEventListener('message',handleMessage)
    ws.addEventListener('close', () => {
      setTimeout(() => {
        connectToWs()
      }, 1000)
    })
  }

  function showOnlinePeople(peopleArray){
    const people = {}

    peopleArray.forEach(({userId,username}) => {
      people[userId] = username
    })

    setOnlinePeople(people)
  }

  function selectContact(userId){
    setSelectedUserId(userId)
  }

  function handleMessage(e){
    const message = JSON.parse(e.data)

    if(message.online){
      showOnlinePeople(message.online)
    }
    else if(message.text){
      setMessages(prev => ([...prev,{...message}]))
    }
  }

  function sendMessage(e){
    e.preventDefault()

    ws.send(JSON.stringify({
      message : {
        recipient : selectedUserId,
        text : newMessage
      }
    }))

    setMessages(prev => ([...prev,{
      text : newMessage,
      sender : id,
      recipient : selectedUserId,
      _id : Date.now()
      }]))

    setNewMessage('')
  }

  useEffect(() => {
    const div = divUnderMessage.current
    if(div){
      console.log('scrolling')
      div.scrollIntoView({behavior : 'smooth', block:'end'})
    }

  },[messages])

  useEffect(() => {
    async function getMessages(){
      const messageData = await axios.get('/messages/' + selectedUserId)

      setMessages(messageData.data)
    }

    if(selectedUserId){
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

        <div className='bg-white w-1/3 '>
          <Logo/>
          {Object.keys(excludedMe).map(userId => (
            <Contact 
            userId = {userId} 
            username = {excludedMe[userId]}
            selectContact = {(x) => setSelectedUserId(x)}
            selected = {userId === selectedUserId}
            online = {true}
             />
          ))}

          {Object.keys(offlinePeople).map(userId => (
            <Contact 
            userId = {userId} 
            username = {offlinePeople[userId].username}
            selectContact = {(x) => setSelectedUserId(x)}
            selected = {userId === selectedUserId}
            online = {false}
             />
          ))}
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
                        <div className={"text-left inline-block p-2 my-2 rounded-md text-sm " +(message.sender === id ? 'bg-blue-500 text-white':'bg-white text-gray-500')}>
                          {message.text}
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

                <button type='submit' className='bg-blue-500 p-2 text-white rounded-sm'>
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