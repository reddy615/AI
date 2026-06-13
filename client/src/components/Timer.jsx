import React, { useEffect, useImperativeHandle, useRef, forwardRef } from 'react'

const Timer = forwardRef(function Timer({ seconds, onTick, onEnd }, ref){
  useImperativeHandle(ref, ()=>({}), [])
  const onTickRef = useRef(onTick)
  const onEndRef = useRef(onEnd)

  useEffect(() => {
    onTickRef.current = onTick
  }, [onTick])

  useEffect(() => {
    onEndRef.current = onEnd
  }, [onEnd])

  useEffect(()=>{
    const id = setInterval(()=>{
      onTickRef.current(s => { if (s<=1){ clearInterval(id); onEndRef.current(); return 0 } return s-1 })
    },1000)
    return ()=>clearInterval(id)
  },[])

  const mm = String(Math.floor(seconds/60)).padStart(2,'0')
  const ss = String(seconds%60).padStart(2,'0')
  return <div className="px-3 py-1 bg-gray-100 rounded">{mm}:{ss}</div>
})

export default Timer
