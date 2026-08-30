import type { Concert } from "@/domain/artists/concerts/api"
import { HomePage } from "@/lib/ui/home-page"

interface HomeRouteProps {
  concert: Concert
  onSelectConcert: (concert: Concert) => void
}

export function HomeRoute({ concert, onSelectConcert }: HomeRouteProps) {
  return <HomePage concert={concert} onSelectConcert={onSelectConcert} />
}
