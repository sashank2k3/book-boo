import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAllThreads } from '../hooks/useDiscussions'
import { USERS } from '../lib/constants'
import styles from './ThreadsPage.module.css'

const ANCHOR_TYPES = ['all', 'word', 'phrase', 'sentence', 'paragraph', 'page', 'chapter']

export default function ThreadsPage() {
  const navigate = useNavigate()
  const { threads, loading } = useAllThreads()
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all'
    ? threads
    : threads.filter(t => t.anchor_type === filter)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')} aria-label="Back">
          ←
        </button>
        <h1 className={styles.title}>All Discussions</h1>
        <div style={{ width: 36 }} />
      </header>

      {/* Filter pills */}
      <div className={styles.filterRow}>
        {ANCHOR_TYPES.map(type => (
          <button
            key={type}
            className={`${styles.filterPill} ${filter === type ? styles.filterPillActive : ''}`}
            onClick={() => setFilter(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Thread list */}
      <div className={styles.list}>
        {loading ? (
          <div className={styles.empty}>Loading discussions...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            No {filter !== 'all' ? filter : ''} discussions yet.
          </div>
        ) : (
          filtered.map(thread => {
            const author = USERS[thread.created_by]
            const replyCount = thread.replies?.[0]?.count ?? 0
            return (
              <div
                key={thread.id}
                className={styles.card}
                onClick={() => navigate(`/read?page=${thread.page_number}&thread=${thread.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/read?page=${thread.page_number}&thread=${thread.id}`)}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.author} style={{ color: author?.color }}>
                    {author?.avatar} {author?.name}
                  </span>
                  <div className={styles.cardMeta}>
                    <span className={styles.anchorBadge}>{thread.anchor_type}</span>
                    <span className={styles.pagePill}>p.{thread.page_number}</span>
                  </div>
                </div>

                {thread.selected_text ? (
                  <blockquote className={styles.quote}>
                    "{thread.selected_text.slice(0, 120)}
                    {thread.selected_text.length > 120 ? '…' : ''}"
                  </blockquote>
                ) : (
                  <p className={styles.pageNote}>Comment on page {thread.page_number}</p>
                )}

                <div className={styles.cardFooter}>
                  <span className={styles.replyCount}>
                    {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                  </span>
                  <span className={styles.timestamp}>
                    {new Date(thread.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
