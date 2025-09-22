import { SignIn } from '@clerk/clerk-react'
import React from 'react'

const Login = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-200 bg-[url('../../image.png')]">
    <SignIn/>
    </div>
  )
}

export default Login