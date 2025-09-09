'use client'

import { useState, useEffect } from 'react'
import styles from './CastButton.module.css'

interface CastButtonProps {
  isCastAvailable: boolean
  isCasting: boolean
  onCastClick: () => void
}

export default function CastButton({ isCastAvailable, isCasting, onCastClick }: CastButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (!isCastAvailable) return null

  return (
    <div className={styles.castButtonWrapper}>
      <button
        className={`${styles.castButton} ${isCasting ? styles.casting : ''}`}
        onClick={onCastClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={isCasting ? 'Stop casting' : 'Cast to device'}
      >
        {isCasting ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 18v2c0 .55.45 1 1 1h2c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11zm20-7H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
            <path className={styles.castWaves} d="M1 10v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11z"/>
            <path className={styles.castWaves} d="M1 14v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7z"/>
            <path className={styles.castWaves} d="M1 18v3h3c0-1.66-1.34-3-3-3z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 18v2c0 .55.45 1 1 1h2c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm18-7H5v1.63c3.96 1.28 7.09 4.41 8.37 8.37H19V7zM1 10v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11zm20-7H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
          </svg>
        )}
      </button>
      {showTooltip && (
        <div className={styles.tooltip}>
          {isCasting ? 'Stop casting' : 'Cast to device'}
        </div>
      )}
    </div>
  )
}