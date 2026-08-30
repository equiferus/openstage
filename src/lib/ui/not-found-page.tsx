import { ArrowLeft, Disc3 } from "lucide-react"

import { Button } from "@/lib/ui/primitives/button"

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
      <span className="flex size-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-amber-300">
        <Disc3 className="size-9" aria-hidden="true" />
      </span>
      <p className="mt-8 text-xs font-bold tracking-[0.18em] text-amber-400 uppercase">Off the setlist</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">This stage is empty.</h1>
      <p className="mt-5 max-w-lg leading-7 text-zinc-500">The artist or page you requested is not in the collection yet.</p>
      <Button className="mt-8" asChild>
        <a href="#/"><ArrowLeft /> Return home</a>
      </Button>
    </div>
  )
}
