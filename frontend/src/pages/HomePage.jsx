import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAllThreads } from '../hooks/useDiscussions'
import { useReadingProgress } from '../hooks/useReadingProgress'
import { USERS, BOOK } from '../lib/constants'
import Avatar from '../components/Avatar'
import styles from './HomePage.module.css'

export default function HomePage() {
  const { username, signOut } = useAuth()
  const { threads, loading } = useAllThreads()
  const navigate = useNavigate()

  const me = USERS[username]
  const other = Object.values(USERS).find(u => u.id !== username)

  // Reading progress (we pass null as currentPage since we're not in the reader)
  const { partnerPage } = useReadingProgress(username, null)

  const recentThreads = threads.slice(0, 4)
  const totalPages = 208 // approximate — will be overridden by actual PDF page count

  return (
    <div className={styles.page}>

      {/* ── Hero / Book cover ── */}
      <div className={styles.hero}>
        <div className={styles.heroTop}>
          <button className={styles.signOutBtn} onClick={signOut} aria-label="Sign out">
            ↩
          </button>
        </div>

        <div className={styles.bookCover}>
          <div className={styles.coverSpine} />
          <div className={styles.coverFace}>
            <p className={styles.coverAuthor}>{BOOK.author}</p>
            <h1 className={styles.coverTitle}>{BOOK.title}</h1>
            <div className={styles.coverDivider} />
            <p className={styles.coverTagline}>A legend that began as a dream</p>
          </div>
        </div>

        {/* Reading together pill */}
        <div className={styles.readersRow}>
          <div className={styles.readerPill}>
            <Avatar username={username} size="sm" />
            <div className={styles.readerInfo}>
              <span className={styles.readerName}>{me?.name}</span>
              <span className={styles.readerLabel}>you</span>
            </div>
          </div>

          <div className={styles.andDot}>✦</div>

          <div className={styles.readerPill}>
            <Avatar username={other?.id} size="sm" />
            <div className={styles.readerInfo}>
              <span className={styles.readerName}>{other?.name}</span>
              {partnerPage ? (
                <span className={styles.readerPage}>p.{partnerPage}</span>
              ) : (
                <span className={styles.readerLabel}>not started</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className={styles.content}>

        {/* CTA */}
        <button className={styles.readBtn} onClick={() => navigate('/read')}>
          <span className={styles.readBtnText}>Continue Reading</span>
          <span className={styles.readBtnArrow}>→</span>
        </button>

        {/* Discussions quick link */}
        <button className={styles.discussionsBtn} onClick={() => navigate('/threads')}>
          <span className={styles.discussionsIcon}>💬</span>
          <span>All Discussions</span>
          {threads.length > 0 && (
            <span className={styles.discussionsBadge}>{threads.length}</span>
          )}
        </button>

        {/* Recent discussions */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent</h2>
            {recentThreads.length > 0 && (
              <button className={styles.seeAll} onClick={() => navigate('/threads')}>
                See all
              </button>
            )}
          </div>

          {loading ? (
            <div className={styles.loadingRow}>
              <div className={styles.shimmer} />
              <div className={styles.shimmer} style={{ width: '70%' }} />
            </div>
          ) : recentThreads.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>✍️</span>
              <p>No discussions yet.</p>
              <p>Open the book and start a conversation.</p>
            </div>
          ) : (
            <div className={styles.threadList}>
              {recentThreads.map(thread => {
                const author = USERS[thread.created_by]
                const replyCount = thread.replies?.[0]?.count ?? 0
                return (
                  <div
                    key={thread.id}
                    className={styles.threadCard}
                    onClick={() => navigate(`/read?page=${thread.page_number}&thread=${thread.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/read?page=${thread.page_number}&thread=${thread.id}`)}
                  >
                    <div className={styles.threadTop}>
                      <div className={styles.threadAuthorRow}>
                        <Avatar username={thread.created_by} size="sm" />
                        <span className={styles.threadAuthorName} style={{ color: author?.color }}>
                          {author?.name}
                        </span>
                      </div>
                      <span className={styles.threadPage}>p.{thread.page_number}</span>
                    </div>
                    {thread.selected_text && (
                      <blockquote className={styles.threadQuote}>
                        "{thread.selected_text.slice(0, 90)}{thread.selected_text.length > 90 ? '…' : ''}"
                      </blockquote>
                    )}
                    <div className={styles.threadBottom}>
                      <span className={styles.replyCount}>
                        {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                      </span>
                      <span className={styles.threadTime}>
                        {new Date(thread.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
