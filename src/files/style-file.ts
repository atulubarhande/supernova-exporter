import { FileHelper, CSSHelper, GeneralHelper, ThemeHelper, FileNameHelper, StringCase } from "@supernovaio/export-utils"
import { OutputTextFile, Token, TokenGroup, TokenType, TypographyToken } from "@supernovaio/sdk-exporters"
import { DesignSystemCollection } from '@supernovaio/sdk-exporters/build/sdk-typescript/src/model/base/SDKDesignSystemCollection'
import { exportConfiguration } from ".."
import { tokenObjectKeyName, resetTokenNameTracking, getTokenPrefix } from "../content/token"
import { TokenTheme } from "@supernovaio/sdk-exporters"
import { DEFAULT_STYLE_FILE_NAMES } from "../constants/defaults"
import { createHierarchicalStructure, createTypographyHierarchicalStructure, deepMerge, processTokenName } from "../utils/token-hierarchy"
import { NamingHelper } from "@supernovaio/export-utils"
import { ThemeExportStyle, TokenNameStructure } from "../../config"
import { convertTypographyToken } from "../content/typography-converter"

/**
 * Creates a value object for a token, either as a simple value or themed values.
 * Accepts an optional typeOverride so that typography atomic sub-entries use
 * their sub-property type (e.g. "fontFamily") instead of the parent "typography" type.
 */
