/**
 * Recipe Parser Utility
 * 
 * Parses standardized recipe text from Notion and extracts:
 * - Ingredient quantities and units
 * - Measurements for scaling
 * - Instructions with temperatures and timings
 */

// ========================================
// UNIT CONVERSION SYSTEM
// ========================================

export type UnitType = 'volume' | 'weight' | 'count'

export interface UnitConversion {
  type: UnitType
  baseUnit: string // The unit we convert everything to
  conversions: Record<string, number> // unit -> multiplier to baseUnit
}

// All conversions to ml (volume) and grams (weight)
export const UNIT_CONVERSIONS: Record<string, UnitConversion> = {
  // Volume conversions (to ml)
  'ml': {
    type: 'volume',
    baseUnit: 'ml',
    conversions: {
      'ml': 1,
      'l': 1000,
      'tsp': 4.92892,
      'tbsp': 14.7868,
      'cup': 236.588,
      'fl oz': 29.5735,
    },
  },
  // Weight conversions (to grams)
  'g': {
    type: 'weight',
    baseUnit: 'g',
    conversions: {
      'g': 1,
      'kg': 1000,
      'oz': 28.3495,
      'lb': 453.592,
    },
  },
  // Count (no conversion needed)
  'count': {
    type: 'count',
    baseUnit: 'count',
    conversions: {
      'piece': 1,
      'pieces': 1,
      'clove': 1,
      'cloves': 1,
      'egg': 1,
      'eggs': 1,
    },
  },
}

// Alias map for common variations
export const UNIT_ALIASES: Record<string, string> = {
  'teaspoon': 'tsp',
  'teaspoons': 'tsp',
  'tablespoon': 'tbsp',
  'tablespoons': 'tbsp',
  'tbsps': 'tbsp',
  'cup': 'cup',
  'cups': 'cup',
  'ounce': 'oz',
  'ounces': 'oz',
  'pound': 'lb',
  'pounds': 'lb',
  'milliliter': 'ml',
  'milliliters': 'ml',
  'liter': 'l',
  'liters': 'l',
  'gram': 'g',
  'grams': 'g',
  'kilogram': 'kg',
  'kilograms': 'kg',
  'fl oz': 'fl oz',
  'fluid ounce': 'fl oz',
  'fluid ounces': 'fl oz',
}

// ========================================
// PARSED INGREDIENT TYPE
// ========================================

export interface ParsedIngredient {
  original: string // Original text from Notion
  quantity: number // Numeric quantity (e.g., 2.25 for "2 1/4")
  unit: string // Unit (tsp, tbsp, cup, g, oz, etc.)
  unitType: UnitType // Category: volume, weight, or count
  ingredient: string // Ingredient name
  notes?: string // Any notes in parentheses
}

// ========================================
// INGREDIENT PARSER
// ========================================

/**
 * Parse a single ingredient line
 * Examples:
 * - "2 1/4 cups all-purpose flour" -> { quantity: 2.25, unit: 'cup', ingredient: 'all-purpose flour' }
 * - "1 tbsp butter, softened" -> { quantity: 1, unit: 'tbsp', ingredient: 'butter', notes: 'softened' }
 * - "2 eggs" -> { quantity: 2, unit: 'count', ingredient: 'eggs' }
 */
export function parseIngredientLine(line: string): ParsedIngredient | null {
  const trimmed = line.trim()

  // Remove leading bullet point or dash
  const cleaned = trimmed.replace(/^[-•]\s*/, '').trim()

  // Extract notes in parentheses at the end
  let notes: string | undefined
  let textWithoutNotes = cleaned
  const notesMatch = cleaned.match(/\(([^)]+)\)$/)
  if (notesMatch) {
    notes = notesMatch[1]
    textWithoutNotes = cleaned.substring(0, notesMatch.index).trim()
  }

  // Try to match: quantity unit ingredient
  // Handles fractions like "2 1/4" or "1/4"
  const quantityMatch = textWithoutNotes.match(
    /^([\d.]+(?:\s+\d+\/\d+)?|\d+\/\d+)\s+([a-z\s]+?)(?:\s+(.+))?$/i
  )

  if (!quantityMatch) {
    // No quantity found - might be just "eggs" or "a pinch of salt"
    return null
  }

  const quantityStr = quantityMatch[1]
  const unitStr = quantityMatch[2]?.trim() || ''
  const ingredientStr = quantityMatch[3]?.trim() || unitStr

  // Parse quantity (handle fractions like "2 1/4")
  const quantity = parseQuantity(quantityStr || '')
  if (quantity === null) return null

  // Normalize and validate unit
  const normalizedUnit = normalizeUnit(unitStr)
  if (!normalizedUnit) return null

  const unitType = getUnitType(normalizedUnit)

  return {
    original: trimmed,
    quantity,
    unit: normalizedUnit,
    unitType,
    ingredient: ingredientStr,
    notes,
  }
}

