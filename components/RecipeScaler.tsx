import * as React from 'react'
import { parseIngredients, scaleRecipe, formatQuantity, type ScaledIngredient } from '@/lib/recipe-parser'
import styles from './RecipeScaler.module.css'

interface RecipeScalerProps {
  ingredientsText: string
  originalServings: number
}

/**
 * RecipeScaler Component
 * 
 * Displays ingredients with an interactive servings slider
 * that automatically scales all quantities in real-time
 */
export const RecipeScaler: React.FC<RecipeScalerProps> = ({
  ingredientsText,
  originalServings,
}) => {
  const [desiredServings, setDesiredServings] = React.useState(originalServings)
  const [showAll, setShowAll] = React.useState(false)

  // Parse ingredients from text
  const ingredients = React.useMemo(() => {
    return parseIngredients(ingredientsText)
  }, [ingredientsText])

  // Scale ingredients based on desired servings
  const scaledIngredients = React.useMemo(() => {
    if (ingredients.length === 0) return []
    return scaleRecipe(ingredients, originalServings, desiredServings)
  }, [ingredients, originalServings, desiredServings])

  if (ingredients.length === 0) {
    // Fallback: just render the text as-is
    return <div className={styles.fallback}>{ingredientsText}</div>
  }

  const displayIngredients = showAll ? scaledIngredients : scaledIngredients.slice(0, 5)
  const hasMore = scaledIngredients.length > 5 && !showAll

  return (
    <div className={styles.scaler}>
      {/* Servings Control */}
      <div className={styles.control}>
        <label htmlFor="servings-input" className={styles.label}>
          Servings:
        </label>
        <div className={styles.controlGroup}>
          <button
            onClick={() => setDesiredServings(Math.max(1, desiredServings - 1))}
            className={styles.button}
            aria-label="Decrease servings"
          >
            −
          </button>
          <input
            id="servings-input"
            type="number"
            min="1"
            value={desiredServings}
            onChange={(e) => setDesiredServings(Math.max(1, parseInt(e.target.value) || 1))}
            className={styles.input}
          />
          <button
            onClick={() => setDesiredServings(desiredServings + 1)}
            className={styles.button}
            aria-label="Increase servings"
          >
            +
          </button>
        </div>
        {originalServings !== desiredServings && (
          <span className={styles.ratio}>
            (×{(desiredServings / originalServings).toFixed(2)})
          </span>
        )}
      </div>

      {/* Ingredients List */}
      <ul className={styles.ingredientsList}>
        {displayIngredients.map((ingredient, index) => (
          <li key={index} className={styles.ingredientItem}>
            <input
              type="checkbox"
              id={`ingredient-${index}`}
              className={styles.checkbox}
              aria-label={`Check off ${ingredient.ingredient}`}
            />
            <label htmlFor={`ingredient-${index}`} className={styles.ingredientLabel}>
              <span className={styles.quantity}>
                {ingredient.displayQuantity}
              </span>
              <span className={styles.unit}>{ingredient.scaledUnit}</span>
              <span className={styles.ingredient}>{ingredient.ingredient}</span>
              {ingredient.notes && (
                <span className={styles.notes}>{ingredient.notes}</span>
              )}
            </label>
          </li>
        ))}
      </ul>

      {/* Show More Button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(true)}
          className={styles.showMore}
        >
          Show {scaledIngredients.length - 5} more ingredients
        </button>
      )}

      {showAll && scaledIngredients.length > 5 && (
        <button
          onClick={() => setShowAll(false)}
          className={styles.showLess}
        >
          Show less
        </button>
      )}
    </div>
  )
}

/**
 * Standalone Ingredient Item Component
 * For rendering a single ingredient with optional styling
 */
export const IngredientItem: React.FC<{
  ingredient: ScaledIngredient
  index: number
}> = ({ ingredient, index }) => {
  return (
    <li className={styles.ingredientItem}>
      <input
        type="checkbox"
        id={`ingredient-${index}`}
        className={styles.checkbox}
      />
      <label htmlFor={`ingredient-${index}`} className={styles.ingredientLabel}>
        <span className={styles.quantity}>{ingredient.displayQuantity}</span>
        <span className={styles.unit}>{ingredient.scaledUnit}</span>
        <span className={styles.ingredient}>{ingredient.ingredient}</span>
        {ingredient.notes && (
          <span className={styles.notes}>{ingredient.notes}</span>
        )}
      </label>
    </li>
  )
}

export default RecipeScaler
