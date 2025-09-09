import VideoPlayer from '@/components/VideoPlayer'
import { WebsiteJsonLd, OrganizationJsonLd } from '@/components/JsonLd'

export default function Home() {
  return (
    <>
      <WebsiteJsonLd />
      <OrganizationJsonLd />
      <VideoPlayer />
    </>
  )
}
