# Current Task

Updated: 2026-08-11

## Active Task

T083: Simplify Display Settings

## Goal

Simplify the display settings panel according to the annotated product screenshot without changing the retained display behavior.

## Scope

- Keep the clock theme, dial style and inner-ring controls unchanged.
- Keep full, clock-only and floating display modes, including the clock context menu and Picture-in-Picture behavior.
- Keep the font-scale and clock-scale controls unchanged.
- Remove the display-template selector, font-family selector and five display-color inputs.
- Do not add a replacement clock-color picker.
- Let each retained clock theme own a readable application palette; `Light` must use dark text on white surfaces.
- Remove only the obsolete DOM bindings, listeners and CSS that belonged to the removed controls.
- Add focused regression coverage and browser verification.

## Out Of Scope

- No changes to `packages/clock` public contracts.
- No changes to event timing, resolution, alerts or provider behavior.
- No changes to persisted display preferences or compatibility behavior outside the removed controls.
- Keep JSON export schema version `1`.

## Gate

```powershell
npm.cmd run docs:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run build --workspace @clock/clock
```

Browser verification must confirm that only the controls marked for removal are absent, all retained controls still work, display modes remain available and the console has no errors or warnings.

## Result

Completed on `codex/feature/simplify-display-settings`.

- The template selector, font-family selector and five color inputs were removed.
- Clock appearance, display mode, font scale and clock scale remain wired to their existing behavior.
- No replacement color picker was introduced.
- Theme-owned CSS colors are no longer overridden by legacy inline display colors, so `Light` renders dark text on white surfaces and `Dark` remains light on dark.
- Documentation, lint, typecheck, all `151` tests across `21` files, the production build and the core-library build pass.
- Browser verification confirmed that the retained appearance, mode and scale controls work; the removed controls are absent; floating, clock-only and full modes remain active; and the warning/error console is empty.
