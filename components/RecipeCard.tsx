import * as React from 'react'
import styles from './RecipeCard.module.css'

// Icon placeholders using Unicode symbols
const ClockIcon = () => <span className={styles.icon}>⏱</span>
const ChefHatIcon = () => <span className={styles.icon}>👨‍🍳</span>
const UsersIcon = () => <span className={styles.icon}>👥</span>

export interface RecipeMetadata {
  prepTime?: number // in minutes
  cookTime?: number // in minutes
  servings?: number
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  tags?: string[]
}

interface RecipeCardProps {
  title: string
  description?: string
  imageUrl?: string
  metadata?: RecipeMetadata
  onClick?: () => void
}

/**
 * RecipeCard Component
 * Displays a recipe with magazine-style layout featuring:
 * - Food photography
 * - Recipe metadata (prep/cook time, servings, difficulty)
 * - Title and description
 * - Tag badges
 * 
 * Can be used as a standalone component or integrated into
 * the NotionPage component for custom recipe rendering.
 */
export const RecipeCard: React.FC<RecipeCardProps> = ({
  title,
  description,
  imageUrl,
  metadata,
  onClick,
}) => {
  const totalTime = (metadata?.prepTime || 0) + (metadata?.cookTime || 0)
  
  const difficultyColor = {
    Easy: '#10b981',
    Medium: '#f59e0b',
    Hard: '#ef4444',
  }[metadata?.difficulty || 'Easy']

  return (
    <article
      className={styles.recipeCard}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.()
        }
      }}
    >
      {/* Image Section */}
      {imageUrl && (
        <div className={styles.imageContainer}>
          <img
            src={imageUrl}
            alt={title}
            className={styles.image}
          />
          {metadata?.difficulty && (
            <div
              className={styles.difficultyBadge}
              style={{ backgroundColor: difficultyColor }}
            >
              {metadata.difficulty}
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        
        {description && (
          <p className={styles.description}>{description}</p>
        )}

        {/* Metadata Bar */}
        {metadata && (
          <div className={styles.metadataBar}>
            {metadata.prepTime && (
              <div className={styles.metadataItem}>
                <ClockIcon />
                <span>{metadata.prepTime}m prep</span>
              </div>
            )}
            
            {metadata.cookTime && (
              <div className={styles.metadataItem}>
                <ChefHatIcon />
                <span>{metadata.cookTime}m cook</span>
              </div>
            )}
            
            {metadata.servings && (
              <div className={styles.metadataItem}>
                <UsersIcon />
                <span>Serves {metadata.servings}</span>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {metadata?.tags && metadata.tags.length > 0 && (
          <div className={styles.tagsContainer}>
            {metadata.tags.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
            {metadata.tags.length > 3 && (
              <span className={styles.tag}>+{metadata.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

/**
 * Simple Recipe Card (lightweight version)
 * Use this for gallery grids where you want minimal styling
 */
export const RecipeCardSimple: React.FC<Omit<RecipeCardProps, 'onClick'>> = ({
  title,
  description,
  imageUrl,
  metadata,
}) => {
  const totalTime = (metadata?.prepTime || 0) + (metadata?.cookTime || 0)

  return (
    <div className={styles.simpleCard}>
      {imageUrl && (
        <div className={styles.simpleImageContainer}>
          <img src={imageUrl} alt={title} className={styles.simpleImage} />
        </div>
      )}
      <div className={styles.simpleContent}>
        <h4 className={styles.simpleTitle}>{title}</h4>
        {totalTime > 0 && (
          <p className={styles.simpleTime}>{totalTime} min</p>
        )}
        {metadata?.difficulty && (
          <p className={styles.simpleDifficulty}>{metadata.difficulty}</p>
        )}
      </div>
    </div>
  )
}

export default RecipeCard
