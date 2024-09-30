"use client"
import { signOut } from "next-auth/react"

export function ButtonLogout(){
  return (
    <button className="block w-2/3 mt-4 mx-auto py-1 px-8 bg-red-400 text-white rounded-full" onClick={()=>signOut({ callbackUrl: '/' })}>
      Log Out
    </button>
  )
}