import { useEffect, useMemo, useState } from 'react'

const CLASS_STORAGE_KEY = 'aiecp-class-feedback'
const PROGRAM_STORAGE_KEY = 'aiecp-program-feedback'

const defaultClassReview = {
  student: '',
  topic: '',
  rating: '5',
  comments: '',
  suggestions: ''
}

const defaultProgramReview = {
  student: '',
  favoriteFeatures: '',
  favoriteTopic: '',
  dreamClass: '',
  overallComments: ''
}

const tabs = [
  { key: 'class', label: 'AIECP Class Feedback' },
  { key: 'program', label: 'AIECP Program Feedback' }
]

function App() {
  const [activeTab, setActiveTab] = useState('class')
  const [classReview, setClassReview] = useState(defaultClassReview)
  const [programReview, setProgramReview] = useState(defaultProgramReview)
  const [classReviews, setClassReviews] = useState([])
  const [programReviews, setProgramReviews] = useState([])
  const [status, setStatus] = useState('')

  useEffect(() => {
    const classStored = localStorage.getItem(CLASS_STORAGE_KEY)
    const programStored = localStorage.getItem(PROGRAM_STORAGE_KEY)

    if (classStored) {
      try {
        setClassReviews(JSON.parse(classStored))
      } catch (error) {
        console.error('Failed to parse class reviews', error)
      }
    }

    if (programStored) {
      try {
        setProgramReviews(JSON.parse(programStored))
      } catch (error) {
        console.error('Failed to parse program reviews', error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(CLASS_STORAGE_KEY, JSON.stringify(classReviews))
  }, [classReviews])

  useEffect(() => {
    localStorage.setItem(PROGRAM_STORAGE_KEY, JSON.stringify(programReviews))
  }, [programReviews])

  const currentReview = activeTab === 'class' ? classReview : programReview
  const currentReviews = activeTab === 'class' ? classReviews : programReviews

  const canSubmit = useMemo(() => {
    if (activeTab === 'class') {
      return classReview.student.trim() && classReview.topic.trim() && classReview.comments.trim()
    }

    return (
      programReview.student.trim() &&
      programReview.favoriteFeatures.trim() &&
      programReview.favoriteTopic.trim() &&
      programReview.dreamClass.trim()
    )
  }, [activeTab, classReview, programReview])

  const handleChange = (event) => {
    const { name, value } = event.target

    if (activeTab === 'class') {
      setClassReview((current) => ({ ...current, [name]: value }))
      return
    }

    setProgramReview((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!canSubmit) {
      setStatus('Please complete all required fields for this form.')
      return
    }

    const reviewPayload = {
      ...currentReview,
      id: Date.now(),
      submittedAt: new Date().toLocaleString()
    }

    if (activeTab === 'class') {
      setClassReviews([reviewPayload, ...classReviews])
      setClassReview(defaultClassReview)
    } else {
      setProgramReviews([reviewPayload, ...programReviews])
      setProgramReview(defaultProgramReview)
    }

    setStatus('Feedback saved locally. Thank you!')
  }

  const downloadFile = (data, filename, type = 'application/json') => {
    const blob = new Blob([data], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const exportJSON = () => {
    if (!currentReviews || currentReviews.length === 0) {
      setStatus('No reviews to export.')
      return
    }

    downloadFile(
      JSON.stringify(currentReviews, null, 2),
      `${activeTab === 'class' ? 'class' : 'program'}-reviews-${Date.now()}.json`,
      'application/json'
    )
    setStatus('Exported reviews as JSON.')
  }

  const exportCSV = () => {
    if (!currentReviews || currentReviews.length === 0) {
      setStatus('No reviews to export.')
      return
    }

    const headers =
      activeTab === 'class'
        ? ['id', 'student', 'topic', 'rating', 'comments', 'suggestions', 'submittedAt']
        : ['id', 'student', 'favoriteFeatures', 'favoriteTopic', 'dreamClass', 'overallComments', 'submittedAt']

    const rows = currentReviews.map((review) =>
      headers
        .map((field) => {
          const val = review[field] ?? ''
          return `"${String(val).replace(/"/g, '""')}"`
        })
        .join(',')
    )

    const csv = [headers.join(','), ...rows].join('\n')
    downloadFile(csv, `${activeTab === 'class' ? 'class' : 'program'}-reviews-${Date.now()}.csv`, 'text/csv')
    setStatus('Exported reviews as CSV.')
  }

  const clearAll = () => {
    if (!window.confirm('Clear all saved reviews for this section? This cannot be undone.')) return

    if (activeTab === 'class') {
      setClassReviews([])
    } else {
      setProgramReviews([])
    }

    setStatus('All saved reviews cleared.')
  }

  return (
    <div className="page-shell">
      <main className="card">
        <header>
          <h1>AIECP Feedback</h1>
          <p>Choose the feedback section below and share your experience for the class or the full program.</p>
        </header>

        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section className="feedback-section">
          <h2>{activeTab === 'class' ? 'AIECP Class Feedback' : 'AIECP Program Feedback'}</h2>
          <p>
            {activeTab === 'class'
              ? 'Share what you liked about today’s class, the topic, and suggestions for improvement.'
              : 'Tell us what parts of the program you enjoyed, which topics sparked your interest, and what you would love in a future cohort.'}
          </p>

          <form onSubmit={handleSubmit} className="feedback-form">
            <label>
              Student name
              <input
                type="text"
                name="student"
                value={currentReview.student}
                onChange={handleChange}
                placeholder="e.g. John Smith"
                required
              />
            </label>

            {activeTab === 'class' ? (
              <>
                <label>
                  Class topic
                  <input
                    type="text"
                    name="topic"
                    value={classReview.topic}
                    onChange={handleChange}
                    placeholder="e.g. React fundamentals"
                    required
                  />
                </label>

                <label>
                  Rating
                  <select name="rating" value={classReview.rating} onChange={handleChange}>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Very good</option>
                    <option value="3">3 - Good</option>
                    <option value="2">2 - Fair</option>
                    <option value="1">1 - Needs improvement</option>
                  </select>
                </label>

                <label>
                  Comments
                  <textarea
                    name="comments"
                    value={classReview.comments}
                    onChange={handleChange}
                    placeholder="What did you like or dislike about the class?"
                    rows="4"
                    required
                  />
                </label>

                <label>
                  Suggestions for improvement
                  <textarea
                    name="suggestions"
                    value={classReview.suggestions}
                    onChange={handleChange}
                    placeholder="How can the next class be better?"
                    rows="3"
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Features you enjoyed most
                  <textarea
                    name="favoriteFeatures"
                    value={programReview.favoriteFeatures}
                    onChange={handleChange}
                    placeholder="What features of the program did you enjoy most?"
                    rows="3"
                    required
                  />
                </label>

                <label>
                  Topics that sparked your interest
                  <textarea
                    name="favoriteTopic"
                    value={programReview.favoriteTopic}
                    onChange={handleChange}
                    placeholder="Which class topics did you really enjoy or want to explore further?"
                    rows="3"
                    required
                  />
                </label>

                <label>
                  What you would love in a new cohort
                  <textarea
                    name="dreamClass"
                    value={programReview.dreamClass}
                    onChange={handleChange}
                    placeholder="What would you love to see as part of a future cohort?"
                    rows="3"
                    required
                  />
                </label>

                <label>
                  Overall comments
                  <textarea
                    name="overallComments"
                    value={programReview.overallComments}
                    onChange={handleChange}
                    placeholder="Any other feedback about the program."
                    rows="4"
                  />
                </label>
              </>
            )}

            <div className="form-actions">
              <button type="submit" className="primary-button">Save feedback locally</button>

              <div className="export-actions">
                <button type="button" className="secondary-button" onClick={exportJSON}>
                  Export JSON
                </button>
                <button type="button" className="secondary-button" onClick={exportCSV}>
                  Export CSV
                </button>
                <button type="button" className="secondary-button danger" onClick={clearAll}>
                  Clear all
                </button>
              </div>
            </div>

            {status && <div className="status-message">{status}</div>}
          </form>
        </section>

        <section className="review-list">
          <h2>{activeTab === 'class' ? 'Saved class reviews' : 'Saved program reviews'}</h2>
          {currentReviews.length === 0 ? (
            <p className="empty-message">No reviews saved yet.</p>
          ) : (
            <div className="reviews-grid">
              {currentReviews.map((item) => (
                <article key={item.id} className="review-card">
                  <div className="review-header">
                    <strong>{item.student}</strong>
                    {activeTab === 'class' ? <span>{item.rating} / 5</span> : null}
                  </div>

                  {activeTab === 'class' ? (
                    <>
                      <p className="meta">Topic: {item.topic}</p>
                      <p>{item.comments}</p>
                      {item.suggestions && <p className="suggestions">Suggestions: {item.suggestions}</p>}
                    </>
                  ) : (
                    <>
                      <p className="meta">Enjoyed features: {item.favoriteFeatures}</p>
                      <p>Interest topic: {item.favoriteTopic}</p>
                      <p>Future cohort wish: {item.dreamClass}</p>
                      {item.overallComments && <p className="suggestions">Comments: {item.overallComments}</p>}
                    </>
                  )}

                  <time className="submitted-at">{item.submittedAt}</time>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
