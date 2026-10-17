import React from 'react'
import { USERS } from '../lib/constants'

/**
 * Renders a circular avatar with the user's initial letter.
 * size: 'sm' (28px) | 'md' (36px) | 'lg' (48px)
 */
export default function Avatar({ username, size = 'md', style = {} }) {
  const user = USERS[username]
  if (!user) return null

  const sizes = {
    sm: { width: 28, height: 28, fontSize: 13 },
    md: { width: 36, height: 36, fontSize: 16 },
    lg: { width: 48, height: 48, fontSize: 20 },
  }

  const { width, height, fontSize } = sizes[size] || sizes.md

  // Resolve the CSS var to a real color for the background
  const colorMap = {
    'var(--harshuu)': '#6366f1',
    'var(--sashank)': '#ec4899',
  }
  const bg = colorMap[user.color] || user.color

  return (
    <span
      aria-label={user.name}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width,
        height,
        borderRadius: '50%',
        background: bg,
        color: 'white',
        fontSize,
        fontWeight: 700,
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        flexShrink: 0,
        lineHeight: 1,
        userSelect: 'none',
        ...style,
      }}
    >
      {user.avatar}
    </span>
  )
}
