'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './VideoPlayer.module.css'

export default function VideoPlayer() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [buffered, setBuffered] = useState(0)
  const [urlInput, setUrlInput] = useState('')
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const [previewTime, setPreviewTime] = useState(0)
  const [previewPosition, setPreviewPosition] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const thumbnailCache = useRef<Map<number, string>>(new Map())
  const lastThumbnailTime = useRef<number>(-1)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return

      switch(e.key) {
        case ' ':
          e.preventDefault()
          togglePlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          seekBackward()
          break
        case 'ArrowRight':
          e.preventDefault()
          seekForward()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
        case 'ArrowUp':
          e.preventDefault()
          changeVolume(0.1)
          break
        case 'ArrowDown':
          e.preventDefault()
          changeVolume(-0.1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, volume, isMuted])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setVideoSrc(url)
      setShowControls(true)
      setLoadingError(null)
    }
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return
    
    const isValidUrl = (url: string) => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    }

    if (!isValidUrl(urlInput)) {
      setLoadingError('Please enter a valid URL')
      return
    }

    setIsLoadingUrl(true)
    setLoadingError(null)
    setVideoSrc(urlInput)
    setShowControls(true)
  }

  const handleVideoError = () => {
    if (videoSrc?.startsWith('http')) {
      setLoadingError('Failed to load video. Please check the URL and try again.')
      setVideoSrc(null)
      setIsLoadingUrl(false)
    }
  }

  const handleVideoLoadStart = () => {
    if (videoSrc?.startsWith('http')) {
      setIsLoadingUrl(true)
    }
  }

  const handleVideoCanPlay = () => {
    setIsLoadingUrl(false)
    setLoadingError(null)
  }

  const togglePlayPause = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const seekForward = () => {
    if (!videoRef.current) return
    videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 5, duration)
  }

  const seekBackward = () => {
    if (!videoRef.current) return
    videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 5, 0)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressBarRef.current) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = percent * duration
  }

  const generateThumbnail = async (time: number): Promise<string | null> => {
    if (!previewVideoRef.current || !canvasRef.current) return null
    
    const roundedTime = Math.floor(time * 2) / 2
    
    if (thumbnailCache.current.has(roundedTime)) {
      return thumbnailCache.current.get(roundedTime)!
    }
    
    if (Math.abs(lastThumbnailTime.current - time) < 0.5) {
      return previewThumbnail
    }
    
    return new Promise((resolve) => {
      const video = previewVideoRef.current!
      const canvas = canvasRef.current!
      
      const handleSeeked = () => {
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        
        const aspectRatio = video.videoWidth / video.videoHeight
        const thumbWidth = 160
        const thumbHeight = thumbWidth / aspectRatio
        
        canvas.width = thumbWidth
        canvas.height = thumbHeight
        
        ctx.drawImage(video, 0, 0, thumbWidth, thumbHeight)
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
        thumbnailCache.current.set(roundedTime, dataUrl)
        
        if (thumbnailCache.current.size > 50) {
          const firstKey = thumbnailCache.current.keys().next().value
          thumbnailCache.current.delete(firstKey!)
        }
        
        lastThumbnailTime.current = time
        video.removeEventListener('seeked', handleSeeked)
        resolve(dataUrl)
      }
      
      video.addEventListener('seeked', handleSeeked)
      video.currentTime = roundedTime
    })
  }

  const handleProgressHover = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return
    
    const rect = progressBarRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    const time = percent * duration
    
    setPreviewTime(time)
    setPreviewPosition(x)
    setShowPreview(true)
    
    if (previewVideoRef.current && videoSrc) {
      const thumbnail = await generateThumbnail(time)
      if (thumbnail) {
        setPreviewThumbnail(thumbnail)
      }
    }
  }

  const handleProgressLeave = () => {
    setShowPreview(false)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      if (newVolume === 0) {
        setIsMuted(true)
      } else if (isMuted) {
        setIsMuted(false)
      }
    }
  }

  const changeVolume = (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta))
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
    }
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      await containerRef.current.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    setCurrentTime(videoRef.current.currentTime)
    
    if (videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
      setBuffered((bufferedEnd / duration) * 100)
    }
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration)
  }

  const handleMouseMove = () => {
    setShowControls(true)
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div 
      ref={containerRef}
      className={styles.container}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {!videoSrc ? (
        <div className={styles.filePicker}>
          <div className={styles.filePickerContent}>
            <h1>Select a Video to Play</h1>
            
            <div className={styles.optionSection}>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={styles.selectFileBtn}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Choose Video File
              </button>
              <p className={styles.supportedFormats}>
                Supported formats: MP4, MKV, MOV, WebM, AVI
              </p>
            </div>

            <div className={styles.divider}>
              <span>OR</span>
            </div>

            <div className={styles.urlSection}>
              <form onSubmit={handleUrlSubmit} className={styles.urlForm}>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Enter video URL (e.g., https://example.com/video.mp4)"
                  className={styles.urlInput}
                />
                <button type="submit" className={styles.loadUrlBtn}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="10 8 16 12 10 16 10 8"></polygon>
                  </svg>
                  Load URL
                </button>
              </form>
              {loadingError && (
                <p className={styles.errorMessage}>{loadingError}</p>
              )}
              <p className={styles.urlHint}>
                Stream videos from direct URLs (CORS-enabled servers only)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {isLoadingUrl && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner}></div>
              <p>Loading video...</p>
            </div>
          )}
          <video
            ref={videoRef}
            src={videoSrc}
            className={styles.video}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onClick={togglePlayPause}
            onError={handleVideoError}
            onLoadStart={handleVideoLoadStart}
            onCanPlay={handleVideoCanPlay}
            crossOrigin="anonymous"
          />
          
          <div className={`${styles.controls} ${showControls ? styles.show : ''}`}>
            <div className={styles.gradient}></div>
            
            <div className={styles.progressContainer}
              onMouseMove={handleProgressHover}
              onMouseLeave={handleProgressLeave}
            >
              <div 
                ref={progressBarRef}
                className={styles.progressBar}
                onClick={handleProgressClick}
              >
                <div className={styles.progressBuffered} style={{ width: `${buffered}%` }} />
                <div className={styles.progressPlayed} style={{ width: `${progressPercentage}%` }} />
                <div className={styles.progressThumb} style={{ left: `${progressPercentage}%` }} />
              </div>
              
              {showPreview && (
                <div 
                  className={styles.seekPreview}
                  style={{ 
                    left: `${previewPosition}px`,
                    transform: `translateX(-50%) translateX(${Math.max(-previewPosition + 80, Math.min(0, progressBarRef.current ? progressBarRef.current.offsetWidth - previewPosition - 80 : 0))}px)`
                  }}
                >
                  {previewThumbnail && (
                    <div className={styles.thumbnailContainer}>
                      <img src={previewThumbnail} alt="Seek preview" />
                    </div>
                  )}
                  <div className={styles.previewTime}>{formatTime(previewTime)}</div>
                </div>
              )}
            </div>
            
            <div className={styles.controlsBottom}>
              <div className={styles.controlsLeft}>
                <button onClick={togglePlayPause} className={styles.controlBtn}>
                  {isPlaying ? (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
                
                <button onClick={seekBackward} className={styles.controlBtn}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                  </svg>
                  <span className={styles.seekLabel}>5</span>
                </button>
                
                <button onClick={seekForward} className={styles.controlBtn}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.01 19V23l5-5-5-5v4c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6h2c0-4.42-3.58-8-8-8s-8 3.58-8 8 3.58 8 8 8z"/>
                  </svg>
                  <span className={styles.seekLabel}>5</span>
                </button>
                
                <button onClick={toggleMute} className={styles.controlBtn}>
                  {isMuted || volume === 0 ? (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                </button>
                
                <div className={styles.volumeSlider}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume * 100}
                    onChange={handleVolumeChange}
                  />
                </div>
                
                <div className={styles.timeDisplay}>
                  <span>{formatTime(currentTime)}</span>
                  <span> / </span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              
              <div className={styles.controlsRight}>
                <button onClick={toggleFullscreen} className={styles.controlBtn}>
                  {isFullscreen ? (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.mkv,.mov,.webm,.avi"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      {videoSrc && (
        <>
          <video
            ref={previewVideoRef}
            src={videoSrc}
            style={{ display: 'none' }}
            crossOrigin="anonymous"
            preload="metadata"
          />
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </>
      )}
    </div>
  )
}
