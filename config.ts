import { StringCase, ColorFormat } from "@supernovaio/export-utils"
import { TokenType } from "@supernovaio/sdk-exporters"

/**
 * Main configuration of the exporter - type interface. Default values for it can be set through `config.json` and users can override the behavior when creating the pipelines.
 */
export enum ThemeExportStyle {
    ApplyDirectly = "applyDirectly",
    SeparateFiles = "separateFiles",
    MergedTheme = "mergedTheme",
    NestedThemes = "nestedThemes"
}

export enum FileStructure {
    SeparateByType = "separateByType",
    SingleFile = "singleFile"
}

export enum TokenSortOrder {
    Default = "default",
    Alphabetical = "alphabetical"
}

export enum TokenNameStructure {
  PathAndName = "pathAndName",
  NameOnly = "nameOnly",
  CollectionPathAndName = "collectionPathAndName"
}

export type ExporterConfiguration = {
  showGeneratedFileDisclaimer: boolean
  disclaimer: string
  generateEmptyFiles: boolean
  showDescriptions: boolean
  useReferences: boolean
  tokenNameStyle: StringCase
  colorFormat: ColorFormat
  colorPrecision: number
  indent: number
  tokenPrefixes: Record<TokenType, string>
  styleFileNames: Record<TokenType, string>
  baseStyleFilePath: string
  exportThemesAs: ThemeExportStyle
  exportOnlyThemedTokens: boolean
  exportBaseValues: boolean
  forceRemUnit: boolean
  remBase: number
  customizeStyleFileNames: boolean
  customizeTokenPrefixes: boolean
  globalNamePrefix: string
  tokenSortOrder: TokenSortOrder
  tokenNameStructure: TokenNameStructure
  useTokenTypePrefixes: boolean
  fileStructure: FileStructure
}