/**
 * Parse quantity string that may contain fractions
 * "2" -> 2
 * "2.5" -> 2.5
 * "1/4" -> 0.25
 * "2 1/4" -> 2.25
 */
function parseQuantity(quantityStr: string): number | null {
  const parts = quantityStr.split(/\s+/)
  let total = 0

  for (const part of parts) {
    if (part.includes('/')) {
      // Fraction
      const fractionParts = part.split('/')
      const numerator = fractionParts[0] ? parseFloat(fractionParts[0]) : NaN
      const denominator = fractionParts[1] ? parseFloat(fractionParts[1]) : NaN
      if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
        return null
      }
      total += numerator / denominator
    } else {
      // Decimal or integer
      const num = parseFloat(part)
      if (isNaN(num)) return null
      total += num
    }
  }

  return total > 0 ? total : null
}

/**
 * Normalize unit to standard form
 */
function normalizeUnit(unitStr: string): string | null {
  const lower = unitStr.toLowerCase().trim()

  // Direct alias lookup
  if (UNIT_ALIASES[lower]) {
    return UNIT_ALIASES[lower]
  }

  // Check if it's already a valid unit
  for (const conversion of Object.values(UNIT_CONVERSIONS)) {
    if (conversion.conversions[lower]) {
      return lower
    }
  }

  return null
}

/**
 * Get the type of unit (volume, weight, or count)
 */
function getUnitType(unit: string): UnitType {
  for (const [, conversion] of Object.entries(UNIT_CONVERSIONS)) {
    if (conversion.conversions[unit]) {
      return conversion.type
    }
  }
  return 'count'
}

/**
 * Parse all ingredients from a text block (multiple lines)
 */
export function parseIngredients(text: string): ParsedIngredient[] {
  const lines = text.split('\n')
  const ingredients: ParsedIngredient[] = []

  for (const line of lines) {
    // Skip empty lines and headings
    if (!line.trim() || line.trim().startsWith('#')) {
      continue
    }

    const parsed = parseIngredientLine(line)
    if (parsed) {
      ingredients.push(parsed)
    }
  }

  return ingredients
}

// ========================================
// UNIT CONVERSION
// ========================================

export interface ConversionResult {
  quantity: number
  unit: string
  baseQuantity: number
  baseUnit: string
}

/**
 * Convert ingredient quantity from one unit to another
 * Example: convertQuantity(2, 'cup', 'ml') -> { quantity: 473.176, unit: 'ml', ... }
 */
export function convertQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string
): ConversionResult | null {
  const normalizedFrom = normalizeUnit(fromUnit)
  const normalizedTo = normalizeUnit(toUnit)

  if (!normalizedFrom || !normalizedTo) return null

  // Find the conversion groups
  let fromGroup: UnitConversion | null = null
  let toGroup: UnitConversion | null = null

  for (const conversion of Object.values(UNIT_CONVERSIONS)) {
    if (conversion.conversions[normalizedFrom]) fromGroup = conversion
    if (conversion.conversions[normalizedTo]) toGroup = conversion
  }

  // Units must be in the same category (can't convert cups to grams)
  if (!fromGroup || !toGroup || fromGroup.baseUnit !== toGroup.baseUnit) {
    return null
  }

  // Convert to base unit, then to target unit
  const toBaseMultiplier = fromGroup.conversions[normalizedFrom] ?? 1
  const fromBaseMultiplier = toGroup.conversions[normalizedTo] ?? 1
  const baseQuantity = quantity * toBaseMultiplier
  const resultQuantity = baseQuantity / fromBaseMultiplier

  return {
    quantity: resultQuantity,
    unit: normalizedTo,
    baseQuantity,
    baseUnit: fromGroup.baseUnit,
  }
}

