import React from 'react'
import Avatar from './Avatar'

const Contact = (props) => {
  return (
    <div key = {props.userId} 
            onClick={() => props.selectContact(props.userId)} 
            className={'border-b border-gray-100 flex items-center gap-3 cursor-pointer ' + (props.selected ? 'bg-purple-50' : '')}
            >

              {props.selected && (
                <div className='w-1 bg-blue-500 h-12 rounded-r-md'>
                  
                </div>
              )}

              <div className='flex gap-2 py-2 pl-4 items-center'>
              <Avatar online = {props.online} username={props.username} userId={props.userId}/>

                <span className='text-gray-600'>
                  {props.username}
                </span>
              </div>
             

            </div>
  )
}

export default Contact