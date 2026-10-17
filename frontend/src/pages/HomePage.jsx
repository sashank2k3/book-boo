import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAllThreads } from '../hooks/useDiscussions'
import { USERS, BOOK } from '../lib/constants'
import styles from './HomePage.module.css'

export default function HomePage() {
  const { username, signOut } = useAuth()
  const { threads, loading } = useAllThreads()
  const navigate = useNavigate()

  const me = USERS[username]
  const other = Object.values(USERS).find(u => u.id !== username)

  const recentThreads = threads.slice(0, 5)

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>📖</span>
          <div>
            <div className={styles.bookTitle}>{BOOK.title}</div>
            <div className={styles.bookAuthor}>by {BOOK.author}</div>
          </div>
        </div>
        <button className={styles.signOutBtn} onClick={signOut} aria-label="Sign out">
          ↩
        </button>
      </header>

      {/* Welcome */}
      <section className={styles.welcome}>
        <div className={styles.greeting}>
          Hey {me?.avatar} <strong>{me?.name}</strong>
        </div>
        <div className={styles.partnerLine}>
          Reading together with {other?.avatar} {other?.name}
        </div>
      </section>

      {/* CTA buttons */}
      <section className={styles.actions}>
        <button
          className={styles.primaryBtn}
          onClick={() => navigate('/read')}
        >
          <span className={styles.btnIcon}>📄</span>
          <span>Continue Reading</span>
          <span className={styles.btnArrow}>→</span>
        </button>

        <button
          className={styles.secondaryBtn}
          onClick={() => navigate('/threads')}
        >
          <span className={styles.btnIcon}>💬</span>
          <span>All Discussions</span>
          {threads.length > 0 && (
            <span className={styles.badge}>{threads.length}</span>
          )}
        </button>
      </section>

      {/* Recent threads */}
      <section className={styles.recent}>
        <h2 className={styles.sectionTitle}>Recent discussions</h2>
        {loading ? (
          <div className={styles.empty}>Loading...</div>
        ) : recentThreads.length === 0 ? (
          <div className={styles.empty}>
            No discussions yet. Start reading and share your first thought!
          </div>
        ) : (
          <div className={styles.threadList}>
            {recentThreads.map(thread => {
              const author = USERS[thread.created_by]
              return (
                <div
                  key={thread.id}
                  className={styles.threadCard}
                  onClick={() => navigate(`/read?page=${thread.page_number}&thread=${thread.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/read?page=${thread.page_number}&thread=${thread.id}`)}
                >
                  <div className={styles.threadMeta}>
                    <span
                      className={styles.threadAuthor}
                      style={{ color: author?.color }}
                    >
                      {author?.avatar} {author?.name}
                    </span>
                    <span className={styles.threadPage}>p.{thread.page_number}</span>
                  </div>
                  {thread.selected_text && (
                    <blockquote className={styles.threadQuote}>
                      "{thread.selected_text.slice(0, 80)}{thread.selected_text.length > 80 ? '…' : ''}"
                    </blockquote>
                  )}
                  <div className={styles.threadFooter}>
                    <span className={styles.anchorBadge}>{thread.anchor_type}</span>
                    <span className={styles.replyCount}>
                      {thread.replies?.[0]?.count ?? 0} replies
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
