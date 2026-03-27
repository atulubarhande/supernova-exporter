### Release Notes
All the updates to this exporter are documented in this file.

## Unreleased

### New

- `tokenNamingStrategy` to control how keys are built (full hierarchy, token only, Supernova `tokenPath`, parent group, full group chain, etc.)
- `lengthOutputUnit` (`preserve` | `px` | `rem`) and `remRootPx` for normalizing applicable lengths

## 1.0.0

### New

- JSON export of all design token types (color, typography, shadow, border, gradient, blur, dimension, size, space, opacity, fontSize, lineHeight, letterSpacing, paragraphSpacing, borderWidth, borderRadius, duration, zIndex, string, productCopy, fontFamily, fontWeight, textCase, textDecoration, visibility)
- Configurable token name style (camelCase, kebabCase, snakeCase)
- Configurable color format (hex, rgba, hsla)
- Optional token descriptions in output
- Single-file (`tokens.json`) or split-by-type output mode
- Brand and theme filtering support
