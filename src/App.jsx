import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

const AUTH_TOKEN_KEY = 'aiecp-admin-token'
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'password123'
const CLASS_TABLE = 'class_reviews'
const PROGRAM_TABLE = 'program_reviews'

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

function currentToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

function setToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

function clearToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

function isAuthenticated() {
  return currentToken() === btoa(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`)
}

function loginWithCredentials(email, password) {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    setToken(btoa(`${email}:${password}`))
    return true
  }
  return false
}

function downloadFile(data, filename, type = 'application/json') {
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

function getDateOnly(dateString) {
  return dateString.split('T')[0]
}

function isToday(dateString) {
  return getDateOnly(dateString) === getDateOnly(new Date().toISOString())
}

function exportReports(reviews, section, reportType) {
  let filtered = reviews
  if (reportType === 'daily') {
    filtered = reviews.filter((r) => isToday(r.submitted_at))
  }

  if (!filtered.length) {
    return null
  }

  const headers =
    section === 'class'
      ? ['id', 'student', 'topic', 'rating', 'comments', 'suggestions', 'submitted_at']
      : ['id', 'student', 'favoriteFeatures', 'favoriteTopic', 'dreamClass', 'overallComments', 'submitted_at']

  const rows = filtered.map((item) =>
    headers
      .map((field) => {
        const value = item[field] ?? ''
        return `"${String(value).replace(/"/g, '""')}"`
      })
      .join(',')
  )

  const csv = [headers.join(','), ...rows].join('\n')
  const title = `${section}-${reportType}-reports`

  return {
    json: () => downloadFile(JSON.stringify(filtered, null, 2), `${title}-${Date.now()}.json`, 'application/json'),
    csv: () => downloadFile(csv, `${title}-${Date.now()}.csv`, 'text/csv')
  }
}

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AdminDashboard({ classReviews, programReviews, onLogout, onClearSection }) {
  const navigate = useNavigate()

  const dailyClassReviews = classReviews.filter((r) => isToday(r.submitted_at))
  const dailyProgramReviews = programReviews.filter((r) => isToday(r.submitted_at))

  const renderReviewCards = (reviews) => {
    if (!reviews.length) {
      return <p className="empty-message">No reviews yet.</p>
    }

    return (
      <div className="reviews-grid">
        {reviews.map((item) => (
          <article key={item.id} className="review-card">
            <div className="review-header">
              <strong>{item.student}</strong>
              {item.rating && <span>{item.rating} / 5</span>}
            </div>
            {item.topic && <p className="meta">Topic: {item.topic}</p>}
            {item.comments && <p>{item.comments}</p>}
            {item.favoriteFeatures && <p className="meta">Enjoyed: {item.favoriteFeatures}</p>}
            {item.favoriteTopic && <p>Interest topic: {item.favoriteTopic}</p>}
            {item.dreamClass && <p>Future cohort wish: {item.dreamClass}</p>}
            {item.suggestions && <p className="suggestions">Suggestions: {item.suggestions}</p>}
            {item.overallComments && <p className="suggestions">Comments: {item.overallComments}</p>}
            <time className="submitted-at">{new Date(item.submitted_at).toLocaleString()}</time>
          </article>
        ))}
      </div>
    )
  }

  return (
    <div className="page-shell">
      <main className="card">
        <header>
          <h1>Admin Dashboard</h1>
          <p>Protected review management UI for AIECP. View, export, and manage daily and overall reports.</p>
        </header>

        <div className="admin-actions">
          <button
            className="secondary-button danger"
            onClick={() => {
              onLogout()
              navigate('/login')
            }}
          >
            Logout
          </button>
        </div>

        <section className="review-list">
          <div className="admin-review-header">
            <div>
              <h2>Today's class reviews ({dailyClassReviews.length})</h2>
              <p>Class feedback submitted today.</p>
            </div>
            <div className="admin-review-actions">
              <button className="secondary-button" onClick={() => exportReports(classReviews, 'class', 'daily')?.json()}>
                Daily JSON
              </button>
              <button className="secondary-button" onClick={() => exportReports(classReviews, 'class', 'daily')?.csv()}>
                Daily CSV
              </button>
              <button className="secondary-button" onClick={() => exportReports(classReviews, 'class', 'overall')?.json()}>
                Overall JSON
              </button>
              <button className="secondary-button" onClick={() => exportReports(classReviews, 'class', 'overall')?.csv()}>
                Overall CSV
              </button>
            </div>
          </div>
          {renderReviewCards(dailyClassReviews)}
        </section>

        <section className="review-list">
          <div className="admin-review-header">
            <div>
              <h2>All class reviews ({classReviews.length})</h2>
              <p>All class feedback.</p>
            </div>
          </div>
          {renderReviewCards(classReviews)}
        </section>

        <section className="review-list admin-program-section">
          <div className="admin-review-header">
            <div>
              <h2>Today's program reviews ({dailyProgramReviews.length})</h2>
              <p>Program feedback submitted today.</p>
            </div>
            <div className="admin-review-actions">
              <button className="secondary-button" onClick={() => exportReports(programReviews, 'program', 'daily')?.json()}>
                Daily JSON
              </button>
              <button className="secondary-button" onClick={() => exportReports(programReviews, 'program', 'daily')?.csv()}>
                Daily CSV
              </button>
              <button className="secondary-button" onClick={() => exportReports(programReviews, 'program', 'overall')?.json()}>
                Overall JSON
              </button>
              <button className="secondary-button" onClick={() => exportReports(programReviews, 'program', 'overall')?.csv()}>
                Overall CSV
              </button>
            </div>
          </div>
          {renderReviewCards(dailyProgramReviews)}
        </section>

        <section className="review-list">
          <div className="admin-review-header">
            <div>
              <h2>All program reviews ({programReviews.length})</h2>
              <p>All program feedback.</p>
            </div>
          </div>
          {renderReviewCards(programReviews)}
        </section>

        <section className="review-list">
          <div className="admin-review-header">
            <div>
              <h2>Clear all data</h2>
              <p>Permanently delete all feedback from the database.</p>
            </div>
            <div className="admin-review-actions">
              <button className="secondary-button danger" onClick={() => onClearSection('class')}>
                Clear all class reviews
              </button>
              <button className="secondary-button danger" onClick={() => onClearSection('program')}>
                Clear all program reviews
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (loginWithCredentials(email.trim(), password)) {
      navigate('/admin')
      return
    }
    setError('Incorrect admin email or password.')
  }

  return (
    <div className="page-shell">
      <main className="card">
        <header>
          <h1>Admin Login</h1>
          <p>Enter admin credentials to access review exports and the protected dashboard.</p>
        </header>

        <form onSubmit={handleSubmit} className="feedback-form">
          <label>
            Admin email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your admin password"
              required
            />
          </label>

          <button type="submit" className="primary-button">
            Login
          </button>
          {error && <div className="status-message">{error}</div>}
        </form>
      </main>
    </div>
  )
}

