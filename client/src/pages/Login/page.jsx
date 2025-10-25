import React from 'react'
import { useContext } from 'react'
import AuthContext from '../../context/auth/authContext'

function Login() {
  const authContext = useContext(AuthContext);
  return (
    <div className='mt-10'>
      <h1>Academic Council Portal</h1>
      <button onClick={authContext.login}>Login</button>
      <button onClick={authContext.logout}>Logout</button>
    </div>
  )
}

export default Login
