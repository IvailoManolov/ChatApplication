import React from 'react'

const Avatar = (props) => {

    const colors = ['bg-red-200','bg-green-200','bg-purple-200','bg-blue-200','bg-yellow-200']

    const userIdBase10 = parseInt(props.userId,16)

    const colorIndex = userIdBase10 % colors.length

    const color = colors[colorIndex]

  return (
    <div className={'w-8 h-8 rounded-full flex items-center ' + color}>
        <div className='text-center w-full opacity-70'>
            {props.username[0]}
        </div>
    </div>
  )
}

export default Avatar