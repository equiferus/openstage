import { Play } from "lucide-react"

import type { SetlistEntry } from "@/domain/artists/concerts/api"
import { formatTimestamp } from "@/lib/utils"
import { Badge } from "@/lib/ui/primitives/badge"

interface SetlistProps {
  entries: readonly SetlistEntry[]
  onSelect: (entry: SetlistEntry) => void
}

export function Setlist({ entries, onSelect }: SetlistProps) {
  const timedEntries = entries.filter((entry) => entry.startAtSeconds !== undefined).length

  return (
    <section className="xl:flex xl:h-full xl:min-h-0 xl:flex-col" aria-labelledby="concert-setlist-title">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="concert-setlist-title" className="mr-auto text-base font-semibold text-white">
          Setlist
        </h2>
        <Badge>{entries.length} tracks</Badge>
      </div>
      {timedEntries > 0 ? (
        <p className="mt-1.5 text-xs text-zinc-500">Select any timestamp to jump to that moment.</p>
      ) : null}

      <ol className="mt-4 divide-y divide-white/8 overflow-x-hidden rounded-xl border border-white/8 bg-black/20 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
        {entries.map((entry, index) => {
          const isPlayable = entry.startAtSeconds !== undefined
          const content = (
            <>
              <span className="w-6 shrink-0 text-right font-mono text-xs text-zinc-600">{String(index + 1).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-zinc-200">{entry.title}</span>
                {entry.note ? <span className="mt-0.5 block text-xs text-zinc-600">{entry.note}</span> : null}
              </span>
              {isPlayable ? (
                <span className="flex shrink-0 items-center gap-1.5 font-mono text-xs text-amber-300">
                  <Play className="size-3 fill-current" aria-hidden="true" />
                  {formatTimestamp(entry.startAtSeconds!)}
                </span>
              ) : null}
            </>
          )

          return (
            <li key={`${entry.title}-${index}`}>
              {isPlayable ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-3 text-left outline-none transition hover:bg-white/5 focus-visible:bg-white/8"
                  onClick={() => onSelect(entry)}
                  aria-label={`Play ${entry.title} at ${formatTimestamp(entry.startAtSeconds!)}`}
                >
                  {content}
                </button>
              ) : (
                <div className="flex items-center gap-3 px-3 py-3">{content}</div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
