import type { Concert } from "@/domain/artists/concerts/api"
import { HomePage } from "@/lib/ui/home-page"
import type { VideoLiveSchedule } from "@/lib/ui/video-player"

interface HomeRouteProps {
  concert: Concert
  goLiveRequest: number
  liveSchedule?: VideoLiveSchedule
  onLiveChange: (isLive: boolean) => void
  onSelectConcert: (concert: Concert) => void
}

export function HomeRoute({ concert, goLiveRequest, liveSchedule, onLiveChange, onSelectConcert }: HomeRouteProps) {
  return (
    <HomePage
      concert={concert}
      goLiveRequest={goLiveRequest}
      liveSchedule={liveSchedule}
      onLiveChange={onLiveChange}
      onSelectConcert={onSelectConcert}
    />
  )
}