function FeedbackPage({ setClassReviews, setProgramReviews }) {
  const [activeTab, setActiveTab] = useState('class')
  const [classReview, setClassReview] = useState(defaultClassReview)
  const [programReview, setProgramReview] = useState(defaultProgramReview)
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    } else {
      setProgramReview((current) => ({ ...current, [name]: value }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) {
      setStatus('Please complete all required fields for this form.')
      return
    }

    setIsSubmitting(true)
    const payload = {
      ...(activeTab === 'class' ? classReview : programReview),
      submitted_at: new Date().toISOString()
    }

    const table = activeTab === 'class' ? CLASS_TABLE : PROGRAM_TABLE
    const { data, error } = await supabase.from(table).insert([payload]).select()

    setIsSubmitting(false)

    if (error) {
      setStatus('Unable to save feedback. Please try again.')
      console.error(error)
      return
    }

    if (activeTab === 'class') {
      setClassReview(defaultClassReview)
      setClassReviews((current) => [data[0], ...current])
    } else {
      setProgramReview(defaultProgramReview)
      setProgramReviews((current) => [data[0], ...current])
    }

    setStatus('Feedback saved successfully. Thank you!')
  }

  return (
    <div className="page-shell">
      <main className="card">
        <header>
          <h1>AIECP Feedback</h1>
          <p>Submit student feedback for the class or the overall program. Feedback is stored securely.</p>
        </header>

        <div className="tabs">
          <button
            type="button"
            className={`tab-button ${activeTab === 'class' ? 'active' : ''}`}
            onClick={() => setActiveTab('class')}
          >
            Class Feedback
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'program' ? 'active' : ''}`}
            onClick={() => setActiveTab('program')}
          >
            Program Feedback
          </button>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          <label>
            Student name
            <input
              type="text"
              name="student"
              value={activeTab === 'class' ? classReview.student : programReview.student}
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
                  placeholder="Which topics did you really enjoy or want to explore further?"
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
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save feedback'}
            </button>
          </div>

          {status && <div className="status-message">{status}</div>}
        </form>
      </main>
    </div>
  )
}

function App() {
  const [classReviews, setClassReviews] = useState([])
  const [programReviews, setProgramReviews] = useState([])

  useEffect(() => {
    const fetchReviews = async () => {
      const classResponse = await supabase
        .from(CLASS_TABLE)
        .select('*')
        .order('submitted_at', { ascending: false })
      if (!classResponse.error) {
        setClassReviews(classResponse.data || [])
      }

      const programResponse = await supabase
        .from(PROGRAM_TABLE)
        .select('*')
        .order('submitted_at', { ascending: false })
      if (!programResponse.error) {
        setProgramReviews(programResponse.data || [])
      }
    }

    fetchReviews()
  }, [])

  const handleLogout = () => {
    clearToken()
  }

  const handleClearSection = async (section) => {
    const table = section === 'class' ? CLASS_TABLE : PROGRAM_TABLE
    if (window.confirm(`Delete all ${section} reviews? This cannot be undone.`)) {
      const { error } = await supabase.from(table).delete().neq('id', '')
      if (!error) {
        if (section === 'class') {
          setClassReviews([])
        } else {
          setProgramReviews([])
        }
      } else {
        console.error(error)
      }
    }
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <FeedbackPage
              setClassReviews={setClassReviews}
              setProgramReviews={setProgramReviews}
            />
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard
                classReviews={classReviews}
                programReviews={programReviews}
                onLogout={handleLogout}
                onClearSection={handleClearSection}
              />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
