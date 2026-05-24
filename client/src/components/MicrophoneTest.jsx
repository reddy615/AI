import React, {useEffect, useState, useRef} from 'react'

export default function MicrophoneTest() {
  const [devices, setDevices] = useState([])
  const [selected, setSelected] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const audioRef = useRef(null)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        const list = await navigator.mediaDevices.enumerateDevices()
        const inputs = list.filter(d => d.kind === 'audioinput')
        setDevices(inputs)
        if (inputs[0]) setSelected(inputs[0].deviceId)
      } catch (err) {
        setError(err.message || String(err))
      }
    }
    load()
  }, [])

  async function testMic() {
    setError(null)
    setStatus('requesting')
    try {
      const constraints = selected ? { audio: { deviceId: { exact: selected } } } : { audio: true }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      const chunks = []
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' })
        const url = URL.createObjectURL(blob)
        if (audioRef.current) audioRef.current.src = url
        // cleanup
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null
        setStatus('idle')
      }
      recorder.start()
      setStatus('recording')
      // record 3 seconds
      await new Promise(r => setTimeout(r, 3000))
      recorder.stop()
      setStatus('processing')
    } catch (err) {
      setError(err.name ? `${err.name}: ${err.message}` : String(err))
      setStatus('error')
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
      <div className="font-semibold text-slate-900">Microphone Test</div>
      <div className="mt-2">
        <label className="block text-xs text-slate-600">Select input</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="mt-1 w-full rounded-md border px-2 py-1 text-sm">
          {devices.length === 0 && <option value="">(no inputs found)</option>}
          {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>)}
        </select>
      </div>

      <div className="mt-3 flex gap-2">
        <button onClick={testMic} className="rounded-xl bg-indigo-600 px-3 py-2 text-white">Test Microphone</button>
        <div className="text-sm text-slate-600">Status: <span className="font-medium text-slate-900">{status}</span></div>
      </div>

      {error && <div className="mt-2 text-xs text-rose-600">Error: {error}</div>}

      <audio ref={audioRef} controls className="mt-3 w-full" />
      <div className="mt-2 text-xs text-slate-500">If the browser shows a permission prompt, allow microphone access. If denied, open browser site settings or OS privacy settings.</div>
    </div>
  )
}
