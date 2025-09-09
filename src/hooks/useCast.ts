'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { 
  CastContext, 
  CastSession, 
  RemotePlayer, 
  RemotePlayerController 
} from '@/types/cast'

export function useCast() {
  const [isCastAvailable, setIsCastAvailable] = useState(false)
  const [isCasting, setIsCasting] = useState(false)
  const [castSession, setCastSession] = useState<CastSession | null>(null)
  const castContextRef = useRef<CastContext | null>(null)
  const remotePlayerRef = useRef<RemotePlayer | null>(null)
  const remotePlayerControllerRef = useRef<RemotePlayerController | null>(null)

  useEffect(() => {
    // Check if Cast SDK is already loaded
    if (window.chrome?.cast?.framework) {
      initializeCastApi()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1'
    script.async = true
    
    script.onload = () => {
      // Wait for the Cast API to be fully available
      const checkCastAvailable = setInterval(() => {
        if (window.chrome?.cast?.framework?.CastContext) {
          clearInterval(checkCastAvailable)
          initializeCastApi()
        }
      }, 100)
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkCastAvailable)
        if (!isCastAvailable) {
          console.log('Cast API failed to load within timeout')
        }
      }, 5000)
    }
    
    script.onerror = () => {
      console.error('Failed to load Cast SDK')
      setIsCastAvailable(false)
    }
    
    document.head.appendChild(script)

    // Also set up the callback method
    window.__onGCastApiAvailable = (isAvailable: boolean) => {
      if (isAvailable && !isCastAvailable) {
        setTimeout(() => initializeCastApi(), 100)
      }
    }

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  const initializeCastApi = () => {
    try {
      if (!window.chrome?.cast?.framework) {
        console.log('Cast framework not available yet')
        return
      }

      const cast = window.chrome.cast
      
      // Check if CastContext exists
      if (!cast.framework.CastContext) {
        console.log('CastContext not available')
        return
      }

      const castContext = cast.framework.CastContext.getInstance()

      // Set options with proper error handling
      castContext.setOptions({
        receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID || 'CC1AD845',
        autoJoinPolicy: cast.framework.AutoJoinPolicy.ORIGIN_SCOPED,
        language: 'en-US',
        resumeSavedSession: true,
      })

      castContextRef.current = castContext

      // Initialize remote player only if framework is ready
      if (cast.framework.RemotePlayer && cast.framework.RemotePlayerController) {
        const remotePlayer = new cast.framework.RemotePlayer()
        const remotePlayerController = new cast.framework.RemotePlayerController(remotePlayer)

        remotePlayerRef.current = remotePlayer
        remotePlayerControllerRef.current = remotePlayerController

        if (cast.framework.RemotePlayerEventType) {
          remotePlayerController.addEventListener(
            cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED,
            handleCastConnectionChanged
          )

          remotePlayerController.addEventListener(
            cast.framework.RemotePlayerEventType.CURRENT_TIME_CHANGED,
            handleTimeUpdate
          )

          remotePlayerController.addEventListener(
            cast.framework.RemotePlayerEventType.IS_PAUSED_CHANGED,
            handlePausedChanged
          )
        }

        setIsCastAvailable(true)
      }
    } catch (error) {
      console.error('Error initializing Cast API:', error)
      setIsCastAvailable(false)
    }
  }

  const handleCastConnectionChanged = useCallback(() => {
    const remotePlayer = remotePlayerRef.current
    if (!remotePlayer) return

    setIsCasting(remotePlayer.isConnected)

    if (remotePlayer.isConnected) {
      const session = castContextRef.current?.getCurrentSession()
      setCastSession(session)
    } else {
      setCastSession(null)
    }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    // Handle time updates from the cast device
  }, [])

  const handlePausedChanged = useCallback(() => {
    // Handle play/pause state changes from the cast device
  }, [])

  const startCast = useCallback(async () => {
    try {
      if (!castContextRef.current) {
        console.error('Cast context not initialized')
        return false
      }

      await castContextRef.current.requestSession()
      return true
    } catch (error) {
      console.error('Error starting cast session:', error)
      return false
    }
  }, [])

  const loadMedia = useCallback(async (
    videoUrl: string,
    title: string = 'Video',
    currentTime: number = 0
  ) => {
    try {
      if (!window.chrome?.cast?.media || !castContextRef.current) {
        console.error('Cast not properly initialized')
        return
      }

      const session = castContextRef.current.getCurrentSession()
      if (!session) {
        console.error('No cast session available')
        return
      }

      const cast = window.chrome.cast
      const mediaInfo = new cast.media.MediaInfo(videoUrl, 'video/mp4')
      
      mediaInfo.metadata = new cast.media.GenericMediaMetadata()
      mediaInfo.metadata.title = title
      mediaInfo.metadata.metadataType = cast.media.MetadataType.GENERIC

      const request = new cast.media.LoadRequest(mediaInfo)
      request.currentTime = currentTime
      request.autoplay = true

      await session.loadMedia(request)
    } catch (error) {
      console.error('Error loading media:', error)
    }
  }, [])

  const stopCast = useCallback(() => {
    if (!castContextRef.current) return

    const session = castContextRef.current.getCurrentSession()
    if (session) {
      session.endSession(true)
    }
  }, [])

  const playPause = useCallback(() => {
    const controller = remotePlayerControllerRef.current
    if (!controller) return

    controller.playOrPause()
  }, [])

  const seek = useCallback((time: number) => {
    const remotePlayer = remotePlayerRef.current
    const controller = remotePlayerControllerRef.current
    
    if (!remotePlayer || !controller) return

    remotePlayer.currentTime = time
    controller.seek()
  }, [])

  const setVolume = useCallback((level: number) => {
    const remotePlayer = remotePlayerRef.current
    const controller = remotePlayerControllerRef.current
    
    if (!remotePlayer || !controller) return

    remotePlayer.volumeLevel = level
    controller.setVolumeLevel()
  }, [])

  const setMuted = useCallback((muted: boolean) => {
    const remotePlayer = remotePlayerRef.current
    const controller = remotePlayerControllerRef.current
    
    if (!remotePlayer || !controller) return

    if (muted) {
      controller.muteOrUnmute()
    } else {
      controller.muteOrUnmute()
    }
  }, [])

  const getCastState = useCallback(() => {
    try {
      const remotePlayer = remotePlayerRef.current
      if (!remotePlayer || !remotePlayer.isConnected) return null

      return {
        currentTime: remotePlayer.currentTime || 0,
        duration: remotePlayer.duration || 0,
        isPaused: remotePlayer.isPaused !== undefined ? remotePlayer.isPaused : true,
        volume: remotePlayer.volumeLevel || 1,
        isMuted: remotePlayer.isMuted || false,
      }
    } catch (error) {
      console.error('Error getting cast state:', error)
      return null
    }
  }, [])

  return {
    isCastAvailable,
    isCasting,
    startCast,
    stopCast,
    loadMedia,
    playPause,
    seek,
    setVolume,
    setMuted,
    getCastState,
  }
}