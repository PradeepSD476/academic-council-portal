import { signInWithPopup } from 'firebase/auth'
import React from 'react'
import { auth, provider } from './lib/firebass'

const handleLogin = async () => {
  const response = await signInWithPopup(auth, provider);
  console.log(response);
}
const App = () => {
  return (
    <div>
      <h1>Academic Council Portal</h1>
      <button onClick={handleLogin}>Login with Google</button>
    </div>
  )
}

export default App
