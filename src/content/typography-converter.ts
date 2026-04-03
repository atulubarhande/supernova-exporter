import { TypographyToken, Unit } from "@supernovaio/sdk-exporters"
import { ExporterConfiguration } from "../../config"

export type TypographyAtomicEntry = {
  value: string
  type: string
}

/**
 * Formats a dimension sub-value from a typography token using the exporter's
 * rem/px configuration. Respects forceRemUnit and remBase from config.
 */
function formatDimensionValue(
  value: { unit: Unit; measure: number },
  config: ExporterConfiguration
): string {
  const m = value.measure
  const remBase = (Number.isFinite(config.remBase) && config.remBase > 0) ? config.remBase : 16

  switch (value.unit) {
    case Unit.ms:
      return `${parseFloat(m.toFixed(3))}ms`
    case Unit.raw:
      return String(parseFloat(m.toFixed(3)))
    case Unit.percent:
      return `${parseFloat(m.toFixed(3))}%`
    case Unit.pixels: {
      if (config.forceRemUnit) {
        const rem = m / remBase
        return `${parseFloat(rem.toFixed(4))}rem`
      }
      return `${parseFloat(m.toFixed(3))}px`
    }
    case Unit.rem: {
      return `${parseFloat(m.toFixed(4))}rem`
    }
    default:
      return `${parseFloat(m.toFixed(3))}`
  }
}

/**
 * Decomposes a composite typography token into individual atomic sub-properties.
 * Each sub-property (fontFamily, fontWeight, fontSize, etc.) becomes its own
 * entry with an appropriate value and type identifier.
 *
 * This is the custom typography handling ported from the original exporter.
 * Instead of outputting a single CSS font shorthand, it fans out into:
 * fontFamily, fontWeight, fontSize, letterSpacing, paragraphSpacing,
 * paragraphIndent, textDecoration, textCase, and optionally lineHeight.
 */
export function convertTypographyToken(
  token: TypographyToken,
  config: ExporterConfiguration
): Record<string, TypographyAtomicEntry> {
  const v = token.value
  const entries: Record<string, TypographyAtomicEntry> = {
    fontFamily:       { value: v.fontFamily.text,                              type: "fontFamily" },
    fontWeight:       { value: v.fontWeight.text,                              type: "fontWeight" },
    fontSize:         { value: formatDimensionValue(v.fontSize, config),        type: "fontSize" },
    letterSpacing:    { value: formatDimensionValue(v.letterSpacing, config),   type: "letterSpacing" },
    paragraphSpacing: { value: formatDimensionValue(v.paragraphSpacing, config), type: "paragraphSpacing" },
    paragraphIndent:  { value: formatDimensionValue(v.paragraphIndent, config), type: "paragraphSpacing" },
    textDecoration:   { value: v.textDecoration.value,                         type: "textDecoration" },
    textCase:         { value: v.textCase.value,                               type: "textCase" },
  }

  if (v.lineHeight) {
    entries.lineHeight = { value: formatDimensionValue(v.lineHeight, config), type: "lineHeight" }
  }

  return entries
}
