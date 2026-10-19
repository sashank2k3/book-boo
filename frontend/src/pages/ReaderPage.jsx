import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import { useAuth } from '../hooks/useAuth'
import { useDiscussions } from '../hooks/useDiscussions'
import { useReadingProgress } from '../hooks/useReadingProgress'
import { supabase } from '../lib/supabase'
import { BOOK, USERS } from '../lib/constants'
import Avatar from '../components/Avatar'
import ThreadPanel from '../components/ThreadPanel'
import NewThreadModal from '../components/NewThreadModal'
import styles from './ReaderPage.module.css'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export default function ReaderPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { username } = useAuth()

  // ── PDF state ─────────────────────────────────────────────────────────
  const [pdfUrl, setPdfUrl]             = useState(null)
  const [numPages, setNumPages]         = useState(null)
  const [currentPage, setCurrentPage]   = useState(
    parseInt(searchParams.get('page') || '1', 10)
  )
  const [pdfError, setPdfError]         = useState(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef(null)

  // ── Discussion state ──────────────────────────────────────────────────
  const [panelOpen, setPanelOpen]           = useState(false)
  const [activeThread, setActiveThread]     = useState(searchParams.get('thread') || null)
  const [newThreadModal, setNewThreadModal] = useState(null)
  const [selectedText, setSelectedText]     = useState('')

  // ── Swipe refs ────────────────────────────────────────────────────────
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  const { threads, createThread, postReply } = useDiscussions(currentPage)
  const { partnerPage } = useReadingProgress(username, currentPage)

  const partner = Object.values(USERS).find(u => u.id !== username)

  // ── Load PDF ──────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const { data } = supabase.storage
        .from(BOOK.bucket)
        .getPublicUrl(BOOK.storageKey)
      setPdfUrl(data.publicUrl)
    } catch {
      setPdfError('Could not load the book. Please try again.')
    }
  }, [])

  // ── Measure container ─────────────────────────────────────────────────
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // ── URL param: open thread ────────────────────────────────────────────
  useEffect(() => {
    const threadId = searchParams.get('thread')
    if (threadId) { setActiveThread(threadId); setPanelOpen(true) }
  }, [searchParams])

  // ── Text selection ────────────────────────────────────────────────────
  const handleTextSelect = useCallback(() => {
    const text = window.getSelection()?.toString().trim()
    setSelectedText(text && text.length > 1 ? text : '')
  }, [])

  // ── Swipe navigation ──────────────────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length > 1) { touchStartX.current = null; return }
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return
    if (e.changedTouches.length > 1) { touchStartX.current = null; return }

    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    touchStartX.current = null

    if (window.visualViewport?.scale > 1.05) return

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx < 0) setCurrentPage(p => Math.min(p + 1, numPages || p))
      else        setCurrentPage(p => Math.max(p - 1, 1))
      setPanelOpen(false)
      setActiveThread(null)
      window.getSelection()?.removeAllRanges()
      setSelectedText('')
    } else {
      const text = window.getSelection()?.toString().trim()
      setSelectedText(text && text.length > 1 ? text : '')
    }
  }, [numPages])

  // ── Page navigation ───────────────────────────────────────────────────
  const goToPage = (page) => {
    const clamped = Math.max(1, Math.min(page, numPages || 1))
    setCurrentPage(clamped)
    setPanelOpen(false)
    setActiveThread(null)
  }

  // ── Thread actions ────────────────────────────────────────────────────
  const handleCommentOnSelection = () => {
    if (!selectedText) return
    setNewThreadModal({ selectedText })
    window.getSelection()?.removeAllRanges()
    setSelectedText('')
  }

  const handleCreateThread = async ({ selectedText, firstMessage }) => {
    const thread = await createThread({ pageNumber: currentPage, selectedText, anchorType: 'page', username })
    await postReply({ threadId: thread.id, content: firstMessage, username })
    setNewThreadModal(null)
    setActiveThread(thread.id)
    setPanelOpen(true)
  }

  // ── PDF sizing: drive by HEIGHT so it fills the screen top-to-bottom ──
  // The pdfArea flex:1 takes up all space between topBar and bottomNav.
  // We pass that exact height to <Page height={}> and react-pdf handles width.
  const BOTTOM_NAV_H = 57
  const pdfHeight = containerSize.height > 0
    ? containerSize.height  // container already excludes bottom nav (it's outside)
    : undefined

  const threadCount = threads.length

  return (
    <div className={styles.page}>

      {/* ── Overlay top bar ── */}
      <header className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/')} aria-label="Back">←</button>

        <div className={styles.centerInfo}>
          <span className={styles.pageNum}>{currentPage}</span>
          {numPages && <span className={styles.pageTotal}> / {numPages}</span>}
          {partnerPage && (
            <div className={styles.partnerChip}>
              <Avatar username={partner?.id} size="sm" style={{ width: 18, height: 18, fontSize: 9 }} />
              <span>p.{partnerPage}</span>
            </div>
          )}
        </div>

        <button
          className={styles.discussBtn}
          onClick={() => setPanelOpen(true)}
          aria-label="Discussions"
        >
          💬{threadCount > 0 && <span className={styles.threadBadge}>{threadCount}</span>}
        </button>
      </header>

      {/* ── PDF Viewer ── */}
      <main
        className={styles.pdfArea}
        ref={containerRef}
        onMouseUp={handleTextSelect}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {pdfError ? (
          <div className={styles.errorState}>
            <span>📚</span>
            <p>{pdfError}</p>
          </div>
        ) : !pdfUrl ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Opening book...</p>
          </div>
        ) : (
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={() => setPdfError('Failed to load PDF.')}
            loading={
              <div className={styles.loadingState}>
                <div className={styles.spinner} />
                <p>Opening book...</p>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              height={pdfHeight}
              renderTextLayer={true}
              renderAnnotationLayer={false}
            />
          </Document>
        )}

        {selectedText && (
          <div className={styles.selectionToolbar}>
            <button onClick={handleCommentOnSelection} className={styles.selectionBtn}>
              💬 Comment on selection
            </button>
          </div>
        )}
      </main>

      {/* ── Bottom nav ── */}
      <nav className={styles.bottomNav}>
        <button className={styles.navBtn} onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1} aria-label="Previous page">←</button>

        <div className={styles.pageJump}>
          <input
            type="number"
            min={1}
            max={numPages || 9999}
            value={currentPage}
            onChange={e => goToPage(parseInt(e.target.value) || 1)}
            className={styles.pageInput}
            aria-label="Jump to page"
          />
        </div>

        <button className={styles.commentPageBtn}
          onClick={() => setNewThreadModal({ selectedText: '' })}
          aria-label="Note on this page">✏️ Note</button>

        <button className={styles.navBtn} onClick={() => goToPage(currentPage + 1)}
          disabled={numPages ? currentPage >= numPages : false}
          aria-label="Next page">→</button>
      </nav>

      {panelOpen && (
        <ThreadPanel
          threads={threads}
          activeThread={activeThread}
          setActiveThread={setActiveThread}
          username={username}
          currentPage={currentPage}
          onClose={() => { setPanelOpen(false); setActiveThread(null) }}
          onPostReply={postReply}
          onNewThread={() => setNewThreadModal({ selectedText: '' })}
        />
      )}

      {newThreadModal && (
        <NewThreadModal
          selectedText={newThreadModal.selectedText}
          pageNumber={currentPage}
          username={username}
          onSubmit={handleCreateThread}
          onClose={() => setNewThreadModal(null)}
        />
      )}
    </div>
  )
}
