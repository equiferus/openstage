import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Routes } from "@/routes/routes"

describe("Openstage single-page catalog", () => {
  it("renders the featured concert with ordered recommendation rails", () => {
    window.location.hash = "#/"
    render(<Routes />)

    expect(screen.getByRole("heading", { name: "The Monolith at AlUla", level: 1 })).toBeInTheDocument()
    const player = screen.getByTitle("The Monolith at AlUla video player")
    expect(player).toHaveAttribute("src", expect.stringContaining("autoplay=1"))
    expect(player).toHaveAttribute("src", expect.stringContaining("mute=1"))
    expect(screen.getByRole("heading", { name: "Setlist", level: 2 })).toBeVisible()
    expect(screen.getByRole("button", { name: "Play Intro at 00:00" })).toBeVisible()

    const recommendations = screen.getByRole("heading", { name: "Recommended concerts" }).closest("section")
    expect(recommendations).not.toBeNull()
    expect(within(recommendations!).getAllByRole("button", { name: /Play .* by/ }).map((button) => button.getAttribute("aria-label"))).toEqual([
      "Play Live in Concert — The Ultimate Experience by Hans Zimmer",
      "Play Live from Joshua Tree by RÜFÜS DU SOL",
      "Play Fuji Rock Festival 2025 by Fred again..",
      "Play The Finale — Live from the Gorge by ODESZA",
      "Play The Best of Armin Only by Armin van Buuren",
      "Play Doncaster Warehouse 1992 by DJ M-Zone",
      "Play Live at Bizarre Festival by Marilyn Manson",
    ])

    expect(screen.getByRole("heading", { name: "More from David Guetta" })).toBeInTheDocument()
  })

  it("selects a recommendation in the central player and updates the URL", async () => {
    const user = userEvent.setup()
    window.location.hash = "#/"
    render(<Routes />)

    await user.click(screen.getByRole("button", { name: "Play Live in Concert — The Ultimate Experience by Hans Zimmer" }))

    expect(screen.getByRole("heading", { name: "Live in Concert — The Ultimate Experience", level: 1 })).toBeInTheDocument()
    expect(screen.getByTitle("Live in Concert — The Ultimate Experience video player")).toBeInTheDocument()
    expect(window.location.hash).toBe("#/?concert=hans-zimmer-diamond-in-the-desert-compilation")
    expect(screen.queryByRole("heading", { name: "More from Hans Zimmer" })).not.toBeInTheDocument()
  })

  it("searches and filters artists and concerts with the drawer table", async () => {
    const user = userEvent.setup()
    window.location.hash = "#/"
    render(<Routes />)

    await user.click(screen.getByRole("button", { name: "Search artists and concerts" }))
    expect(screen.getByRole("dialog", { name: "Search Openstage" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Concerts" }))
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter by artist" }), "david-guetta")
    expect(screen.getByText("3 results")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Play David Guetta's primary concert" })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByRole("combobox", { name: "Filter by artist" }), "")
    const search = screen.getByRole("searchbox", { name: "Search catalog" })
    await user.type(search, "Joshua Tree")
    await user.click(screen.getByRole("button", { name: "Play Live from Joshua Tree by RÜFÜS DU SOL" }))

    expect(screen.queryByRole("dialog", { name: "Search Openstage" })).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Live from Joshua Tree", level: 1 })).toBeInTheDocument()
    expect(window.location.hash).toBe("#/?concert=rufus-du-sol-live-joshua-tree")
  })

  it("routes concert and feature suggestions to separate issue forms", async () => {
    const user = userEvent.setup()
    window.location.hash = "#/"
    render(<Routes />)

    await user.click(screen.getAllByRole("button", { name: "Suggest" })[0])

    expect(screen.getByRole("dialog", { name: "What would you like to suggest?" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Add a concert/ })).toHaveAttribute(
      "href",
      "https://github.com/equiferus/openstage/issues/new?template=recording-suggestion.yml",
    )
    expect(screen.getByRole("link", { name: /Suggest an app feature/ })).toHaveAttribute(
      "href",
      "https://github.com/equiferus/openstage/issues/new?template=feature-suggestion.yml",
    )
  })

  it("selects an artist search result through its primary concert", async () => {
    const user = userEvent.setup()
    window.location.hash = "#/"
    render(<Routes />)

    await user.click(screen.getByRole("button", { name: "Search artists and concerts" }))
    await user.type(screen.getByRole("searchbox", { name: "Search catalog" }), "ODESZA")
    await user.click(screen.getByRole("button", { name: "Play ODESZA's primary concert" }))

    expect(screen.getByRole("heading", { name: "The Finale — Live from the Gorge", level: 1 })).toBeInTheDocument()
  })

  it("normalizes legacy routes and responds to browser history state", () => {
    window.location.hash = "#/artists/rufus-du-sol"
    render(<Routes />)

    expect(screen.getByRole("heading", { name: "Live from Joshua Tree", level: 1 })).toBeInTheDocument()
    expect(window.location.hash).toBe("#/?concert=rufus-du-sol-live-joshua-tree")

    window.history.pushState(null, "", "#/?concert=odesza-finale-gorge")
    fireEvent(window, new PopStateEvent("popstate"))
    expect(screen.getByRole("heading", { name: "The Finale — Live from the Gorge", level: 1 })).toBeInTheDocument()
  })

  it("falls back to the featured concert for invalid links", () => {
    window.location.hash = "#/?concert=not-here"
    render(<Routes />)

    expect(screen.getByRole("heading", { name: "The Monolith at AlUla", level: 1 })).toBeInTheDocument()
    expect(window.location.hash).toBe("#/")
  })
})
