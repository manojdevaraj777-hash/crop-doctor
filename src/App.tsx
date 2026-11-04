import { useEffect, useRef, useState } from 'react'
import type { FormEvent, RefObject } from 'react'
import { AlertTriangle, ArrowUpRight, BookOpen, Camera, Check, CloudUpload, Eye, FileText, History, Leaf, LeafyGreen, LoaderCircle, LogOut, Maximize2, Menu, MessageCircle, Minimize2, Moon, ScanLine, Send, Settings2, ShieldCheck, Sprout, Stethoscope, Sun, Trash2, Upload, X, ZoomIn, ZoomOut } from 'lucide-react'
import './App.css'

type Diagnosis = { crop: string; disease: string; confidence: number; severity: string; treatable: boolean; summary: string; cause?: string; actions: string[]; treatmentSteps?: string[]; organic?: string[]; prevention?: string[]; medicines?: string[]; isDemo?: boolean; imageUrl?: string; cropMismatch?: boolean; specifiedCrop?: string; detectedCrop?: string; mismatchMessage?: string }
type DiagnosticRecord = Diagnosis & { id: string; date: string; fileName: string; imageUrl?: string }
type ChatMessage = { role: 'assistant' | 'user'; text: string }
type Session = { name: string; email: string }
type Page = 'overview' | 'scan' | 'history' | 'treatments' | 'settings'
type Language = 'en' | 'ta'

