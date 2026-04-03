# Style Dictionary Exporter for Supernova (Custom Typography)

A [Supernova](https://supernova.io) exporter that outputs design tokens in [Style Dictionary](https://amzn.github.io/style-dictionary/) JSON format. Based on Supernova's official Style Dictionary exporter, with **custom typography handling** that decomposes composite typography tokens into atomic sub-properties.

## Typography: Atomic Decomposition

Instead of exporting typography tokens as a single CSS font shorthand, this exporter fans them out into individual sub-properties for easy mapping to SCSS variables or utility classes:

```json
{
  "typography": {
    "heading": {
      "font-family": { "value": "Inter", "type": "fontFamily" },
      "font-weight": { "value": "700", "type": "fontWeight" },
      "font-size": { "value": "24px", "type": "fontSize" },
      "line-height": { "value": "32px", "type": "lineHeight" },
      "letter-spacing": { "value": "0px", "type": "letterSpacing" },
      "paragraph-spacing": { "value": "0px", "type": "paragraphSpacing" },
      "paragraph-indent": { "value": "0px", "type": "paragraphSpacing" },
      "text-decoration": { "value": "none", "type": "textDecoration" },
      "text-case": { "value": "none", "type": "textCase" }
    }
  }
}
```

All other token types (color, dimension, shadow, border, gradient, blur, etc.) use the standard Style Dictionary output via `CSSHelper.tokenToCSS`.

## Supported Token Types

- **Color** -- HEX, RGB, HSL, OKLCH with auto/fixed alpha variants
- **Typography** -- atomic sub-property decomposition (fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, paragraphSpacing, paragraphIndent, textDecoration, textCase)
- **Shadow** -- CSS box-shadow compatible output
- **Border** -- CSS border shorthand
- **Gradient** -- linear/radial/angular gradients
- **Blur** -- layer/background blur
- **Dimensions** -- dimension, size, space, opacity, fontSize, lineHeight, letterSpacing, paragraphSpacing, borderWidth, borderRadius, duration, zIndex
- **Strings** -- string, productCopy, fontFamily, fontWeight
- **Options** -- textCase, textDecoration, visibility

## Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `tokenNameStructure` | enum | `pathAndName` | How hierarchy is included: `pathAndName`, `nameOnly`, `collectionPathAndName` |
| `tokenNameStyle` | enum | `kebabCase` | Case style: `camelCase`, `kebabCase`, `snakeCase`, `constantCase`, `pascalCase`, `flatCase` |
| `colorFormat` | enum | `smartHashHex` | Color format with auto/fixed variants for HEX, RGB, HSL, OKLCH |
| `forceRemUnit` | boolean | `false` | Convert all pixel values to REM units |
| `remBase` | number | `16` | Base px value for REM conversion |
| `useReferences` | boolean | `true` | Output token references where applicable |
| `colorPrecision` | number | `3` | Maximum decimals in color values |
| `exportThemesAs` | enum | `separateFiles` | Theme export mode: `separateFiles`, `applyDirectly`, `mergedTheme`, `nestedThemes` |
| `exportOnlyThemedTokens` | boolean | `false` | Themed files include only overridden tokens |
| `exportBaseValues` | boolean | `true` | Export base values alongside themes |
| `fileStructure` | enum | `separateByType` | File organization: `separateByType` or `singleFile` |
| `generateEmptyFiles` | boolean | `false` | Generate empty files instead of omitting |
| `tokenSortOrder` | enum | `default` | Token sorting: `default` or `alphabetical` |
| `baseStyleFilePath` | string | `./base` | Output directory for style files |
| `globalNamePrefix` | string | `""` | Prefix for all token names |
| `useTokenTypePrefixes` | boolean | `true` | Prefix hierarchy with token type |
| `showDescriptions` | boolean | `true` | Include token descriptions in output |
| `showGeneratedFileDisclaimer` | boolean | `true` | Add auto-generated disclaimer comment |
| `indent` | number | `2` | JSON indentation spaces |

## Dependencies

This exporter depends on `@supernovaio/export-utils`, included in the `utils/` directory (from [Supernova-Studio/exporters](https://github.com/Supernova-Studio/exporters)).

## Development

```bash
npm install
npm run dev     # watch mode
npm run build   # production build
```
