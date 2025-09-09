interface CastFramework {
  CastContext: {
    getInstance(): CastContext
  }
  RemotePlayer: new () => RemotePlayer
  RemotePlayerController: new (player: RemotePlayer) => RemotePlayerController
  AutoJoinPolicy: {
    ORIGIN_SCOPED: string
  }
  RemotePlayerEventType: {
    IS_CONNECTED_CHANGED: string
    CURRENT_TIME_CHANGED: string
    IS_PAUSED_CHANGED: string
  }
}

interface CastContext {
  setOptions(options: CastOptions): void
  requestSession(): Promise<CastSession>
  getCurrentSession(): CastSession | null
  endCurrentSession(stopCasting: boolean): void
}

interface CastOptions {
  receiverApplicationId: string
  autoJoinPolicy: string
  language?: string
  resumeSavedSession?: boolean
}

interface CastSession {
  sessionId: string
  loadMedia(request: LoadRequest): Promise<void>
  endSession(stopCasting: boolean): void
  getMediaSession(): MediaSession | null
}

interface RemotePlayer {
  isConnected: boolean
  currentTime: number
  duration: number
  isPaused: boolean
  volumeLevel: number
  isMuted: boolean
  mediaInfo?: MediaInfo
}

interface RemotePlayerController {
  addEventListener(type: string, handler: () => void): void
  removeEventListener(type: string, handler: () => void): void
  playOrPause(): void
  seek(): void
  setVolumeLevel(): void
  muteOrUnmute(): void
}

interface MediaInfo {
  contentId: string
  contentType: string
  metadata?: GenericMediaMetadata
}

interface GenericMediaMetadata {
  title?: string
  metadataType?: number
}

interface LoadRequest {
  media: MediaInfo
  currentTime?: number
  autoplay?: boolean
}

interface MediaSession {
  media: MediaInfo
  currentTime: number
}

interface CastMedia {
  MediaInfo: new (contentId: string, contentType: string) => MediaInfo
  GenericMediaMetadata: new () => GenericMediaMetadata
  LoadRequest: new (mediaInfo: MediaInfo) => LoadRequest
  MetadataType: {
    GENERIC: number
  }
  DEFAULT_MEDIA_RECEIVER_APP_ID?: string
}

interface Cast {
  framework: CastFramework
  media: CastMedia
}

interface Chrome {
  cast?: Cast
}

declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void
    chrome?: Chrome
  }
}

export type {
  CastContext,
  CastSession,
  RemotePlayer,
  RemotePlayerController,
  MediaInfo,
  LoadRequest,
  Cast,
  Chrome
}