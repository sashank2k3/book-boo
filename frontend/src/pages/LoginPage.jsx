import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { USERS } from '../lib/constants'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const [selected, setSelected] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, user } = useAuth()
  const navigate = useNavigate()

  // Already logged in — redirect
  React.useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!selected) return
    setError('')
    setLoading(true)
    try {
      await signIn(selected, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError('Wrong password. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Background decoration */}
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />

      <div className={styles.card}>
        {/* Book icon */}
        <div className={styles.bookIcon}>📖</div>

        <h1 className={styles.title}>Book Boo</h1>
        <p className={styles.subtitle}>The Alchemist</p>
        <p className={styles.byline}>by Paulo Coelho</p>

        <p className={styles.prompt}>Who are you?</p>

        {/* User selector */}
        <div className={styles.userRow}>
          {Object.values(USERS).map(u => (
            <button
              key={u.id}
              className={`${styles.userBtn} ${selected === u.id ? styles.userBtnActive : ''}`}
              style={selected === u.id ? { '--user-color': u.color } : {}}
              onClick={() => { setSelected(u.id); setError('') }}
              type="button"
            >
              <span className={styles.userAvatar}>{u.avatar}</span>
              <span className={styles.userName}>{u.name}</span>
            </button>
          ))}
        </div>

        {/* Password form — only shown after selecting */}
        {selected && (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.inputWrapper}>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={styles.input}
                autoFocus
                required
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || !password}
              style={{ '--user-color': USERS[selected].color }}
            >
              {loading ? 'Opening book...' : `Continue as ${USERS[selected].name}`}
            </button>
          </form>
        )}

        <p className={styles.footer}>
          Your login is saved. You won't need to do this again.
        </p>
      </div>
    </div>
  )
}
