import React, { useState } from 'react'
import { USERS } from '../lib/constants'
import Avatar from './Avatar'
import styles from './NewThreadModal.module.css'

export default function NewThreadModal({
  selectedText,
  pageNumber,
  username,
  onSubmit,
  onClose,
}) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const me = USERS[username]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    try {
      await onSubmit({ selectedText, anchorType: 'page', firstMessage: message.trim() })
    } catch (err) {
      console.error(err)
      setSending(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <h2 className={styles.title}>New Discussion</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Selected text preview */}
        {selectedText && (
          <div className={styles.preview}>
            <span className={styles.previewIcon}>❝</span>
            <p className={styles.previewText}>
              {selectedText.slice(0, 150)}
              {selectedText.length > 150 ? '…' : ''}
            </p>
          </div>
        )}

        <div className={styles.pageBadge}>Page {pageNumber}</div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputRow}>
            <Avatar username={username} size="md" style={{ marginTop: 6 }} />
            <textarea
              className={styles.textarea}
              placeholder="What's on your mind?"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            style={{ background: me?.color }}
            disabled={!message.trim() || sending}
          >
            {sending ? 'Starting discussion…' : 'Start discussion'}
          </button>
        </form>
      </div>
    </div>
  )
}
