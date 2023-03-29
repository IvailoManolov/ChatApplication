import React, { useContext, useEffect, useState } from 'react'
import Avatar from './Avatar'
import Logo from './Logo'
import {uniqBy} from 'lodash'
import { UserContext } from './UserContext'

const ChatComponent = () => {

  const[ws,setWs] = useState(null)
  const[onlinePeople,setOnlinePeople] = useState({})
  const[selectedUserId,setSelectedUserId] = useState(null)
  const[newMessage,setNewMessage] = useState('')
  const[messages,setMessages] = useState([])

  const {username,id} = useContext(UserContext)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000')
    setWs(ws)
    ws.addEventListener('message',handleMessage)
  },[])

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
      console.log(message)
      showOnlinePeople(message.online)
    }
    else if(message.text){
      console.log({message})
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
      recipient : selectedUserId
      }]))
    setNewMessage('')
  }

  const excludedMe = {...onlinePeople}

  delete excludedMe[id]

  let messageWithoutDupe = uniqBy(messages,'id')

  return (
    <div className='flex h-screen'>

        <div className='bg-white w-1/3'>
          <Logo/>
          {Object.keys(excludedMe).map(userId => (
            <div key = {userId} 
            onClick={() => selectContact(userId)} 
            className={'border-b border-gray-100 flex items-center gap-3 cursor-pointer ' + (userId === selectedUserId ? 'bg-purple-50' : '')}
            >

              {userId === selectedUserId && (
                <div className='w-1 bg-blue-500 h-12 rounded-r-md'>
                  
                </div>
              )}

              <div className='flex gap-2 py-2 pl-4 items-center'>
              <Avatar username={onlinePeople[userId]} userId={userId}/>

                <span className='text-gray-600'>
                  {onlinePeople[userId]}
                </span>
              </div>
             

            </div>
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
                <div>
                  {messageWithoutDupe.map(message => (
                    <div>
                      {message.text}
                    </div>
                  ))}
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