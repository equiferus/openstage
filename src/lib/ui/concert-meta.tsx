import { CalendarDays, Clock3, MapPin, Radio } from "lucide-react"

import type { Concert } from "@/domain/artists/concerts/api"
import { getVenueLabel } from "@/lib/concert"
import { formatDuration } from "@/lib/utils"

interface ConcertMetaProps {
  concert: Concert
  compact?: boolean
}

export function ConcertMeta({ concert, compact = false }: ConcertMetaProps) {
  const items = [
    { icon: CalendarDays, label: concert.dateLabel },
    { icon: MapPin, label: getVenueLabel(concert) },
    { icon: Clock3, label: formatDuration(concert.durationSeconds) },
    {
      icon: Radio,
      label: concert.source.platform === "youtube" ? `YouTube · ${concert.source.uploader}` : concert.source.provider,
    },
  ]

  return (
    <dl className={compact ? "flex flex-wrap gap-x-5 gap-y-2" : "grid gap-3 sm:grid-cols-2"}>
      {items.map(({ icon: Icon, label }) => (
        <div key={label} className="flex min-w-0 items-center gap-2 text-sm text-zinc-400">
          <Icon className="size-4 shrink-0 text-amber-400" aria-hidden="true" />
          <dt className="sr-only">Concert detail</dt>
          <dd className="truncate">{label}</dd>
        </div>
      ))}
    </dl>
  )
}
