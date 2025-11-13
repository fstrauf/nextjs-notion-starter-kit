import * as React from 'react'
import { RecipeScaler } from './RecipeScaler'

/**
 * A simple component to render RecipeScaler in a Notion page
 * Usage: Add a text block with content like:
 * [[RECIPE_SCALER]]
 */
export function RecipeScalerEmbed({ pageProperties }: { pageProperties?: any }) {
  const [ingredientsText, setIngredientsText] = React.useState('')

  React.useEffect(() => {
    // Try to extract ingredients from page properties if available
    // This assumes you have an "Ingredients" property in your Notion database
    if (pageProperties?.ingredients) {
      setIngredientsText(pageProperties.ingredients)
    } else if (pageProperties?.Ingredients) {
      setIngredientsText(pageProperties.Ingredients)
    }
  }, [pageProperties])

  if (!ingredientsText) {
    return (
      <div style={{ padding: '12px', fontSize: '14px', color: '#888' }}>
        No ingredients found. Add an "Ingredients" property to this page or pass ingredientsText.
      </div>
    )
  }

  return <RecipeScaler ingredientsText={ingredientsText} originalServings={1} />
}
