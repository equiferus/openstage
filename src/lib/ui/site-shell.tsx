import type { ReactNode } from "react"
import { Code2, Menu, Play, Plus } from "lucide-react"

import { Button } from "@/lib/ui/primitives/button"

const suggestionUrl =
  "https://github.com/equiferus/openstage/issues/new?template=recording-suggestion.yml"

interface SiteShellProps {
  children: ReactNode
}

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5 font-semibold tracking-tight text-white">
      <span className="flex size-8 items-center justify-center rounded-full bg-amber-400 text-zinc-950 shadow-lg shadow-amber-400/15">
        <Play className="ml-0.5 size-3.5 fill-current" aria-hidden="true" />
      </span>
      <span className="text-lg">openstage</span>
    </span>
  )
}

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#/" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-amber-400" aria-label="Openstage home">
            <Wordmark />
          </a>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary navigation">
            <Button variant="ghost" asChild>
              <a href="#/">Home</a>
            </Button>
            <Button variant="ghost" asChild>
              <a href="#/browse">Browse</a>
            </Button>
          </nav>
          <Button variant="outline" size="sm" asChild>
            <a href={suggestionUrl} target="_blank" rel="noreferrer">
              <Plus aria-hidden="true" />
              <span className="hidden xs:inline">Suggest a recording</span>
              <span className="xs:hidden">Suggest</span>
            </a>
          </Button>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-md leading-6">A community-curated index of remarkable live recordings. Every performance links back to its original source.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <a href={suggestionUrl} target="_blank" rel="noreferrer">
                <Menu aria-hidden="true" /> Suggest a set
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href="https://github.com/equiferus/openstage" target="_blank" rel="noreferrer" aria-label="Openstage on GitHub">
                <Code2 aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
