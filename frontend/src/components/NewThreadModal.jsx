import React, { useState } from 'react'
import { USERS } from '../lib/constants'
import styles from './NewThreadModal.module.css'

const ANCHOR_OPTIONS = [
  { value: 'word',      label: '🔤 Word', desc: 'A specific word' },
  { value: 'phrase',    label: '📝 Phrase', desc: 'A short phrase' },
  { value: 'sentence',  label: '💬 Sentence', desc: 'A full sentence' },
  { value: 'paragraph', label: '📋 Paragraph', desc: 'A whole paragraph' },
  { value: 'page',      label: '📄 Page', desc: 'This whole page' },
  { value: 'chapter',   label: '📖 Chapter', desc: 'About a chapter' },
]

export default function NewThreadModal({
  selectedText,
  anchorType: initialAnchorType,
  pageNumber,
  username,
  onSubmit,
  onClose,
}) {
  const [anchorType, setAnchorType] = useState(initialAnchorType || 'page')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const me = USERS[username]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    try {
      await onSubmit({ selectedText, anchorType, firstMessage: message.trim() })
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
          {/* Anchor type selector */}
          <div className={styles.anchorSection}>
            <label className={styles.label}>This is about a…</label>
            <div className={styles.anchorGrid}>
              {ANCHOR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.anchorOpt} ${anchorType === opt.value ? styles.anchorOptActive : ''}`}
                  onClick={() => setAnchorType(opt.value)}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className={styles.messageSection}>
            <label className={styles.label}>Your thought</label>
            <div className={styles.inputRow}>
              <span className={styles.avatar}>{me?.avatar}</span>
              <textarea
                className={styles.textarea}
                placeholder="What's on your mind?"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                autoFocus
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            style={{ background: me?.color || 'var(--accent)' }}
            disabled={!message.trim() || sending}
          >
            {sending ? 'Starting discussion…' : 'Start discussion'}
          </button>
        </form>
      </div>
    </div>
  )
}
