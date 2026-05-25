import { useState } from 'react'
import './App.css'

const tasks = [
  {
    id: 'predict',
    title: 'Sentiment Prediction',
    endpoint: 'http://127.0.0.1:8000/predict'
  },
  {
    id: 'generate',
    title: 'Text Generation',
    endpoint: 'http://127.0.0.1:8000/generate'
  },
  {
    id: 'classification',
    title: 'Zero-Shot Classification',
    endpoint: 'http://127.0.0.1:8000/classification'
  }
]

function App() {
  const [activeTaskId, setActiveTaskId] = useState(tasks[0].id)
  const [inputText, setInputText] = useState('')
  const [labelsText, setLabelsText] = useState('positive, negative, neutral')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const activeTask = tasks.find((task) => task.id === activeTaskId)

  const formatOutput = (taskId, data) => {
    if (taskId === 'predict') {
      if (data && typeof data === 'object' && 'label' in data) return data.label
      return String(data)
    }

    if (taskId === 'generate') {
      if (data && typeof data === 'object') {
        if ('generated_text' in data) return data.generated_text
        if ('text' in data) return data.text
      }
      return String(data)
    }

    if (taskId === 'classification') {
      if (data && typeof data === 'object' && Array.isArray(data.labels) && data.labels.length > 0) {
        return data.labels[0]
      }
      return String(data)
    }

    return String(data)
  }

  const runTask = async () => {
    if (!inputText.trim()) {
      setResult({ type: 'error', data: 'Please enter input text.' })
      return
    }
    setLoading(true)
    setResult({ type: 'info', data: 'Running...' })

    try {
      let body = { text: inputText }
      if (activeTask.id === 'classification') {
        const labels = labelsText
          .split(',')
          .map((label) => label.trim())
          .filter(Boolean)

        if (!labels.length) {
          setResult({ type: 'error', data: 'Please enter at least one label.' })
          setLoading(false)
          return
        }
        body = { text: inputText, labels }
      }

      const response = await fetch(activeTask.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const rawText = await response.text()
      let data

      try {
        data = JSON.parse(rawText)
      } catch {
        data = rawText
      }

      if (!response.ok) {
        throw new Error(
          typeof data === 'string' ? data : JSON.stringify(data, null, 2)
        )
      }

      setResult({ type: 'success', data: formatOutput(activeTask.id, data) })
    } catch (error) {
      setResult({ type: 'error', data: error.message || 'Request failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>AI Service Dashboard</h1>
        <p>Select a task, enter input text, and view the output.</p>
      </header>

      <section className="task-picker">
        {tasks.map((task) => (
          <button
            key={task.id}
            className={`task-button ${activeTaskId === task.id ? 'active' : ''}`}
            onClick={() => setActiveTaskId(task.id)}
          >
            {task.title}
          </button>
        ))}
      </section>

      <section className="task-card">
        <h2>Current Task: {activeTask.title}</h2>
        <label htmlFor="inputText">Input</label>
        <textarea
          id="inputText"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={7}
          placeholder="Type your text here..."
        />
        {activeTask.id === 'classification' && (
          <>
            <label htmlFor="labelsText">Labels (comma separated)</label>
            <input
              id="labelsText"
              type="text"
              value={labelsText}
              onChange={(e) => setLabelsText(e.target.value)}
              placeholder="sports, politics, technology"
            />
          </>
        )}
        <button onClick={runTask} disabled={loading}>
          {loading ? 'Running...' : 'Run Task'}
        </button>
        <div className={`result ${result?.type || ''}`}>
          <strong>Output</strong>
          <pre>
            {result ? result.data : 'No output yet'}
          </pre>
        </div>
      </section>
    </main>
  )
}

export default App
