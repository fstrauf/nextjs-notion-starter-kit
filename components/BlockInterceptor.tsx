/**
 * Recipe Block Interceptor
 * 
 * Detects "Ingredients" sections in Notion pages and renders them
 * with the interactive RecipeScaler component instead of plain text.
 */

import * as React from 'react'
import { useNotionContext } from 'react-notion-x'
import type { Block } from 'notion-types'
import { RecipeScaler } from './RecipeScaler'

interface BlockInterceptorProps {
  block: Block
  children: React.ReactNode
  getBlockTitle?: (block: Block) => string | null
}

/**
 * Extract text content from a block (used to check if it's an "Ingredients" heading)
 */
function getBlockText(block: Block | null | undefined): string {
  if (!block) return ''
  
  const properties = (block as any)?.properties
  if (properties?.title) {
    const titleArray = Array.isArray(properties.title) ? properties.title : []
    return titleArray.map((item: any) => {
      if (Array.isArray(item)) return item[0] || ''
      return ''
    }).join('')
  }
  
  return ''
}

/**
 * Extract all text from consecutive bulleted list items
 * This is used to gather the ingredient lines
 */
export function extractListItems(recordMap: any, startBlockId: string): string[] {
  const items: string[] = []
  const blocks = (recordMap?.block || {}) as Record<string, any>
  const blockOrder = Object.keys(blocks).sort()
  const startIndex = blockOrder.indexOf(startBlockId)

  for (let i = startIndex + 1; i < blockOrder.length; i++) {
    const blockId = blockOrder[i] ?? ''
    if (!blockId) continue
    
    const blockData = blocks[blockId]?.value
    if (!blockData) continue
    
    // Stop if we hit a non-list block
    if (blockData.type !== 'bulleted_list') {
      break
    }

    const text = getBlockText(blockData)
    if (text) {
      items.push(text)
    }
  }

  return items
}

/**
 * Determine if a page is a recipe (has "Ingredients" and "Instructions" sections)
 */
export function isRecipePage(recordMap: any): boolean {
  const blocks = recordMap?.block || {}
  const blockIds = Object.keys(blocks)
  
  let hasIngredients = false
  let hasInstructions = false

  for (const blockId of blockIds) {
    const blockData = blocks[blockId]?.value
    if (!blockData) continue
    
    const text = getBlockText(blockData).toLowerCase()
    if (text.includes('ingredients')) hasIngredients = true
    if (text.includes('instructions')) hasInstructions = true
  }

  return hasIngredients && hasInstructions
}

/**
 * BlockInterceptor Component
 * 
 * Checks if this block is an "Ingredients" heading, and if so,
 * renders the next list items as an interactive RecipeScaler
 */
export const BlockInterceptor: React.FC<BlockInterceptorProps> = ({
  block,
  children,
}) => {
  const { recordMap } = useNotionContext()
  const blockText = getBlockText(block)
  
  // Check if this is an "Ingredients" heading
  const isIngredientsHeading = blockText.toLowerCase().includes('ingredients')

  if (!isIngredientsHeading) {
    // Not an ingredients section, render normally
    return <>{children}</>
  }

  // Extract ingredients list items
  const listItems = extractListItems(recordMap, block.id)
  
  if (listItems.length === 0) {
    // No ingredients found, render normally
    return <>{children}</>
  }

  // Get servings from page properties if available
  let originalServings = 1
  try {
    const blocks = (recordMap?.block || {}) as Record<string, any>
    const blockArray = Object.values(blocks)
    const rootBlock = blockArray?.[0] as any
    const servingsStr = rootBlock?.value?.properties?.Servings as any[]
    if (servingsStr && Array.isArray(servingsStr) && servingsStr.length > 0) {
      const servingsPart = (servingsStr?.[0] as any[])?.[0]
      if (typeof servingsPart === 'string') {
        originalServings = parseInt(servingsPart) || 1
      }
    }
  } catch (e) {
    // Fallback to default
  }

  const ingredientsText = listItems.join('\n')

  return (
    <>
      {/* Render the "Ingredients" heading */}
      {children}
      
      {/* Render the interactive RecipeScaler */}
      <RecipeScaler
        ingredientsText={ingredientsText}
        originalServings={originalServings}
      />
    </>
  )
}

export default BlockInterceptor
