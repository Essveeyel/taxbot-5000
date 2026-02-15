import { useEffect, useMemo, useRef, useState } from 'react'
import taxbotEvil from './assets/images/taxbotEvil.png'
import taxbotNice from './assets/images/taxbotNice.png'
import './App.css'

function App() {
  const defaultWelcomeMessage =
    'Welcome to Taxbot-5000. Type anything to begin the scripted conversation.'
  const defaultThemeTransitionMs = 9000
  const [initialStep, setInitialStep] = useState({
    text: defaultWelcomeMessage,
    evil: false,
  })
  const [scriptedResponses, setScriptedResponses] = useState([
    { text: 'Hello! I am Taxbot-5000. Let\'s walk through your taxes.', evil: false },
    { text: 'Great. First, can you confirm your employment status?', evil: false },
    { text: 'Thanks. Next, gather your income statements (W-2, 1099, etc.).', evil: true },
    { text: 'Perfect. We are now moving to deductions and credits.', evil: true },
  ])
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: initialStep.text,
    },
  ])
  const [tagline, setTagline] = useState('Fast, friendly tax guidance for every filer.')
  const [userInput, setUserInput] = useState('')
  const [scriptIndex, setScriptIndex] = useState(0)
  const [currentStage, setCurrentStage] = useState(0)
  const [typingTheme, setTypingTheme] = useState(null)
  const [themeTransitionMs, setThemeTransitionMs] = useState(defaultThemeTransitionMs)
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const [isTaxbotTyping, setIsTaxbotTyping] = useState(false)
  const [scriptTransferMessage, setScriptTransferMessage] = useState('')
  const replyTimeoutRef = useRef(null)
  const wordIntervalRef = useRef(null)
  const themeShiftTimeoutRef = useRef(null)
  const importInputRef = useRef(null)
  const messagesContainerRef = useRef(null)

  const scrollMessagesToBottom = () => {
    const container = messagesContainerRef.current

    if (!container) {
      return
    }

    container.scrollTop = container.scrollHeight
  }

  const usableScript = useMemo(
    () =>
      scriptedResponses
        .map((step) => ({ text: step.text.trim(), evil: step.evil }))
        .filter((step) => step.text.length > 0),
    [scriptedResponses],
  )

  const isEvilTheme = useMemo(() => {
    if (typeof typingTheme === 'boolean') {
      return typingTheme
    }

    if (currentStage === 0) {
      return initialStep.evil
    }

    return Boolean(usableScript[currentStage - 1]?.evil)
  }, [currentStage, initialStep.evil, usableScript, typingTheme])

  const updateScriptLine = (index, value) => {
    setScriptedResponses((prev) =>
      prev.map((line, lineIndex) =>
        lineIndex === index ? { ...line, text: value } : line,
      ),
    )
  }

  const updateScriptEvil = (index, value) => {
    setScriptedResponses((prev) =>
      prev.map((line, lineIndex) =>
        lineIndex === index ? { ...line, evil: value } : line,
      ),
    )
  }

  const addScriptLine = () => {
    setScriptedResponses((prev) => [...prev, { text: '', evil: false }])
  }

  const removeScriptLine = (index) => {
    setScriptedResponses((prev) => prev.filter((_, lineIndex) => lineIndex !== index))
    setScriptIndex((prev) => Math.max(0, Math.min(prev, usableScript.length - 1)))
  }

  const stopTypingTimers = () => {
    if (replyTimeoutRef.current) {
      clearTimeout(replyTimeoutRef.current)
      replyTimeoutRef.current = null
    }

    if (wordIntervalRef.current) {
      clearInterval(wordIntervalRef.current)
      wordIntervalRef.current = null
    }

    if (themeShiftTimeoutRef.current) {
      clearTimeout(themeShiftTimeoutRef.current)
      themeShiftTimeoutRef.current = null
    }
  }

  const resetConversation = () => {
    stopTypingTimers()

    setMessages([
      {
        role: 'assistant',
        content: initialStep.text.trim() || defaultWelcomeMessage,
      },
    ])
    setUserInput('')
    setScriptIndex(0)
    setCurrentStage(0)
    setTypingTheme(null)
    setThemeTransitionMs(defaultThemeTransitionMs)
    setIsTaxbotTyping(false)
  }

  useEffect(() => {
    return () => {
      stopTypingTimers()
    }
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollMessagesToBottom()
    })
  }, [messages, isTaxbotTyping])

  useEffect(() => {
    setMessages((prev) => {
      if (
        prev.length === 1 &&
        prev[0].role === 'assistant' &&
        scriptIndex === 0 &&
        !isTaxbotTyping
      ) {
        return [
          {
            role: 'assistant',
            content:
              initialStep.text.trim() || defaultWelcomeMessage,
          },
        ]
      }

      return prev
    })
  }, [initialStep.text, scriptIndex, isTaxbotTyping])

  const handleSend = () => {
    const trimmedInput = userInput.trim()

    if (!trimmedInput || isTaxbotTyping) {
      return
    }

    const scriptedReply = usableScript[scriptIndex] ?? {
      text: 'The scripted flow is complete. Add more script steps to continue.',
      evil: false,
    }

    setMessages((prev) => [...prev, { role: 'user', content: trimmedInput }])
    setIsTaxbotTyping(true)

    if (scriptIndex < usableScript.length) {
      setScriptIndex((prev) => prev + 1)
    }

    if (replyTimeoutRef.current) {
      clearTimeout(replyTimeoutRef.current)
      replyTimeoutRef.current = null
    }

    if (wordIntervalRef.current) {
      clearInterval(wordIntervalRef.current)
      wordIntervalRef.current = null
    }

    const replyWords = scriptedReply.text.split(/\s+/).filter(Boolean)
    const typingDurationMs = Math.max(replyWords.length * 120, 2400)
    const themeTransitionDurationMs = Math.max(replyWords.length * 220, 7000)

    replyTimeoutRef.current = setTimeout(() => {
      setThemeTransitionMs(themeTransitionDurationMs)

      const transitionKickoffDelayMs = Math.max(
        Math.min(Math.floor(typingDurationMs * 0.45), typingDurationMs - 400),
        250,
      )

      themeShiftTimeoutRef.current = setTimeout(() => {
        setTypingTheme(scriptedReply.evil)
        themeShiftTimeoutRef.current = null
      }, transitionKickoffDelayMs)

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      if (replyWords.length === 0) {
        setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: scriptedReply.text }])
        setCurrentStage((prev) => Math.min(prev + 1, usableScript.length))
        setTypingTheme(null)
        setIsTaxbotTyping(false)
        replyTimeoutRef.current = null
        return
      }

      let wordCursor = 0

      wordIntervalRef.current = setInterval(() => {
        wordCursor += 1
        const partialReply = replyWords.slice(0, wordCursor).join(' ')

        setMessages((prev) => {
          if (!prev.length) {
            return prev
          }

          const next = [...prev]
          const lastIndex = next.length - 1

          if (next[lastIndex]?.role === 'assistant') {
            next[lastIndex] = { ...next[lastIndex], content: partialReply }
          }

          return next
        })

        if (wordCursor >= replyWords.length) {
          clearInterval(wordIntervalRef.current)
          wordIntervalRef.current = null
          setCurrentStage((prev) => Math.min(prev + 1, usableScript.length))
          setTypingTheme(null)
          setIsTaxbotTyping(false)
        }
      }, 120)

      replyTimeoutRef.current = null
    }, 700)

    setUserInput('')
  }

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const handleExportScript = () => {
    const scriptPayload = {
      version: 1,
      tagline,
      initialStep,
      steps: scriptedResponses,
    }

    const blob = new Blob([JSON.stringify(scriptPayload, null, 2)], {
      type: 'application/json',
    })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = 'taxbot-script.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(downloadUrl)
    setScriptTransferMessage('Script exported as taxbot-script.json')
  }

  const normalizeScriptStep = (step) => {
    if (typeof step === 'string') {
      return { text: step, evil: false }
    }

    if (step && typeof step === 'object') {
      return {
        text: typeof step.text === 'string' ? step.text : '',
        evil: Boolean(step.evil),
      }
    }

    return null
  }

  const handleImportScript = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const rawFile = await file.text()
      const parsed = JSON.parse(rawFile)

      const importedInitialRaw = parsed?.initialStep
      const importedInitialStep =
        typeof importedInitialRaw === 'string'
          ? { text: importedInitialRaw, evil: false }
          : normalizeScriptStep(importedInitialRaw)

      const importedStepsRaw =
        Array.isArray(parsed) ? parsed : parsed?.steps ?? parsed?.scriptedResponses ?? parsed?.script

      if (!Array.isArray(importedStepsRaw)) {
        throw new Error('Missing steps array')
      }

      const importedSteps = importedStepsRaw
        .map((step) => normalizeScriptStep(step))
        .filter((step) => Boolean(step))

      if (importedSteps.length === 0) {
        throw new Error('No valid script steps found')
      }

      const nextInitialStep = importedInitialStep ?? { text: defaultWelcomeMessage, evil: false }

      setTagline(typeof parsed?.tagline === 'string' ? parsed.tagline : tagline)
      setInitialStep(nextInitialStep)
      setScriptedResponses(importedSteps)

      stopTypingTimers()
      setMessages([
        {
          role: 'assistant',
          content: nextInitialStep.text.trim() || defaultWelcomeMessage,
        },
      ])
      setUserInput('')
      setScriptIndex(0)
      setCurrentStage(0)
      setTypingTheme(null)
      setThemeTransitionMs(defaultThemeTransitionMs)
      setIsTaxbotTyping(false)
      setScriptTransferMessage(`Imported script from ${file.name}`)
    } catch {
      setScriptTransferMessage('Import failed. Please use a valid JSON script file.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div
      className={`app-shell ${isSidebarVisible ? '' : 'sidebar-hidden'} ${isEvilTheme ? 'evil-mode' : ''}`}
      style={{ '--theme-transition-ms': `${themeTransitionMs}ms` }}
    >
      <button
        type="button"
        className="sidebar-icon-toggle"
        onClick={() => setIsSidebarVisible((prev) => !prev)}
        aria-label={isSidebarVisible ? 'Hide script panel' : 'Show script panel'}
        title={isSidebarVisible ? 'Hide script panel' : 'Show script panel'}
      >
        {isSidebarVisible ? '◀' : '▶'}
      </button>

      <aside className="script-panel" aria-hidden={!isSidebarVisible}>
        <div className="script-panel-header">
          <h1>Taxbot-5000</h1>
          <p>Script Builder</p>
          <label htmlFor="chat-tagline">Chat Tagline</label>
          <input
            id="chat-tagline"
            type="text"
            value={tagline}
            onChange={(event) => setTagline(event.target.value)}
            placeholder="Enter predetermined tagline"
          />
          {scriptTransferMessage && <p className="script-transfer-message">{scriptTransferMessage}</p>}
        </div>

        <div className="script-list">
          <div className="script-item">
            <div className="step-title-row">
              <label htmlFor="script-step-0">Step 0 (Initial message)</label>
              <label className="evil-toggle" htmlFor="script-evil-0">
                <input
                  id="script-evil-0"
                  type="checkbox"
                  checked={initialStep.evil}
                  onChange={(event) =>
                    setInitialStep((prev) => ({ ...prev, evil: event.target.checked }))
                  }
                />
                Evil?
              </label>
            </div>
            <textarea
              id="script-step-0"
              value={initialStep.text}
              onChange={(event) =>
                setInitialStep((prev) => ({ ...prev, text: event.target.value }))
              }
              placeholder="Enter the initial assistant message shown before user input"
              rows={3}
            />
          </div>

          {scriptedResponses.map((response, index) => (
            <div className="script-item" key={index}>
              <div className="step-title-row">
                <label htmlFor={`script-step-${index}`}>Step {index + 1}</label>
                <label className="evil-toggle" htmlFor={`script-evil-${index + 1}`}>
                  <input
                    id={`script-evil-${index + 1}`}
                    type="checkbox"
                    checked={response.evil}
                    onChange={(event) => updateScriptEvil(index, event.target.checked)}
                  />
                  Evil?
                </label>
              </div>
              <textarea
                id={`script-step-${index}`}
                value={response.text}
                onChange={(event) => updateScriptLine(index, event.target.value)}
                placeholder="Enter scripted assistant response"
                rows={3}
              />
              <button
                type="button"
                className="ghost-button"
                onClick={() => removeScriptLine(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="script-actions">
          <button type="button" onClick={addScriptLine}>
            Add Step
          </button>
          <button type="button" className="ghost-button" onClick={resetConversation}>
            Reset Chat
          </button>
          <button type="button" className="ghost-button" onClick={handleExportScript}>
            Export Script
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => importInputRef.current?.click()}
          >
            Import Script
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="file-input-hidden"
            onChange={handleImportScript}
          />
        </div>
      </aside>

      <main className="chat-panel">
        <header className="chat-header">
          <div className="chat-identity">
            <img src={isEvilTheme ? taxbotEvil : taxbotNice} alt="Taxbot status" />
            <div>
              <h2>Taxbot-5000 Assistant</h2>
              <p>{tagline.trim() || 'Fast, friendly tax guidance for every filer.'}</p>
            </div>
          </div>
        </header>

        <section className="messages" aria-live="polite" ref={messagesContainerRef}>
          <div className="messages-track">
            {messages.map((message, index) => (
              <article key={`${message.role}-${index}`} className={`message message-${message.role}`}>
                <p>{message.content}</p>
              </article>
            ))}
            {isTaxbotTyping && (
              <article className="message message-assistant message-typing" aria-label="Taxbot is typing">
                <p>Taxbot-5000 is typing…</p>
              </article>
            )}
          </div>
        </section>

        <footer className="composer">
          <textarea
            value={userInput}
            onChange={(event) => setUserInput(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type anything — Taxbot-5000 is here to help."
            rows={2}
            disabled={isTaxbotTyping}
          />
          <button type="button" onClick={handleSend} disabled={isTaxbotTyping}>
            {isTaxbotTyping ? 'Waiting…' : 'Send'}
          </button>
        </footer>
      </main>
    </div>
  )
}

export default App