const translations = {
  en: {
    dashboard: 'Dashboard',
    analysis: 'Analysis',
    history: 'History',
    treatment: 'Treatment',
    settings: 'Settings',
    plantHealth: 'PLANT HEALTH',
    signOut: 'Sign out',
    connected: 'Connected',
    tagline: 'Helping your farm grow healthy',
    menu: 'Menu',
    more: 'More',
    myFarmWorkspace: 'My Farm Workspace',
    diagnosticTool: 'DIAGNOSTIC TOOL',
    analysisSubtitle: 'Take a bright, clear photo of the sick leaf or crop.',
    aiReady: 'AI Ready',
    step1Upload: '01 / UPLOAD',
    imageInput: 'Image Input',
    plantType: 'Plant Type:',
    autoDetectPlant: '✨ Auto-Detect with AI (Any Plant)',
    plantTypesGuide: 'Plant Types Guide',
    dropPhotoHere: 'Drop a plant or leaf photo here',
    browseFromDevice: 'browse from your device',
    standardSizingNote: 'Standard sizing: portrait, landscape, or square (JPG, PNG, HEIC)',
    noImage: 'No image',
    waitingForPhoto: 'Waiting for a photo',
    standardPreviewReady: 'Standard Preview Ready',
    takePhoto: 'Take Photo',
    step2Results: '02 / RESULTS',
    aiAnalysis: 'AI Analysis',
    diseaseFound: 'DISEASE FOUND',
    noScanYet: 'No scan yet',
    diagnosticAccuracy: 'Diagnostic Accuracy',
    analyzeImage: 'Analyze Image',
    analyzing: 'Analyzing...',
    identifiedIssue: 'Identified Issue',
    recommendedTreatment: 'Recommended Treatment',
    uploadAndHitAnalyze: 'Upload an image and hit analyze.',
    scanToGetTreatment: 'Scan an image to get treatment recommendations.',
    viewFullTreatmentPlan: 'View Full Step-by-Step Treatment Plan',
    standardFit: 'Standard Fit',
    fillFrame: 'Fill Frame',
    fullView: 'Full View',
    standardAspectBadge: 'Standard Fit • 100%',
    filledViewBadge: 'Filled View',
    fieldAssistant: 'Field assistant',
    askAboutCrop: 'Ask about your crop...',
    askAssistantHint: 'Ask a question about your crop, disease prevention, or treatment recipes.',
    selectScannedPlant: 'Select Scanned Plant:',
    aiDiagnosticNotes: 'AI Diagnostic Notes',
    actionSteps: 'Immediate Action Steps',
    treatmentProtocol: 'Step-by-Step Protocol',
    organicSolutions: 'Natural & Organic Solutions',
    preventionPractices: 'Prevention & Cultural Practices',
    medicinesList: 'Recommended Agrochemicals',
    totalScans: 'Total Scans',
    latestCrop: 'Latest Crop',
    healthCondition: 'Health Condition',
    averageAccuracy: 'Diagnostic Accuracy',
    quickAnalysis: 'QUICK ANALYSIS',
    heroWelcome: 'Welcome',
    heroDesc: 'Check on your plants, catch sickness early, and review treatment guides.',
    heroStopSickness: 'Stop sickness before it spreads.',
    heroStopDesc: 'Upload a clear photo of a leaf to find out what is wrong and exactly how to fix it.',
    runAnalysis: 'Run Analysis',
    newAnalysisAction: 'New Analysis',
    diagnoseLeafSub: 'Diagnose a plant leaf',
    historyAction: 'History',
    savedRecordsSub: 'saved diagnostic records',
    treatmentAction: 'Treatment',
    actionablePlansSub: 'Actionable recovery plans',
    recordsTitle: 'Records',
    recordsSubtitle: 'Past diagnoses and treatment plans for your crops.',
    noRecordsYet: 'No scan records found yet.',
    deleteRecord: 'Delete',
    viewTreatmentAction: 'View Treatment',
    settingsTitle: 'Settings & Data',
    settingsSubtitle: 'Manage your account preferences, records, and data exports.',
    profileCard: 'Profile & Account',
    languagePreference: 'Language Preference / மொழி',
    farmerName: 'Full Name',
    emailAddress: 'Email Address',
    savedRecordsCount: 'Saved Records',
    selectThisPlant: 'Select This Plant',
    selectedForScan: 'Selected for Scan',
    guideSubtitle: 'Visual identification markers, distinctive plant features, and common crop diseases',
    visualIdLabel: 'Visual Identification:',
    commonIssuesLabel: 'Common Crop Issues:',
    treatmentSubtitle: 'Step-by-step instructions to treat the identified issue.',
    yourRecords: 'YOUR RECORDS',
    historySubtitle: "Here are the plants you've analyzed previously.",
    noHistoryDesc: 'Analyze a plant to see it here.',
    stepsFor: 'STEPS FOR',
    riskLevel: 'Risk',
    treatableStatus: 'Treatable',
    difficultStatus: 'Difficult',
    whyHappened: 'Why did this happen?',
    recommendedActions: 'Recommended Actions',
    chemicalSolutions: 'Chemical Solutions',
    prevention: 'Prevention',
    safetyWarning: 'Be safe! Only use products approved for this crop.',
    noActiveAnalysis: 'No active analysis',
    analyzeForTreatments: 'Analyze a plant to get treatment plans here.',
    exportPdf: 'Export Records (PDF)',
    exportPdfDesc: 'Download your scan history and treatments as a PDF.',
    downloadAllPdf: 'Download All Scan History (PDF)',
    downloadSpecificPdf: 'Download Specific Plant Scan (PDF)...',
    pdfEngineNote: "Note: This uses the browser's native print-to-PDF engine.",
    signOutSwitch: 'Sign Out / Switch Account',
    chooseLanguage: 'Choose Application Language',
    removeImage: 'Remove image',
    chatThinking: 'Thinking...',
    chatDisclaimer: 'Confirm urgent decisions with an agronomist.',
    chatSub: 'AI support for your current scan',
    clearChat: 'Clear',
    confirmClearChat: 'Delete all messages in this chat?'
  },
  ta: {
    dashboard: 'முகப்பு',
    analysis: 'பயிர் ஆய்வு',
    history: 'வரலாறு',
    treatment: 'சிகிச்சை முறைகள்',
    settings: 'அமைப்புகள்',
    plantHealth: 'பயிர் நலம்',
    signOut: 'வெளியேறு',
    connected: 'இணைக்கப்பட்டது',
    tagline: 'உங்கள் பண்ணை செழித்து வளர உதவுகிறது',
    menu: 'பட்டி',
    more: 'கூடுதல்',
    myFarmWorkspace: 'என் பண்ணை தளம்',
    diagnosticTool: 'பயிர் மருத்துவக் கருவி',
    analysisSubtitle: 'பாதிக்கப்பட்ட இலை அல்லது பயிரின் தெளிவான புகைப்படத்தை எடுக்கவும்.',
    aiReady: 'AI தயார்',
    step1Upload: '01 / பதிவேற்றம்',
    imageInput: 'பட உள்ளீடு',
    plantType: 'பயிர் வகை:',
    autoDetectPlant: '✨ AI மூலம் கண்டறி (அனைத்து பயிர்களும்)',
    plantTypesGuide: 'பயிர் வகைகள் வழிகாட்டி',
    dropPhotoHere: 'தாவர அல்லது இலை புகைப்படத்தை இங்கே பதிவேற்றவும்',
    browseFromDevice: 'சாதனத்திலிருந்து தேர்ந்தெடுக்கவும்',
    standardSizingNote: 'அனைத்து அளவுகளும் பொருந்தும்: செங்குத்து, கிடைமட்டம், சதுரம்',
    noImage: 'படம் இல்லை',
    waitingForPhoto: 'புகைப்படத்திற்காக காத்திருக்கிறது',
    standardPreviewReady: 'முழு காட்சி தயார்',
    takePhoto: 'புகைப்படம் எடு',
    step2Results: '02 / ஆய்வு முடிவுகள்',
    aiAnalysis: 'AI ஆய்வு முடிவுகள்',
    diseaseFound: 'கண்டறியப்பட்ட நோய்',
    noScanYet: 'இன்னும் ஆய்வு செய்யப்படவில்லை',
    diagnosticAccuracy: 'துல்லியத்தன்மை',
    analyzeImage: 'படத்தை ஆய்வு செய்',
    analyzing: 'ஆய்வு செய்கிறது...',
    identifiedIssue: 'கண்டறியப்பட்ட பிரச்சனை',
    recommendedTreatment: 'பரிந்துரைக்கப்பட்ட சிகிச்சை',
    uploadAndHitAnalyze: 'படத்தைப் பதிவேற்றி ஆய்வு செய் பொத்தானை அழுத்தவும்.',
    scanToGetTreatment: 'சிகிச்சை பரிந்துரைகளைப் பெற புகைப்படத்தை ஆய்வு செய்யவும்.',
    viewFullTreatmentPlan: 'முழுமையான சிகிச்சை முறையை காண்க',
    standardFit: 'முழு காட்சி',
    fillFrame: 'நிரப்பு காட்சி',
    fullView: 'முழுத்திரை',
    standardAspectBadge: 'முழு காட்சி • 100%',
    filledViewBadge: 'நிரப்பப்பட்ட காட்சி',
    fieldAssistant: 'விவசாய உதவியாளர்',
    askAboutCrop: 'உங்கள் பயிர் பற்றி கேளுங்கள்...',
    askAssistantHint: 'உங்கள் பயிர், நோய் தடுப்பு அல்லது இயற்கை மருத்துவம் பற்றி கேளுங்கள்.',
    selectScannedPlant: 'ஆய்வு செய்த பயிரைத் தேர்வு செய்க:',
    aiDiagnosticNotes: 'AI மருத்துவக் குறிப்புகள்',
    actionSteps: 'உடனடி நடவடிக்கைகள்',
    treatmentProtocol: 'படிப்படியான சிகிச்சை வழிமுறைகள்',
    organicSolutions: 'இயற்கை விவசாய தீர்வுகள்',
    preventionPractices: 'நோய் தடுப்பு & சிறந்த நடைமுறைகள்',
    medicinesList: 'பரிந்துரைக்கப்பட்ட மருந்துகள் / பூச்சிக்கொல்லிகள்',
    totalScans: 'மொத்த ஆய்வுகள்',
    latestCrop: 'சமீபத்திய பயிர்',
    healthCondition: 'பயிர் நிலைமை',
    averageAccuracy: 'சராசரி துல்லியம்',
    quickAnalysis: 'விரைவு ஆய்வு',
    heroWelcome: 'வணக்கம்',
    heroDesc: 'உங்கள் பயிர்களைக் கண்காணிக்கவும், நோய்களை முன்கூட்டியே கண்டறிந்து சிகிச்சை பெறவும்.',
    heroStopSickness: 'பயிர் நோய் பரவுவதை முன்கூட்டியே தடுங்கள்.',
    heroStopDesc: 'இலையின் தெளிவான புகைப்படத்தை பதிவேற்றி, என்ன பிரச்சனை என்பதை அறிந்து உடனடி தீர்வை பெறுங்கள்.',
    runAnalysis: 'ஆய்வைத் தொடங்கு',
    newAnalysisAction: 'புதிய ஆய்வு',
    diagnoseLeafSub: 'இலை நோயை கண்டறியுங்கள்',
    historyAction: 'வரலாறு',
    savedRecordsSub: 'சேமிக்கப்பட்ட ஆய்வு பதிவுகள்',
    treatmentAction: 'சிகிச்சை',
    actionablePlansSub: 'பயனுள்ள குணப்படுத்தும் முறைகள்',
    recordsTitle: 'மருத்துவ பதிவுகள்',
    recordsSubtitle: 'உங்கள் பயிர்களின் முந்தைய ஆய்வு மற்றும் சிகிச்சை விவரங்கள்.',
    noRecordsYet: 'இன்னும் ஆய்வு பதிவுகள் எதுவும் இல்லை.',
    deleteRecord: 'நீக்கு',
    viewTreatmentAction: 'சிகிச்சையைக் காண்க',
    settingsTitle: 'அமைப்புகள் & தரவுகள்',
    settingsSubtitle: 'உங்கள் கணக்கு விவரங்கள் மற்றும் மொழி விருப்பங்களை நிர்வகியுங்கள்.',
    profileCard: 'விவரக்குறிப்பு & கணக்கு',
    languagePreference: 'மொழி விருப்பம் (Language)',
    farmerName: 'முழு பெயர்',
    emailAddress: 'மின்னஞ்சல் முகவரி',
    savedRecordsCount: 'சேமிக்கப்பட்ட பதிவுகள்',
    selectThisPlant: 'இப்பயிரைத் தேர்வு செய்',
    selectedForScan: 'ஆய்வுக்கு தேர்ந்தெடுக்கப்பட்டது',
    guideSubtitle: 'பயிர் அடையாளக் குறிகள், தனித்துவமான அமைப்புகள் மற்றும் பொதுவான நோய்கள்',
    visualIdLabel: 'பயிர் அடையாளங்கள்:',
    commonIssuesLabel: 'பொதுவான பயிர் நோய்கள்:',
    treatmentSubtitle: 'கண்டறியப்பட்ட நோய்க்கான படிப்படியான சிகிச்சை வழிமுறைகள்.',
    yourRecords: 'உங்கள் பதிவுகள்',
    historySubtitle: 'நீங்கள் முன்பு ஆய்வு செய்த பயிர்களின் விவரங்கள்.',
    noHistoryDesc: 'பயிரை ஆய்வு செய்து அதன் விவரங்களை இங்கே காணலாம்.',
    stepsFor: 'சிகிச்சை வழிகாட்டி:',
    riskLevel: 'பாதிப்பு',
    treatableStatus: 'குணப்படுத்தக்கூடியது',
    difficultStatus: 'கடினமானது',
    whyHappened: 'இது ஏன் நிகழ்ந்தது?',
    recommendedActions: 'பரிந்துரைக்கப்பட்ட நடவடிக்கைகள்',
    chemicalSolutions: 'இரசாயன தீர்வுகள் / மருந்துகள்',
    prevention: 'நோய் தடுப்பு முறைகள்',
    safetyWarning: 'பாதுகாப்பாக இருங்கள்! இப்பயிருக்கான பரிந்துரைக்கப்பட்ட மருந்துகளை மட்டுமே பயன்படுத்தவும்.',
    noActiveAnalysis: 'செயலில் உள்ள ஆய்வு எதுவும் இல்லை',
    analyzeForTreatments: 'சிகிச்சை வழிகாட்டிகளைப் பெற பயிரை ஆய்வு செய்யவும்.',
    exportPdf: 'மருத்துவ அறிக்கையை பதிவிறக்கு (PDF)',
    exportPdfDesc: 'உங்கள் ஆய்வு வரலாறு மற்றும் சிகிச்சைகளை PDF ஆக பதிவிறக்கம் செய்யுங்கள்.',
    downloadAllPdf: 'அனைத்து ஆய்வு வரலாற்றையும் பதிவிறக்கு (PDF)',
    downloadSpecificPdf: 'குறிப்பிட்ட பயிர் ஆய்வை பதிவிறக்கு (PDF)...',
    pdfEngineNote: 'குறிப்பு: இது உலாவியின் நேரடி PDF அச்சு வசதியைப் பயன்படுத்துகிறது.',
    signOutSwitch: 'வெளியேறு / கணக்கை மாற்று',
    chooseLanguage: 'பயன்பாட்டு மொழியைத் தேர்ந்தெடுக்கவும்',
    removeImage: 'படத்தை நீக்கு',
    chatThinking: 'பதிலளிக்கிறது...',
    chatDisclaimer: 'முக்கிய முடிவுகளுக்கு வேளாண் அதிகாரியை ஆலோசிக்கவும்.',
    chatSub: 'உங்கள் பயிர் ஆய்வுக்கான AI உதவி',
    clearChat: 'அழி',
    confirmClearChat: 'இந்த அரட்டையில் உள்ள அனைத்து செய்திகளையும் அழிக்கவா?'
  }
}

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
  const [lang, setLang] = useState<Language>(() => { return (localStorage.getItem('cropdoctor-lang') as Language) || 'en' })
  const t = translations[lang]
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

      const data = new FormData()
      data.append('image', file)
      data.append('crop', 'auto')
      data.append('lang', lang)
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
          lang,
          history: chatMessages.slice(-8)
        }) 
      })
      const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || 'Chat service unavailable.')
      setChatMessages((current) => [...current, { role: 'assistant', text: data.reply }])
    } catch (caught) { setChatMessages((current) => [...current, { role: 'assistant', text: caught instanceof Error ? caught.message : 'I could not answer that right now.' }]) } finally { setChatLoading(false) }
  }
  const initials = session.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const pageTitle = page === 'overview' ? t.dashboard : page === 'scan' ? t.analysis : page === 'history' ? t.history : page === 'treatments' ? t.treatment : t.settings

  return <div className="app-shell"><aside className={`sidebar ${mobileNav ? 'open' : ''}`}><div className="brand"><span className="brand-mark"><LeafyGreen size={18} /></span><span>crop<span>doctor</span></span></div><div className="farm-switcher"><span className="farm-icon"><Leaf size={16} /></span><div><strong>{session.name}</strong><small>{t.myFarmWorkspace}</small></div></div><nav className="nav"><p>{t.menu}</p><button className={page === 'overview' ? 'active' : ''} onClick={() => navigate('overview')}>{t.dashboard}</button><button className={page === 'scan' ? 'active' : ''} onClick={() => navigate('scan')}><ScanLine size={16} />{t.analysis}</button><button className={page === 'history' ? 'active' : ''} onClick={() => navigate('history')}><History size={16} />{t.history}</button><button className={page === 'treatments' ? 'active' : ''} onClick={() => navigate('treatments')}><Leaf size={16} />{t.treatment}</button><p className="nav-gap">{t.more}</p><button className={page === 'settings' ? 'active' : ''} onClick={() => navigate('settings')}><Settings2 size={16} />{t.settings}</button></nav><div className="sidebar-bottom"><div className="profile"><span>{initials}</span><div><strong>{session.name}</strong><small>{session.email}</small></div><button className="logout-button" onClick={logout} title={t.signOut}><LogOut size={15} /></button></div></div></aside><header className="site-header"><button className="mobile-toggle" onClick={() => setMobileNav(!mobileNav)} aria-label="Open navigation"><Menu size={20} /></button><button className="site-brand" onClick={() => navigate('overview')}><span className="brand-mark"><LeafyGreen size={18} /></span><span>crop<span>doctor</span></span></button><nav className="top-nav"><span>{t.tagline}</span></nav><div className="header-account"><div className="lang-switcher"><button type="button" className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => { setLang('en'); localStorage.setItem('cropdoctor-lang', 'en') }} title="English">EN</button><button type="button" className={`lang-btn ${lang === 'ta' ? 'active' : ''}`} onClick={() => { setLang('ta'); localStorage.setItem('cropdoctor-lang', 'ta') }} title="தமிழ் (Tamil)">தமிழ்</button></div><button className="theme-toggle-icon" onClick={() => { const next = theme === 'light' ? 'dark' : 'light'; setTheme(next); localStorage.setItem('cropdoctor-theme', next) }} title="Toggle Theme">{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button><span className="connected"><i /> {t.connected}</span><button className="account-avatar" onClick={logout} title={t.signOut}>{initials}</button></div></header>
    <main className="main">
      <div className="page-bar">
        <div>
          <span className="eyebrow">{t.plantHealth}</span>
          <strong>{pageTitle}</strong>
        </div>
        <button className="sign-out" onClick={logout}>
          <LogOut size={17} /> {t.signOut}
        </button>
      </div>
      <div className="content">
        {page === 'overview' && <Overview name={session.name} records={records} navigate={navigate} t={t} />}
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
            t={t}
            lang={lang}
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
            t={t}
          />
        )}
        {page === 'treatments' && (
          <TreatmentsView
            diagnosis={diagnosis}
            records={records}
            selectedRecord={selectedRecord}
            onSelectRecord={setSelectedRecord}
            t={t}
          />
        )}
        {page === 'settings' && <SettingsView session={session} records={records} logout={logout} t={t} lang={lang} setLang={setLang} />}
      </div>
    </main>
    {chatOpen && (
      <section className="chat-panel" aria-label="Crop doctor assistant">
        <div className="chat-header">
          <div>
            <strong>{t.fieldAssistant}</strong>
            <span>{t.chatSub}</span>
          </div>
          <div className="chat-header-actions">
            {chatMessages.length > 0 && (
              <button
                type="button"
                className="chat-clear-btn"
                onClick={() => {
                  if (window.confirm(t.confirmClearChat)) {
                    setChatMessages([])
                  }
                }}
                title="Delete chat history"
              >
                <Trash2 size={13} /> {t.clearChat}
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
              <p>{t.askAssistantHint}</p>
            </div>
          )}
          {chatMessages.map((message, index) => (
            <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
              {message.text}
            </div>
          ))}
          {chatLoading && (
            <div className="chat-message assistant">
              <LoaderCircle className="spin" size={14} /> {t.chatThinking}
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
            placeholder={t.askAboutCrop}
            aria-label={t.fieldAssistant}
          />
          <button type="submit" disabled={chatLoading || !chatInput.trim()}>
            <Send size={15} />
          </button>
        </form>
        <p className="chat-disclaimer">
          <ShieldCheck size={12} /> {t.chatDisclaimer}
        </p>
      </section>
    )}
    {page === 'scan' && file && <button className="remove-image" type="button" onClick={() => window.dispatchEvent(new Event('cropdoctor:remove-image'))}><X size={14} /> {t.removeImage}</button>}<button className="chat-launcher" onClick={() => setChatOpen(!chatOpen)}><MessageCircle size={18} /> {t.fieldAssistant}</button></div>
}

function Overview({ name, records, navigate, t }: { name: string; records: DiagnosticRecord[]; navigate: (page: Page) => void; t: typeof translations['en'] }) {
  const latest = records[0];
  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow"><span>{t.dashboard}</span><span className="location"><Sun size={13} /> {t.plantHealth}</span></div>
          <h1>{t.heroWelcome}, {name}.</h1>
          <p>{t.heroDesc}</p>
        </div>
        <div className="hero-weather">
          <strong>Database: Atlas</strong>
          <span>MongoDB Cloud Connected</span>
          <div className="weather-line"><i /><b>Active</b></div>
        </div>
      </section>

      <div className="overview-stats">
        <div className="stat-card">
          <small>{t.totalScans}</small>
          <strong>{records.length}</strong>
        </div>
        <div className="stat-card">
          <small>{t.latestCrop}</small>
          <strong>{latest?.crop || '—'}</strong>
        </div>
        <div className="stat-card">
          <small>{t.healthCondition}</small>
          <strong style={{ color: latest ? (latest.treatable === false ? '#b6532b' : 'var(--green)') : 'var(--muted)' }}>
            {latest ? latest.disease : t.noScanYet}
          </strong>
        </div>
        <div className="stat-card">
          <small>{t.averageAccuracy}</small>
          <strong>{latest ? `${latest.confidence}%` : '—'}</strong>
        </div>
      </div>

      <section className="field-strip">
        <div className="field-copy">
          <span className="field-kicker">{t.quickAnalysis}</span>
          <h2>{t.heroStopSickness}</h2>
          <p>{t.heroStopDesc}</p>
          <button onClick={() => navigate('scan')}>{t.runAnalysis} <ArrowUpRight size={15} /></button>
        </div>
      </section>

      <section className="overview-grid">
        <button className="overview-action" onClick={() => navigate('scan')}>
          <ScanLine size={20} />
          <span><strong>{t.newAnalysisAction}</strong><small>{t.diagnoseLeafSub}</small></span>
          <ArrowUpRight size={17} />
        </button>
        <button className="overview-action" onClick={() => navigate('history')}>
          <History size={20} />
          <span><strong>{t.historyAction}</strong><small>{records.length} {t.savedRecordsSub}</small></span>
          <ArrowUpRight size={17} />
        </button>
        <button className="overview-action" onClick={() => navigate('treatments')}>
          <Leaf size={20} />
          <span><strong>{t.treatmentAction}</strong><small>{t.actionablePlansSub}</small></span>
          <ArrowUpRight size={17} />
        </button>
      </section>
    </>
  )
}

