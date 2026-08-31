import { ArrowUpRight, Lightbulb, Music2, Plus } from "lucide-react"

import { Button } from "@/lib/ui/primitives/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/lib/ui/primitives/sheet"

const concertSuggestionUrl =
  "https://github.com/equiferus/openstage/issues/new?template=recording-suggestion.yml"
const featureSuggestionUrl =
  "https://github.com/equiferus/openstage/issues/new?template=feature-suggestion.yml"

interface SuggestionDrawerProps {
  variant?: "outline" | "ghost"
}

const suggestions = [
  {
    title: "Add a concert",
    description: "Share a remarkable live recording, event details, and a setlist when available.",
    label: "Concert suggestion",
    href: concertSuggestionUrl,
    icon: Music2,
  },
  {
    title: "Suggest an app feature",
    description: "Propose a new capability or an improvement to the Openstage experience.",
    label: "Feature suggestion",
    href: featureSuggestionUrl,
    icon: Lightbulb,
  },
] as const

export function SuggestionDrawer({ variant = "outline" }: SuggestionDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant={variant} size="sm">
          <Plus aria-hidden="true" />
          <span>Suggest</span>
        </Button>
      </SheetTrigger>
      <SheetContent closeLabel="Close suggestions" className="max-w-lg">
        <div className="border-b border-white/8 px-5 py-6 pr-16 sm:px-7">
          <SheetHeader>
            <SheetTitle>What would you like to suggest?</SheetTitle>
            <SheetDescription>
              Choose a category so your suggestion reaches the right queue and can be handled independently.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex flex-col gap-3 p-5 sm:p-7">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon

            return (
              <SheetClose asChild key={suggestion.title}>
                <a
                  className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 outline-none transition hover:border-amber-300/30 hover:bg-amber-400/[0.04] focus-visible:ring-2 focus-visible:ring-amber-400"
                  href={suggestion.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-amber-300/20 bg-amber-400/8 text-amber-300">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-[0.65rem] font-semibold tracking-[0.14em] text-amber-300 uppercase">
                      {suggestion.label}
                    </span>
                    <span className="mt-1 flex items-center gap-2 font-semibold text-white">
                      {suggestion.title}
                      <ArrowUpRight className="size-4 text-zinc-600 transition group-hover:text-amber-300" aria-hidden="true" />
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-zinc-500">
                      {suggestion.description}
                    </span>
                  </span>
                </a>
              </SheetClose>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
