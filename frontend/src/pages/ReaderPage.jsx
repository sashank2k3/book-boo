import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import { useAuth } from '../hooks/useAuth'
import { useDiscussions } from '../hooks/useDiscussions'
import { supabase } from '../lib/supabase'
import { BOOK } from '../lib/constants'
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
  const [pdfUrl, setPdfUrl]         = useState(null)
  const [numPages, setNumPages]     = useState(null)
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  )
  const [pdfError, setPdfError]     = useState(null)
  const [containerWidth, setContainerWidth] = useState(null)
  const containerRef = useRef(null)

  // ── Discussion state ──────────────────────────────────────────────────
  const [panelOpen, setPanelOpen]       = useState(false)
  const [activeThread, setActiveThread] = useState(searchParams.get('thread') || null)
  const [newThreadModal, setNewThreadModal] = useState(null)
  const [selectedText, setSelectedText] = useState('')

  // ── Swipe refs ────────────────────────────────────────────────────────
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  const { threads, createThread, postReply } = useDiscussions(currentPage)

  // ── Load PDF from Supabase Storage ────────────────────────────────────
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

  // ── Measure container for responsive PDF width ────────────────────────
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // ── Open thread from URL param ─────────────────────────────────────────
  useEffect(() => {
    const threadId = searchParams.get('thread')
    if (threadId) {
      setActiveThread(threadId)
      setPanelOpen(true)
    }
  }, [searchParams])

  // ── Text selection (desktop mouse) ────────────────────────────────────
  const handleTextSelect = useCallback(() => {
    const text = window.getSelection()?.toString().trim()
    setSelectedText(text && text.length > 1 ? text : '')
  }, [])

  // ── Touch swipe handler ───────────────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    // Only track single-finger touches for swipe navigation
    if (e.touches.length > 1) {
      touchStartX.current = null
      touchStartY.current = null
      return
    }
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return

    // If multiple fingers were used (pinch zoom), ignore
    if (e.changedTouches.length > 1) {
      touchStartX.current = null
      touchStartY.current = null
      return
    }

    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current

    touchStartX.current = null
    touchStartY.current = null

    // If the page is zoomed in (visual viewport smaller than layout viewport),
    // don't navigate — let the user pan around the zoomed content
    if (window.visualViewport && window.visualViewport.scale > 1.05) {
      return
    }

    // Horizontal swipe: must dominate vertical and exceed 60px
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx < 0) {
        setCurrentPage(prev => Math.min(prev + 1, numPages || prev))
      } else {
        setCurrentPage(prev => Math.max(prev - 1, 1))
      }
      setPanelOpen(false)
      setActiveThread(null)
      window.getSelection()?.removeAllRanges()
      setSelectedText('')
    } else {
      // vertical — check for text selection
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

  const handleCommentOnPage = () => {
    setNewThreadModal({ selectedText: '' })
  }

  const handleCreateThread = async ({ selectedText, firstMessage }) => {
    const thread = await createThread({
      pageNumber: currentPage,
      selectedText,
      anchorType: 'page',
      username,
    })
    await postReply({ threadId: thread.id, content: firstMessage, username })
    setNewThreadModal(null)
    setActiveThread(thread.id)
    setPanelOpen(true)
  }

  const threadCount = threads.length

  return (
    <div className={styles.page}>
      {/* ── Top bar ── */}
      <header className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/')} aria-label="Back">
          ←
        </button>
        <div className={styles.pageIndicator}>
          <span className={styles.pageNum}>{currentPage}</span>
          {numPages && <span className={styles.pageTotal}> / {numPages}</span>}
        </div>
        <button
          className={styles.discussBtn}
          onClick={() => setPanelOpen(true)}
          aria-label="Open discussions"
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
              width={containerWidth ? containerWidth - 24 : undefined}
              renderTextLayer={true}
              renderAnnotationLayer={false}
            />
          </Document>
        )}

        {/* Floating selection toolbar */}
        {selectedText && (
          <div className={styles.selectionToolbar}>
            <button onClick={handleCommentOnSelection} className={styles.selectionBtn}>
              💬 Comment on selection
            </button>
          </div>
        )}
      </main>

      {/* ── Bottom navigation ── */}
      <nav className={styles.bottomNav}>
        <button
          className={styles.navBtn}
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          ←
        </button>

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

        <button
          className={styles.commentPageBtn}
          onClick={handleCommentOnPage}
          aria-label="Comment on this page"
        >
          ✏️ Note
        </button>

        <button
          className={styles.navBtn}
          onClick={() => goToPage(currentPage + 1)}
          disabled={numPages ? currentPage >= numPages : false}
          aria-label="Next page"
        >
          →
        </button>
      </nav>

      {/* ── Discussion panel ── */}
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

      {/* ── New thread modal ── */}
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
