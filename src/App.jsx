import { useEffect, useMemo, useRef, useState } from 'react'
import taxbotEvil from './assets/images/taxbotEvil.png'
import taxbotNice from './assets/images/taxbotNice.png'
import './App.css'

function App() {
  const [initialStep, setInitialStep] = useState({
    text: 'Welcome to Taxbot-5000. Type anything to begin the scripted conversation.',
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
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const [isTaxbotTyping, setIsTaxbotTyping] = useState(false)
  const replyTimeoutRef = useRef(null)
  const wordIntervalRef = useRef(null)

  const usableScript = useMemo(
    () =>
      scriptedResponses
        .map((step) => ({ text: step.text.trim(), evil: step.evil }))
        .filter((step) => step.text.length > 0),
    [scriptedResponses],
  )

  const isEvilTheme = useMemo(() => {
    if (currentStage === 0) {
      return initialStep.evil
    }

    return Boolean(usableScript[currentStage - 1]?.evil)
  }, [currentStage, initialStep.evil, usableScript])

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

  const resetConversation = () => {
    if (replyTimeoutRef.current) {
      clearTimeout(replyTimeoutRef.current)
      replyTimeoutRef.current = null
    }

    if (wordIntervalRef.current) {
      clearInterval(wordIntervalRef.current)
      wordIntervalRef.current = null
    }

    setMessages([
      {
        role: 'assistant',
        content:
          initialStep.text.trim() ||
          'Welcome to Taxbot-5000. Type anything to begin the scripted conversation.',
      },
    ])
    setUserInput('')
    setScriptIndex(0)
    setCurrentStage(0)
    setIsTaxbotTyping(false)
  }

  useEffect(() => {
    return () => {
      if (replyTimeoutRef.current) {
        clearTimeout(replyTimeoutRef.current)
      }

      if (wordIntervalRef.current) {
        clearInterval(wordIntervalRef.current)
      }
    }
  }, [])

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
              initialStep.text.trim() ||
              'Welcome to Taxbot-5000. Type anything to begin the scripted conversation.',
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

    replyTimeoutRef.current = setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      if (replyWords.length === 0) {
        setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: scriptedReply.text }])
        setCurrentStage((prev) => Math.min(prev + 1, usableScript.length))
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

  return (
    <div
      className={`app-shell ${isSidebarVisible ? '' : 'sidebar-hidden'} ${isEvilTheme ? 'evil-mode' : ''}`}
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

        <section className="messages" aria-live="polite">
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
