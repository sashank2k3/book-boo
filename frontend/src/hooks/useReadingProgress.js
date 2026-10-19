import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Simple reading progress — no realtime.
 * - On mount: fetch partner's last saved page.
 * - On currentPage change: upsert our own page (fires when user navigates).
 */
export function useReadingProgress(username, currentPage) {
  const [partnerPage, setPartnerPage] = useState(null)

  // Fetch partner's last saved page once on mount
  useEffect(() => {
    if (!username) return
    supabase
      .from('reading_progress')
      .select('page_number')
      .neq('username', username)
      .single()
      .then(({ data }) => {
        if (data) setPartnerPage(data.page_number)
      })
  }, [username])

  // Save our page whenever it changes
  useEffect(() => {
    if (!username || !currentPage) return
    supabase
      .from('reading_progress')
      .upsert(
        { username, page_number: currentPage, updated_at: new Date().toISOString() },
        { onConflict: 'username' }
      )
  }, [username, currentPage])

  return { partnerPage }
}
