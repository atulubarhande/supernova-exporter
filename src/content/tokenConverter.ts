import { ColorHelper, NamingHelper, StringCase, ColorFormat } from "@supernovaio/export-helpers"
import {
  Token,
  TokenGroup,
  TokenType,
  ColorToken,
  TypographyToken,
  ShadowToken,
  BorderToken,
  GradientToken,
  BlurToken,
  Unit,
  ColorTokenValue,
  ShadowTokenValue,
  GradientTokenValue,
  AnyDimensionToken,
  AnyStringToken,
  TextCaseToken,
  TextDecorationToken,
  VisibilityToken,
} from "@supernovaio/sdk-exporters"
import { ExporterConfiguration } from "../../config"

export type TokenJsonEntry = {
  value: any
  type: string
  description?: string
}

export type TypographyAtomicEntries = {
  kind: "atomic"
  entries: Record<string, { value: any; type: string }>
}

const STRING_CASE_MAP: Record<ExporterConfiguration["tokenNameStyle"], StringCase> = {
  camelCase: StringCase.camelCase,
  kebabCase: StringCase.paramCase,
  snakeCase: StringCase.snakeCase,
}

const COLOR_FORMAT_MAP: Record<ExporterConfiguration["colorFormat"], ColorFormat> = {
  hex: ColorFormat.hashHex8,
  rgba: ColorFormat.rgba,
  hsla: ColorFormat.hsla,
}

export function tokenName(
  token: Token,
  tokenGroups: Array<TokenGroup>,
  nameStyle: ExporterConfiguration["tokenNameStyle"]
): string {
  const parent = tokenGroups.find((g) => g.id === token.parentGroupId) ?? null
  return NamingHelper.codeSafeVariableNameForToken(token, STRING_CASE_MAP[nameStyle], parent, null)
}

export function tokenTypeName(tokenType: TokenType): string {
  const map: Record<TokenType, string> = {
    [TokenType.color]: "color",
    [TokenType.typography]: "typography",
    [TokenType.shadow]: "shadow",
    [TokenType.border]: "border",
    [TokenType.gradient]: "gradient",
    [TokenType.blur]: "blur",
    [TokenType.radius]: "borderRadius",
    [TokenType.borderWidth]: "borderWidth",
    [TokenType.duration]: "duration",
    [TokenType.fontSize]: "fontSize",
    [TokenType.dimension]: "dimension",
    [TokenType.letterSpacing]: "letterSpacing",
    [TokenType.lineHeight]: "lineHeight",
    [TokenType.opacity]: "opacity",
    [TokenType.paragraphSpacing]: "paragraphSpacing",
    [TokenType.size]: "size",
    [TokenType.space]: "space",
    [TokenType.zIndex]: "zIndex",
    [TokenType.textDecoration]: "textDecoration",
    [TokenType.textCase]: "textCase",
    [TokenType.visibility]: "visibility",
    [TokenType.fontFamily]: "fontFamily",
    [TokenType.fontWeight]: "fontWeight",
    [TokenType.string]: "string",
    [TokenType.productCopy]: "productCopy",
  }
  return map[tokenType] ?? tokenType
}

function formatColor(color: ColorTokenValue, colorFormat: ExporterConfiguration["colorFormat"]): string {
  return ColorHelper.formattedColor(color, COLOR_FORMAT_MAP[colorFormat], 3)
}

function unitSuffix(unit: Unit): string {
  switch (unit) {
    case Unit.pixels: return "px"
    case Unit.percent: return "%"
    case Unit.rem: return "rem"
    case Unit.ms: return "ms"
    case Unit.raw: return ""
    default: return ""
  }
}

function remRoot(config: ExporterConfiguration): number {
  const n = config.remRootPx
  return Number.isFinite(n) && n > 0 ? n : 16
}

/** Supernova shadow offsets and blur radii are stored as pixel numbers without a unit field. */
function formatShadowPixelLength(pxValue: number, config: ExporterConfiguration): number | string {
  if (config.lengthOutputUnit === "preserve") {
    return pxValue
  }
  const px = parseFloat(pxValue.toFixed(3))
  if (config.lengthOutputUnit === "px") {
    return `${px}px`
  }
  const rem = px / remRoot(config)
  return `${parseFloat(rem.toFixed(4))}rem`
}

function formatDimensionValue(value: { unit: Unit; measure: number }, config: ExporterConfiguration): string {
  const m = value.measure
  const mode = config.lengthOutputUnit

  switch (value.unit) {
    case Unit.ms:
      return `${parseFloat(m.toFixed(3))}ms`
    case Unit.raw:
      return String(parseFloat(m.toFixed(3)))
    case Unit.percent:
      return `${parseFloat(m.toFixed(3))}%`
    case Unit.pixels: {
      if (mode === "rem") {
        const rem = m / remRoot(config)
        return `${parseFloat(rem.toFixed(4))}rem`
      }
      return `${parseFloat(m.toFixed(3))}px`
    }
    case Unit.rem: {
      if (mode === "px") {
        const px = m * remRoot(config)
        return `${parseFloat(px.toFixed(3))}px`
      }
      return `${parseFloat(m.toFixed(4))}rem`
    }
    default:
      return `${parseFloat(m.toFixed(3))}${unitSuffix(value.unit)}`
  }
}

