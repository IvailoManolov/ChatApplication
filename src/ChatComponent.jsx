import React, { useEffect, useState } from 'react'
import Avatar from './Avatar'

const ChatComponent = () => {

  const[ws,setWs] = useState(null)
  const[onlinePeople,setOnlinePeople] = useState({})

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

  function handleMessage(e){
    const message = JSON.parse(e.data)

    if(message.online){
      showOnlinePeople(message.online)
    }
  }

  return (
    <div className='flex h-screen'>

        <div className='bg-white w-1/3 pl-4 pt-4'>
          <div className='text-blue-800 font-bold flex gap-3 mb-4'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>

            MernChat
          </div>
          {Object.keys(onlinePeople).map(userId => (
            <div className='border-b border-gray-100 py-2 flex items-center gap-3 cursor-pointer'>
              <Avatar username={onlinePeople[userId]} userId={userId}/>
              <span className='text-gray-600'>
                {onlinePeople[userId]}
              </span>
            </div>
          ))}
        </div>

        <div className = 'flex flex-col bg-blue-50 w-2/3 p-2'>

            <div className='flex-grow'>messages</div>

            <div className="flex gap-2 mx-2">
                <input type="text"
                 placeholder='Type your message here'
                  className='bg-white flex-grow border rounded-sm p-2' />

                  <button className='bg-blue-500 p-2 text-white rounded-sm'>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>

            </div>
        </div>
    </div>
  )
}

export default ChatComponent