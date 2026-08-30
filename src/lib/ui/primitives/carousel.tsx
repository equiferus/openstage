import * as React from "react"
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/lib/ui/primitives/button"

type CarouselApi = UseEmblaCarouselType[1]
type CarouselOptions = Parameters<typeof useEmblaCarousel>[0]

interface CarouselContextValue {
  carouselRef: UseEmblaCarouselType[0]
  api: CarouselApi
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a Carousel")
  }

  return context
}

function Carousel({
  options,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { options?: CarouselOptions }) {
  const [carouselRef, api] = useEmblaCarousel({ align: "start", dragFree: false, ...options })
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const updateControls = React.useCallback((carouselApi: NonNullable<CarouselApi>) => {
    setCanScrollPrev(carouselApi.canScrollPrev())
    setCanScrollNext(carouselApi.canScrollNext())
  }, [])

  const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api])
  const scrollNext = React.useCallback(() => api?.scrollNext(), [api])

  React.useEffect(() => {
    if (!api) return

    const frameId = window.requestAnimationFrame(() => updateControls(api))
    api.on("select", updateControls)
    api.on("reInit", updateControls)

    return () => {
      window.cancelAnimationFrame(frameId)
      api.off("select", updateControls)
      api.off("reInit", updateControls)
    }
  }, [api, updateControls])

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      scrollPrev()
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      scrollNext()
    }
  }

  return (
    <CarouselContext.Provider value={{ carouselRef, api, scrollPrev, scrollNext, canScrollPrev, canScrollNext }}>
      <div
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div className={cn("-ml-4 flex touch-pan-y", className)} {...props} />
    </div>
  )
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      className={cn("min-w-0 shrink-0 grow-0 basis-full pl-4 md:basis-1/2 lg:basis-1/3", className)}
      {...props}
    />
  )
}

function CarouselPrevious({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { canScrollPrev, scrollPrev } = useCarousel()

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("absolute -top-14 right-12 size-9", className)}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeft aria-hidden="true" />
      <span className="sr-only">Previous concerts</span>
    </Button>
  )
}

function CarouselNext({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { canScrollNext, scrollNext } = useCarousel()

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("absolute -top-14 right-0 size-9", className)}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRight aria-hidden="true" />
      <span className="sr-only">Next concerts</span>
    </Button>
  )
}

export { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi }
