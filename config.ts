/**
 * Main configuration of the exporter - type interface.
 * Default values for it can be set through `config.json`
 * Users can override the behavior when creating the pipelines or by creating `config.local.json` file specifying actual values.
 */
export type ExporterConfiguration = {
  generateDisclaimer: boolean
  tokenNameStyle: "camelCase" | "kebabCase" | "snakeCase"
  colorFormat: "hex" | "rgba" | "hsla"
  includeDescriptions: boolean
  splitByTokenType: boolean
  /** How to output CSS lengths: keep Supernova units, normalize to px, or normalize to rem */
  lengthOutputUnit: "preserve" | "px" | "rem"
  /** Root font size in px used when converting between px and rem */
  remRootPx: number
}
