import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Fetches and subscribes to discussions for a given page.
 * Also provides helpers to post threads and replies.
 */
export function useDiscussions(currentPage) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchThreads = useCallback(async () => {
    if (!currentPage) return
    setLoading(true)
    const { data, error } = await supabase
      .from('threads')
      .select(`
        *,
        replies (
          *
        )
      `)
      .eq('page_number', currentPage)
      .order('created_at', { ascending: true })

    if (!error) {
      // Sort replies within each thread
      const sorted = (data || []).map(t => ({
        ...t,
        replies: (t.replies || []).sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ),
      }))
      setThreads(sorted)
    }
    setLoading(false)
  }, [currentPage])

  useEffect(() => {
    fetchThreads()

    // Real-time subscription for threads on this page
    const channel = supabase
      .channel(`page-${currentPage}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'threads', filter: `page_number=eq.${currentPage}` },
        () => fetchThreads()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'replies' },
        () => fetchThreads()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [currentPage, fetchThreads])

  const createThread = async ({ pageNumber, selectedText, anchorType, username }) => {
    const { data, error } = await supabase
      .from('threads')
      .insert({
        page_number: pageNumber,
        selected_text: selectedText,
        anchor_type: anchorType, // 'word' | 'sentence' | 'paragraph' | 'page' | 'chapter'
        created_by: username,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const postReply = async ({ threadId, content, username }) => {
    const { data, error } = await supabase
      .from('replies')
      .insert({
        thread_id: threadId,
        content,
        created_by: username,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  return { threads, loading, createThread, postReply, refetch: fetchThreads }
}

/**
 * Fetch all threads across all pages (for the overview / thread list).
 */
export function useAllThreads() {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const { data, error } = await supabase
        .from('threads')
        .select(`*, replies(count)`)
        .order('created_at', { ascending: false })

      if (!error) setThreads(data || [])
      setLoading(false)
    }

    fetchAll()

    const channel = supabase
      .channel('all-threads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threads' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'replies' }, fetchAll)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return { threads, loading }
}
