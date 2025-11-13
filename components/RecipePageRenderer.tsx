import * as React from 'react'
import { RecipeScaler } from './RecipeScaler'

/**
 * Extract ingredients from page blocks
 * Finds "Ingredients" heading and collects following bulleted list items
 */
function extractIngredientsFromBlocks(recordMap: any): string[] | null {
  try {
    const blocks = recordMap?.block || {}
    const blockEntries = Object.entries(blocks)
    let foundIngredientsHeading = false
    let ingredients: string[] = []

    console.log('[RecipePageRenderer] Scanning', Object.keys(blocks).length, 'blocks for ingredients section')

    for (const [blockId, blockEntry] of blockEntries) {
      const blockVal = (blockEntry as any)?.value

      if (!blockVal) continue

      const blockType = blockVal?.type
      const blockText = blockVal?.properties?.title?.[0]?.[0] || ''

      // Look for "Ingredients" heading
      if ((blockType === 'sub_header' || blockType === 'heading_2' || blockType === 'heading_3') && 
          blockText.toLowerCase() === 'ingredients') {
        console.log('[RecipePageRenderer] ✓ Found Ingredients heading')
        foundIngredientsHeading = true
        continue
      }

      // If we found ingredients heading, collect bulleted items
      if (foundIngredientsHeading) {
        // Stop at next major heading (but not sub_sub_header which are like "Dry Ingredients")
        if ((blockType === 'sub_header' || blockType === 'heading_2' || blockType === 'heading_3') && 
            blockText.toLowerCase() !== 'ingredients') {
          console.log('[RecipePageRenderer] Stopping at next section:', blockText)
          break
        }

        // Collect bulleted list items
        if (blockType === 'bulleted_list' || blockType === 'bulleted_list_item') {
          if (blockText.trim()) {
            console.log('[RecipePageRenderer] Added ingredient:', blockText)
            ingredients.push(blockText.trim())
          }
        }

        // Skip sub_sub_headers and empty text blocks - they're OK within ingredients section
        if (blockType === 'sub_sub_header' || (blockType === 'text' && !blockText.trim())) {
          continue
        }

        // Stop if we hit something unexpected
        if (blockType !== 'bulleted_list' && blockType !== 'bulleted_list_item' && 
            blockType !== 'sub_sub_header' && blockType !== 'text') {
          console.log('[RecipePageRenderer] Stopping at unexpected block type:', blockType)
          break
        }
      }
    }

    if (ingredients.length > 0) {
      console.log('[RecipePageRenderer] ✓ Extracted', ingredients.length, 'ingredients')
      return ingredients
    }

    console.log('[RecipePageRenderer] No ingredients found')
    return null
  } catch (e) {
    console.error('[RecipePageRenderer] Error:', e)
    return null
  }
}

/**
 * Component that renders recipe ingredients as an interactive scaler
 * Extracts from "Ingredients" heading and following bulleted list
 */
export function RecipePageRenderer({
  recordMap,
  block
}: {
  recordMap: any
  block: any
}) {
  const ingredients = React.useMemo(() => {
    if (!recordMap) return null
    return extractIngredientsFromBlocks(recordMap)
  }, [recordMap])

  if (!ingredients || ingredients.length === 0) {
    return null
  }

  return (
    <div style={{ margin: '24px 0', padding: '0 16px' }}>
      <RecipeScaler
        ingredientsText={ingredients.join('\n')}
        originalServings={1}
      />
    </div>
  )
}
