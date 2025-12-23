/**
 * Utility functions for SQL to API Builder
 */

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'LEFT_NULL' | 'RIGHT_NULL' | 'FULL_NULL'

/**
 * Join Types Explanation (Set Theory)
 * 
 * Visual Reference:
 * 
 * INNER JOIN (Intersection)
 * ┌─────┐   ┌─────┐
 * │  A  │   │  B  │
 * │   ┌─┼───┼─┐   │
 * └───┼─┘   └─┼───┘
 *     │  A∩B  │
 *     └───────┘
 * 
 * LEFT JOIN (A + Intersection)
 * ┌─────────┐   ┌─────┐
 * │    A    │   │  B  │
 * │   ┌─────┼───┼─┐   │
 * │   │     └───┘ │   │
 * └───┴───────────┴───┘
 * 
 * RIGHT JOIN (B + Intersection)
 * ┌─────┐   ┌─────────┐
 * │  A  │   │    B    │
 * │   ┌─┼───┼─────┐   │
 * │   │ └───┘     │   │
 * └───┴───────────┴───┘
 * 
 * FULL OUTER JOIN (Union)
 * ┌─────────────────────┐
 * │         A∪B         │
 * │   ┌─────────────┐   │
 * │   │      │      │   │
 * └───┴─────────────┴───┘
 * 
 * LEFT JOIN (NULL) - Left Only
 * ┌─────────┐   ┌─────┐
 * │    A    │   │  B  │
 * │   ┌ ─ ─ ┼ ─ ┼ ┐   │
 * │   │     └───┘ │   │ (NULL)
 * └───┴───────────┴───┘
 * 
 * RIGHT JOIN (NULL) - Right Only
 * ┌─────┐   ┌─────────┐
 * │  A  │   │    B    │
 * │   ┌ ┼ ─ ┼ ─ ─ ┐   │
 * │   │ └───┘     │   │ (NULL)
 * └───┴───────────┴───┘
 * 
 * FULL OUTER (NULL) - Symmetric Difference
 * ┌─────────┐   ┌─────────┐
 * │    A    │   │    B    │
 * │   ┌ ─ ─ ┼ ─ ┼ ─ ─ ┐   │
 * │   │ (NULL) (NULL) │   │
 * └───┴───────────────┴───┘
 */

export interface JoinDefinition {
  type: JoinType
  label: string
  description: string
  sqlTemplate: string
  setTheory: string
  useCase: string
}

export const JOIN_DEFINITIONS: Record<JoinType, JoinDefinition> = {
  INNER: {
    type: 'INNER',
    label: 'Inner Join',
    description: 'Returns only matching rows from both tables',
    sqlTemplate: 'INNER JOIN {right} ON {left}.{lcol} = {right}.{rcol}',
    setTheory: 'A ∩ B (Intersection)',
    useCase: 'Find customers who have placed orders',
  },
  LEFT: {
    type: 'LEFT',
    label: 'Left Join',
    description: 'All rows from left table + matching rows from right',
    sqlTemplate: 'LEFT JOIN {right} ON {left}.{lcol} = {right}.{rcol}',
    setTheory: 'A ∪ (A ∩ B)',
    useCase: 'List all customers, including those without orders',
  },
  RIGHT: {
    type: 'RIGHT',
    label: 'Right Join',
    description: 'All rows from right table + matching rows from left',
    sqlTemplate: 'RIGHT JOIN {right} ON {left}.{lcol} = {right}.{rcol}',
    setTheory: 'B ∪ (A ∩ B)',
    useCase: 'List all orders, including orphaned ones',
  },
  FULL: {
    type: 'FULL',
    label: 'Full Outer Join',
    description: 'All rows from both tables, matching where possible',
    sqlTemplate: 'FULL OUTER JOIN {right} ON {left}.{lcol} = {right}.{rcol}',
    setTheory: 'A ∪ B (Union)',
    useCase: 'Complete dataset from both tables',
  },
  LEFT_NULL: {
    type: 'LEFT_NULL',
    label: 'Left Join (Exclude Matches)',
    description: 'Rows from left table that have NO match in right',
    sqlTemplate: 'LEFT JOIN {right} ON {left}.{lcol} = {right}.{rcol} WHERE {right}.{rcol} IS NULL',
    setTheory: 'A - B (Left Difference)',
    useCase: 'Find customers who have never placed an order',
  },
  RIGHT_NULL: {
    type: 'RIGHT_NULL',
    label: 'Right Join (Exclude Matches)',
    description: 'Rows from right table that have NO match in left',
    sqlTemplate: 'RIGHT JOIN {right} ON {left}.{lcol} = {right}.{rcol} WHERE {left}.{lcol} IS NULL',
    setTheory: 'B - A (Right Difference)',
    useCase: 'Find orphaned records in right table',
  },
  FULL_NULL: {
    type: 'FULL_NULL',
    label: 'Full Outer (Exclude Matches)',
    description: 'Rows that exist in only one table, not both',
    sqlTemplate: 'FULL OUTER JOIN {right} ON {left}.{lcol} = {right}.{rcol} WHERE {left}.{lcol} IS NULL OR {right}.{rcol} IS NULL',
    setTheory: 'A △ B (Symmetric Difference)',
    useCase: 'Find mismatches between two tables',
  },
}