interface PlantInfo {
  name: string;
  nameTa: string;
  category: string;
  categoryTa: string;
  icon: string;
  regionalNames?: string;
  identifiers: string[];
  identifiersTa: string[];
  commonDiseases: string[];
  commonDiseasesTa: string[];
}

const SUPPORTED_PLANTS: PlantInfo[] = [
  {
    name: 'Maize (Corn)',
    nameTa: 'மக்காச்சோளம் (Maize / Corn)',
    category: 'Cereal / Grain',
    categoryTa: 'தானியப் பயிர்',
    icon: '🌽',
    regionalNames: 'Corn, Makka / மக்காச்சோளம்',
    identifiers: ['Broad leaves with wavy margins and distinct pale midrib', 'Prominent multi-branched feathery tassels (male pollen plumes) at apex', 'Ears with fine silks developing along mid-stalk nodes'],
    identifiersTa: ['அலை போன்ற விளிம்புகளுடன் கூடிய அகன்ற இலைகள்', 'தண்டின் உச்சியில் தோன்றும் ஆண் பூங்கொத்து (Tassel)', 'நடுத் தண்டு கணுக்களில் பட்டு நூல் போன்ற இழைகளுடன் வளரும் கதிர்கள்'],
    commonDiseases: ['Northern Corn Leaf Blight', 'Common Rust', 'Gray Leaf Spot', 'Smut'],
    commonDiseasesTa: ['இலைக்கருகல் நோய்', 'துரு நோய் (Rust)', 'சாம்பல் இலைப்புள்ளி', 'கரிப்பூட்டை நோய்']
  },
  {
    name: 'Rice (Paddy)',
    nameTa: 'நெல் (Rice / Paddy)',
    category: 'Cereal / Grain',
    categoryTa: 'முக்கிய தானியம்',
    icon: '🌾',
    regionalNames: 'Paddy, Dhan, Chawal / நெல்',
    identifiers: ['Narrow, upright, slender green leaves with linear veins', 'Drooping branched panicles carrying golden grain clusters', 'Clumping tillers grown in flooded or upland soil'],
    identifiersTa: ['நேரான, குறுகலான பச்சை இலைகள்', 'தங்க தானியக் கொத்துகளைத் தாங்கிய தொங்கும் கதிர்கள்', 'நீர் நிறைந்த அல்லது மேட்டு நிலத்தில் வளரும் தூர்கள்'],
    commonDiseases: ['Rice Blast', 'Bacterial Leaf Blight', 'Brown Spot', 'Sheath Blight'],
    commonDiseasesTa: ['குலை நோய் (Blast)', 'பாக்டீரியா இலைக்கருகல்', 'செம்புள்ளி நோய்', 'உறை அழுகல் நோய்']
  },
  {
    name: 'Pearl Millet (Bajra)',
    nameTa: 'கம்பு (Pearl Millet / Bajra)',
    category: 'Millet / Grain',
    categoryTa: 'சிறு தானியம்',
    icon: '🌾',
    regionalNames: 'Bajra, Sajje, Kambu / கம்பு',
    identifiers: ['Tall robust stalks with upright leaves', 'Single, solid, unbranched dense cylindrical spike (candle-like)', 'NEVER produces branched spreading feathery tassels'],
    identifiersTa: ['வலுவான உயரமான தண்டு வளர்ச்சி', 'மெழுகுவர்த்தி போன்ற உருளை வடிவ அடர்ந்த கதிர்', 'மெல்லிய ரோமங்கள் கொண்ட நேரான இலைகள்'],
    commonDiseases: ['Downy Mildew (Green Ear)', 'Rust', 'Ergot', 'Smut'],
    commonDiseasesTa: ['அடிச்சாம்பல் நோய் (Green Ear)', 'துரு நோய்', 'எர்காட் நோய்', 'கரிப்பூட்டை நோய்']
  },
  {
    name: 'Sorghum (Jowar)',
    nameTa: 'சோளம் / ஜொன்னல் (Sorghum / Jowar)',
    category: 'Millet / Grain',
    categoryTa: 'சிறு தானியம்',
    icon: '🌾',
    regionalNames: 'Jowar, Great Millet, Cholam / சோளம்',
    identifiers: ['Broad leaves similar to maize but without side cobs', 'Terminal open or compact spherical grain panicle at summit', 'Waxy coating on stalk and leaf sheaths'],
    identifiersTa: ['மக்காச்சோளம் போன்ற அகன்ற இலைகள் (பக்கக் கதிர்கள் இருக்காது)', 'தண்டின் உச்சியில் தோன்றும் திறந்த அல்லது உருண்டை வடிவ தானியக் கதிர்', 'தண்டு மற்றும் இலைகளில் மெழுகு பூச்சு'],
    commonDiseases: ['Anthracnose', 'Grain Mold', 'Leaf Blight', 'Downy Mildew'],
    commonDiseasesTa: ['ஆந்த்ராக்னோஸ் நோய்', 'தானிய பூஞ்சை காளான்', 'இலைக்கருகல்', 'அடிச்சாம்பல் நோய்']
  },
  {
    name: 'Wheat',
    nameTa: 'கோதுமை (Wheat)',
    category: 'Cereal / Grain',
    categoryTa: 'தானியப் பயிர்',
    icon: '🌾',
    regionalNames: 'Gehun, Kanak / கோதுமை',
    identifiers: ['Slender dark green leaves with prominent ligule & auricles', 'Compact terminal spikes with stiff awns (beards)', 'Dense spikelets holding wheat grains'],
    identifiersTa: ['செழுமையான பச்சை நிற குறுகிய இலைகள்', 'முட்கள் (Awns) கொண்ட அடர்த்தியான கதிர் தலை', 'கோதுமை மணிகளைத் தாங்கிய சிறு கதிர்கள்'],
    commonDiseases: ['Yellow / Stripe Rust', 'Brown / Leaf Rust', 'Powdery Mildew', 'Spot Blotch'],
    commonDiseasesTa: ['மஞ்சள் துரு நோய்', 'பழுப்பு துரு நோய்', 'சாம்பல் நோய்', 'இலைப்புள்ளி நோய்']
  },
  {
    name: 'Tomato',
    nameTa: 'தக்காளி (Tomato)',
    category: 'Vegetable',
    categoryTa: 'காய்கறிப் பயிர்',
    icon: '🍅',
    regionalNames: 'Tamatar / தக்காளி',
    identifiers: ['Irregularly lobed, serrated compound leaves with herbal scent', 'Small bright yellow star-shaped flowers', 'Green to vibrant red spherical fruit clusters'],
    identifiersTa: ['தனித்துவமான வாசனை கொண்ட ரம்பப் பல் போன்ற கூட்டிலைகள்', 'சிறிய மஞ்சள் நிற நட்சத்திர வடிவ பூக்கள்', 'பச்சை முதல் அடர் சிவப்பு நிற காய்கள்/பழங்கள்'],
    commonDiseases: ['Early Blight (Target Spots)', 'Late Blight', 'Leaf Mold', 'Bacterial Spot'],
    commonDiseasesTa: ['முன் பருவ கருகல் நோய்', 'பின் பருவ கருகல் நோய்', 'இலை பூஞ்சை', 'பாக்டீரியா புள்ளி நோய்']
  },
  {
    name: 'Potato',
    nameTa: 'உருளைக்கிழங்கு (Potato)',
    category: 'Vegetable / Tuber',
    categoryTa: 'கிழங்கு பயிர்',
    icon: '🥔',
    regionalNames: 'Aloo, Batata / உருளைக்கிழங்கு',
    identifiers: ['Compound pinnate leaves with large terminal leaflet', 'White, pink, or violet 5-lobed flowers', 'Fleshy underground tubers with eye buds'],
    identifiersTa: ['பெரிய முனை சிற்றிலை கொண்ட சிறகு வடிவ கூட்டிலைகள்', 'வெள்ளை அல்லது இளஞ்சிவப்பு நிற 5 இதழ் பூக்கள்', 'மண்ணுக்கு அடியில் விளையும் மாவுச்சத்து கிழங்குகள்'],
    commonDiseases: ['Late Blight (Phytophthora)', 'Early Blight', 'Blackleg', 'Common Scab'],
    commonDiseasesTa: ['பின் பருவ கருகல் நோய்', 'முன் பருவ கருகல் நோய்', 'கருந்தண்டு அழுகல்', 'சொறி நோய் (Scab)']
  },
  {
    name: 'Cotton',
    nameTa: 'பருத்தி (Cotton)',
    category: 'Cash Crop / Fiber',
    categoryTa: 'பணப்பயிர் / இழை',
    icon: '🌿',
    regionalNames: 'Kapas, Rui / பருத்தி',
    identifiers: ['Palmately 3-to-5 lobed dark green leaves', 'Large cream or pale yellow flowers turning reddish-pink', 'Round/oval bolls opening to reveal white cotton fiber'],
    identifiersTa: ['3 முதல் 5 மடல்கள் கொண்ட கை போன்ற அகன்ற இலைகள்', 'வெளிறிய மஞ்சள் அல்லது கிரீம் நிற மலர்கள்', 'முதிர்ந்து வெடிக்கும் வெள்ளை பஞ்சு காய்கள்'],
    commonDiseases: ['Bacterial Blight (Angular Leaf Spot)', 'Fusarium Wilt', 'Alternaria Leaf Spot', 'Root Rot'],
    commonDiseasesTa: ['பாக்டீரியா கருகல் (கோண இலைப்புள்ளி)', 'வாடல் நோய்', 'ஆல்டர்னேரியா இலைப்புள்ளி', 'வேரழுகல் நோய்']
  },
  {
    name: 'Sugarcane',
    nameTa: 'கரும்பு (Sugarcane)',
    category: 'Cash Crop / Sugar',
    categoryTa: 'பணப்பயிர்',
    icon: '🎋',
    regionalNames: 'Ganna, Karumbu / கரும்பு',
    identifiers: ['Thick, fibrous, jointed stalks with clearly visible nodes and internodes', 'Long, linear, sword-like leaves with sharp serrated edges', 'Silky white arrow/feather tassel in reproductive stage'],
    identifiersTa: ['கணுக்கள் நிறைந்த தடிமனான சாறுள்ள தண்டு', 'நீண்ட வாள் போன்ற கூர்மையான விளிம்புடைய இலைகள்', 'பருவ காலத்தில் தோன்றும் வெண்பட்டு போன்ற பூங்கொத்து'],
    commonDiseases: ['Red Rot', 'Smut', 'Grassy Shoot Disease', 'Wilt'],
    commonDiseasesTa: ['செவ்வழுகல் நோய் (Red Rot)', 'கரிப்பூட்டை நோய்', 'புற்கட்டு நோய்', 'வாடல் நோய்']
  },
  {
    name: 'Chili / Pepper',
    nameTa: 'மிளகாய் (Chili / Pepper)',
    category: 'Vegetable / Spice',
    categoryTa: 'மசாலா / காய்கறி',
    icon: '🌶️',
    regionalNames: 'Mirchi, Capsicum / மிளகாய்',
    identifiers: ['Smooth, ovate-elliptic leaves with pointed tips', 'Small solitary white or greenish flowers', 'Pungent conical or blocky fruit turning from green to red'],
    identifiersTa: ['மென்மையான கூர்மையான முனைகள் கொண்ட இலைகள்', 'சிறிய தனித்த வெள்ளை மலர்கள்', 'காரத்தன்மை கொண்ட பச்சை முதல் சிவப்பு நிற காய்கள்'],
    commonDiseases: ['Anthracnose (Fruit Rot)', 'Chili Leaf Curl Virus', 'Powdery Mildew', 'Bacterial Wilt'],
    commonDiseasesTa: ['பழ அழுகல் (Anthracnose)', 'இலை சுருட்டு வைரஸ் நோய்', 'சாம்பல் நோய்', 'பாக்டீரியா வாடல்']
  },
  {
    name: 'Soybean',
    nameTa: 'சோயாபீன் (Soybean)',
    category: 'Legume / Oilseed',
    categoryTa: 'பயறு / எண்ணெய்வித்து',
    icon: '🌱',
    regionalNames: 'Bhat / சோயாபீன்',
    identifiers: ['Trifoliate leaves with oval leaflets covered in fine hairs', 'Small white or purple pea-like flowers in leaf axils', 'Hairy pods containing 2-4 protein-rich beans'],
    identifiersTa: ['ரோமங்கள் கொண்ட மூன்று சிற்றிலை அமைப்பு', 'இலைக் கோணங்களில் பூக்கும் சிறிய மலர்கள்', '2-4 விதைகளைக் கொண்ட ரோமம் நிறைந்த காய்கள்'],
    commonDiseases: ['Soybean Rust', 'Frogeye Leaf Spot', 'Charcoal Rot', 'Yellow Mosaic Virus'],
    commonDiseasesTa: ['சோயா துரு நோய்', 'தவளைக்கண் இலைப்புள்ளி', 'கரி அழுகல்', 'மஞ்சள் தேமல் நோய்']
  },
  {
    name: 'Groundnut (Peanut)',
    nameTa: 'நிலக்கடலை / வேர்க்கடலை (Groundnut)',
    category: 'Legume / Oilseed',
    categoryTa: 'எண்ணெய்வித்து',
    icon: '🥜',
    regionalNames: 'Mungfali, Kadalekai, Verkadalai / நிலக்கடலை',
    identifiers: ['Pinnate leaves with four oval leaflets (two pairs)', 'Yellow self-pollinating flowers on short stalks', 'Pegs that bury into soil to form underground pods'],
    identifiersTa: ['நான்கு சிற்றிலைகள் கொண்ட கூட்டிலை அமைப்பு', 'மஞ்சள் நிற சுய மகரந்த மலர்கள்', 'மண்ணில் இறங்கி காய்களை உருவாக்கும் விழுதுகள்'],
    commonDiseases: ['Tikka Disease (Leaf Spot)', 'Rust', 'Collar Rot', 'Rosette Virus'],
    commonDiseasesTa: ['திக்கா இலைப்புள்ளி நோய்', 'துரு நோய்', 'தண்டு அழுகல்', 'ரோஸெட் வைரஸ் நோய்']
  }
];

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
  navigate,
  t,
  lang
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
  t: typeof translations['en'];
  lang: Language;
}) { 
  const confidence = diagnosis?.confidence ?? 0; 
  const [showWebcam, setShowWebcam] = useState(false);
  const [imageFitMode, setImageFitMode] = useState<'contain' | 'cover'>('contain');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [showPlantGuide, setShowPlantGuide] = useState(false);
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
          <span className="eyebrow">{t.diagnosticTool}</span>
          <h2>{t.analysis}</h2>
          <p>{t.analysisSubtitle}</p>
        </div>
        <span className="model-badge"><i /> {t.aiReady}</span>
      </div>
      <section className="scan-layout">
        <div className="capture-panel">
          <div className="panel-top">
            <div>
              <span className="step">{t.step1Upload}</span>
              <h3>{t.imageInput}</h3>
            </div>
            <button className="small-icon" title="Upload image" onClick={() => uploadInputRef.current?.click()}>
              <Upload size={19} />
            </button>
          </div>

          <div className="crop-selector-bar">
            <div className="crop-selector-header">
              <div className="auto-detect-tag">
                <Sprout size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
                <span>{lang === 'ta' ? 'அனைத்து பயிர்களும் AI மூலம் தானாக கண்டறியப்படும்' : 'AI Auto-Detects Any Plant from Photo'}</span>
              </div>
              <button
                type="button"
                className="browse-plants-btn"
                onClick={() => setShowPlantGuide(true)}
                title="View plant identification guides and common crop diseases"
              >
                <BookOpen size={14} style={{ flexShrink: 0 }} />
                <span>{t.plantTypesGuide}</span>
              </button>
            </div>
            <div className="supported-crops-pills">
              <span className="crop-mini-pill">🌽 {lang === 'ta' ? 'மக்காச்சோளம்' : 'Maize'}</span>
              <span className="crop-mini-pill">🌾 {lang === 'ta' ? 'நெல்' : 'Rice'}</span>
              <span className="crop-mini-pill">🌾 {lang === 'ta' ? 'கம்பு' : 'Bajra'}</span>
              <span className="crop-mini-pill">🌾 {lang === 'ta' ? 'சோளம்' : 'Sorghum'}</span>
              <span className="crop-mini-pill">🌾 {lang === 'ta' ? 'கோதுமை' : 'Wheat'}</span>
              <span className="crop-mini-pill">🍅 {lang === 'ta' ? 'தக்காளி' : 'Tomato'}</span>
              <span className="crop-mini-pill">🥔 {lang === 'ta' ? 'உருளை' : 'Potato'}</span>
              <span className="crop-mini-pill">🌶️ {lang === 'ta' ? 'மிளகாய்' : 'Chili'}</span>
              <span className="crop-mini-pill">🌿 {lang === 'ta' ? 'பருத்தி' : 'Cotton'}</span>
              <span className="crop-mini-pill">🎋 {lang === 'ta' ? 'கரும்பு' : 'Sugarcane'}</span>
              <span className="crop-mini-pill">+ {lang === 'ta' ? 'அனைத்து பயிர்களும்' : 'All Plants'}</span>
            </div>
          </div>

          <div
            className={`dropzone ${isDragging ? 'dragging' : ''} ${imageUrl ? 'has-image' : ''}`}
            onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => { event.preventDefault(); setIsDragging(false); selectFile(event.dataTransfer.files?.[0]) }}
          >
            {imageUrl ? (
              <div className="image-preview-wrapper">
                <div className="image-view-toolbar" onClick={(e) => e.stopPropagation()}>
                  <div className="view-mode-pills">
                    <button
                      type="button"
                      className={`view-mode-pill ${imageFitMode === 'contain' ? 'active' : ''}`}
                      onClick={() => setImageFitMode('contain')}
                      title="Standard Fit: Full photo visible uncropped"
                    >
                      <Minimize2 size={12} /> {t.standardFit}
                    </button>
                    <button
                      type="button"
                      className={`view-mode-pill ${imageFitMode === 'cover' ? 'active' : ''}`}
                      onClick={() => setImageFitMode('cover')}
                      title="Fill Frame: Zooms to fill window"
                    >
                      <Maximize2 size={12} /> {t.fillFrame}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="view-fullscreen-btn"
                    onClick={() => { setIsLightboxOpen(true); setLightboxZoom(1); }}
                    title="Open full size inspector"
                  >
                    <ZoomIn size={13} /> {t.fullView}
                  </button>
                </div>
                <img
                  src={imageUrl}
                  alt="Selected crop leaf"
                  className={imageFitMode === 'cover' ? 'fill-mode' : 'contain-mode'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                    setLightboxZoom(1);
                  }}
                  title="Click to zoom / inspect photo in full size"
                />
                <div className="image-size-badge">
                  {imageFitMode === 'contain' ? t.standardAspectBadge : t.filledViewBadge}
                </div>
              </div>
            ) : (
              <div className="drop-content" onClick={() => uploadInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                <span className="upload-icon"><CloudUpload size={28} /></span>
                <strong>{t.dropPhotoHere}</strong>
                <span>{lang === 'ta' ? 'அல்லது ' : 'or '}<u>{t.browseFromDevice}</u></span>
                <small>{t.standardSizingNote}</small>
              </div>
            )}
            <input ref={uploadInputRef} type="file" accept="image/*" onChange={(event) => selectFile(event.target.files?.[0])} />
          </div>
          <div className="capture-footer">
            <div className="file-name">
              <FileText size={18} />
              <span>
                <strong>{file ? file.name : t.noImage}</strong>
                <small>{file ? (imageUrl ? t.standardPreviewReady : 'Ready') : t.waitingForPhoto}</small>
              </span>
            </div>
            <button className="camera" onClick={startCamera}>
              <Camera size={18} /> {t.takePhoto}
            </button>
            <input ref={cameraInputRef} className="hidden" type="file" accept="image/*" capture="environment" onChange={(event) => selectFile(event.target.files?.[0])} />
          </div>
        </div>
        <div className="result-panel">
          <div className="panel-top">
            <div>
              <span className="step">{t.step2Results}</span>
              <h3>{t.aiAnalysis}</h3>
            </div>
            <span className={`result-state ${status === 'analyzing' ? 'working' : ''}`}>
              <i />{status === 'analyzing' ? t.analyzing : diagnosis ? 'Done' : 'Waiting'}
            </span>
          </div>

          <div className="result-content">
            <div className="result-head">
              <div>
                <span className="muted-label">{t.diseaseFound}</span>
                <h4>{diagnosis?.disease ?? t.noScanYet}</h4>
              </div>
            </div>
            <div className="result-facts">
              <span>
                <small>{t.plantType.replace(':', '')}</small>
                <strong>
                  <Sprout size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', color: 'var(--green)' }} />
                  {diagnosis?.crop || '—'}
                </strong>
              </span>
              <span><small>{t.diagnosticAccuracy}</small><strong>{confidence ? `${confidence}%` : '—'}</strong></span>
            </div>
          </div>
          {file && (
            <button className="analyze" onClick={() => void analyze()} disabled={status === 'analyzing'}>
              {status === 'analyzing' ? <><LoaderCircle className="spin" size={20} /> {t.analyzing}</> : <><Stethoscope size={20} /> {t.analyzeImage}</>}
            </button>
          )}
          {error && <p className="error"><AlertTriangle size={18} /> {error}</p>}
          <div className="treatment">
            <div className="treatment-body">
              <strong>{t.identifiedIssue}</strong>
              <p>{diagnosis?.summary ?? t.uploadAndHitAnalyze}</p>
              <strong style={{marginTop: '16px', display: 'block'}}>{t.recommendedTreatment}</strong>
              <p>{diagnosis?.treatmentSteps?.[0] ?? diagnosis?.actions?.[0] ?? t.scanToGetTreatment}</p>
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
              {t.viewFullTreatmentPlan} <ArrowUpRight size={16} />
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

      {isLightboxOpen && imageUrl && (
        <div className="lightbox-overlay" onClick={() => { setIsLightboxOpen(false); setLightboxZoom(1); }}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <div className="lightbox-title">
                <Eye size={18} />
                <span>High-Resolution Photo Inspection ({file?.name || 'Photo'})</span>
              </div>
              <div className="lightbox-actions">
                <button
                  type="button"
                  className="zoom-btn"
                  onClick={() => setLightboxZoom((z) => Math.max(0.5, z - 0.25))}
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="zoom-level">{Math.round(lightboxZoom * 100)}%</span>
                <button
                  type="button"
                  className="zoom-btn"
                  onClick={() => setLightboxZoom((z) => Math.min(3, z + 0.25))}
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  className="zoom-reset-btn"
                  onClick={() => setLightboxZoom(1)}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="lightbox-close"
                  onClick={() => { setIsLightboxOpen(false); setLightboxZoom(1); }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="lightbox-body">
              <img
                src={imageUrl}
                alt="Full size crop photo"
                style={{ transform: `scale(${lightboxZoom})`, transition: 'transform 0.15s ease' }}
              />
            </div>
          </div>
        </div>
      )}

      {showPlantGuide && (
        <div className="plant-guide-overlay" onClick={() => setShowPlantGuide(false)}>
          <div className="plant-guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="plant-guide-header">
              <div className="plant-guide-title">
                <BookOpen size={22} className="guide-icon" style={{ color: 'var(--green)' }} />
                <div>
                  <h3>{t.plantTypesGuide}</h3>
                  <p>{t.guideSubtitle}</p>
                </div>
              </div>
              <button
                type="button"
                className="plant-guide-close"
                onClick={() => setShowPlantGuide(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="plant-guide-grid">
              {SUPPORTED_PLANTS.map((plant) => (
                <div key={plant.name} className="plant-card">
                  <div className="plant-card-head">
                    <span className="plant-card-icon">{plant.icon}</span>
                    <div className="plant-card-title-group">
                      <h4>{lang === 'ta' ? plant.nameTa : plant.name}</h4>
                      <div className="plant-card-meta">
                        <span className="plant-category-badge">{lang === 'ta' ? plant.categoryTa : plant.category}</span>
                        {plant.regionalNames && <span className="plant-regional">({plant.regionalNames})</span>}
                      </div>
                    </div>
                  </div>

                  <div className="plant-card-section">
                    <strong className="section-label">{t.visualIdLabel}</strong>
                    <ul className="marker-list">
                      {(lang === 'ta' ? plant.identifiersTa : plant.identifiers).map((id, idx) => (
                        <li key={idx}><span className="bullet">▪</span> {id}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="plant-card-section">
                    <strong className="section-label">{t.commonIssuesLabel}</strong>
                    <div className="disease-chips">
                      {(lang === 'ta' ? plant.commonDiseasesTa : plant.commonDiseases).map((d, idx) => (
                        <span key={idx} className="disease-chip">{d}</span>
                      ))}
                    </div>
                  </div>


                </div>
              ))}
            </div>
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
  onDeleteRecord,
  t
}: {
  records: DiagnosticRecord[];
  navigate: (page: Page) => void;
  onSelectRecord: (record: DiagnosticRecord) => void;
  onDeleteRecord: (id: string) => Promise<void>;
  t: typeof translations['en'];
}) {
  return (
    <section className="view-page">
      <span className="eyebrow">{t.yourRecords}</span>
      <h2>{t.history}</h2>
      <p>{t.historySubtitle}</p>
      {records.length === 0 ? (
        <div className="empty-state large">
          <History size={25} />
          <strong>{t.noRecordsYet}</strong>
          <span>{t.noHistoryDesc}</span>
          <button onClick={() => navigate('scan')}>{t.runAnalysis} <ArrowUpRight size={17} /></button>
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
                      background: 'var(--paper)'
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
                        {record.confidence}%<small>{t.diagnosticAccuracy}</small>
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(record.id)}
                        title={t.deleteRecord}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          background: 'rgba(221, 116, 65, 0.15)',
                          color: 'var(--orange)',
                          border: '1px solid rgba(221, 116, 65, 0.3)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} /> {t.deleteRecord}
                      </button>
                    </div>
                  </div>
                  <p className="record-summary">{record.summary}</p>
                  <button
                    className="text-button"
                    onClick={() => onSelectRecord(record)}
                    style={{ marginTop: '10px', padding: '6px 0' }}
                  >
                    {t.viewTreatmentAction} <ArrowUpRight size={14} />
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
  t
}: {
  diagnosis: Diagnosis | null;
  records: DiagnosticRecord[];
  selectedRecord: DiagnosticRecord | null;
  onSelectRecord: (record: DiagnosticRecord | null) => void;
  t: typeof translations['en'];
}) {
  const active = selectedRecord || diagnosis || records[0];
  const activeImg = active?.imageUrl;
  return (
    <section className="view-page">
      <span className="eyebrow">{t.plantHealth}</span>
      <h2>{t.treatment}</h2>
      <p>{t.treatmentSubtitle}</p>
      {records.length > 0 && (
        <div style={{ margin: '14px 0 20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}>{t.selectScannedPlant}</label>
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
                <span className="record-id">{t.stepsFor}</span>
                <h3>{active.disease}</h3>
                <p>{active.crop} · {t.riskLevel}: {active.severity} · {active.confidence}% {t.diagnosticAccuracy}</p>
              </div>
              <span className="protocol-status">{active.treatable ? t.treatableStatus : t.difficultStatus}</span>
            </div>
            {active.cause && (
              <section className="protocol-section">
                <h4>{t.whyHappened}</h4>
                <p style={{ color: 'var(--muted)', fontSize: '15px' }}>{active.cause}</p>
              </section>
            )}
            <section className="protocol-section">
              <h4>{t.recommendedActions}</h4>
              <ol>
                {(active.treatmentSteps || active.actions).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
            <section className="protocol-section">
              <h4>{t.organicSolutions}</h4>
              <ul>
                {(active.organic || ['No specific natural solutions found.']).map((org) => (
                  <li key={org}>{org}</li>
                ))}
              </ul>
            </section>
            <section className="protocol-section">
              <h4>{t.chemicalSolutions}</h4>
              <ul>
                {(active.medicines || ['No medicine suggested.']).map((medicine) => (
                  <li key={medicine}>{medicine}</li>
                ))}
              </ul>
              <p className="safety-note">
                <ShieldCheck size={15} /> {t.safetyWarning}
              </p>
            </section>
            <section className="protocol-section">
              <h4>{t.prevention}</h4>
              <ul>
                {(active.prevention || ['Keep checking new leaves.']).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
          <aside className="protocol-aside">
            {activeImg && (
              <div style={{
                width: '100%',
                maxHeight: '220px',
                borderRadius: '10px',
                marginBottom: '16px',
                border: '1px solid rgba(0,0,0,0.1)',
                background: '#0d1712',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <img
                  src={activeImg}
                  alt={active.disease}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '220px',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </div>
            )}
            <LeafyGreen size={21} />
            <strong>{t.aiDiagnosticNotes}</strong>
            <p>{active.summary}</p>
            <span>Photo: {active === diagnosis ? 'Current upload' : (records[0]?.fileName || 'Scanned photo')}</span>
          </aside>
        </div>
      ) : (
        <div className="empty-state large">
          <Stethoscope size={25} />
          <strong>{t.noActiveAnalysis}</strong>
          <span>{t.analyzeForTreatments}</span>
        </div>
      )}
    </section>
  )
}

function SettingsView({
  session,
  records,
  logout,
  t,
  lang,
  setLang
}: {
  session: Session;
  records: DiagnosticRecord[];
  logout: () => void;
  t: typeof translations['en'];
  lang: Language;
  setLang: (lang: Language) => void;
}) { 
  const [printMode, setPrintMode] = useState<'none' | 'all' | string>('none');
  useEffect(() => { if (printMode !== 'none') { window.print(); setTimeout(() => setPrintMode('none'), 1000); } }, [printMode]);
  return (
    <section className="view-page">
      <div className="print-hide">
        <span className="eyebrow">{t.settingsTitle.toUpperCase()}</span>
        <h2>{t.settingsTitle}</h2>
        <p>{t.settingsSubtitle}</p>
        <div className="settings-grid">
          {/* Language Preference Card */}
          <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
            <h3>🌐 {t.languagePreference}</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '14px' }}>
              {t.chooseLanguage}
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setLang('en');
                  localStorage.setItem('cropdoctor-lang', 'en');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: lang === 'en' ? '2px solid var(--green)' : '1px solid var(--line)',
                  background: lang === 'en' ? 'var(--green)' : 'var(--card)',
                  color: lang === 'en' ? 'white' : 'var(--ink)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.15s ease'
                }}
              >
                🇬🇧 English (Default) {lang === 'en' && <Check size={16} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLang('ta');
                  localStorage.setItem('cropdoctor-lang', 'ta');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: lang === 'ta' ? '2px solid var(--green)' : '1px solid var(--line)',
                  background: lang === 'ta' ? 'var(--green)' : 'var(--card)',
                  color: lang === 'ta' ? 'white' : 'var(--ink)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.15s ease'
                }}
              >
                🇮🇳 தமிழ் (Tamil) {lang === 'ta' && <Check size={16} />}
              </button>
            </div>
          </div>

          <div className="settings-card">
            <h3>{t.profileCard}</h3>
            <label>{t.farmerName}<input value={session.name} readOnly /></label>
            <label>{t.emailAddress}<input value={session.email} readOnly /></label>
            <div style={{ marginTop: '15px', padding: '12px', background: 'var(--paper)', borderRadius: '7px', fontSize: '13px', color: 'var(--ink)', border: '1px solid var(--line)' }}>
              <strong>{t.savedRecordsCount}:</strong> {records.length} {lang === 'ta' ? 'ஆய்வு அறிக்கைகள் சேமிக்கப்பட்டுள்ளன.' : `scan ${records.length === 1 ? 'report' : 'reports'} saved for this account.`}
            </div>
            <button 
              type="button" 
              onClick={logout} 
              style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(221, 116, 65, 0.15)', color: 'var(--orange)', border: '1px solid rgba(221, 116, 65, 0.3)', borderRadius: '7px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}
            >
              <LogOut size={16} /> {t.signOutSwitch}
            </button>
          </div>
          <div className="settings-card">
            <h3>{t.exportPdf}</h3>
            <p style={{ marginBottom: '18px', color: 'var(--muted)', fontSize: '15px' }}>{t.exportPdfDesc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                className="primary-button" 
                onClick={() => setPrintMode('all')} 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px', justifyContent: 'center', background: 'var(--lime)', color: 'var(--ink)', border: 'none', borderRadius: '7px', fontWeight: 'bold' }}
              >
                <FileText size={17} /> {t.downloadAllPdf}
              </button>
              <select 
                style={{ width: '100%', padding: '12px', borderRadius: '7px', border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--ink)' }} 
                onChange={(e) => { if (e.target.value) { setPrintMode(e.target.value); e.target.value = ''; } }} 
                defaultValue=""
              >
                <option value="" disabled>{t.downloadSpecificPdf}</option>
                {records.map(r => <option key={r.id} value={r.id}>{r.crop} - {r.disease} ({r.date})</option>)}
              </select>
            </div>
            <p className="settings-note" style={{ marginTop: '15px' }}><AlertTriangle size={17} /> {t.pdfEngineNote}</p>
          </div>
        </div>
      </div>
      {printMode !== 'none' && (
        <div className="print-only">
          <h1>Crop Doctor - {lang === 'ta' ? 'பயிர் மருத்துவ அறிக்கை' : 'Diagnostic Report'}</h1>
          <p>{lang === 'ta' ? 'அறிக்கை உருவாக்கப்பட்ட தேதி' : 'Report generated on'} {new Date().toLocaleDateString()} for {session.name} ({session.email})</p>
          <hr style={{ marginBottom: '30px' }} />
          {records.filter(r => printMode === 'all' || r.id === printMode).map((record) => (
            <div key={record.id} style={{ pageBreakAfter: 'always', marginBottom: '40px' }}>
              <h2 style={{ color: 'var(--green)', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                {record.crop} - {record.disease}
              </h2>

              {record.imageUrl && (
                <div style={{ margin: '14px 0 16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#555', margin: '0 0 6px 0' }}>{lang === 'ta' ? 'ஆய்வு செய்யப்பட்ட இலை புகைப்படம்:' : 'Scanned Leaf Photo:'}</p>
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
                <span><strong>{lang === 'ta' ? 'தேதி' : 'Date'}:</strong> {record.date}</span>
                <span><strong>{t.diagnosticAccuracy}:</strong> {record.confidence}%</span>
                <span><strong>{t.riskLevel}:</strong> {record.severity || 'Unknown'}</span>
                <span><strong>{lang === 'ta' ? 'குணப்படுத்தல்' : 'Treatable'}:</strong> {record.treatable ? t.treatableStatus : t.difficultStatus}</span>
              </div>
              <div style={{ marginTop: '20px' }}>
                <h3>{lang === 'ta' ? 'ஆய்வு சுருக்கம்' : 'Diagnosis Summary'}</h3>
                <p>{record.summary}</p>
                {record.cause && <p><strong>{lang === 'ta' ? 'காரணம்' : 'Cause'}:</strong> {record.cause}</p>}
              </div>
              <div style={{ marginTop: '20px' }}>
                <h3>{t.actionSteps}</h3>
                <ul style={{ paddingLeft: '20px' }}>
                  {(record.treatmentSteps || record.actions || []).map((step: string) => (
                    <li key={step} style={{ marginBottom: '5px' }}>{step}</li>
                  ))}
                </ul>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div>
                  <h3>{t.chemicalSolutions}</h3>
                  <ul style={{ paddingLeft: '20px' }}>
                    {(record.medicines || ['None specified']).map((m: string) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>{t.organicSolutions}</h3>
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