/**
 * Format a quantity as a readable string
 * 2.25 -> "2 1/4"
 * 0.5 -> "1/2"
 * 1.333 -> "1 1/3"
 */
export function formatQuantity(quantity: number): string {
  if (quantity % 1 === 0) {
    return quantity.toString()
  }

  // Convert to fraction
  const fractionMatch = closestFraction(quantity)
  if (fractionMatch && fractionMatch.error < 0.01) {
    const { whole, numerator, denominator } = fractionMatch
    if (whole > 0) {
      return `${whole} ${numerator}/${denominator}`
    }
    return `${numerator}/${denominator}`
  }

  return quantity.toFixed(2)
}

/**
 * Find closest simple fraction to a decimal
 */
function closestFraction(
  decimal: number
): { whole: number; numerator: number; denominator: number; error: number } | null {
  const whole = Math.floor(decimal)
  const remainder = decimal - whole

  const maxDenominator = 16 // 1/16 is smallest common cooking fraction
  let bestNumerator = 0
  let bestDenominator = 1
  let bestError = 1

  for (let denominator = 1; denominator <= maxDenominator; denominator++) {
    const numerator = Math.round(remainder * denominator)
    const value = numerator / denominator
    const error = Math.abs(value - remainder)

    if (error < bestError) {
      bestError = error
      bestNumerator = numerator
      bestDenominator = denominator
    }
  }

  if (bestNumerator === bestDenominator) {
    return { whole: whole + 1, numerator: 1, denominator: 1, error: 0 }
  }

  return { whole, numerator: bestNumerator, denominator: bestDenominator, error: bestError }
}

// ========================================
// RECIPE SCALING
// ========================================

export interface ScaledIngredient extends ParsedIngredient {
  scaledQuantity: number
  scaledUnit: string
  displayQuantity: string // Formatted for display
}

/**
 * Scale all ingredients based on servings ratio
 * originalServings=24, desiredServings=12 -> multiply all quantities by 0.5
 */
export function scaleRecipe(
  ingredients: ParsedIngredient[],
  originalServings: number,
  desiredServings: number
): ScaledIngredient[] {
  const scaleFactor = desiredServings / originalServings

  return ingredients.map((ingredient) => {
    const scaledQuantity = ingredient.quantity * scaleFactor

    return {
      ...ingredient,
      scaledQuantity,
      scaledUnit: ingredient.unit,
      displayQuantity: formatQuantity(scaledQuantity),
    }
  })
}

// ========================================
// INSTRUCTION PARSER
// ========================================

export interface ParsedInstruction {
  stepNumber: number
  text: string
  temperature?: { value: number; unit: 'F' | 'C' }
  time?: { value: number; unit: string } // "minutes", "seconds", etc.
}

/**
 * Parse instructions from numbered list
 * Extracts temperatures and cooking times
 */
export function parseInstructions(text: string): ParsedInstruction[] {
  const lines = text.split('\n')
  const instructions: ParsedInstruction[] = []
  let stepNumber = 0

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip empty lines and headings
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    // Extract step number if present
    const stepMatch = trimmed.match(/^(\d+)\.\s+(.+)$/)
    if (stepMatch) {
      const stepStr = stepMatch[1] ?? '0'
      const instructionText = stepMatch[2] ?? ''
      
      stepNumber = parseInt(stepStr)

      // Extract temperature
      const tempMatch = instructionText.match(/(\d+)°?([FC])/i)
      const temperature = tempMatch
        ? {
            value: parseInt(tempMatch[1] ?? '0'),
            unit: (tempMatch[2] ?? 'F').toUpperCase() as 'F' | 'C',
          }
        : undefined

      // Extract time
      const timeMatch = instructionText.match(/(\d+(?:\s*-\s*\d+)?)\s*(minute|min|second|sec|hour|hr)s?/i)
      const time = timeMatch
        ? {
            value: parseInt(timeMatch[1] ?? '0'),
            unit: (timeMatch[2] ?? 'minute').toLowerCase(),
          }
        : undefined

      instructions.push({
        stepNumber,
        text: instructionText,
        temperature,
        time,
      })
    }
  }

  return instructions
}

// ========================================
// EXPORTS
// ========================================

export const RecipeParser = {
  parseIngredientLine,
  parseIngredients,
  parseInstructions,
  convertQuantity,
  formatQuantity,
  scaleRecipe,
}
