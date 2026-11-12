import { describe, expect, test } from "bun:test";
import { initialSignInPath, signInPath } from "./entry-flow";

describe("sign-in entry flows", () => {
  test("desktop experience starts at desktop sign-in", () => {
    expect(signInPath(false)).toBe("/login");
    expect(initialSignInPath(1590)).toBe("/login");
  });
  test("phone experience starts at shift sign-in", () => {
    expect(signInPath(true)).toBe("/m/login");
    expect(initialSignInPath(390)).toBe("/m/login");
  });
});