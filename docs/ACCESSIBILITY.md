# Accessibility

## Current Application

- The official web application uses `lang="he"` and `dir="rtl"`.
- Visible UI text is Hebrew-first, with technical timezone identifiers kept as IANA strings.
- Buttons, inputs, selects and links use visible focus outlines.
- Validation messages are shown in Hebrew.
- The current marker interaction model is still application-managed and should be improved in `packages/clock` in a later phase.

## Required Future Work

Marker accessibility in the library should support an explicit opt-in mode:

```ts
markerInteraction?: "none" | "focusable";
onMarkerActivate?: (event: ResolvedInstantEvent) => void;
```

When enabled, markers must support focus, Enter, Space, visible focus rings and cleanup.

## Migration Note

The app migration does not change marker behavior. It preserves existing behavior and documents the accessibility work for a separate phase.
