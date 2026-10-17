import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import { useAuth } from '../hooks/useAuth'
import { useDiscussions } from '../hooks/useDiscussions'
import { supabase } from '../lib/supabase'
import { BOOK, USERS } from '../lib/constants'
import ThreadPanel from '../components/ThreadPanel'
import NewThreadModal from '../components/NewThreadModal'
import styles from './ReaderPage.module.css'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Use the bundled worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export default function ReaderPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { username } = useAuth()

  // PDF state
  const [pdfUrl, setPdfUrl] = useState(null)
  const [numPages, setNumPages] = useState(null)
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  )
  const [pdfLoading, setPdfLoading] = useState(true)
  const [pdfError, setPdfError] = useState(null)
  const [containerWidth, setContainerWidth] = useState(null)
  const containerRef = useRef(null)

  // Discussion state
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeThread, setActiveThread] = useState(
    searchParams.get('thread') || null
  )
  const [newThreadModal, setNewThreadModal] = useState(null) // { selectedText, anchorType }
  const [selectedText, setSelectedText] = useState('')

  const { threads, createThread, postReply } = useDiscussions(currentPage)

  // ── Load PDF URL from Supabase Storage ───────────────────────────────
  useEffect(() => {
    const loadPdf = async () => {
      try {
        const { data } = supabase.storage
          .from(BOOK.bucket)
          .getPublicUrl(BOOK.storageKey)
        setPdfUrl(data.publicUrl)
      } catch (err) {
        setPdfError('Could not load the book. Please try again.')
      }
    }
    loadPdf()
  }, [])

  // ── Container width for responsive PDF ───────────────────────────────
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

  // ── Open thread from URL param ────────────────────────────────────────
  useEffect(() => {
    const threadId = searchParams.get('thread')
    if (threadId) {
      setActiveThread(threadId)
      setPanelOpen(true)
    }
  }, [searchParams])

  // ── Text selection handler ────────────────────────────────────────────
  const handleTextSelect = useCallback(() => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()
    if (text && text.length > 1) {
      setSelectedText(text)
    } else {
      setSelectedText('')
    }
  }, [])

  const handleCommentOnSelection = () => {
    if (!selectedText) return
    // Guess anchor type by length
    const words = selectedText.split(/\s+/).length
    let anchorType = 'word'
    if (words > 50) anchorType = 'paragraph'
    else if (words > 15) anchorType = 'sentence'
    else if (words > 5) anchorType = 'phrase'

    setNewThreadModal({ selectedText, anchorType })
    window.getSelection()?.removeAllRanges()
    setSelectedText('')
  }

  const handleCommentOnPage = () => {
    setNewThreadModal({ selectedText: '', anchorType: 'page' })
  }

  const handleCreateThread = async ({ selectedText, anchorType, firstMessage }) => {
    const thread = await createThread({
      pageNumber: currentPage,
      selectedText,
      anchorType,
      username,
    })
    // Post the first message as a reply immediately
    await postReply({
      threadId: thread.id,
      content: firstMessage,
      username,
    })
    setNewThreadModal(null)
    setActiveThread(thread.id)
    setPanelOpen(true)
  }

  // ── Page navigation ───────────────────────────────────────────────────
  const goToPage = (page) => {
    const clamped = Math.max(1, Math.min(page, numPages || 1))
    setCurrentPage(clamped)
    setPanelOpen(false)
    setActiveThread(null)
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
          💬 {threadCount > 0 && <span className={styles.threadBadge}>{threadCount}</span>}
        </button>
      </header>

      {/* ── PDF Viewer ── */}
      <main
        className={styles.pdfArea}
        ref={containerRef}
        onMouseUp={handleTextSelect}
        onTouchEnd={handleTextSelect}
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
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages)
              setPdfLoading(false)
            }}
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
              width={containerWidth ? containerWidth - 32 : undefined}
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

        {/* Page jump input */}
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

      {/* ── Discussion panel (bottom sheet) ── */}
      {panelOpen && (
        <ThreadPanel
          threads={threads}
          activeThread={activeThread}
          setActiveThread={setActiveThread}
          username={username}
          currentPage={currentPage}
          onClose={() => { setPanelOpen(false); setActiveThread(null) }}
          onPostReply={postReply}
          onNewThread={() => setNewThreadModal({ selectedText: '', anchorType: 'page' })}
        />
      )}

      {/* ── New thread modal ── */}
      {newThreadModal && (
        <NewThreadModal
          selectedText={newThreadModal.selectedText}
          anchorType={newThreadModal.anchorType}
          pageNumber={currentPage}
          username={username}
          onSubmit={handleCreateThread}
          onClose={() => setNewThreadModal(null)}
        />
      )}
    </div>
  )
}
