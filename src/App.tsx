import { useEffect, useRef, useState } from 'react'
import type { FormEvent, RefObject } from 'react'
import { AlertTriangle, ArrowUpRight, Camera, Check, CloudUpload, FileText, History, Leaf, LeafyGreen, LoaderCircle, LogOut, Menu, MessageCircle, Moon, ScanLine, Send, Settings2, ShieldCheck, Stethoscope, Sun, Trash2, Upload, X } from 'lucide-react'
import './App.css'

type Diagnosis = { crop: string; disease: string; confidence: number; severity: string; treatable: boolean; summary: string; cause?: string; actions: string[]; treatmentSteps?: string[]; organic?: string[]; prevention?: string[]; medicines?: string[]; isDemo?: boolean; imageUrl?: string }
type DiagnosticRecord = Diagnosis & { id: string; date: string; fileName: string; imageUrl?: string }
type ChatMessage = { role: 'assistant' | 'user'; text: string }
type Session = { name: string; email: string }
type Page = 'overview' | 'scan' | 'history' | 'treatments' | 'settings'

function getSession(): Session | null {
  try {
    // Uses sessionStorage so closing the tab or signing out requires logging in again
    const session = JSON.parse(sessionStorage.getItem('cropdoctor-session') || 'null') as Session | null
    return session?.name && session?.email ? session : null
  } catch { return null }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxDim = 800
        let width = img.width
        let height = img.height
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        } else {
          resolve(reader.result as string)
        }
      }
      img.onerror = () => resolve(reader.result as string)
      img.src = reader.result as string
    }
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}

function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [mode, setMode] = useState<'signin' | 'register'>('signin')
  
  // Independent state for Sign In
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')

  // Independent state for Create Account
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    setLoading(true)
    try {
      if (mode === 'signin') {
        const cleanEmail = signInEmail.trim().toLowerCase()
        const cleanPassword = signInPassword.trim()
        if (!cleanEmail || !cleanPassword) {
          setError('Enter your email and password to sign in.')
          setLoading(false)
          return
        }
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to sign in.')
        onLogin({ name: data.name, email: data.email })
      } else {
        const cleanName = registerName.trim()
        const cleanEmail = registerEmail.trim().toLowerCase()
        const cleanPassword = registerPassword.trim()
        if (!cleanName || !cleanEmail || !cleanPassword) {
          setError('Please provide your name, email, and password to create an account.')
          setLoading(false)
          return
        }
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cleanName, email: cleanEmail, password: cleanPassword })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create account.')
        
        // Transition to Sign In tab instead of directly entering workspace
        setSignInEmail(cleanEmail)
        setSignInPassword('')
        setRegisterName('')
        setRegisterEmail('')
        setRegisterPassword('')
        setSuccess('Account created successfully! Please enter your password to sign in.')
        setMode('signin')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-image">
        <div className="login-brand">
          <span className="brand-mark"><LeafyGreen size={18} /></span>
          <strong>crop<span>doctor</span></strong>
        </div>
        <div className="login-quote">
          <span>SMART FARM</span>
          <h1>Better crops start with clear answers.</h1>
          <p>Take a picture, find the problem, and know exactly what to do next.</p>
        </div>
      </div>
      <section className="login-card">
        <div className="login-heading">
          <span className="eyebrow">CROP DOCTOR</span>
          <h2>{mode === 'signin' ? 'Welcome Back!' : 'Create Farm Account'}</h2>
          <p>{mode === 'signin' ? 'Sign in to access your crop scan records and diagnoses.' : 'Register a new dedicated workspace for your farm.'}</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
          >
            Create Account
          </button>
        </div>

        {mode === 'signin' ? (
          <form onSubmit={submit} className="login-form" key="form-signin">
            {success && <p className="login-success"><Check size={16} /> {success}</p>}
            <label>
              Email address
              <input
                type="email"
                value={signInEmail}
                onChange={(event) => setSignInEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={signInPassword}
                onChange={(event) => setSignInPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </label>
            {error && <p className="login-error"><AlertTriangle size={14} /> {error}</p>}
            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? 'Connecting...' : 'Enter Workspace'} <ArrowUpRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={submit} className="login-form" key="form-register">
            <label>
              Full name
              <input
                value={registerName}
                onChange={(event) => setRegisterName(event.target.value)}
                placeholder="Farmer or Farm name"
                autoComplete="name"
                required
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                placeholder="Create a secure password"
                autoComplete="new-password"
                required
              />
            </label>
            {error && <p className="login-error"><AlertTriangle size={14} /> {error}</p>}
            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'} <ArrowUpRight size={16} />
            </button>
          </form>
        )}

        <button
          type="button"
          className="auth-switch-link"
          onClick={() => {
            setMode(mode === 'signin' ? 'register' : 'signin')
            setError('')
            setSuccess('')
          }}
        >
          {mode === 'signin' ? "Don't have an account? Create one here" : 'Already have an account? Sign in here'}
        </button>

        <p className="login-note"><ShieldCheck size={13} /> Each account maintains its own private, isolated scan history.</p>
      </section>
    </main>
  )
}

