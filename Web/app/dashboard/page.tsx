import {currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const user = await currentUser()
  
  const role = user?.publicMetadata['role'] as string

  if (role === 'admin') {
    redirect('/administration')
  } else if (role === 'student') {
    redirect('/student') 
  } else if (role === 'faculty') {
    redirect('/faculty')
  }

  return null;
}
