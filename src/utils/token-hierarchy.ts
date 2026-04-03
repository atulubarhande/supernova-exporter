import { TokenType, Token } from "@supernovaio/sdk-exporters"
import { DesignSystemCollection } from '@supernovaio/sdk-exporters/build/sdk-typescript/src/model/base/SDKDesignSystemCollection'
import { NamingHelper, TokenNameTracker } from "@supernovaio/export-utils"
import { exportConfiguration } from ".."
import { getTokenPrefix } from "../content/token"

const tokenNameTracker = new TokenNameTracker()

/**
 * Reset the name tracking between file generations
 */
export function resetNameTracking(): void {
  tokenNameTracker.reset()
}

/**
 * Processes a token name according to our rules using TokenNameTracker
 */
export function processTokenName(
  token: Token, 
  path: string[] = [],
  collections: Array<DesignSystemCollection> = []
): string {
  let tokenName = tokenNameTracker.getSimpleTokenName(
    token,
    exportConfiguration.tokenNameStyle,
    false,
    path
  )

  if (tokenName.startsWith('_')) {
    tokenName = tokenName.slice(1)
  }

  return tokenName
}

/**
 * Converts a token's full path and name into a hierarchical object structure.
 * First level is always the type prefix (e.g. 'color').
 * Middle levels come from path segments.
 * Last level is the token name.
 */
export function createHierarchicalStructure(
  path: string[] | undefined, 
  name: string, 
  value: any,
  token: Token,
  collections: Array<DesignSystemCollection> = []
): any {
  let collectionSegment: string | null = null
  if (exportConfiguration.tokenNameStructure === 'collectionPathAndName' && token.collectionId) {
    const collection = collections.find(c => c.persistentId === token.collectionId)
    collectionSegment = collection?.name ?? null
  }

  const prefix = NamingHelper.codeSafeVariableName(
    getTokenPrefix(token.tokenType),
    exportConfiguration.tokenNameStyle
  )

  const segments = [
    ...(exportConfiguration.globalNamePrefix ? 
      [NamingHelper.codeSafeVariableName(exportConfiguration.globalNamePrefix, exportConfiguration.tokenNameStyle)] : 
      []),
    ...(prefix ? [prefix] : [])
  ]

  if (collectionSegment) {
    segments.push(NamingHelper.codeSafeVariableName(collectionSegment, exportConfiguration.tokenNameStyle))
  }

  const pathSegments = [
    ...(collectionSegment ? [collectionSegment] : []),
    ...(exportConfiguration.tokenNameStructure !== 'nameOnly'
      ? (path || [])
          .filter(segment => segment && segment.trim().length > 0)
          .map(segment => NamingHelper.codeSafeVariableName(segment, exportConfiguration.tokenNameStyle))
      : [])
  ]

  if (exportConfiguration.tokenNameStructure !== 'nameOnly') {
    segments.push(
      ...(path || [])
        .filter(segment => segment && segment.trim().length > 0)
        .map(segment => NamingHelper.codeSafeVariableName(segment, exportConfiguration.tokenNameStyle))
    )
  }

  const tokenName = tokenNameTracker.getSimpleTokenName(
    token,
    exportConfiguration.tokenNameStyle,
    false,
    pathSegments
  )

  segments.push(tokenName.replace(/^_/, ''))

  return segments.reduceRight((nestedValue, segment) => ({
    [segment]: nestedValue
  }), value)
}

/**
 * Variant of createHierarchicalStructure for typography atomic sub-properties.
 * Builds the same segment chain (global prefix, type prefix, collection, path, token name)
 * but appends the sub-property suffix (e.g. "fontFamily", "fontSize") as an extra nesting
 * level under the token name.
 */
export function createTypographyHierarchicalStructure(
  path: string[] | undefined,
  name: string,
  subPropertySuffix: string,
  value: any,
  token: Token,
  collections: Array<DesignSystemCollection> = []
): any {
  let collectionSegment: string | null = null
  if (exportConfiguration.tokenNameStructure === 'collectionPathAndName' && token.collectionId) {
    const collection = collections.find(c => c.persistentId === token.collectionId)
    collectionSegment = collection?.name ?? null
  }

  const prefix = NamingHelper.codeSafeVariableName(
    getTokenPrefix(token.tokenType),
    exportConfiguration.tokenNameStyle
  )

  const segments = [
    ...(exportConfiguration.globalNamePrefix ?
      [NamingHelper.codeSafeVariableName(exportConfiguration.globalNamePrefix, exportConfiguration.tokenNameStyle)] :
      []),
    ...(prefix ? [prefix] : [])
  ]

  if (collectionSegment) {
    segments.push(NamingHelper.codeSafeVariableName(collectionSegment, exportConfiguration.tokenNameStyle))
  }

  const pathSegments = [
    ...(collectionSegment ? [collectionSegment] : []),
    ...(exportConfiguration.tokenNameStructure !== 'nameOnly'
      ? (path || [])
          .filter(segment => segment && segment.trim().length > 0)
          .map(segment => NamingHelper.codeSafeVariableName(segment, exportConfiguration.tokenNameStyle))
      : [])
  ]

  if (exportConfiguration.tokenNameStructure !== 'nameOnly') {
    segments.push(
      ...(path || [])
        .filter(segment => segment && segment.trim().length > 0)
        .map(segment => NamingHelper.codeSafeVariableName(segment, exportConfiguration.tokenNameStyle))
    )
  }

  const tokenName = tokenNameTracker.getSimpleTokenName(
    token,
    exportConfiguration.tokenNameStyle,
    false,
    pathSegments
  )

  segments.push(tokenName.replace(/^_/, ''))

  const formattedSuffix = NamingHelper.codeSafeVariableName(
    subPropertySuffix,
    exportConfiguration.tokenNameStyle
  )
  segments.push(formattedSuffix)

  return segments.reduceRight((nestedValue, segment) => ({
    [segment]: nestedValue
  }), value)
}

/**
 * Deeply merges objects together, ensuring descriptions appear after all other properties.
 */
export function deepMerge(target: any, source: any): any {
  if (!target) return source
  if (!source) return target
  
  const output = { ...target }
  
  const description = source.description || target.description
  delete output.description
  delete source.description

  Object.keys(source).forEach(key => {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!(key in target)) {
        output[key] = source[key]
      } else {
        output[key] = deepMerge(target[key], source[key])
      }
    } else {
      output[key] = source[key]
    }
  })

  if (description) {
    output.description = description
  }
  
  return output
}
