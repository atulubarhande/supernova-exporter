import { Supernova, PulsarContext, RemoteVersionIdentifier, AnyOutputFile, TokenType, TokenTheme } from "@supernovaio/sdk-exporters"
import { ExporterConfiguration, ThemeExportStyle, FileStructure } from "../config"
import { styleOutputFile, combinedStyleOutputFile } from "./files/style-file"
import { StringCase, ThemeHelper } from "@supernovaio/export-utils"
import { deepMerge } from "./utils/token-hierarchy"

/** Exporter configuration from the resolved default configuration and user overrides */
export const exportConfiguration = Pulsar.exportConfig<ExporterConfiguration>()

/**
 * Filters out null values from an array of output files
 * @param files Array of output files that may contain null values
 * @returns Array of non-null output files
 */
function processOutputFiles(files: Array<AnyOutputFile | null>): Array<AnyOutputFile> {
    return files.filter((file): file is AnyOutputFile => file !== null);
}

Pulsar.export(async (sdk: Supernova, context: PulsarContext): Promise<Array<AnyOutputFile>> => {
  const remoteVersionIdentifier: RemoteVersionIdentifier = {
    designSystemId: context.dsId,
    versionId: context.versionId,
  }

  let tokens = await sdk.tokens.getTokens(remoteVersionIdentifier)
  let tokenGroups = await sdk.tokens.getTokenGroups(remoteVersionIdentifier)
  let tokenCollections = await sdk.tokens.getTokenCollections(remoteVersionIdentifier)

  if (context.brandId) {
    const brands = await sdk.brands.getBrands(remoteVersionIdentifier)
    const brand = brands.find((brand) => brand.id === context.brandId || brand.idInVersion === context.brandId)
    if (!brand) {
      throw new Error(`Unable to find brand ${context.brandId}.`)
    }

    tokens = tokens.filter((token) => token.brandId === brand.id)
    tokenGroups = tokenGroups.filter((tokenGroup) => tokenGroup.brandId === brand.id)
  }

  if (context.themeIds && context.themeIds.length > 0) {
    const themes = await sdk.tokens.getTokenThemes(remoteVersionIdentifier)
    const themesToApply = context.themeIds.map((themeId) => {
      const theme = themes.find((theme) => theme.id === themeId || theme.idInVersion === themeId)
      if (!theme) {
        throw new Error(`Unable to find theme ${themeId}`)
      }
      return theme
    })
    
    switch (exportConfiguration.exportThemesAs) {
      case ThemeExportStyle.NestedThemes:
        if (exportConfiguration.fileStructure === FileStructure.SingleFile) {
          const baseFile = exportConfiguration.exportBaseValues
            ? combinedStyleOutputFile(tokens, tokenGroups, '', undefined, tokenCollections)
            : null

          const themeFiles = themesToApply.map((theme) => {
            const themedTokens = sdk.tokens.computeTokensByApplyingThemes(tokens, tokens, [theme])
            const originalExportBaseValues = exportConfiguration.exportBaseValues
            exportConfiguration.exportBaseValues = false
            const file = combinedStyleOutputFile(themedTokens, tokenGroups, '', theme, tokenCollections)
            exportConfiguration.exportBaseValues = originalExportBaseValues
            return file
          })

          const mergedFile = [baseFile, ...themeFiles].reduce((merged, file) => {
            if (!file) return merged
            if (!merged) return file

            const mergedContent = deepMerge(
              JSON.parse(merged.content),
              JSON.parse(file.content)
            )

            return {
              ...file,
              content: JSON.stringify(mergedContent, null, exportConfiguration.indent)
            }
          }, null)

          return processOutputFiles([mergedFile])
        }

        const valueObjectFiles = Object.values(TokenType)
          .map((type) => {
            const baseFile = exportConfiguration.exportBaseValues
              ? styleOutputFile(type, tokens, tokenGroups, '', undefined, tokenCollections)
              : null

            const themeFiles = themesToApply.map((theme) => {
              const themedTokens = sdk.tokens.computeTokensByApplyingThemes(tokens, tokens, [theme])
              const originalExportBaseValues = exportConfiguration.exportBaseValues
              exportConfiguration.exportBaseValues = false
              const file = styleOutputFile(type, themedTokens, tokenGroups, '', theme, tokenCollections)
              exportConfiguration.exportBaseValues = originalExportBaseValues
              return file
            })

            return [baseFile, ...themeFiles].reduce((merged, file) => {
              if (!file) return merged
              if (!merged) return file

              const mergedContent = deepMerge(
                JSON.parse(merged.content),
                JSON.parse(file.content)
              )

              return {
                ...file,
                content: JSON.stringify(mergedContent, null, exportConfiguration.indent)
              }
            }, null)
          })
        return processOutputFiles(valueObjectFiles)

      case ThemeExportStyle.SeparateFiles:
        if (exportConfiguration.fileStructure === FileStructure.SingleFile) {
          const themeFiles = themesToApply.map((theme) => {
            const themedTokens = sdk.tokens.computeTokensByApplyingThemes(tokens, tokens, [theme])
            const themePath = ThemeHelper.getThemeIdentifier(theme, StringCase.camelCase)
            return combinedStyleOutputFile(themedTokens, tokenGroups, themePath, theme, tokenCollections)
          })
          
          const baseFile = exportConfiguration.exportBaseValues
            ? combinedStyleOutputFile(tokens, tokenGroups, '', undefined, tokenCollections)
            : null

          return processOutputFiles([baseFile, ...themeFiles])
        }

        const themeFiles = themesToApply.flatMap((theme) => {
          const themedTokens = sdk.tokens.computeTokensByApplyingThemes(tokens, tokens, [theme])
          const themePath = ThemeHelper.getThemeIdentifier(theme, StringCase.camelCase)
          return Object.values(TokenType)
            .map((type) => styleOutputFile(type, themedTokens, tokenGroups, themePath, theme, tokenCollections))
        })
        
        const baseFiles = exportConfiguration.exportBaseValues
          ? Object.values(TokenType)
              .map((type) => styleOutputFile(type, tokens, tokenGroups, '', undefined, tokenCollections))
          : []

        return processOutputFiles([
          ...baseFiles, 
          ...themeFiles
        ])

      case ThemeExportStyle.MergedTheme:
        if (exportConfiguration.fileStructure === FileStructure.SingleFile) {
          const baseFile = exportConfiguration.exportBaseValues
            ? combinedStyleOutputFile(tokens, tokenGroups, '', undefined, tokenCollections)
            : null

          const themedTokens = sdk.tokens.computeTokensByApplyingThemes(tokens, tokens, themesToApply)
          const mergedThemeFile = combinedStyleOutputFile(
            themedTokens,
            tokenGroups,
            'themed',
            themesToApply[0],
            tokenCollections
          )

          return processOutputFiles([baseFile, mergedThemeFile])
        }

        const baseTokenFiles = exportConfiguration.exportBaseValues
          ? Object.values(TokenType)
              .map((type) => styleOutputFile(type, tokens, tokenGroups, '', undefined, tokenCollections))
          : []

        const themedTokens = sdk.tokens.computeTokensByApplyingThemes(tokens, tokens, themesToApply)
        const mergedThemeFiles = Object.values(TokenType)
          .map((type) => styleOutputFile(
            type, 
            themedTokens, 
            tokenGroups, 
            'themed',
            themesToApply[0],
            tokenCollections
          ))

        const mergedFiles = [
          ...baseTokenFiles, 
          ...mergedThemeFiles
        ]
        return processOutputFiles(mergedFiles)

      case ThemeExportStyle.ApplyDirectly:
        tokens = sdk.tokens.computeTokensByApplyingThemes(tokens, tokens, themesToApply)
        break
    }
  }

  if (exportConfiguration.fileStructure === FileStructure.SingleFile) {
    const defaultFile = exportConfiguration.exportBaseValues
      ? combinedStyleOutputFile(tokens, tokenGroups, '', undefined, tokenCollections)
      : null
    return processOutputFiles([defaultFile])
  }

  const defaultFiles = exportConfiguration.exportBaseValues
    ? Object.values(TokenType)
        .map((type) => styleOutputFile(type, tokens, tokenGroups, '', undefined, tokenCollections))
    : []
  
  return processOutputFiles(defaultFiles)
})
