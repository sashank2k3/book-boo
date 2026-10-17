import React, { useState, useRef, useEffect } from 'react'
import { USERS } from '../lib/constants'
import styles from './ThreadPanel.module.css'

export default function ThreadPanel({
  threads,
  activeThread,
  setActiveThread,
  username,
  currentPage,
  onClose,
  onPostReply,
  onNewThread,
}) {
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const active = threads.find(t => t.id === activeThread) || threads[0] || null

  useEffect(() => {
    if (active && !activeThread) setActiveThread(active.id)
  }, [active, activeThread, setActiveThread])

  // Scroll to bottom when active thread changes or new reply arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active?.replies?.length])

  const handleSend = async () => {
    if (!replyText.trim() || !active) return
    setSending(true)
    try {
      await onPostReply({ threadId: active.id, content: replyText.trim(), username })
      setReplyText('')
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={styles.overlay}>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.sheet}>
        {/* Drag handle */}
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.pageLabel}>Page {currentPage}</span>
            <span className={styles.threadCount}>
              {threads.length} {threads.length === 1 ? 'thread' : 'threads'}
            </span>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.newBtn} onClick={onNewThread}>
              + New
            </button>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {threads.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No discussions on this page yet.</p>
            <button className={styles.startBtn} onClick={onNewThread}>
              Start a discussion
            </button>
          </div>
        ) : (
          <div className={styles.body}>
            {/* Thread selector tabs */}
            {threads.length > 1 && (
              <div className={styles.threadTabs}>
                {threads.map((t, i) => (
                  <button
                    key={t.id}
                    className={`${styles.threadTab} ${t.id === active?.id ? styles.threadTabActive : ''}`}
                    onClick={() => setActiveThread(t.id)}
                  >
                    {t.anchor_type === 'page' ? `📄 Page note` : `"${t.selected_text?.slice(0,20)}…"`}
                  </button>
                ))}
              </div>
            )}

            {/* Active thread */}
            {active && (
              <>
                {/* Quoted text */}
                {active.selected_text && (
                  <div className={styles.quotedText}>
                    <span className={styles.quoteIcon}>❝</span>
                    <p>{active.selected_text}</p>
                  </div>
                )}

                {/* Messages */}
                <div className={styles.messages}>
                  {active.replies?.map(reply => {
                    const author = USERS[reply.created_by]
                    const isMe = reply.created_by === username
                    return (
                      <div
                        key={reply.id}
                        className={`${styles.message} ${isMe ? styles.messageMe : styles.messageThem}`}
                      >
                        {!isMe && (
                          <span className={styles.msgAvatar}>{author?.avatar}</span>
                        )}
                        <div className={styles.msgContent}>
                          {!isMe && (
                            <span className={styles.msgName} style={{ color: author?.color }}>
                              {author?.name}
                            </span>
                          )}
                          <div
                            className={styles.msgBubble}
                            style={isMe ? { background: USERS[username]?.color || 'var(--accent)' } : {}}
                          >
                            {reply.content}
                          </div>
                          <span className={styles.msgTime}>
                            {new Date(reply.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply input */}
                <div className={styles.replyBar}>
                  <textarea
                    ref={textareaRef}
                    className={styles.replyInput}
                    placeholder="Add to the discussion…"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    style={{
                      height: Math.min(120, Math.max(40, replyText.split('\n').length * 20 + 20)) + 'px'
                    }}
                  />
                  <button
                    className={styles.sendBtn}
                    onClick={handleSend}
                    disabled={!replyText.trim() || sending}
                    style={{ background: USERS[username]?.color || 'var(--accent)' }}
                    aria-label="Send"
                  >
                    {sending ? '…' : '↑'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
