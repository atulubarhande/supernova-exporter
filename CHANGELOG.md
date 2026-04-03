### Release Notes
All the updates to this exporter are documented in this file.

## 2.5.0

### Changed

- Replaced custom JSON exporter with Supernova's official Style Dictionary exporter as the base
- All non-typography token types now use standard `CSSHelper.tokenToCSS` for industry-standard output
- Adopted hierarchical nested JSON structure (Style Dictionary compatible)
- Switched from `@supernovaio/export-helpers` to `@supernovaio/export-utils`
- Updated SDK to `@supernovaio/sdk-exporters@2.3.3`

### Preserved

- Custom typography token handling: composite typography tokens are still decomposed into atomic sub-properties (fontFamily, fontWeight, fontSize, letterSpacing, paragraphSpacing, paragraphIndent, textDecoration, textCase, lineHeight)

### New

- Theme support: separate files, apply directly, merged theme, nested themes
- Token references support (`useReferences`)
- Collection-based token organization (`collectionPathAndName`)
- Configurable file structure: separate by type or single combined file
- Token sorting (default or alphabetical)
- Global name prefix
- Token type prefix customization
- Extended color format options (HEX, RGB, HSL, OKLCH with auto variants)
- Custom style file names and output paths
- Base value export control for themed outputs

## 1.0.0

### New

- JSON export of all design token types (color, typography, shadow, border, gradient, blur, dimension, size, space, opacity, fontSize, lineHeight, letterSpacing, paragraphSpacing, borderWidth, borderRadius, duration, zIndex, string, productCopy, fontFamily, fontWeight, textCase, textDecoration, visibility)
- Configurable token name style (camelCase, kebabCase, snakeCase)
- Configurable color format (hex, rgba, hsla)
- Optional token descriptions in output
- Single-file (`tokens.json`) or split-by-type output mode
- Brand and theme filtering support