function createTokenValue(
  value: string,
  token: Token,
  theme?: TokenTheme,
  typeOverride?: string
): any {
  const baseValue = value.replace(/['"]/g, '')
  const description = token.description && exportConfiguration.showDescriptions 
    ? { description: token.description.trim() } 
    : {}
  
  const tokenType = typeOverride ?? getTokenPrefix(token.tokenType, true)

  if (exportConfiguration.exportThemesAs === ThemeExportStyle.NestedThemes) {
    const valueObject = {}

    if (!theme && exportConfiguration.exportBaseValues) {
      valueObject['base'] = {
        value: baseValue,
        type: tokenType
      }
    }

    if (theme) {
      valueObject[ThemeHelper.getThemeIdentifier(theme, StringCase.kebabCase)] = {
        value: baseValue,
        type: tokenType
      }
    }

    return {
      ...valueObject,
      ...description
    }
  }

  return {
    value: baseValue,
    type: tokenType,
    ...description
  }
}

/**
 * Core token processing function that handles the transformation of tokens into a structured object.
 */
function processTokensToObject(
  tokens: Array<Token>,
  tokenGroups: Array<TokenGroup>,
  theme?: TokenTheme,
  collections: Array<DesignSystemCollection> = [],
  allTokens?: Array<Token>
): any | null {
  resetTokenNameTracking()

  if (!exportConfiguration.generateEmptyFiles && tokens.length === 0) {
    return null
  }

  const mappedTokens = new Map((allTokens || tokens).map((token) => [token.id, token]))

  let sortedTokens = [...tokens]
  if (exportConfiguration.tokenSortOrder === 'alphabetical') {
    sortedTokens.sort((a, b) => {
      const nameA = tokenObjectKeyName(a, tokenGroups, true, collections)
      const nameB = tokenObjectKeyName(b, tokenGroups, true, collections)
      return nameA.localeCompare(nameB)
    })
  }

  const tokenObject: any = {}
  
  if (exportConfiguration.showGeneratedFileDisclaimer) {
    tokenObject._comment = exportConfiguration.disclaimer
  }
  
  sortedTokens.forEach(token => {
    // Typography tokens are decomposed into atomic sub-properties
    if (token.tokenType === TokenType.typography) {
      const atomicEntries = convertTypographyToken(token as TypographyToken, exportConfiguration)
      for (const [suffix, entry] of Object.entries(atomicEntries)) {
        const subValue = createTokenValue(String(entry.value), token, theme, entry.type)
        const hierarchicalObject = createTypographyHierarchicalStructure(
          token.tokenPath || [],
          token.name,
          suffix,
          subValue,
          token,
          collections
        )
        Object.assign(tokenObject, deepMerge(tokenObject, hierarchicalObject))
      }
      return
    }

    const name = tokenObjectKeyName(token, tokenGroups, true, collections)

    const value = CSSHelper.tokenToCSS(token, mappedTokens, {
      allowReferences: exportConfiguration.useReferences,
      decimals: exportConfiguration.colorPrecision,
      colorFormat: exportConfiguration.colorFormat,
      forceRemUnit: exportConfiguration.forceRemUnit,
      remBase: exportConfiguration.remBase,
      tokenToVariableRef: (t) => {
        const prefix = getTokenPrefix(t.tokenType)
        const pathSegments = (t.tokenPath || [])
          .filter(segment => segment && segment.trim().length > 0)
          .map(segment => NamingHelper.codeSafeVariableName(segment, exportConfiguration.tokenNameStyle))

        const tokenName = processTokenName(t, pathSegments)

        let segments: string[] = []
        if (prefix) {
          segments.push(prefix)
        }

        switch (exportConfiguration.tokenNameStructure) {
          case TokenNameStructure.NameOnly:
            segments.push(tokenName)
            break
            
          case TokenNameStructure.CollectionPathAndName:
            if (t.collectionId) {
              const collection = collections.find(c => c.persistentId === t.collectionId)
              if (collection) {
                const collectionSegment = NamingHelper.codeSafeVariableName(collection.name, exportConfiguration.tokenNameStyle)
                segments.push(collectionSegment)
              }
            }
            segments.push(...pathSegments, tokenName)
            break
            
          case TokenNameStructure.PathAndName:
            segments.push(...pathSegments, tokenName)
            break
        }

        if (exportConfiguration.globalNamePrefix) {
          segments.unshift(
            NamingHelper.codeSafeVariableName(
              exportConfiguration.globalNamePrefix, 
              exportConfiguration.tokenNameStyle
            )
          )
        }

        return `{${segments.join('.')}}`
      }
    })

    const hierarchicalObject = createHierarchicalStructure(
      token.tokenPath || [],
      token.name,
      createTokenValue(value, token, theme),
      token,
      collections
    )

    Object.assign(tokenObject, deepMerge(tokenObject, hierarchicalObject))
  })

  return tokenObject
}

/**
 * Generates a style file for a specific token type (color.json, typography.json, etc.).
 */
export function styleOutputFile(
  type: TokenType,
  tokens: Array<Token>,
  tokenGroups: Array<TokenGroup>,
  themePath: string = '',
  theme?: TokenTheme,
  collections: Array<DesignSystemCollection> = []
): OutputTextFile | null {
  if (!exportConfiguration.exportBaseValues && !themePath && 
      exportConfiguration.exportThemesAs !== ThemeExportStyle.NestedThemes) {
    return null
  }

  let tokensOfType = tokens.filter((token) => token.tokenType === type)

  if (themePath && theme && exportConfiguration.exportOnlyThemedTokens) {
    tokensOfType = ThemeHelper.filterThemedTokens(tokensOfType, theme)
    
    if (tokensOfType.length === 0) {
      return null
    }
  }

  const tokenObject = processTokensToObject(tokensOfType, tokenGroups, theme, collections, tokens)
  if (!tokenObject) {
    return null
  }

  const content = JSON.stringify(tokenObject, null, exportConfiguration.indent)

  return FileHelper.createTextFile({
    relativePath: themePath ? `./${themePath}` : exportConfiguration.baseStyleFilePath,
    fileName: exportConfiguration.customizeStyleFileNames
      ? FileNameHelper.ensureFileExtension(exportConfiguration.styleFileNames[type], ".json")
      : DEFAULT_STYLE_FILE_NAMES[type],
    content: content
  })
}

function generateTokenObject(tokens: Array<Token>, tokenGroups: Array<TokenGroup>): string {
  const indentString = GeneralHelper.indent(exportConfiguration.indent)
  
  let sortedTokens = [...tokens]
  
  if (exportConfiguration.tokenSortOrder === 'alphabetical') {
    sortedTokens.sort((a, b) => {
      const nameA = tokenObjectKeyName(a, tokenGroups, true)
      const nameB = tokenObjectKeyName(b, tokenGroups, true)
      return nameA.localeCompare(nameB)
    })
  }

  return sortedTokens.map(token => {
    const name = tokenObjectKeyName(token, tokenGroups, true)
    if (token.description) {
      return `${indentString}/** ${token.description.trim()} */\n${indentString}${name},`
    }
    return `${indentString}${name},`
  }).join('\n')
}

/**
 * Generates a single combined JSON file containing all token types.
 */
export function combinedStyleOutputFile(
  tokens: Array<Token>,
  tokenGroups: Array<TokenGroup>,
  themePath: string = '',
  theme?: TokenTheme,
  collections: Array<DesignSystemCollection> = []
): OutputTextFile | null {
  if (!exportConfiguration.exportBaseValues && !themePath && 
      exportConfiguration.exportThemesAs !== ThemeExportStyle.NestedThemes) {
    return null
  }

  const originalTokens = [...tokens]

  if (themePath && theme && exportConfiguration.exportOnlyThemedTokens) {
    tokens = ThemeHelper.filterThemedTokens(tokens, theme)
    
    if (tokens.length === 0) {
      return null
    }
  }

  const tokenObject = processTokensToObject(tokens, tokenGroups, theme, collections, originalTokens)
  if (!tokenObject) {
    return null
  }

  const content = JSON.stringify(tokenObject, null, exportConfiguration.indent)

  const fileName = themePath ? `tokens.${themePath}.json` : 'tokens.json'
  const relativePath = './'

  return FileHelper.createTextFile({
    relativePath: relativePath,
    fileName: fileName,
    content: content
  })
}
