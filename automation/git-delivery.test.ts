import { describe, expect, test } from "bun:test"

import { validateDeliveryBranch } from "./git-delivery"

describe("Git delivery fallback", () => {
  test("accepts only the linked issue branch namespace", () => {
    expect(validateDeliveryBranch("issue/42-light-mode", 42)).toBe("issue/42-light-mode")
    expect(() => validateDeliveryBranch("issue/41-light-mode", 42)).toThrow("Unsafe delivery branch")
    expect(() => validateDeliveryBranch("main", 42)).toThrow("Unsafe delivery branch")
    expect(() => validateDeliveryBranch("issue/42-bad branch", 42)).toThrow("Unsafe delivery branch")
  })
})