/**
 * Build SQL query from query configuration
 */
export function buildSQLQuery(config: {
  tables: string[]
  columns: string[]
  joins: Array<{
    leftTable: string
    rightTable: string
    leftColumn: string
    rightColumn: string
    joinType: JoinType
  }>
  where?: string
  orderBy?: string
  limit?: number
}): string {
  if (config.tables.length === 0) {
    throw new Error('No tables selected')
  }

  let sql = 'SELECT '
  sql += config.columns.length > 0 ? config.columns.join(', ') : '*'
  sql += `\nFROM ${config.tables[0]}`

  for (const join of config.joins) {
    const def = JOIN_DEFINITIONS[join.joinType]
    let joinSQL = '\n'

    switch (join.joinType) {
      case 'INNER':
      case 'LEFT':
      case 'RIGHT':
      case 'FULL':
        joinSQL += def.sqlTemplate
          .replace('{right}', join.rightTable)
          .replace('{left}', join.leftTable)
          .replace('{lcol}', join.leftColumn)
          .replace('{rcol}', join.rightColumn)
        break

      case 'LEFT_NULL':
      case 'RIGHT_NULL':
      case 'FULL_NULL':
        const [joinPart, wherePart] = def.sqlTemplate.split(' WHERE ')
        joinSQL += joinPart
          .replace('{right}', join.rightTable)
          .replace('{left}', join.leftTable)
          .replace('{lcol}', join.leftColumn)
          .replace('{rcol}', join.rightColumn)
        
        if (!config.where) {
          joinSQL += '\nWHERE ' + wherePart
            .replace('{right}', join.rightTable)
            .replace('{left}', join.leftTable)
            .replace('{lcol}', join.leftColumn)
            .replace('{rcol}', join.rightColumn)
        }
        break
    }

    sql += joinSQL
  }

  if (config.where) {
    sql += `\nWHERE ${config.where}`
  }

  if (config.orderBy) {
    sql += `\nORDER BY ${config.orderBy}`
  }

  if (config.limit) {
    sql += `\nLIMIT ${config.limit}`
  }

  return sql
}

/**
 * Transform raw SQL results to custom JSON structure
 */
export function transformData(
  rawData: any[],
  mappingRules: Array<{
    sqlColumn: string
    jsonPath: string
    type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
  }>
): any[] {
  return rawData.map((row) => {
    const result: any = {}

    for (const rule of mappingRules) {
      const value = getNestedValue(row, rule.sqlColumn)
      setNestedValue(result, rule.jsonPath, convertType(value, rule.type))
    }

    return result
  })
}

function getNestedValue(obj: any, path: string): any {
  if (path.includes('.')) {
    const [table, ...rest] = path.split('.')
    const column = rest.join('.')
    return obj[path] !== undefined ? obj[path] : obj[column]
  }
  return obj[path]
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!current[key]) {
      current[key] = {}
    }
    current = current[key]
  }

  current[keys[keys.length - 1]] = value
}

function convertType(value: any, type: string): any {
  if (value === null || value === undefined) return null

  switch (type) {
    case 'number':
      return Number(value)
    case 'boolean':
      return Boolean(value)
    case 'date':
      return new Date(value).toISOString()
    case 'array':
      return Array.isArray(value) ? value : [value]
    case 'object':
      return typeof value === 'object' ? value : { value }
    default:
      return String(value)
  }
}

/**
 * Validate SQL query syntax
 */
export function validateSQL(sql: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Basic validation
  if (!sql.trim()) {
    errors.push('SQL query is empty')
  }

  if (!sql.toLowerCase().includes('select')) {
    errors.push('Query must include SELECT statement')
  }

  if (!sql.toLowerCase().includes('from')) {
    errors.push('Query must include FROM clause')
  }

  // Check for balanced parentheses
  const openParens = (sql.match(/\(/g) || []).length
  const closeParens = (sql.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    errors.push('Unbalanced parentheses in query')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Infer data type from column name
 */
export function inferDataType(columnName: string): 'string' | 'number' | 'boolean' | 'date' {
  const lower = columnName.toLowerCase()

  if (lower.includes('id') || lower.includes('count') || lower.includes('amount') || lower.includes('price')) {
    return 'number'
  }

  if (
    lower.includes('date') ||
    lower.includes('time') ||
    lower.includes('created') ||
    lower.includes('updated') ||
    lower.includes('modified')
  ) {
    return 'date'
  }

  if (
    lower.includes('is_') ||
    lower.includes('has_') ||
    lower.includes('active') ||
    lower.includes('enabled') ||
    lower.includes('deleted')
  ) {
    return 'boolean'
  }

  return 'string'
}
