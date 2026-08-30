import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Routes } from "@/routes/routes"

describe("Openstage routes", () => {
  it("renders the featured performance and ordered artist catalog", () => {
    window.location.hash = "#/"
    render(<Routes />)

    expect(screen.getByRole("heading", { name: /David Guetta turns the desert/i })).toBeInTheDocument()
    const player = screen.getByTitle("The Monolith at AlUla video player")
    expect(player).toHaveAttribute("src", expect.stringContaining("autoplay=1"))
    expect(player).toHaveAttribute("src", expect.stringContaining("mute=1"))

    const artistLinks = screen.getAllByRole("link", { name: /View .* recordings/ })
    expect(artistLinks.map((link) => link.getAttribute("aria-label"))).toEqual([
      "View David Guetta recordings",
      "View Hans Zimmer recordings",
      "View RÜFÜS DU SOL recordings",
      "View Fred again.. recordings",
      "View ODESZA recordings",
      "View Armin van Buuren recordings",
    ])
  })

  it("renders an artist route and switches David Guetta recordings", async () => {
    const user = userEvent.setup()
    window.location.hash = "#/artists/david-guetta"
    render(<Routes />)

    expect(screen.getByRole("heading", { name: "David Guetta", level: 1 })).toBeInTheDocument()
    expect(screen.getByTitle("The Monolith at AlUla video player")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /United at Home — Dubai Edition/i }))
    expect(screen.getByTitle("United at Home — Dubai Edition video player")).toBeInTheDocument()
    expect(screen.getByText("Burj Al Arab helipad")).toBeInTheDocument()
  })

  it("updates when the hash route changes", () => {
    window.location.hash = "#/"
    render(<Routes />)

    window.location.hash = "#/artists/rufus-du-sol"
    fireEvent(window, new HashChangeEvent("hashchange"))

    expect(screen.getByRole("heading", { name: "RÜFÜS DU SOL", level: 1 })).toBeInTheDocument()
  })

  it("shows a friendly not-found state", () => {
    window.location.hash = "#/artists/not-here"
    render(<Routes />)

    expect(screen.getByRole("heading", { name: "This stage is empty." })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Return home/ })).toHaveAttribute("href", "#/")
  })
})
