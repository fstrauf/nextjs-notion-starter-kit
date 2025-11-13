/**
 * Recipe Auto-Detect Hook
 * 
 * Automatically finds "Ingredients" sections in a Notion page
 * and wraps them with the interactive RecipeScaler component.
 * 
 * This is a simpler approach that works after the page renders.
 */

import * as React from 'react'
import type { ExtendedRecordMap } from 'notion-types'

export interface RecipeSection {
  heading: string
  items: string[]
  blockId: string | undefined
  startIndex: number
  endIndex: number
}

/**
 * Find all ingredient sections in the page
 * Returns: array of objects with heading, items, and block indices
 */
export function findRecipeSections(recordMap: ExtendedRecordMap | undefined): RecipeSection[] {
  if (!recordMap?.block) return []

  const blocks = (recordMap.block || {}) as Record<string, any>
  const blockIds = Object.keys(blocks)
  const sections: RecipeSection[] = []

  for (let i = 0; i < blockIds.length; i++) {
    const blockId = blockIds[i] ?? ''
    if (!blockId) continue
    
    const blockData = blocks[blockId]?.value

    if (!blockData) continue

    // Check if this block is a heading with "Ingredients"
    const blockText = getBlockText(blockData).toLowerCase()

    if (blockData.type === 'heading_2' && blockText.includes('ingredients')) {
      // Found ingredients heading, now collect the following bulleted list items
      const items: string[] = []
      let endIndex = i

      for (let j = i + 1; j < blockIds.length; j++) {
        const nextBlockId = blockIds[j] ?? ''
        if (!nextBlockId) continue
        
        const nextBlockData = blocks[nextBlockId]?.value

        if (!nextBlockData) continue

        // Stop at non-list blocks (except divider)
        if (nextBlockData.type !== 'bulleted_list' && nextBlockData.type !== 'divider') {
          endIndex = j - 1
          break
        }

        if (nextBlockData.type === 'bulleted_list') {
          const text = getBlockText(nextBlockData)
          if (text) {
            items.push(text)
          }
        }

        endIndex = j
      }

      if (items.length > 0) {
        sections.push({
          heading: blockText,
          items,
          blockId,
          startIndex: i,
          endIndex,
        })
      }
    }
  }

  return sections
}

/**
 * Extract text from a Notion block
 */
function getBlockText(block: any): string {
  if (!block) return ''

  const properties = block?.properties
  if (properties?.title) {
    const titleArray = Array.isArray(properties.title) ? properties.title : []
    return titleArray
      .map((item: any) => {
        if (Array.isArray(item)) return item[0] || ''
        return ''
      })
      .join('')
  }

  return ''
}

/**
 * Get the original servings from page properties
 */
export function getOriginalServings(recordMap: ExtendedRecordMap | undefined): number {
  if (!recordMap?.block) return 1

  const blocks = (recordMap.block || {}) as Record<string, any>

  // Try to find a page block with Servings property
  for (const blockId in blocks) {
    const blockData = blocks[blockId]?.value
    if (!blockData || blockData.type !== 'page') continue

    // Look for Servings in properties
    const servingsArray = blockData?.properties?.Servings as any[]
    if (servingsArray && Array.isArray(servingsArray) && servingsArray.length > 0) {
      const servingsPart = (servingsArray[0] as any[])?.[0]
      if (typeof servingsPart === 'string') {
        const parsed = parseInt(servingsPart)
        if (!isNaN(parsed) && parsed > 0) {
          return parsed
        }
      }
    }
  }

  return 1
}
