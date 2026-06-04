import React, { useEffect, useState } from 'react'

export default function AnimatedCounter({ value = 0, duration = 800 }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let start = null
    const from = 0
    const to = Number(value) || 0
    function step(timestamp) {
      if (!start) start = timestamp
      const progress = Math.min(1, (timestamp - start) / duration)
      const cur = Math.round(from + (to - from) * progress)
      setN(cur)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value, duration])
  return <span>{n}</span>
}