export function convertToken(
  token: Token,
  config: ExporterConfiguration
): any | TypographyAtomicEntries {
  switch (token.tokenType) {
    case TokenType.color:
      return convertColorToken(token as ColorToken, config)
    case TokenType.typography:
      return convertTypographyToken(token as TypographyToken, config)
    case TokenType.shadow:
      return convertShadowToken(token as ShadowToken, config)
    case TokenType.border:
      return convertBorderToken(token as BorderToken, config)
    case TokenType.gradient:
      return convertGradientToken(token as GradientToken, config)
    case TokenType.blur:
      return convertBlurToken(token as BlurToken, config)
    case TokenType.dimension:
    case TokenType.size:
    case TokenType.space:
    case TokenType.opacity:
    case TokenType.fontSize:
    case TokenType.lineHeight:
    case TokenType.letterSpacing:
    case TokenType.paragraphSpacing:
    case TokenType.borderWidth:
    case TokenType.radius:
    case TokenType.duration:
    case TokenType.zIndex:
      return convertDimensionToken(token as AnyDimensionToken, config)
    case TokenType.string:
    case TokenType.productCopy:
    case TokenType.fontFamily:
    case TokenType.fontWeight:
      return convertStringToken(token as AnyStringToken, config)
    case TokenType.textCase:
      return convertOptionToken(token as TextCaseToken, config)
    case TokenType.textDecoration:
      return convertOptionToken(token as TextDecorationToken, config)
    case TokenType.visibility:
      return convertOptionToken(token as VisibilityToken, config)
    default:
      return null
  }
}

function convertColorToken(token: ColorToken, config: ExporterConfiguration): string {
  return formatColor(token.value, config.colorFormat)
}

function convertTypographyToken(token: TypographyToken, config: ExporterConfiguration): TypographyAtomicEntries {
  const v = token.value
  const entries: Record<string, { value: any; type: string }> = {
    fontFamily: { value: v.fontFamily.text, type: "fontFamily" },
    fontWeight: { value: v.fontWeight.text, type: "fontWeight" },
    fontSize: { value: formatDimensionValue(v.fontSize, config), type: "fontSize" },
    letterSpacing: { value: formatDimensionValue(v.letterSpacing, config), type: "letterSpacing" },
    paragraphSpacing: { value: formatDimensionValue(v.paragraphSpacing, config), type: "paragraphSpacing" },
    paragraphIndent: { value: formatDimensionValue(v.paragraphIndent, config), type: "paragraphSpacing" },
    textDecoration: { value: v.textDecoration.value, type: "textDecoration" },
    textCase: { value: v.textCase.value, type: "textCase" },
  }
  if (v.lineHeight) {
    entries.lineHeight = { value: formatDimensionValue(v.lineHeight, config), type: "lineHeight" }
  }
  return { kind: "atomic", entries }
}

function convertShadowLayer(layer: ShadowTokenValue, config: ExporterConfiguration): Record<string, any> {
  return {
    color: formatColor(layer.color, config.colorFormat),
    offsetX: formatShadowPixelLength(layer.x, config),
    offsetY: formatShadowPixelLength(layer.y, config),
    blur: formatShadowPixelLength(layer.radius, config),
    spread: formatShadowPixelLength(layer.spread, config),
    type: layer.type,
  }
}

function convertShadowToken(token: ShadowToken, config: ExporterConfiguration): any {
  if (token.value.length === 1) {
    return convertShadowLayer(token.value[0], config)
  }
  return token.value.map((layer) => convertShadowLayer(layer, config))
}

function convertBorderToken(token: BorderToken, config: ExporterConfiguration): Record<string, any> {
  return {
    color: formatColor(token.value.color, config.colorFormat),
    width: formatDimensionValue(token.value.width, config),
    style: token.value.style,
    position: token.value.position,
  }
}

function convertGradientLayer(layer: GradientTokenValue, config: ExporterConfiguration): Record<string, any> {
  return {
    type: layer.type,
    from: layer.from,
    to: layer.to,
    aspectRatio: layer.aspectRatio,
    stops: layer.stops.map((stop) => ({
      position: stop.position,
      color: formatColor(stop.color, config.colorFormat),
    })),
  }
}

function convertGradientToken(token: GradientToken, config: ExporterConfiguration): any {
  if (token.value.length === 1) {
    return convertGradientLayer(token.value[0], config)
  }
  return token.value.map((layer) => convertGradientLayer(layer, config))
}

function convertBlurToken(token: BlurToken, config: ExporterConfiguration): Record<string, any> {
  return {
    type: token.value.type,
    radius: formatDimensionValue(token.value.radius, config),
  }
}

function convertDimensionToken(token: AnyDimensionToken, config: ExporterConfiguration): string {
  return formatDimensionValue(token.value, config)
}

function convertStringToken(token: AnyStringToken, _config: ExporterConfiguration): string {
  return token.value.text
}

function convertOptionToken(
  token: TextCaseToken | TextDecorationToken | VisibilityToken,
  _config: ExporterConfiguration
): string {
  return token.value.value
}