function App() {
  const [session, setSession] = useState<Session | null>(() => getSession())
  const [theme, setTheme] = useState<'light'|'dark'>(() => { return (localStorage.getItem('cropdoctor-theme') as 'light'|'dark') || 'light' })
  useEffect(() => { if (theme === 'dark') document.body.classList.add('dark-mode'); else document.body.classList.remove('dark-mode') }, [theme])
  const [page, setPage] = useState<Page>(() => { const hash = window.location.hash.slice(1) as Page; return ['overview', 'scan', 'history', 'treatments', 'settings'].includes(hash) ? hash : 'overview' })
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<DiagnosticRecord | null>(null)
  const [records, setRecords] = useState<DiagnosticRecord[]>([])
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'error'>('idle')
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, chatLoading, chatOpen])

  const resetAllSessionData = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(null)
    setFile(null)
    setDiagnosis(null)
    setSelectedRecord(null)
    setRecords([])
    setStatus('idle')
    setError('')
    setChatMessages([])
    setChatInput('')
    setChatOpen(false)
    setPage('overview')
    if (uploadInputRef.current) uploadInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  useEffect(() => {
    // Clear any legacy localStorage session so closing tab requires signing in
    localStorage.removeItem('cropdoctor-session')
  }, [])

  const logout = () => {
    resetAllSessionData()
    sessionStorage.removeItem('cropdoctor-session')
    localStorage.removeItem('cropdoctor-session')
    setSession(null)
    window.location.hash = ''
  }

  const handleLogin = (newSession: Session) => {
    resetAllSessionData()
    sessionStorage.setItem('cropdoctor-session', JSON.stringify(newSession))
    localStorage.removeItem('cropdoctor-session')
    setSession(newSession)
  }

  const deleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this scan record from your database?')) return
    try {
      const cleanEmail = session?.email.toLowerCase().trim() || ''
      const res = await fetch(`/api/records/${id}?email=${encodeURIComponent(cleanEmail)}`, { method: 'DELETE' })
      if (res.ok) {
        setRecords(prev => prev.filter(r => r.id !== id))
        if (selectedRecord?.id === id) setSelectedRecord(null)
      }
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl) }, [imageUrl])
  useEffect(() => {
    const handleHashChange = () => { const hash = window.location.hash.slice(1) as Page; if (['overview', 'scan', 'history', 'treatments', 'settings'].includes(hash)) setPage(hash) }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    if (session?.email) {
      setRecords([]) // Instantly clear previous records to prevent cross-account flash
      const cleanEmail = session.email.toLowerCase().trim()
      fetch(`/api/records?email=${encodeURIComponent(cleanEmail)}`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setRecords(data); else setRecords([]) })
        .catch(err => { console.error(err); setRecords([]) })
    } else {
      setRecords([])
    }
  }, [session?.email])

  const navigate = (nextPage: Page) => { setPage(nextPage); setMobileNav(false); window.history.replaceState(null, '', nextPage === 'overview' ? '#' : `#${nextPage}`) }
  const selectFile = (nextFile?: File) => {
    if (!nextFile?.type.startsWith('image/')) { setError('Please choose a JPG, PNG or HEIC image.'); return }
    if (nextFile.size > 10 * 1024 * 1024) { setError('That image is larger than 10 MB.'); return }
    setFile(nextFile); setImageUrl(URL.createObjectURL(nextFile)); setDiagnosis(null); setError(''); setStatus('idle'); setPage('scan')
  }
  const removeImage = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setFile(null); setImageUrl(null); setDiagnosis(null); setError(''); setStatus('idle')
    if (uploadInputRef.current) uploadInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }
  useEffect(() => {
    const handleRemoveImage = () => removeImage()
    window.addEventListener('cropdoctor:remove-image', handleRemoveImage)
    return () => window.removeEventListener('cropdoctor:remove-image', handleRemoveImage)
  }, [])

  if (!session) return <Login onLogin={handleLogin} />

  const analyze = async () => {
    if (!file) return
    setStatus('analyzing'); setError('')
    try {
      let photoDataUrl = ''
      try {
        photoDataUrl = await fileToDataUrl(file)
      } catch (err) {
        console.warn('Image conversion note:', err)
      }

      const data = new FormData(); data.append('image', file); data.append('crop', 'unknown')
      const response = await fetch('/api/diagnose', { method: 'POST', body: data })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'The AI service is not available right now.')
      const nextDiagnosis = { ...(result as Diagnosis), imageUrl: photoDataUrl }
      setDiagnosis(nextDiagnosis)
      setSelectedRecord(null)
      const recordData = { 
        ...nextDiagnosis, 
        imageUrl: photoDataUrl, 
        date: new Date().toLocaleString(), 
        fileName: file.name, 
        userEmail: session.email.toLowerCase().trim() 
      }
      const saveRes = await fetch('/api/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(recordData) })
      if (saveRes.ok) {
         const savedRecord = await saveRes.json()
         setRecords((prev) => [savedRecord, ...prev].slice(0, 50))
      }
      setStatus('idle')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to analyze this image.'); setStatus('error') }
  }
  const sendChat = async () => {
    const message = chatInput.trim(); if (!message || chatLoading) return
    setChatInput(''); setChatMessages((current) => [...current, { role: 'user', text: message }]); setChatLoading(true)
    try {
      const activeContext = diagnosis || selectedRecord || records[0];
      const contextSummary = activeContext ? {
        crop: activeContext.crop,
        disease: activeContext.disease,
        confidence: activeContext.confidence,
        severity: activeContext.severity,
        summary: activeContext.summary,
        actions: activeContext.actions,
        treatmentSteps: activeContext.treatmentSteps,
        organic: activeContext.organic,
        medicines: activeContext.medicines,
      } : null;
      const response = await fetch('/api/chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          message, 
          crop: activeContext?.crop || 'unknown crop', 
          diagnosis: contextSummary,
          history: chatMessages.slice(-8)
        }) 
      })
      const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || 'Chat service unavailable.')
      setChatMessages((current) => [...current, { role: 'assistant', text: data.reply }])
    } catch (caught) { setChatMessages((current) => [...current, { role: 'assistant', text: caught instanceof Error ? caught.message : 'I could not answer that right now.' }]) } finally { setChatLoading(false) }
  }
  const initials = session.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const pageTitle = page === 'overview' ? 'Dashboard' : page === 'scan' ? 'Analysis' : page === 'history' ? 'History' : page === 'treatments' ? 'Treatment' : 'Settings'

  return <div className="app-shell"><aside className={`sidebar ${mobileNav ? 'open' : ''}`}><div className="brand"><span className="brand-mark"><LeafyGreen size={18} /></span><span>crop<span>doctor</span></span></div><div className="farm-switcher"><span className="farm-icon"><Leaf size={16} /></span><div><strong>{session.name}</strong><small>My Farm Workspace</small></div></div><nav className="nav"><p>Menu</p><button className={page === 'overview' ? 'active' : ''} onClick={() => navigate('overview')}>Dashboard</button><button className={page === 'scan' ? 'active' : ''} onClick={() => navigate('scan')}><ScanLine size={16} />Analysis</button><button className={page === 'history' ? 'active' : ''} onClick={() => navigate('history')}><History size={16} />History</button><button className={page === 'treatments' ? 'active' : ''} onClick={() => navigate('treatments')}><Leaf size={16} />Treatment</button><p className="nav-gap">More</p><button className={page === 'settings' ? 'active' : ''} onClick={() => navigate('settings')}><Settings2 size={16} />Settings</button></nav><div className="sidebar-bottom"><div className="profile"><span>{initials}</span><div><strong>{session.name}</strong><small>{session.email}</small></div><button className="logout-button" onClick={logout} title="Sign out"><LogOut size={15} /></button></div></div></aside><header className="site-header"><button className="mobile-toggle" onClick={() => setMobileNav(!mobileNav)} aria-label="Open navigation"><Menu size={20} /></button><button className="site-brand" onClick={() => navigate('overview')}><span className="brand-mark"><LeafyGreen size={18} /></span><span>crop<span>doctor</span></span></button><nav className="top-nav"><span>Helping your farm grow healthy</span></nav><div className="header-account"><button className="theme-toggle-icon" onClick={() => { const next = theme === 'light' ? 'dark' : 'light'; setTheme(next); localStorage.setItem('cropdoctor-theme', next) }} title="Toggle Theme">{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button><span className="connected"><i /> Connected</span><button className="account-avatar" onClick={logout} title="Sign out">{initials}</button></div></header>
    <main className="main">
      <div className="page-bar">
        <div>
          <span className="eyebrow">PLANT HEALTH</span>
          <strong>{pageTitle}</strong>
        </div>
        <button className="sign-out" onClick={logout}>
          <LogOut size={17} /> Sign out
        </button>
      </div>
      <div className="content">
        {page === 'overview' && <Overview name={session.name} records={records} navigate={navigate} />}
        {page === 'scan' && (
          <ScanView
            file={file}
            imageUrl={imageUrl}
            diagnosis={diagnosis}
            status={status}
            error={error}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            selectFile={selectFile}
            analyze={analyze}
            uploadInputRef={uploadInputRef}
            cameraInputRef={cameraInputRef}
            navigate={navigate}
          />
        )}
        {page === 'history' && (
          <HistoryView
            records={records}
            navigate={navigate}
            onSelectRecord={(r: DiagnosticRecord) => {
              setSelectedRecord(r)
              navigate('treatments')
            }}
            onDeleteRecord={deleteRecord}
          />
        )}
        {page === 'treatments' && (
          <TreatmentsView
            diagnosis={diagnosis}
            records={records}
            selectedRecord={selectedRecord}
            onSelectRecord={setSelectedRecord}
          />
        )}
        {page === 'settings' && <SettingsView session={session} records={records} logout={logout} />}
      </div>
    </main>
    {chatOpen && (
      <section className="chat-panel" aria-label="Crop doctor assistant">
        <div className="chat-header">
          <div>
            <strong>Field assistant</strong>
            <span>AI support for your current scan</span>
          </div>
          <div className="chat-header-actions">
            {chatMessages.length > 0 && (
              <button
                type="button"
                className="chat-clear-btn"
                onClick={() => {
                  if (window.confirm('Delete all messages in this chat?')) {
                    setChatMessages([])
                  }
                }}
                title="Delete chat history"
              >
                <Trash2 size={13} /> Clear
              </button>
            )}
            <button
              onClick={() => setChatOpen(false)}
              aria-label="Close chat"
              className="chat-close-btn"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="chat-messages">
          {chatMessages.length === 0 && (
            <div className="chat-empty">
              <p>Ask a question about your crop, disease prevention, or treatment recipes.</p>
              <div className="chat-quick-prompts">
                <button
                  type="button"
                  onClick={() => setChatInput('How do I prevent this problem from spreading?')}
                >
                  💡 How do I stop it from spreading?
                </button>
                <button
                  type="button"
                  onClick={() => setChatInput('What organic spray can I prepare at home?')}
                >
                  🌿 What natural spray can I make at home?
                </button>
                <button
                  type="button"
                  onClick={() => setChatInput('How often should I water during recovery?')}
                >
                  💧 How much watering is safe now?
                </button>
              </div>
            </div>
          )}
          {chatMessages.map((message, index) => (
            <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
              {message.text}
            </div>
          ))}
          {chatLoading && (
            <div className="chat-message assistant">
              <LoaderCircle className="spin" size={14} /> Thinking...
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>
        <form
          className="chat-form"
          onSubmit={(event) => {
            event.preventDefault()
            void sendChat()
          }}
        >
          <input
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Ask about your crop..."
            aria-label="Ask the crop assistant"
          />
          <button type="submit" disabled={chatLoading || !chatInput.trim()}>
            <Send size={15} />
          </button>
        </form>
        <p className="chat-disclaimer">
          <ShieldCheck size={12} /> Confirm urgent decisions with an agronomist.
        </p>
      </section>
    )}
    {page === 'scan' && file && <button className="remove-image" type="button" onClick={() => window.dispatchEvent(new Event('cropdoctor:remove-image'))}><X size={14} /> Remove image</button>}<button className="chat-launcher" onClick={() => setChatOpen(!chatOpen)}><MessageCircle size={18} /> Field assistant</button></div>
}

function Overview({ name, records, navigate }: { name: string; records: DiagnosticRecord[]; navigate: (page: Page) => void }) {
  const latest = records[0];
  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow"><span>DASHBOARD</span><span className="location"><Sun size={13} /> Plant Health</span></div>
          <h1>Welcome, {name}.</h1>
          <p>Check on your plants, catch sickness early, and review treatment guides.</p>
        </div>
        <div className="hero-weather">
          <strong>Database: Atlas</strong>
          <span>MongoDB Cloud Connected</span>
          <div className="weather-line"><i /><b>Active</b></div>
        </div>
      </section>

      <div className="overview-stats">
        <div className="stat-card">
          <small>Total Scans</small>
          <strong>{records.length}</strong>
        </div>
        <div className="stat-card">
          <small>Latest Crop</small>
          <strong>{latest?.crop || 'None yet'}</strong>
        </div>
        <div className="stat-card">
          <small>Health Condition</small>
          <strong style={{ color: latest ? (latest.treatable === false ? '#b6532b' : 'var(--green)') : 'var(--muted)' }}>
            {latest ? latest.disease : 'No Scans Yet'}
          </strong>
        </div>
        <div className="stat-card">
          <small>Diagnostic Accuracy</small>
          <strong>{latest ? `${latest.confidence}%` : '—'}</strong>
        </div>
      </div>

      <section className="field-strip">
        <div className="field-copy">
          <span className="field-kicker">QUICK ANALYSIS</span>
          <h2>Stop sickness <em>before it spreads.</em></h2>
          <p>Upload a clear photo of a leaf to find out what's wrong and exactly how to fix it.</p>
          <button onClick={() => navigate('scan')}>Run Analysis <ArrowUpRight size={15} /></button>
        </div>
      </section>

      <section className="overview-grid">
        <button className="overview-action" onClick={() => navigate('scan')}>
          <ScanLine size={20} />
          <span><strong>New Analysis</strong><small>Diagnose a plant leaf</small></span>
          <ArrowUpRight size={17} />
        </button>
        <button className="overview-action" onClick={() => navigate('history')}>
          <History size={20} />
          <span><strong>History</strong><small>{records.length} saved diagnostic records</small></span>
          <ArrowUpRight size={17} />
        </button>
        <button className="overview-action" onClick={() => navigate('treatments')}>
          <Leaf size={20} />
          <span><strong>Treatment</strong><small>Actionable recovery plans</small></span>
          <ArrowUpRight size={17} />
        </button>
      </section>
    </>
  )
}

function ScanView({
  file,
  imageUrl,
  diagnosis,
  status,
  error,
  isDragging,
  setIsDragging,
  selectFile,
  analyze,
  uploadInputRef,
  cameraInputRef,
  navigate
}: {
  file: File | null;
  imageUrl: string | null;
  diagnosis: Diagnosis | null;
  status: 'idle' | 'analyzing' | 'error';
  error: string;
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;
  selectFile: (file?: File) => void;
  analyze: () => Promise<void>;
  uploadInputRef: RefObject<HTMLInputElement | null>;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  navigate: (page: Page) => void;
}) { 
  const confidence = diagnosis?.confidence ?? 0; 
  const [showWebcam, setShowWebcam] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      cameraInputRef.current?.click();
      return;
    }
    setShowWebcam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error(err);
      alert("Camera access denied or unavailable.");
      setShowWebcam(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const f = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            selectFile(f);
            stopCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setShowWebcam(false);
  };

  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow">DIAGNOSTIC TOOL</span>
          <h2>Analysis</h2>
          <p>Take a bright, clear photo of the sick leaf.</p>
        </div>
        <span className="model-badge"><i /> AI Ready</span>
      </div>
      <section className="scan-layout">
        <div className="capture-panel">
          <div className="panel-top">
            <div>
              <span className="step">01 / UPLOAD</span>
              <h3>Image Input</h3>
            </div>
            <button className="small-icon" title="Upload image" onClick={() => uploadInputRef.current?.click()}>
              <Upload size={19} />
            </button>
          </div>
          <label
            className={`dropzone ${isDragging ? 'dragging' : ''} ${imageUrl ? 'has-image' : ''}`}
            onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => { event.preventDefault(); setIsDragging(false); selectFile(event.dataTransfer.files?.[0]) }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="Selected crop leaf" />
            ) : (
              <div className="drop-content">
                <span className="upload-icon"><CloudUpload size={28} /></span>
                <strong>Drop a leaf photo here</strong>
                <span>or <u>browse from your device</u></span>
                <small>JPG, PNG or HEIC</small>
              </div>
            )}
            <input ref={uploadInputRef} type="file" accept="image/*" onChange={(event) => selectFile(event.target.files?.[0])} />
          </label>
          <div className="capture-footer">
            <div className="file-name">
              <FileText size={18} />
              <span>
                <strong>{file ? file.name : 'No image'}</strong>
                <small>{file ? 'Ready' : 'Waiting for a photo'}</small>
              </span>
            </div>
            <button className="camera" onClick={startCamera}>
              <Camera size={18} /> Take Photo
            </button>
            <input ref={cameraInputRef} className="hidden" type="file" accept="image/*" capture="environment" onChange={(event) => selectFile(event.target.files?.[0])} />
          </div>
        </div>
        <div className="result-panel">
          <div className="panel-top">
            <div>
              <span className="step">02 / RESULTS</span>
              <h3>AI Analysis</h3>
            </div>
            <span className={`result-state ${status === 'analyzing' ? 'working' : ''}`}>
              <i />{status === 'analyzing' ? 'Analyzing...' : diagnosis ? 'Done' : 'Waiting'}
            </span>
          </div>
          <div className="result-content">
            <div className="result-head">
              <div>
                <span className="muted-label">DISEASE FOUND</span>
                <h4>{diagnosis?.disease ?? 'No scan yet'}</h4>
              </div>
            </div>
            <div className="result-facts">
              <span><small>Plant Type</small><strong>{diagnosis?.crop ?? 'Unknown'}</strong></span>
              <span><small>Diagnostic Accuracy</small><strong>{confidence ? `${confidence}%` : '—'}</strong></span>
            </div>
          </div>
          {file && (
            <button className="analyze" onClick={() => void analyze()} disabled={status === 'analyzing'}>
              {status === 'analyzing' ? <><LoaderCircle className="spin" size={20} /> Analyzing...</> : <><Stethoscope size={20} /> Analyze Image</>}
            </button>
          )}
          {error && <p className="error"><AlertTriangle size={18} /> {error}</p>}
          <div className="treatment">
            <div className="treatment-body">
              <strong>Identified Issue</strong>
              <p>{diagnosis?.summary ?? 'Upload an image and hit analyze.'}</p>
              <strong style={{marginTop: '16px', display: 'block'}}>Recommended Treatment</strong>
              <p>{diagnosis?.treatmentSteps?.[0] ?? diagnosis?.actions?.[0] ?? 'Scan an image to get treatment recommendations.'}</p>
            </div>
          </div>
          {diagnosis && (
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate('treatments')}
              style={{
                marginTop: '16px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 700,
                background: 'var(--green)',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              View Full Step-by-Step Treatment Plan <ArrowUpRight size={16} />
            </button>
          )}
        </div>
      </section>
      {showWebcam && (
        <div className="webcam-modal" style={{position:'fixed',inset:0,zIndex:999,background:'#000',display:'flex',flexDirection:'column'}}>
          <video ref={videoRef} style={{flex:1,width:'100%',objectFit:'cover'}} playsInline autoPlay muted />
          <div style={{padding:'30px',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#000'}}>
             <button onClick={stopCamera} style={{color:'white',background:'transparent',border:'none',fontSize:'16px'}}>Cancel</button>
             <button onClick={takePhoto} style={{width:'70px',height:'70px',borderRadius:'50%',background:'white',border:'4px solid #aaa',cursor:'pointer'}}></button>
             <div style={{width:'50px'}}></div>
          </div>
        </div>
      )}
    </> 
  )
}

function HistoryView({
  records,
  navigate,
  onSelectRecord,
  onDeleteRecord
}: {
  records: DiagnosticRecord[];
  navigate: (page: Page) => void;
  onSelectRecord: (record: DiagnosticRecord) => void;
  onDeleteRecord: (id: string) => Promise<void>;
}) {
  return (
    <section className="view-page">
      <span className="eyebrow">YOUR RECORDS</span>
      <h2>History</h2>
      <p>Here are the plants you've analyzed previously.</p>
      {records.length === 0 ? (
        <div className="empty-state large">
          <History size={25} />
          <strong>No history</strong>
          <span>Analyze a plant to see it here.</span>
          <button onClick={() => navigate('scan')}>Run Analysis <ArrowUpRight size={17} /></button>
        </div>
      ) : (
        <div className="record-list">
          {records.map((record) => (
            <article className="record-card" key={record.id}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                {record.imageUrl && (
                  <img
                    src={record.imageUrl}
                    alt={`${record.crop} leaf`}
                    style={{
                      width: '88px',
                      height: '88px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      flexShrink: 0,
                      background: '#f4f6f1'
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="record-card-head">
                    <div>
                      <span className="record-id">{record.id}</span>
                      <h3>{record.disease}</h3>
                      <p>{record.crop} · {record.date}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span className="record-confidence">
                        {record.confidence}%<small>accuracy</small>
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(record.id)}
                        title="Delete this record"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          background: '#fff0e9',
                          color: '#a34e2c',
                          border: '1px solid #f0d5c8',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                  <p className="record-summary">{record.summary}</p>
                  <button
                    className="text-button"
                    onClick={() => onSelectRecord(record)}
                    style={{ marginTop: '10px', padding: '6px 0' }}
                  >
                    View Treatment Plan <ArrowUpRight size={14} />
                  </button>
                  <small className="record-source" style={{ display: 'block', marginTop: '10px' }}>
                    Photo: {record.fileName}
                  </small>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function TreatmentsView({
  diagnosis,
  records,
  selectedRecord,
  onSelectRecord,
}: {
  diagnosis: Diagnosis | null;
  records: DiagnosticRecord[];
  selectedRecord: DiagnosticRecord | null;
  onSelectRecord: (record: DiagnosticRecord | null) => void;
}) {
  const active = selectedRecord || diagnosis || records[0];
  const activeImg = active?.imageUrl;
  return (
    <section className="view-page">
      <span className="eyebrow">PLANT CARE</span>
      <h2>Treatment</h2>
      <p>Step-by-step instructions to treat the identified issue.</p>
      {records.length > 0 && (
        <div style={{ margin: '14px 0 20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}>Select Scanned Plant:</label>
          <select
            value={selectedRecord?.id || (diagnosis && !selectedRecord ? 'current' : records[0]?.id || '')}
            onChange={(e) => {
              const val = e.target.value
              if (val === 'current') {
                onSelectRecord(null)
              } else {
                const found = records.find(r => r.id === val)
                if (found) onSelectRecord(found)
              }
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              background: 'var(--card)',
              color: 'var(--ink)',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            {diagnosis && <option value="current">Current Scan: {diagnosis.crop} - {diagnosis.disease}</option>}
            {records.map(r => (
              <option key={r.id} value={r.id}>
                {r.crop} - {r.disease} ({r.date})
              </option>
            ))}
          </select>
        </div>
      )}
      {active ? (
        <div className="protocol-layout">
          <div className="protocol-main">
            <div className="protocol-heading">
              <div>
                <span className="record-id">STEPS FOR</span>
                <h3>{active.disease}</h3>
                <p>{active.crop} · Risk: {active.severity} · {active.confidence}% diagnostic accuracy</p>
              </div>
              <span className="protocol-status">{active.treatable ? 'Treatable' : 'Difficult'}</span>
            </div>
            {active.cause && (
              <section className="protocol-section">
                <h4>Why did this happen?</h4>
                <p style={{ color: 'var(--muted)', fontSize: '15px' }}>{active.cause}</p>
              </section>
            )}
            <section className="protocol-section">
              <h4>Recommended Actions</h4>
              <ol>
                {(active.treatmentSteps || active.actions).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
            <section className="protocol-section">
              <h4>Natural & Organic Solutions</h4>
              <ul>
                {(active.organic || ['No specific natural solutions found.']).map((org) => (
                  <li key={org}>{org}</li>
                ))}
              </ul>
            </section>
            <section className="protocol-section">
              <h4>Chemical Solutions</h4>
              <ul>
                {(active.medicines || ['No medicine suggested.']).map((medicine) => (
                  <li key={medicine}>{medicine}</li>
                ))}
              </ul>
              <p className="safety-note">
                <ShieldCheck size={15} /> Be safe! Only use products approved for this crop.
              </p>
            </section>
            <section className="protocol-section">
              <h4>Prevention</h4>
              <ul>
                {(active.prevention || ['Keep checking new leaves.']).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
          <aside className="protocol-aside">
            {activeImg && (
              <img
                src={activeImg}
                alt={active.disease}
                style={{
                  width: '100%',
                  maxHeight: '190px',
                  objectFit: 'cover',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}
              />
            )}
            <LeafyGreen size={21} />
            <strong>AI Diagnostic Notes</strong>
            <p>{active.summary}</p>
            <span>From photo: {active === diagnosis ? 'Current upload' : (records[0]?.fileName || 'Scanned photo')}</span>
          </aside>
        </div>
      ) : (
        <div className="empty-state large">
          <Stethoscope size={25} />
          <strong>No active analysis</strong>
          <span>Analyze a plant to get treatment plans here.</span>
        </div>
      )}
    </section>
  )
}

function SettingsView({ session, records, logout }: { session: Session; records: DiagnosticRecord[]; logout: () => void }) { 
  const [printMode, setPrintMode] = useState<'none' | 'all' | string>('none');
  useEffect(() => { if (printMode !== 'none') { window.print(); setTimeout(() => setPrintMode('none'), 1000); } }, [printMode]);
  return (
    <section className="view-page">
      <div className="print-hide">
        <span className="eyebrow">WORKSPACE</span>
        <h2>Settings & Data</h2>
        <p>Manage your account preferences, records, and data exports.</p>
        <div className="settings-grid">
          <div className="settings-card">
            <h3>Profile & Account</h3>
            <label>Full name<input value={session.name} readOnly /></label>
            <label>Email address<input value={session.email} readOnly /></label>
            <div style={{ marginTop: '15px', padding: '12px', background: '#f5f8f3', borderRadius: '7px', fontSize: '13px', color: 'var(--ink)' }}>
              <strong>Saved Records:</strong> {records.length} scan {records.length === 1 ? 'report' : 'reports'} saved for this account.
            </div>
            <button 
              type="button" 
              onClick={logout} 
              style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fff0e9', color: '#a34e2c', border: '1px solid #e5bca9', borderRadius: '7px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}
            >
              <LogOut size={16} /> Sign Out / Switch Account
            </button>
          </div>
          <div className="settings-card">
            <h3>Export Records (PDF)</h3>
            <p style={{ marginBottom: '18px', color: 'var(--muted)', fontSize: '15px' }}>Download your scan history and treatments as a PDF.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                className="primary-button" 
                onClick={() => setPrintMode('all')} 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px', justifyContent: 'center', background: 'var(--lime)', color: 'var(--ink)', border: 'none', borderRadius: '7px', fontWeight: 'bold' }}
              >
                <FileText size={17} /> Download All Scan History (PDF)
              </button>
              <select 
                style={{ width: '100%', padding: '12px', borderRadius: '7px', border: '1px solid var(--line)', background: '#f7f9f5' }} 
                onChange={(e) => { if (e.target.value) { setPrintMode(e.target.value); e.target.value = ''; } }} 
                defaultValue=""
              >
                <option value="" disabled>Download Specific Plant Scan (PDF)...</option>
                {records.map(r => <option key={r.id} value={r.id}>{r.crop} - {r.disease} ({r.date})</option>)}
              </select>
            </div>
            <p className="settings-note" style={{ marginTop: '15px' }}><AlertTriangle size={17} /> Note: This uses the browser's native print-to-PDF engine.</p>
          </div>
        </div>
      </div>
      {printMode !== 'none' && (
        <div className="print-only">
          <h1>Crop Doctor - Diagnostic Report</h1>
          <p>Report generated on {new Date().toLocaleDateString()} for {session.name} ({session.email})</p>
          <hr style={{ marginBottom: '30px' }} />
          {records.filter(r => printMode === 'all' || r.id === printMode).map((record) => (
            <div key={record.id} style={{ pageBreakAfter: 'always', marginBottom: '40px' }}>
              <h2 style={{ color: 'var(--green)', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                {record.crop} - {record.disease}
              </h2>

              {record.imageUrl && (
                <div style={{ margin: '14px 0 16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#555', margin: '0 0 6px 0' }}>Scanned Leaf Photo:</p>
                  <img
                    src={record.imageUrl}
                    alt={`${record.crop} - ${record.disease}`}
                    style={{
                      maxWidth: '280px',
                      maxHeight: '200px',
                      objectFit: 'contain',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      background: '#f9f9f9',
                      display: 'block'
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '14px' }}>
                <span><strong>Date:</strong> {record.date}</span>
                <span><strong>Diagnostic Accuracy:</strong> {record.confidence}%</span>
                <span><strong>Severity:</strong> {record.severity || 'Unknown'}</span>
                <span><strong>Treatable:</strong> {record.treatable ? 'Yes' : 'Difficult'}</span>
              </div>
              <div style={{ marginTop: '20px' }}>
                <h3>Diagnosis Summary</h3>
                <p>{record.summary}</p>
                {record.cause && <p><strong>Cause:</strong> {record.cause}</p>}
              </div>
              <div style={{ marginTop: '20px' }}>
                <h3>Recommended Actions</h3>
                <ul style={{ paddingLeft: '20px' }}>
                  {(record.treatmentSteps || record.actions || []).map((step: string) => (
                    <li key={step} style={{ marginBottom: '5px' }}>{step}</li>
                  ))}
                </ul>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div>
                  <h3>Chemical Solutions</h3>
                  <ul style={{ paddingLeft: '20px' }}>
                    {(record.medicines || ['None specified']).map((m: string) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Organic Solutions</h3>
                  <ul style={{ paddingLeft: '20px' }}>
                    {(record.organic || ['None specified']).map((o: string) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default App



