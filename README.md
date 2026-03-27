# JSON Exporter for Supernova

A custom [Supernova](https://supernova.io) exporter that outputs all design tokens as structured JSON.

## Supported Token Types

- **Color** -- hex, rgba, or hsla output
- **Typography** -- atomic output: each sub-property (fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, textCase, textDecoration) becomes its own token for easy Bootstrap/SCSS variable mapping
- **Shadow** -- single or multi-layer with color, offsets, blur, spread
- **Border** -- color, width, style, position
- **Gradient** -- linear/radial/angular with color stops
- **Blur** -- layer or background blur with radius
- **Dimension-like** -- dimension, size, space, opacity, fontSize, lineHeight, letterSpacing, paragraphSpacing, borderWidth, borderRadius, duration, zIndex
- **String-like** -- string, productCopy, fontFamily, fontWeight
- **Option-like** -- textCase, textDecoration, visibility

## Example Output

Given a design system with tokens, the exporter produces:

```json
{
  "color": {
    "colorPrimary": {
      "value": "#3366ffff",
      "type": "color",
      "description": "Primary brand color"
    },
    "colorSecondary": {
      "value": "#ff6633ff",
      "type": "color"
    }
  },
  "dimension": {
    "spacingSmall": {
      "value": "8px",
      "type": "dimension"
    }
  },
  "typography": {
    "headingFontFamily": {
      "value": "Inter",
      "type": "fontFamily"
    },
    "headingFontWeight": {
      "value": "700",
      "type": "fontWeight"
    },
    "headingFontSize": {
      "value": "24px",
      "type": "fontSize"
    },
    "headingLineHeight": {
      "value": "32px",
      "type": "lineHeight"
    },
    "headingLetterSpacing": {
      "value": "0px",
      "type": "letterSpacing"
    }
  }
}
```

When `splitByTokenType` is enabled, each type gets its own file (e.g. `color.json`, `typography.json`, `dimension.json`).

## Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `generateDisclaimer` | boolean | `true` | Adds a `_comment` field indicating the file is auto-generated |
| `tokenNameStyle` | enum | `camelCase` | Naming convention for token keys: `camelCase`, `kebabCase`, or `snakeCase` |
| `colorFormat` | enum | `hex` | Color output format: `hex`, `rgba`, or `hsla` |
| `includeDescriptions` | boolean | `true` | Includes token descriptions in the output |
| `splitByTokenType` | boolean | `false` | Generates separate files per token type instead of a single `tokens.json` |
| `lengthOutputUnit` | enum | `preserve` | Lengths for spacing, sizing, typography dimensions, border width, blur, and shadow offsets: `preserve` keeps Supernova units; `px` outputs px (converts `rem` tokens using `remRootPx`); `rem` outputs rem (converts `px` tokens using `remRootPx`). Percent, raw (unitless), and `ms` are unchanged. |
| `remRootPx` | number | `16` | Root font size in px for px↔rem conversion when `lengthOutputUnit` is `px` or `rem`. |

Override defaults by editing `config.local.json`:

```json
{
  "tokenNameStyle": "kebabCase",
  "colorFormat": "rgba",
  "splitByTokenType": true,
  "lengthOutputUnit": "rem",
  "remRootPx": 16
}
```

## Development

```bash
npm install
npm run dev     # watch mode
npm run build   # production build
```
