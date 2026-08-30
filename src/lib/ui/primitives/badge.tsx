import * as React from "react"

import { cn } from "@/lib/utils"

function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[0.6875rem] font-semibold tracking-[0.08em] text-zinc-200 uppercase",
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
