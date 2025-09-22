import { SignUp } from '@clerk/clerk-react'
import React from 'react'

export default function Signup() {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-200 bg-[url('../../image.png')]">
    <SignUp/>
    </div>
  )
}
