import React, { useContext } from 'react'
import ChatComponent from './ChatComponent'
import Register from './Register'
import { UserContext } from './UserContext'

const Routes = () => {

  const {username,id} = useContext(UserContext)

  if(username){
    return <ChatComponent />
  }

  return (
    <Register/>
  )
}

export default Routes