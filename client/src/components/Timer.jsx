import React, { useEffect, useImperativeHandle, forwardRef } from 'react'

const Timer = forwardRef(function Timer({ seconds, onTick, onEnd }, ref){
  useImperativeHandle(ref, ()=>({}))

  useEffect(()=>{
    const id = setInterval(()=>{
      onTick(s => { if (s<=1){ clearInterval(id); onEnd(); return 0 } return s-1 })
    },1000)
    return ()=>clearInterval(id)
  },[])

  const mm = String(Math.floor(seconds/60)).padStart(2,'0')
  const ss = String(seconds%60).padStart(2,'0')
  return <div className="px-3 py-1 bg-gray-100 rounded">{mm}:{ss}</div>
})

export default Timer
