import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HealthScribe() {
  const navigate = useNavigate()

  // Format seconds into MM:SS
  const formatTime = (secs) => {
    if (isNaN(secs) || secs === undefined || secs === null) return '00:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  
  // Service configuration and status
  const [config, setConfig] = useState({ live_transcription_enabled: false, mode: 'mock/demo' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Active viewing state
  const [activeRightTab, setActiveRightTab] = useState('notes') // 'notes' | 'summary' | 'keypoints'
  const [skipSmallTalk, setSkipSmallTalk] = useState(false)
  const [activeCitations, setActiveCitations] = useState([])
  const [selectedNoteItem, setSelectedNoteItem] = useState(null)
  
  // Audio state
  const [recording, setRecording] = useState(false)
  const [recordTime, setRecordTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMockAudio, setIsMockAudio] = useState(false)
  
  // Transcription results (structured JSON schema)
  const [results, setResults] = useState(null)
  const [processingStep, setProcessingStep] = useState('')
  
  // References
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const fileInputRef = useRef(null)
  const transcriptionContainerRef = useRef(null)
  const audioRef = useRef(null)
  
  // Simulated playback timer for mock sandbox cases
  const mockPlaybackIntervalRef = useRef(null)
  const lastActiveTurnId = useRef(null)

  // Fetch config on mount
  useEffect(() => {
    fetch('http://localhost:8002/api/healthscribe/config')
      .then(res => res.json())
      .then(setConfig)
      .catch(() => {
        console.warn('Could not fetch healthscribe config, using defaults.')
      })
  }, [])

  // Timer for microphone recording
  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => {
        setRecordTime(t => t + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
      setRecordTime(0)
    }
    return () => clearInterval(timerRef.current)
  }, [recording])

  // Helper: parse "MM:SS" into total seconds
  const parseTimeToSeconds = (timeStr) => {
    if (!timeStr) return 0
    const parts = timeStr.split(':')
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
    }
    return 0
  }

  // --- SAFE NORMALIZERS FOR GEMINI API SCHEMAS ---

  // Safely parse transcription into objects
  const getNormalizedTurns = () => {
    if (!results) return []
    
    // Fallback if transcription is a raw string
    if (typeof results.transcription === 'string') {
      const lines = results.transcription.split('\n').filter(Boolean)
      return lines.map((line, idx) => {
        // Look for timestamp like [00:15] Speaker: Text
        const match = line.match(/^\[(\d{2}:\d{2})\]\s*([^:]+):\s*(.*)$/)
        if (match) {
          return {
            id: `t${idx + 1}`,
            time: match[1],
            speaker: match[2],
            text: match[3]
          }
        }
        
        // Look for Speaker: Text without timestamp
        const matchNoTime = line.match(/^([^:]+):\s*(.*)$/)
        if (matchNoTime) {
          return {
            id: `t${idx + 1}`,
            time: '00:00',
            speaker: matchNoTime[1],
            text: matchNoTime[2]
          }
        }

        return {
          id: `t${idx + 1}`,
          time: '00:00',
          speaker: 'Encounter',
          text: line
        }
      })
    }
    
    if (Array.isArray(results.transcription)) {
      return results.transcription.map((turn, idx) => ({
        id: turn.id || `t${idx + 1}`,
        speaker: turn.speaker || 'Unknown',
        time: turn.time || '00:00',
        text: turn.text || ''
      }))
    }

    return []
  }

  const normalizedTurns = getNormalizedTurns()

  // Filter transcription turns based on "Skip small talk" toggle
  const getFilteredTurns = () => {
    if (!skipSmallTalk) return normalizedTurns
    
    const citedTurnIds = new Set()
    
    // Collate citations
    if (Array.isArray(results.notes_sections)) {
      results.notes_sections.forEach(sec => {
        sec.items?.forEach(item => item.citations?.forEach(id => citedTurnIds.add(id)))
      })
    }
    if (Array.isArray(results.summary)) {
      results.summary.forEach(item => item.citations?.forEach(id => citedTurnIds.add(id)))
    }
    if (Array.isArray(results.objectives)) {
      results.objectives.forEach(item => item.citations?.forEach(id => citedTurnIds.add(id)))
    }
    if (Array.isArray(results.key_points)) {
      results.key_points.forEach(item => item.citations?.forEach(id => citedTurnIds.add(id)))
    }
    
    return normalizedTurns.filter(turn => citedTurnIds.has(turn.id))
  }

  const filteredTurns = getFilteredTurns()

  // Effect to synchronize audio timeline with active transcription and notes highlighting
  useEffect(() => {
    if (normalizedTurns.length === 0) return

    let activeTurn = null
    let maxTime = -1

    normalizedTurns.forEach(turn => {
      const turnSec = parseTimeToSeconds(turn.time)
      if (turnSec <= currentTime && turnSec > maxTime) {
        maxTime = turnSec
        activeTurn = turn
      }
    })

    if (activeTurn && activeTurn.id !== lastActiveTurnId.current) {
      lastActiveTurnId.current = activeTurn.id
      setActiveCitations([activeTurn.id])
      
      const element = document.getElementById(`turn-${activeTurn.id}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }

      let highlightedSomething = false
      
      if (activeRightTab === 'notes' && Array.isArray(results.notes_sections)) {
        for (let s = 0; s < results.notes_sections.length; s++) {
          const sec = results.notes_sections[s]
          if (!Array.isArray(sec.items)) continue
          const foundIndex = sec.items.findIndex(item => item.citations?.includes(activeTurn.id))
          if (foundIndex !== -1) {
            setSelectedNoteItem(`${s}-${foundIndex}`)
            highlightedSomething = true
            const noteEl = document.getElementById(`note-${s}-${foundIndex}`)
            if (noteEl) {
              noteEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }
            break
          }
        }
      } else if (activeRightTab === 'summary' && Array.isArray(results.summary)) {
        const foundIndex = results.summary.findIndex(item => item.citations?.includes(activeTurn.id))
        if (foundIndex !== -1) {
          setSelectedNoteItem(`sum-${foundIndex}`)
          highlightedSomething = true
        }
      } else if (activeRightTab === 'keypoints') {
        const objIndex = Array.isArray(results.objectives) ? results.objectives.findIndex(item => item.citations?.includes(activeTurn.id)) : -1
        if (objIndex !== -1) {
          setSelectedNoteItem(`obj-${objIndex}`)
          highlightedSomething = true
        } else {
          const kpIndex = Array.isArray(results.key_points) ? results.key_points.findIndex(item => item.citations?.includes(activeTurn.id)) : -1
          if (kpIndex !== -1) {
            setSelectedNoteItem(`kp-${kpIndex}`)
            highlightedSomething = true
          }
        }
      }

      if (!highlightedSomething) {
        setSelectedNoteItem(null)
      }
    }
  }, [currentTime, results, activeRightTab, normalizedTurns])

  // Mock Audio Playback Simulation
  useEffect(() => {
    if (isPlaying && isMockAudio) {
      mockPlaybackIntervalRef.current = setInterval(() => {
        setCurrentTime(t => {
          if (t >= duration) {
            setIsPlaying(false)
            return duration
          }
          return t + 0.5
        })
      }, 500)
    } else {
      clearInterval(mockPlaybackIntervalRef.current)
    }

    return () => clearInterval(mockPlaybackIntervalRef.current)
  }, [isPlaying, isMockAudio, duration])

  // HTML5 Audio Event Handlers
  const handleAudioTimeUpdate = () => {
    if (audioRef.current && !isMockAudio) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current && !isMockAudio) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
    setCurrentTime(duration)
  }

  // Play/Pause Action
  const togglePlay = () => {
    if (isMockAudio) {
      if (currentTime >= duration) {
        setCurrentTime(0)
      }
      setIsPlaying(!isPlaying)
    } else if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e))
        setIsPlaying(true)
      }
    }
  }

  // Seek / Timeline Scrubbing
  const handleTimelineClick = (e) => {
    if (duration === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const width = rect.width
    const clickPercentage = clickX / width
    const seekTime = Math.min(duration, Math.max(0, clickPercentage * duration))
    
    setCurrentTime(seekTime)
    
    if (!isMockAudio && audioRef.current) {
      audioRef.current.currentTime = seekTime
    }
  }

  // User manual clicks on dialogue turn (seek audio to that segment)
  const handleTurnClick = (turn) => {
    const seekTime = parseTimeToSeconds(turn.time)
    setCurrentTime(seekTime)
    if (!isMockAudio && audioRef.current) {
      audioRef.current.currentTime = seekTime
    }
    setActiveCitations([turn.id])
  }

  // User clicks on right panel notes point (seek audio and highlight turn)
  const handleNoteItemClick = (item, index) => {
    setSelectedNoteItem(index)
    if (item.citations && item.citations.length > 0) {
      setActiveCitations(item.citations)
      
      const firstTurnId = item.citations[0]
      const turnObj = normalizedTurns.find(t => t.id === firstTurnId)
      if (turnObj) {
        const seekTime = parseTimeToSeconds(turnObj.time)
        setCurrentTime(seekTime)
        if (!isMockAudio && audioRef.current) {
          audioRef.current.currentTime = seekTime
        }
      }
    } else {
      setActiveCitations([])
    }
  }

  // Microphone recording completions
  const startRecording = async () => {
    setError(null)
    setAudioUrl(null)
    setAudioBlob(null)
    setSelectedFile(null)
    setResults(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    audioChunksRef.current = []
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setIsMockAudio(false)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setRecording(true)
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.')
      console.error(err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  // File Upload completions
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setAudioBlob(file)
      setAudioUrl(URL.createObjectURL(file))
      setIsMockAudio(false)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      setResults(null)
      setError(null)
    }
  }

  // Simulated preset loading
  const loadSandboxPreset = async (presetName) => {
    setError(null)
    setLoading(true)
    setResults(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setActiveCitations([])
    setSelectedNoteItem(null)
    lastActiveTurnId.current = null
    
    const steps = [
      'Accessing sandbox audio store...',
      `Loading pre-recorded ${presetName.toUpperCase()} encounter session...`,
      'Running Speech-to-Text & diarization...',
      'Mapping dialogue timeline references...',
      'Extracting clinical findings and structured notes...'
    ]
    
    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(steps[i])
      await new Promise(resolve => setTimeout(resolve, 600))
    }
    
    try {
      const formData = new FormData()
      const dummyBlob = new Blob(['preset'], { type: 'audio/mp3' })
      formData.append('file', dummyBlob, `${presetName}_session.mp3`)
      
      const res = await fetch('http://localhost:8002/api/healthscribe/transcribe', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`)
      const data = await res.json()
      
      setResults(data)
      setIsMockAudio(true)
      
      // Determine duration based on mock timeline
      if (presetName === 'ramesh') setDuration(75) // 1:15
      else if (presetName === 'priya') setDuration(90) // 1:30
      else if (presetName === 'arjun') setDuration(130) // 2:10
      else setDuration(30)
      
    } catch (err) {
      setError(`Failed to process simulated encounter: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Uploaded audio file processing
  const processUploadedAudio = async () => {
    if (!audioBlob) return
    setError(null)
    setLoading(true)
    setResults(null)
    setActiveCitations([])
    setSelectedNoteItem(null)
    lastActiveTurnId.current = null
    
    const steps = [
      'Uploading audio encounter file...',
      'Connecting to Gemini API...',
      'Transcribing dialog & separating speakers...',
      'Generating citation references...',
      'Formulating clinical report sections...'
    ]
    
    let stepIndex = 0
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        setProcessingStep(steps[stepIndex])
        stepIndex++
      }
    }, 1500)

    try {
      const formData = new FormData()
      const filename = selectedFile ? selectedFile.name : 'recorded_mic_session.wav'
      formData.append('file', audioBlob, filename)
      
      const res = await fetch('http://localhost:8002/api/healthscribe/transcribe', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) throw new Error(`Transcription service failed: HTTP ${res.status}`)
      
      const data = await res.json()
      setResults(data)
      setIsMockAudio(false)
    } catch (err) {
      setError(`Failed to transcribe audio: ${err.message}`)
      console.error(err)
    } finally {
      clearInterval(stepInterval)
      setLoading(false)
    }
  }

  // Import Case Action
  const handleImportToMedCare = () => {
    if (!results || !results.extracted_entities) return
    
    let notesText = `CLINICAL DISCHARGE SUMMARY (GENERATED VIA HEALTHSCRIBE)\n======================================================\n`
    if (Array.isArray(results.notes_sections)) {
      results.notes_sections.forEach(sec => {
        notesText += `\n${sec.title.toUpperCase()}:\n`
        sec.items?.forEach(item => {
          notesText += `- ${item.text}\n`
        })
      })
    } else if (typeof results.notes === 'string') {
      notesText += results.notes
    }

    const prefillData = {
      name: results.extracted_entities.name || '',
      age: results.extracted_entities.age || '',
      sex: results.extracted_entities.sex || 'Male',
      weight_kg: results.extracted_entities.weight_kg || '',
      blood_group: results.extracted_entities.blood_group || '',
      allergies: results.extracted_entities.allergies || '',
      discharge_text: notesText
    }
    
    navigate('/cases/new', { state: { prefill: prefillData } })
  }

  return (
    <>
      {/* Hidden HTML5 Audio Element */}
      {audioUrl && !isMockAudio && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleAudioTimeUpdate}
          onLoadedMetadata={handleAudioLoadedMetadata}
          onEnded={handleAudioEnded}
          style={{ display: 'none' }}
        />
      )}

      {/* CSS Styles */}
      <style>{`
        .workspace-split-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          margin-top: 20px;
          height: calc(100vh - 160px);
          min-height: 600px;
        }
        @media(max-width: 1024px) {
          .workspace-split-container {
            grid-template-columns: 1fr;
            height: auto;
          }
        }
        .pane-side {
          display: flex;
          flex-direction: column;
          background: var(--bg-surface);
          height: 100%;
          overflow: hidden;
        }
        .pane-header-bar {
          background: rgba(13, 21, 40, 0.95);
          border-bottom: 1px solid var(--border);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 700;
          font-size: 0.82rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-primary);
        }
        .pane-toolbar {
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--border);
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .pane-scrollable-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        
        /* Audio Player Bar */
        .audio-player-panel {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .audio-play-btn {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: none;
          color: var(--text-primary);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          font-size: 0.85rem;
          transition: var(--transition);
        }
        .audio-play-btn:hover {
          background: var(--accent);
          transform: scale(1.05);
        }
        .audio-time-label {
          font-family: monospace;
          font-size: 0.82rem;
          color: var(--text-secondary);
        }
        .audio-timeline-bar-wrapper {
          flex: 1;
          height: 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.06);
          position: relative;
          cursor: pointer;
        }
        .audio-timeline-progress-gradient {
          position: absolute;
          left: 0; top: 0;
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6);
        }
        .audio-timeline-pin {
          position: absolute;
          top: 50%;
          width: 12px; height: 12px;
          border-radius: 50%;
          background: white;
          border: 2px solid var(--accent);
          transform: translate(-50%, -50%);
          box-shadow: 0 0 8px rgba(59,130,246,0.6);
        }
        
        /* Dialogue turn rows layout */
        .dialogue-turn-row {
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          margin-bottom: 12px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: var(--transition);
          background: rgba(255,255,255,0.01);
        }
        .dialogue-turn-row:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: var(--border-hover);
        }
        .dialogue-turn-row.highlighted-turn {
          background: rgba(59, 130, 246, 0.08) !important;
          border-color: var(--accent) !important;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.18);
        }
        .turn-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }
        .turn-speaker {
          font-weight: 700;
          font-size: 0.8rem;
          letter-spacing: 0.03em;
        }
        .turn-speaker.doctor-tag { color: var(--accent-light); }
        .turn-speaker.patient-tag { color: var(--green); }
        .turn-timestamp {
          font-family: monospace;
          font-size: 0.76rem;
          color: var(--text-muted);
          background: rgba(255,255,255,0.04);
          padding: 1px 6px;
          border-radius: 4px;
        }
        .turn-text {
          font-size: 0.88rem;
          line-height: 1.6;
          color: var(--text-primary);
        }

        /* Skip small talk switch toggle */
        .switch-toggle-row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          margin-bottom: 14px;
        }
        .switch-control {
          position: relative;
          display: inline-block;
          width: 44px; height: 22px;
        }
        .switch-control input { opacity: 0; width: 0; height: 0; }
        .switch-slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(255,255,255,0.1);
          transition: .3s;
          border-radius: 34px;
          border: 1px solid var(--border);
        }
        .switch-slider:before {
          position: absolute;
          content: "";
          height: 14px; width: 14px;
          left: 3px; bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }
        input:checked + .switch-slider {
          background-color: var(--green);
          border-color: var(--green);
        }
        input:checked + .switch-slider:before {
          transform: translateX(22px);
        }
        
        /* Simulated toolbar items */
        .toolbar-btn {
          background: none; border: none;
          color: var(--text-secondary);
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.82rem;
          transition: var(--transition);
          display: flex; align-items: center; justify-content: center;
        }
        .toolbar-btn:hover {
          background: rgba(255,255,255,0.06);
          color: var(--text-primary);
        }
        .toolbar-divider {
          width: 1px;
          height: 18px;
          background: var(--border);
        }
        
        /* Note section styling */
        .note-card-section {
          margin-bottom: 24px;
        }
        .note-section-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--accent-light);
          margin-bottom: 10px;
          border-left: 3px solid var(--accent);
          padding-left: 10px;
        }
        .note-item-bullet {
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid transparent;
          margin-bottom: 6px;
          cursor: pointer;
          transition: var(--transition);
          color: var(--text-secondary);
          font-size: 0.88rem;
          line-height: 1.6;
        }
        .note-item-bullet:hover {
          background: rgba(255,255,255,0.02);
          border-color: var(--border);
          color: var(--text-primary);
        }
        .note-item-bullet.active-note {
          background: rgba(6, 182, 212, 0.08) !important;
          border-color: var(--cyan) !important;
          color: var(--text-primary) !important;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.1);
        }
        .note-citation-badge {
          display: inline-flex;
          align-items: center;
          font-size: 0.68rem;
          font-family: monospace;
          background: rgba(59,130,246,0.15);
          color: var(--accent-light);
          padding: 1px 5px;
          border-radius: 4px;
          margin-left: 6px;
          font-weight: bold;
        }
        
        .right-pane-tab-container {
          display: flex;
          background: rgba(13,21,40,0.6);
          border-bottom: 1px solid var(--border);
        }
        .right-pane-tab {
          flex: 1;
          padding: 10px 14px;
          text-align: center;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: var(--transition);
        }
        .right-pane-tab:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.01);
        }
        .right-pane-tab.active {
          color: var(--cyan);
          border-bottom-color: var(--cyan);
          background: rgba(6,182,212,0.04);
        }
        
        .pane-scrollable-body::-webkit-scrollbar {
          width: 6px;
        }
        .pane-scrollable-body::-webkit-scrollbar-track {
          background: transparent;
        }
        .pane-scrollable-body::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 3px;
        }
        .pane-scrollable-body::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>

      {/* Top Header Bar */}
      <div className="topbar">
        <div>
          <div className="topbar-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            🎙️ HealthScribe Desktop
            <span className={`status-pill ${config.live_transcription_enabled ? 'live' : 'demo'}`}>
              {config.live_transcription_enabled ? 'Live Gemini AI Mode' : 'Demo Sandbox Mode'}
            </span>
          </div>
          <div className="topbar-sub">Double-screen dialogue mapper. Play audio to see synchronized scrolling and citation highlights.</div>
        </div>
        <div className="topbar-right" style={{ display: 'flex', gap: 12 }}>
          <input
            type="file"
            accept="audio/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current.click()} disabled={loading || recording}>
            📁 Upload
          </button>
          
          {!recording ? (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={startRecording} disabled={loading}>
              🔴 Record Live
            </button>
          ) : (
            <button className="btn btn-danger btn-sm" onClick={stopRecording}>
              ⏹️ Stop ({formatTime(recordTime)})
            </button>
          )}

          {results && (
            <button className="btn btn-primary btn-sm" onClick={handleImportToMedCare}>
              🚀 Import to MedCare
            </button>
          )}
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 1400, paddingBottom: 10 }}>
        
        {error && (
          <div className="alert danger" style={{ marginBottom: 12 }}>
            <span className="alert-icon">❌</span>
            <div className="alert-content"><div className="alert-title">{error}</div></div>
          </div>
        )}

        {/* Empty state & Loading placeholder */}
        {!results && !loading && (
          <div className="card" style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(13,21,40,0.3)', margin: '20px auto', maxWidth: 640 }}>
            <span style={{ fontSize: '3rem', marginBottom: 16, display: 'block' }}>🎙️</span>
            <h3 style={{ marginBottom: 10 }}>Select Encounter Scenario to Load Interface</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: 24 }}>
              Record dialogue, upload a doctor consultation recording, or select a pre-recorded case below to experience the synchronized double-screen dashboard.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => loadSandboxPreset('ramesh')}>
                Ramesh (Cardiology)
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => loadSandboxPreset('priya')}>
                Priya (Typhoid)
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => loadSandboxPreset('arjun')}>
                Arjun (Heart & Kidney)
              </button>
            </div>
            
            {audioBlob && (
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 24, paddingTop: 20 }}>
                <h4 style={{ marginBottom: 10 }}>Uploaded Encounter Found</h4>
                <button className="btn btn-primary" onClick={processUploadedAudio}>
                  ✨ Transcribe & Analyze Audio
                </button>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="card" style={{ padding: '120px 20px', textAlign: 'center', background: 'rgba(13,21,40,0.3)', margin: '20px auto', maxWidth: 640 }}>
            <span className="spinner" style={{ width: 44, height: 44, borderWidth: 4, margin: '0 auto 20px' }} />
            <h3 style={{ color: 'var(--accent-light)', marginBottom: 8 }}>Structuring Clinical Encounter</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{processingStep}</p>
          </div>
        )}

        {/* WORKSPACE: Split Pane layout */}
        {results && !loading && (
          <div className="workspace-split-container">
            
            {/* LEFT SCREEN: PATIENT VISIT TRANSCRIPT */}
            <div className="pane-side" style={{ borderRight: '1px solid var(--border)' }}>
              <div className="pane-header-bar">
                <span>Patient Visit Transcript</span>
                <span style={{ fontSize: '0.74rem', textTransform: 'none', color: 'var(--text-muted)' }}>
                  {filteredTurns.length} turns displayed
                </span>
              </div>
              
              <div className="pane-scrollable-body" ref={transcriptionContainerRef}>
                {/* Audio Progress Bar panel */}
                <div className="audio-player-panel">
                  <button className="audio-play-btn" onClick={togglePlay}>
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>
                  <span className="audio-time-label">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  <div className="audio-timeline-bar-wrapper" onClick={handleTimelineClick}>
                    <div
                      className="audio-timeline-progress-gradient"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                    <div
                      className="audio-timeline-pin"
                      style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                  <button className="toolbar-btn" style={{ fontSize: '1rem', padding: 0 }}>🔊</button>
                </div>

                {/* Skip Small Talk Switch Toggle */}
                <div className="switch-toggle-row">
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Skip small talk</span>
                  <label className="switch-control">
                    <input
                      type="checkbox"
                      checked={skipSmallTalk}
                      onChange={(e) => setSkipSmallTalk(e.target.checked)}
                    />
                    <span className="switch-slider" />
                  </label>
                </div>

                {/* Dialog Turns */}
                <div className="dialogue-turns-list">
                  {filteredTurns.map((turn) => {
                    const speakerName = turn.speaker || 'Unknown';
                    const isDoctor = speakerName.toLowerCase().includes('doc') || speakerName.toLowerCase().includes('clinician');
                    const isHighlighted = activeCitations.includes(turn.id);
                    return (
                      <div
                        key={turn.id}
                        id={`turn-${turn.id}`}
                        className={`dialogue-turn-row ${isHighlighted ? 'highlighted-turn' : ''}`}
                        onClick={() => handleTurnClick(turn)}
                      >
                        <div className="turn-meta">
                          <span className={`turn-speaker ${isDoctor ? 'doctor-tag' : 'patient-tag'}`}>
                            {speakerName}
                          </span>
                          <span className="turn-timestamp">[{turn.time}]</span>
                        </div>
                        <div className="turn-text">{turn.text}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT SCREEN: CLINICAL SUMMARY & REPORT */}
            <div className="pane-side">
              {/* Tab navigation */}
              <div className="right-pane-tab-container">
                <div className={`right-pane-tab ${activeRightTab === 'notes' ? 'active' : ''}`} onClick={() => { setActiveRightTab('notes'); setSelectedNoteItem(null); }}>
                  📝 Clinical Notes
                </div>
                <div className={`right-pane-tab ${activeRightTab === 'summary' ? 'active' : ''}`} onClick={() => { setActiveRightTab('summary'); setSelectedNoteItem(null); }}>
                  🤝 Patient Summary
                </div>
                <div className={`right-pane-tab ${activeRightTab === 'keypoints' ? 'active' : ''}`} onClick={() => { setActiveRightTab('keypoints'); setSelectedNoteItem(null); }}>
                  🎯 Objectives & Keypoints
                </div>
              </div>

              {/* Rich-text formatting toolbar mockup */}
              <div className="pane-toolbar">
                <select className="form-select" style={{ width: 100, height: 28, padding: '2px 8px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} defaultValue="Roboto">
                  <option>Roboto</option><option>Inter</option><option>Courier</option>
                </select>
                <select className="form-select" style={{ width: 60, height: 28, padding: '2px 8px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} defaultValue="14">
                  <option>12</option><option>14</option><option>16</option>
                </select>
                <div className="toolbar-divider" />
                <button className="toolbar-btn" style={{ fontWeight: 'bold' }}>B</button>
                <button className="toolbar-btn" style={{ fontStyle: 'italic' }}>I</button>
                <button className="toolbar-btn" style={{ textDecoration: 'underline' }}>U</button>
                <button className="toolbar-btn" style={{ textDecoration: 'line-through' }}>S</button>
                <div className="toolbar-divider" />
                <button className="toolbar-btn" title="Copy text">📋</button>
                <button className="toolbar-btn" title="Bullet List">•=</button>
                <button className="toolbar-btn" title="Numbered List">1=</button>
              </div>

              {/* Right Scrollable Content */}
              <div className="pane-scrollable-body">
                
                {/* TAB 1: CLINICAL NOTES */}
                {activeRightTab === 'notes' && (
                  <div className="notes-sections-list">
                    {Array.isArray(results.notes_sections) ? (
                      results.notes_sections.map((section, sIndex) => (
                        <div key={section.title || sIndex} className="note-card-section">
                          <div className="note-section-title">{section.title || 'Clinical Notes'}</div>
                          <div className="note-section-body">
                            {Array.isArray(section.items) ? (
                              section.items.map((item, iIndex) => {
                                const noteIdKey = `${sIndex}-${iIndex}`;
                                const isSelected = selectedNoteItem === noteIdKey;
                                return (
                                  <div
                                    key={iIndex}
                                    id={`note-${noteIdKey}`}
                                    className={`note-item-bullet ${isSelected ? 'active-note' : ''}`}
                                    onClick={() => handleNoteItemClick(item, noteIdKey)}
                                  >
                                    {item.text}
                                    {Array.isArray(item.citations) && item.citations.map((cId) => (
                                      <span key={cId} className="note-citation-badge">
                                        t{cId.replace('t', '')}
                                      </span>
                                    ))}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="note-item-bullet">{section.text || JSON.stringify(section)}</div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : typeof results.notes === 'string' ? (
                      <div className="note-card-section">
                        <div className="note-section-title">Clinical Notes</div>
                        <div className="markdown-text">{results.notes}</div>
                      </div>
                    ) : (
                      <div className="note-card-section">
                        <div className="note-section-title">Clinical Notes</div>
                        <div className="note-item-bullet">{JSON.stringify(results.notes_sections || results.notes)}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: PATIENT FRIENDLY SUMMARY */}
                {activeRightTab === 'summary' && results.summary && (
                  <div className="notes-sections-list">
                    <div className="note-card-section">
                      <div className="note-section-title">Encounter Recovery Summary</div>
                      <div className="note-section-body">
                        {Array.isArray(results.summary) ? (
                          results.summary.map((item, idx) => {
                            const isSelected = selectedNoteItem === `sum-${idx}`;
                            return (
                              <div
                                key={idx}
                                className={`note-item-bullet ${isSelected ? 'active-note' : ''}`}
                                style={{ padding: 14, marginBottom: 12, border: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.005)' }}
                                onClick={() => handleNoteItemClick(item, `sum-${idx}`)}
                              >
                                {item.text}
                                {Array.isArray(item.citations) && item.citations.map((cId) => (
                                  <span key={cId} className="note-citation-badge">
                                    t{cId.replace('t', '')}
                                  </span>
                                ))}
                              </div>
                            );
                          })
                        ) : (
                          <div className="note-item-bullet" style={{ padding: 14, lineHeight: 1.8 }}>
                            {typeof results.summary === 'string' ? results.summary : JSON.stringify(results.summary)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: OBJECTIVES & KEY TAKEAWAYS */}
                {activeRightTab === 'keypoints' && (
                  <div className="notes-sections-list">
                    {/* Objectives */}
                    <div className="note-card-section">
                      <div className="note-section-title">Recovery Objectives</div>
                      <div className="note-section-body">
                        {Array.isArray(results.objectives) ? (
                          results.objectives.map((item, idx) => {
                            const isSelected = selectedNoteItem === `obj-${idx}`;
                            return (
                              <div
                                key={idx}
                                className={`note-item-bullet ${isSelected ? 'active-note' : ''}`}
                                onClick={() => handleNoteItemClick(item, `obj-${idx}`)}
                              >
                                🎯 {item.text}
                                {Array.isArray(item.citations) && item.citations.map((cId) => (
                                  <span key={cId} className="note-citation-badge">
                                    t{cId.replace('t', '')}
                                  </span>
                                ))}
                              </div>
                            );
                          })
                        ) : (
                          <div className="note-item-bullet">
                            {typeof results.objectives === 'string' ? results.objectives : JSON.stringify(results.objectives)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Keypoints */}
                    <div className="note-card-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                      <div className="note-section-title">Critical Key Points</div>
                      <div className="note-section-body">
                        {Array.isArray(results.key_points) ? (
                          results.key_points.map((item, idx) => {
                            const isSelected = selectedNoteItem === `kp-${idx}`;
                            return (
                              <div
                                key={idx}
                                className={`note-item-bullet ${isSelected ? 'active-note' : ''}`}
                                onClick={() => handleNoteItemClick(item, `kp-${idx}`)}
                              >
                                💡 {item.text}
                                {Array.isArray(item.citations) && item.citations.map((cId) => (
                                  <span key={cId} className="note-citation-badge">
                                    t{cId.replace('t', '')}
                                  </span>
                                ))}
                              </div>
                            );
                          })
                        ) : (
                          <div className="note-item-bullet">
                            {typeof results.key_points === 'string' ? results.key_points : JSON.stringify(results.key_points)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

      </div>
    </>
  )
}
