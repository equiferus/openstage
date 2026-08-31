import { useMemo, useState } from "react"
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  filterFn_equalsString,
  filterFn_includesString,
  globalFilteringFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import { Headphones, MapPin, Play, Search } from "lucide-react"

import { listArtists } from "@/domain/artists/api"
import type { Concert } from "@/domain/artists/concerts/api"
import { getConcertById, getPrimaryConcertByArtistId, listConcerts } from "@/domain/artists/concerts/api"
import { cn } from "@/lib/utils"
import { createCatalogSearchRows, type CatalogSearchKind, type CatalogSearchRow } from "@/lib/catalog-search"
import { Badge } from "@/lib/ui/primitives/badge"
import { Button } from "@/lib/ui/primitives/button"
import { Input } from "@/lib/ui/primitives/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/lib/ui/primitives/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/lib/ui/primitives/table"

const artists = listArtists()
const searchRows = createCatalogSearchRows(artists, listConcerts())
const searchFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: {
    equalsString: filterFn_equalsString,
    includesString: filterFn_includesString,
  },
})
const columnHelper = createColumnHelper<typeof searchFeatures, CatalogSearchRow>()
const columns = columnHelper.columns([
  columnHelper.accessor("searchText", {
    id: "result",
    header: "Results",
    filterFn: "includesString",
  }),
  columnHelper.accessor("kind", {
    header: "Type",
    filterFn: "equalsString",
  }),
  columnHelper.accessor("artistId", {
    header: "Artist",
    filterFn: "equalsString",
  }),
])

interface SearchDrawerProps {
  onSelectConcert: (concert: Concert) => void
}

export function SearchDrawer({ onSelectConcert }: SearchDrawerProps) {
  const [open, setOpen] = useState(false)
  const data = useMemo(() => searchRows, [])
  const table = useTable({
    columns,
    data,
    features: searchFeatures,
    globalFilterFn: "includesString",
    getColumnCanGlobalFilter: (column) => column.id === "result",
    getRowId: (row) => row.id,
  })
  const activeKind = table.getColumn("kind")?.getFilterValue() as CatalogSearchKind | undefined
  const activeArtist = table.getColumn("artistId")?.getFilterValue() as string | undefined
  const filteredRows = table.getRowModel().rows

  function selectResult(result: CatalogSearchRow) {
    const concert = result.concertId
      ? getConcertById(result.concertId)
      : getPrimaryConcertByArtistId(result.artistId)

    if (!concert) return

    onSelectConcert(concert)
    setOpen(false)
  }

  function setKind(kind?: CatalogSearchKind) {
    table.getColumn("kind")?.setFilterValue(kind)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Search artists and concerts">
          <Search aria-hidden="true" />
          <span className="hidden sm:inline">Search</span>
        </Button>
      </SheetTrigger>
      <SheetContent closeLabel="Close search">
        <div className="border-b border-white/8 px-5 py-6 pr-16 sm:px-7">
          <SheetHeader>
            <SheetTitle>Search Openstage</SheetTitle>
            <SheetDescription>Find an artist or recording and send it to the main stage.</SheetDescription>
          </SheetHeader>

          <div className="relative mt-6">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-600" aria-hidden="true" />
            <Input
              autoFocus
              className="pl-10"
              type="search"
              placeholder="Artist, concert, venue, city…"
              value={(table.state.globalFilter as string | undefined) ?? ""}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              aria-label="Search catalog"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2" aria-label="Result type filter">
            {([
              [undefined, "All"],
              ["artist", "Artists"],
              ["concert", "Concerts"],
            ] as const).map(([kind, label]) => (
              <Button
                key={label}
                type="button"
                size="sm"
                variant={activeKind === kind ? "secondary" : "ghost"}
                aria-pressed={activeKind === kind}
                onClick={() => setKind(kind)}
              >
                {label}
              </Button>
            ))}
          </div>

          <label className="mt-4 block">
            <span className="sr-only">Filter by artist</span>
            <select
              className="h-10 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm text-zinc-300 outline-none transition focus:border-amber-300/40 focus:ring-2 focus:ring-amber-400/20"
              value={activeArtist ?? ""}
              onChange={(event) => table.getColumn("artistId")?.setFilterValue(event.target.value || undefined)}
            >
              <option value="">All artists</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>{artist.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-4">
          <p className="px-3 py-2 text-xs text-zinc-600" aria-live="polite">
            {filteredRows.length} {filteredRows.length === 1 ? "result" : "results"}
          </p>
          {filteredRows.length ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Results</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => {
                  const result = row.original
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="p-0">
                        <button
                          type="button"
                          className="group flex w-full items-start gap-3 rounded-xl px-3 py-4 text-left outline-none focus-visible:bg-white/8"
                          onClick={() => selectResult(result)}
                          aria-label={result.kind === "artist" ? `Play ${result.artistName}'s primary concert` : `Play ${result.title} by ${result.artistName}`}
                        >
                          <span className={cn(
                            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border",
                            result.kind === "artist"
                              ? "border-amber-300/20 bg-amber-400/8 text-amber-300"
                              : "border-white/10 bg-white/5 text-zinc-400 group-hover:text-white",
                          )}>
                            {result.kind === "artist" ? <Headphones className="size-4" aria-hidden="true" /> : <Play className="ml-0.5 size-3.5 fill-current" aria-hidden="true" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-zinc-100">{result.title}</span>
                              <Badge className="px-2 py-0.5 text-[0.6rem]">{result.kind}</Badge>
                            </span>
                            {result.kind === "concert" ? <span className="mt-1 block text-xs font-medium text-amber-300">{result.artistName}</span> : null}
                            <span className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-zinc-600">
                              <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                              <span className="line-clamp-2">{result.context}</span>
                            </span>
                          </span>
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="mx-3 mt-6 rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
              <Search className="mx-auto size-6 text-zinc-700" aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold text-zinc-300">No performances found</p>
              <p className="mt-1 text-xs leading-5 text-zinc-600">Try another term or clear one of the filters.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
