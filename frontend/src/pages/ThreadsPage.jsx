import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAllThreads } from '../hooks/useDiscussions'
import { USERS } from '../lib/constants'
import Avatar from '../components/Avatar'
import styles from './ThreadsPage.module.css'

export default function ThreadsPage() {
  const navigate = useNavigate()
  const { threads, loading } = useAllThreads()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')} aria-label="Back">
          ←
        </button>
        <h1 className={styles.title}>All Discussions</h1>
        <div style={{ width: 36 }} />
      </header>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.empty}>Loading discussions...</div>
        ) : threads.length === 0 ? (
          <div className={styles.empty}>No discussions yet.</div>
        ) : (
          threads.map(thread => {
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
                  <div className={styles.authorRow}>
                    <Avatar username={thread.created_by} size="sm" />
                    <span className={styles.author} style={{ color: author?.color }}>
                      {author?.name}
                    </span>
                  </div>
                  <span className={styles.pagePill}>p.{thread.page_number}</span>
                </div>

                {thread.selected_text ? (
                  <blockquote className={styles.quote}>
                    "{thread.selected_text.slice(0, 120)}
                    {thread.selected_text.length > 120 ? '…' : ''}"
                  </blockquote>
                ) : (
                  <p className={styles.pageNote}>Note on page {thread.page_number}</p>
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
