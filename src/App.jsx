
import { useState, useEffect } from 'react'
import './App.css'

const API_URL = 'http://localhost:5000/api/feedback'

function App() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  useEffect(() => {
  async function loadFeedback() {
    try {
      const response = await fetch(API_URL)
      if (!response.ok) throw new Error('Could not load feedback')

      const data = await response.json()

      const grouped = data.reduce((result, item) => {
        let course = result.find(
          (entry) => entry.name === item.courseName
        )

        if (!course) {
          course = {
            id: item.courseId,
            name: item.courseName,
            duration: item.courseDuration,
            feedback: [],
          }
          result.push(course)
        }

        course.feedback.push({
          id: item._id,
          comments: item.comments,
          rating: item.rating,
        })

        return result
      }, [])

      setCourses(grouped)
      setApiError('')
    } catch (error) {
      setApiError('Could not load data. Check that the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  loadFeedback()
}, [])
  const [page, setPage] = useState('dashboard')
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [editingFeedback, setEditingFeedback] = useState(null)
  const [form, setForm] = useState({
    courseName: '',
    courseDuration: '',
    comments: '',
    rating: '5',
  })

  const selectedCourse = courses.find(
    (course) => course.id === selectedCourseId
  )

  const allFeedback = courses.flatMap((course) =>
    course.feedback.map((item) => ({ ...item, courseId: course.id }))
  )

  const averageRating = allFeedback.length
    ? (
        allFeedback.reduce((sum, item) => sum + item.rating, 0) /
        allFeedback.length
      ).toFixed(1)
    : '0.0'

  function openCourse(courseId) {
    setSelectedCourseId(courseId)
    setEditingFeedback(null)
    setPage('course')
  }

  function openAddFeedback() {
    setEditingFeedback(null)
    setForm({ courseName: '', comments: '', rating: '5' })
    setPage('add')
  }

  function editFeedback(course, item) {
    setSelectedCourseId(course.id)
    setEditingFeedback({ ...item, courseId: course.id })
    setForm({
      courseName: course.name,
      comments: item.comments,
      rating: String(item.rating),
    })
    setPage('add')
  }

  
async function deleteFeedback(courseId, feedbackId) {
  const confirmed = window.confirm(
    'Are you sure you want to delete this feedback?'
  )

  if (!confirmed) return

  try {
    const response = await fetch(`${API_URL}/${feedbackId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Could not delete feedback')
    }

    setCourses((previousCourses) =>
      previousCourses
        .map((course) => ({
          ...course,
          feedback: course.feedback.filter(
            (item) => item.id !== feedbackId
          ),
        }))
        .filter((course) => course.feedback.length > 0)
    )

    setApiError('')
  } catch (error) {
    alert('Could not delete feedback. Please check that your backend is running.')
  }
}

  
async function handleSubmit(event) {
  event.preventDefault()

  const courseName = form.courseName.trim()
  const comments = form.comments.trim()
  const rating = Number(form.rating)

  if (!courseName || !comments || rating < 1 || rating > 5) {
    alert('Please fill in all fields and choose a rating from 1 to 5.')
    return
  }

  const existingCourse = courses.find(
    (course) => course.name.toLowerCase() === courseName.toLowerCase()
  )

  const courseId = existingCourse?.id || `CRS${Date.now()}`
  const courseDuration = form.courseDuration.trim()

  const feedbackData = {
    courseId,
    courseName,
    courseDuration,
    comments,
    rating,
  }

  try {
    const url = editingFeedback
      ? `${API_URL}/${editingFeedback.id}`
      : API_URL

    const response = await fetch(url, {
      method: editingFeedback ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData),
    })

    if (!response.ok) {
      throw new Error('Could not save feedback')
    }

    const savedFeedback = await response.json()

    setCourses((previousCourses) => {
      const updatedCourses = previousCourses.map((course) => ({
        ...course,
        feedback: [...course.feedback],
      }))

      let course = updatedCourses.find(
        (item) => item.name === savedFeedback.courseName
      )

      if (!course) {
        course = {
          id: savedFeedback.courseId,
          name: savedFeedback.courseName,
          duration: savedFeedback.courseDuration,
          feedback: [],
        }
        updatedCourses.push(course)
      }
      course.duration = savedFeedback.courseDuration

      const savedItem = {
        id: savedFeedback._id,
        comments: savedFeedback.comments,
        rating: savedFeedback.rating,
      }

      if (editingFeedback) {
        course.feedback = course.feedback.map((item) =>
          item.id === editingFeedback.id ? savedItem : item
        )
      } else {
        course.feedback.push(savedItem)
      }

      return updatedCourses
    })

    setForm({
        courseName: '',
        courseDuration: '',
        comments: '',
        rating: '5',
      })
    setEditingFeedback(null)
    setApiError('')
    setPage('dashboard')
  } catch (error) {
    alert('Could not save feedback. Please check that your backend is running.')
  }
}


  function renderStars(rating) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  function courseAverage(course) {
    if (!course.feedback.length) return '—'
    const total = course.feedback.reduce((sum, item) => sum + item.rating, 0)
    return (total / course.feedback.length).toFixed(1)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">F</span>
          <h2>Feedback Hub</h2>
        </div>

        <p className="nav-label">WORKSPACE</p>
        <nav>
          <button
            className={`nav-link ${page === 'dashboard' ? 'active' : ''}`}
            onClick={() => setPage('dashboard')}
          >
            <span>▦</span> Dashboard
          </button>

          <button
            className={`nav-link ${page === 'add' ? 'active' : ''}`}
            onClick={openAddFeedback}
          >
            <span>＋</span> Add Feedback
          </button>
        </nav>

        <div className="sidebar-note">
          <span>✦</span>
          <p>Every opinion helps us grow.</p>
        </div>
      </aside>

      <main className="main-content">
        {loading && <p>Loading feedback...</p>}
        {apiError && <p role="alert">{apiError}</p>}
        <header className="topbar">
          <div>
            <p className="eyebrow">FEEDBACK MANAGEMENT</p>
            <h1>
              {page === 'dashboard'
                ? 'Dashboard'
                : page === 'course'
                  ? 'Course Feedback'
                  : editingFeedback
                    ? 'Update Feedback'
                    : 'Add Feedback'}
            </h1>
            <p className="subtitle">
              {page === 'dashboard'
                ? 'Your course feedback at a glance.'
                : page === 'course'
                  ? 'Review feedback and course performance.'
                  : 'Share your thoughts about a course.'}
            </p>
          </div>

          {page !== 'add' && (
            <button className="primary-button" onClick={openAddFeedback}>
              + Add Feedback
            </button>
          )}
        </header>

        {page === 'dashboard' && (
          <>
            <section className="stats">
              <article className="stat-card">
                <div className="stat-icon">▤</div>
                <span>Total Courses</span>
                <h2>{courses.length}</h2>
                <p>Courses in your workspace</p>
              </article>

              <article className="stat-card">
                <div className="stat-icon">☷</div>
                <span>Feedback Entries</span>
                <h2>{allFeedback.length}</h2>
                <p>Feedback received so far</p>
              </article>

              <article className="stat-card">
                <div className="stat-icon">★</div>
                <span>Average Rating</span>
                <h2>{averageRating} <small>/ 5</small></h2>
                <p>Across all feedback entries</p>
              </article>
            </section>

            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>Courses</h2>
                  <p className="subtitle">
                    Select a course to explore its feedback.
                  </p>
                </div>
                <span className="count-badge">{courses.length} courses</span>
              </div>

              <div className="course-list">
                {courses.map((course) => (
                  <button
                    className="course-item"
                    key={course.id}
                    onClick={() => openCourse(course.id)}
                  >
                    <span className="course-icon">▤</span>
                    <span className="course-info">
                      <strong>{course.name}</strong>
                      <small>
                        {course.feedback.length} feedback entr
                        {course.feedback.length === 1 ? 'y' : 'ies'}
                      </small>
                    </span>
                    <span className="course-rating">
                      ★ {courseAverage(course)}
                    </span>
                    <span className="chevron">›</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {page === 'course' && selectedCourse && (
          <>
            <button
              className="back-button"
              onClick={() => setPage('dashboard')}
            >
              ← Back to Dashboard
            </button>

            <section className="course-summary panel">
              <div>
                <p className="eyebrow">{selectedCourse.id}</p>
                <h2>{selectedCourse.name}</h2>
                <p className="subtitle">
                  Duration: {selectedCourse.duration}
                </p>
              </div>
              <div className="overall-rating">
                <span>Overall Rating</span>
                <strong>★ {courseAverage(selectedCourse)}</strong>
                <small>out of 5</small>
              </div>
            </section>

            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>Feedback Entries</h2>
                  <p className="subtitle">
                    {selectedCourse.feedback.length} entries for this course.
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => {
                    setEditingFeedback(null)
                    setForm({
                      courseName: selectedCourse.name,
                      comments: '',
                      rating: '5',
                    })
                    setPage('add')
                  }}
                >
                  + Add Entry
                </button>
              </div>

              {selectedCourse.feedback.length === 0 ? (
                <p className="empty-state">No feedback yet for this course.</p>
              ) : (
                <div className="feedback-list">
                  {selectedCourse.feedback.map((item) => (
                    <article className="feedback-item" key={item.id}>
                      <div className="feedback-top">
                        <span className="stars">
                          {renderStars(item.rating)}
                        </span>
                        <span className="rating-label">
                          {item.rating}/5
                        </span>
                      </div>
                      <p>{item.comments}</p>
                      <div className="feedback-actions">
                        <button
                          className="small-button"
                          onClick={() => editFeedback(selectedCourse, item)}
                        >
                          Update
                        </button>
                        <button
                          className="delete-button"
                          onClick={() =>
                            deleteFeedback(selectedCourse.id, item.id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {page === 'add' && (
          <section className="panel form-panel">
            <h2>{editingFeedback ? 'Update Feedback' : 'New Feedback Entry'}</h2>
            <p className="subtitle">
              {editingFeedback
                ? 'Make changes to this feedback entry.'
                : 'Tell us about your learning experience.'}
            </p>

            <form onSubmit={handleSubmit}>
              <label>
                Course Name
                <input
                  value={form.courseName}
                  onChange={(event) =>
                    setForm({ ...form, courseName: event.target.value })
                  }
                  placeholder="Enter course name"
                  list="course-options"
                  required
                />
                <datalist id="course-options">
                  {courses.map((course) => (
                    <option key={course.id} value={course.name} />
                  ))}
                </datalist>
              </label>
              
              <label>
                Course Duration
                <input
                  value={form.courseDuration || ''}
                  onChange={(event) =>
                    setForm({ ...form, courseDuration: event.target.value })
                  }
                 placeholder="e.g. 8 weeks"
                required
                />
              </label>


              <label>
                Feedback Comments
                <textarea
                  value={form.comments}
                  onChange={(event) =>
                    setForm({ ...form, comments: event.target.value })
                  }
                  placeholder="Write your comments..."
                  rows="5"
                  required
                />
              </label>

              <label>
                Feedback Rating
                <select
                  value={form.rating}
                  onChange={(event) =>
                    setForm({ ...form, rating: event.target.value })
                  }
                  required
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Very Good</option>
                  <option value="3">3 - Good</option>
                  <option value="2">2 - Fair</option>
                  <option value="1">1 - Poor</option>
                </select>
              </label>

              <div className="form-actions">
                <button type="submit" className="primary-button">
                  {editingFeedback ? 'Save Changes' : 'Submit Feedback'}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setEditingFeedback(null)
                    setPage(selectedCourseId ? 'course' : 'dashboard')
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
