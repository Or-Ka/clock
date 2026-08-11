import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("public release configuration", () => {
  it("serves a restrictive production policy with only the documented data providers", () => {
    const vercel = JSON.parse(readRepositoryFile("vercel.json")) as {
      readonly headers?: readonly {
        readonly headers: readonly { readonly key: string; readonly value: string }[];
      }[];
    };
    const headers = new Map(
      vercel.headers?.flatMap((rule) => rule.headers.map((header) => [header.key, header.value]))
    );
    const contentSecurityPolicy = headers.get("Content-Security-Policy") ?? "";

    expect(contentSecurityPolicy).toContain("default-src 'self'");
    expect(contentSecurityPolicy).toContain("script-src 'self'");
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
    expect(contentSecurityPolicy).toContain("https://api.sunrise-sunset.org");
    expect(contentSecurityPolicy).toContain("https://www.hebcal.com");
    expect(contentSecurityPolicy).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("pins CI actions and enforces audit, formatting and least privilege", () => {
    const ci = readRepositoryFile(".github/workflows/ci.yml");

    expect(ci).toContain("contents: read");
    expect(ci).toContain("npm audit --audit-level=high");
    expect(ci).toContain("npm run format:check");
    expect(ci).toMatch(/actions\/checkout@[\da-f]{40}/u);
    expect(ci).toMatch(/actions\/setup-node@[\da-f]{40}/u);
    expect(ci).not.toMatch(/uses: [^\n]+@v\d+/u);
  });

  it("ships the optimized developer animation and public collaboration files", () => {
    const webp = join(repositoryRoot, "apps/web/src/dev.webp");

    expect(existsSync(webp)).toBe(true);
    expect(statSync(webp).size).toBeLessThan(100_000);
    expect(existsSync(join(repositoryRoot, "apps/web/src/dev.gif"))).toBe(false);
    expect(readRepositoryFile("README.md")).toContain("https://heb-clock.vercel.app");
    expect(readRepositoryFile("LICENSE")).toContain("MIT License");
    expect(readRepositoryFile("SECURITY.md")).toContain("Report a vulnerability");
    expect(readRepositoryFile("CONTRIBUTING.md")).toContain("npm.cmd run format:check");
  });
});

function readRepositoryFile(path: string): string {
  return readFileSync(join(repositoryRoot, path), "utf8").replaceAll("\r\n", "\n");
}
