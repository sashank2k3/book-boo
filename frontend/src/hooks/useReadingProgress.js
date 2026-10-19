import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Tracks and broadcasts the current user's page,
 * and subscribes to the partner's page in realtime.
 */
export function useReadingProgress(username, currentPage) {
  const [partnerProgress, setPartnerProgress] = useState(null) // { username, page_number }

  // Upsert our own progress whenever page changes
  useEffect(() => {
    if (!username || !currentPage) return

    supabase
      .from('reading_progress')
      .upsert({ username, page_number: currentPage, updated_at: new Date().toISOString() },
               { onConflict: 'username' })
      .then(({ error }) => {
        if (error) console.error('Progress upsert error:', error)
      })
  }, [username, currentPage])

  // Fetch partner's progress and subscribe to changes
  useEffect(() => {
    if (!username) return

    const fetchPartner = async () => {
      const { data } = await supabase
        .from('reading_progress')
        .select('*')
        .neq('username', username)
        .single()
      if (data) setPartnerProgress(data)
    }

    fetchPartner()

    const channel = supabase
      .channel('reading-progress')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reading_progress' },
        (payload) => {
          // Only update if it's the partner's row
          if (payload.new?.username !== username) {
            setPartnerProgress(payload.new)
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [username])

  return { partnerProgress }
}
