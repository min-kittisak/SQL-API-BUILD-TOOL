'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Eye, AlertCircle, CheckCircle, ArrowLeft, ArrowRight, Settings2, ChevronDown, Search, Loader2 } from 'lucide-react'
import type { DatabaseConfig, TableSchema, SQLQuery, JoinConfig } from '@/app/page'
import Editor from '@monaco-editor/react'

type WhereCondition = {
  id: string
  column: string
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'IS NULL' | 'IS NOT NULL'
  value: string
  connector: 'AND' | 'OR'
}

type OrderByRule = {
  id: string
  column: string
  direction: 'ASC' | 'DESC'
}

type Props = {
  schema: TableSchema[]
  query: SQLQuery
  onQueryChange: (query: SQLQuery) => void
  dbConfig: DatabaseConfig | null
  onNext: () => void
  onBack: () => void
  onSchemaFetched: (schema: TableSchema[]) => void
}

const JOIN_TYPES = [
  { value: 'INNER', label: 'Inner Join', desc: 'เฉพาะแถวที่ตรงกันจากทั้งสองตาราง' },
  { value: 'LEFT', label: 'Left Join', desc: 'ทั้งหมดจากซ้าย + ที่ตรงกันจากขวา' },
  { value: 'RIGHT', label: 'Right Join', desc: 'ทั้งหมดจากขวา + ที่ตรงกันจากซ้าย' },
  { value: 'FULL', label: 'Full Join', desc: 'ทุกแถวจากทั้งสองตาราง' },
  { value: 'LEFT_NULL', label: 'Left Join (NULL)', desc: 'แถวซ้ายที่ไม่ตรงกับขวา' },
  { value: 'RIGHT_NULL', label: 'Right Join (NULL)', desc: 'แถวขวาที่ไม่ตรงกับซ้าย' },
  { value: 'FULL_NULL', label: 'Full Outer (NULL)', desc: 'แถวที่ไม่ตรงกันทั้งสองตาราง' },
] as const

export default function QueryBuilder({ schema, query, onQueryChange, dbConfig, onNext, onBack, onSchemaFetched }: Props) {
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [validationResult, setValidationResult] = useState<{ success: boolean; message: string } | null>(null)
  const [validating, setValidating] = useState(false)
  const [queryResults, setQueryResults] = useState<any[]>([])
  const [executing, setExecuting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [whereConditions, setWhereConditions] = useState<WhereCondition[]>([])
  const [orderByRules, setOrderByRules] = useState<OrderByRule[]>([])
  const [limitValue, setLimitValue] = useState<number | undefined>(query.limit)
  const [searchTable, setSearchTable] = useState<string>('')
  const [loadingSchema, setLoadingSchema] = useState(schema.length === 0)

  // Load schema if not loaded yet
  useEffect(() => {
    if (schema.length === 0 && dbConfig) {
      loadSchema()
    }
  }, [])

  const loadSchema = async () => {
    setLoadingSchema(true)
    try {
      const response = await fetch('/api/database/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbConfig),
      })
      const result = await response.json()
      if (result.success) {
        onSchemaFetched(result.schema)
      }
    } catch (error) {
      console.error('Failed to load schema:', error)
    } finally {
      setLoadingSchema(false)
    }
  }

  // Filter and sort tables
  const filteredAndSortedTables = schema
    .filter((table) => 
      table.name.toLowerCase().includes(searchTable.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  const addTable = (tableName: string) => {
    if (!query.tables.includes(tableName)) {
      onQueryChange({
        ...query,
        tables: [...query.tables, tableName],
      })
    }
  }

  const removeTable = (tableName: string) => {
    onQueryChange({
      ...query,
      tables: query.tables.filter((t) => t !== tableName),
      columns: query.columns.filter((c) => !c.startsWith(tableName + '.')),
      joins: query.joins.filter((j) => j.leftTable !== tableName && j.rightTable !== tableName),
    })
  }

  const toggleColumn = (tableName: string, columnName: string) => {
    const fullColumn = `${tableName}.${columnName}`
    const exists = query.columns.includes(fullColumn)

    onQueryChange({
      ...query,
      columns: exists ? query.columns.filter((c) => c !== fullColumn) : [...query.columns, fullColumn],
    })
  }

  const addJoin = () => {
    if (query.tables.length < 2) return

    const newJoin: JoinConfig = {
      id: Date.now().toString(),
      leftTable: query.tables[0],
      rightTable: query.tables[1],
      leftColumn: '',
      rightColumn: '',
      joinType: 'INNER',
    }

    onQueryChange({
      ...query,
      joins: [...query.joins, newJoin],
    })
  }

  const updateJoin = (id: string, updates: Partial<JoinConfig>) => {
    onQueryChange({
      ...query,
      joins: query.joins.map((j) => (j.id === id ? { ...j, ...updates } : j)),
    })
  }

  const removeJoin = (id: string) => {
    onQueryChange({
      ...query,
      joins: query.joins.filter((j) => j.id !== id),
    })
  }

  const addWhereCondition = () => {
    const availableColumns = query.columns.length > 0 ? query.columns : ['*']
    const newCondition: WhereCondition = {
      id: Date.now().toString(),
      column: availableColumns[0],
      operator: '=',
      value: '',
      connector: 'AND',
    }
    setWhereConditions([...whereConditions, newCondition])
  }

  const updateWhereCondition = (id: string, updates: Partial<WhereCondition>) => {
    setWhereConditions(whereConditions.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  const removeWhereCondition = (id: string) => {
    setWhereConditions(whereConditions.filter((c) => c.id !== id))
  }

  const addOrderByRule = () => {
    const availableColumns = query.columns.length > 0 ? query.columns : ['*']
    const newRule: OrderByRule = {
      id: Date.now().toString(),
      column: availableColumns[0],
      direction: 'ASC',
    }
    setOrderByRules([...orderByRules, newRule])
  }

  const updateOrderByRule = (id: string, updates: Partial<OrderByRule>) => {
    setOrderByRules(orderByRules.map((r) => (r.id === id ? { ...r, ...updates } : r)))
  }

  const removeOrderByRule = (id: string) => {
    setOrderByRules(orderByRules.filter((r) => r.id !== id))
  }

  const generateWhereClause = (): string => {
    if (whereConditions.length === 0) return ''
    
    return whereConditions
      .map((condition, index) => {
        let clause = ''
        
        // Add connector for all except first condition
        if (index > 0) {
          clause += ` ${condition.connector} `
        }
        
        // Build condition based on operator
        if (condition.operator === 'IS NULL' || condition.operator === 'IS NOT NULL') {
          clause += `${condition.column} ${condition.operator}`
        } else if (condition.operator === 'IN') {
          clause += `${condition.column} IN (${condition.value})`
        } else if (condition.operator === 'LIKE') {
          clause += `${condition.column} LIKE '${condition.value}'`
        } else {
          // For =, !=, >, <, >=, <=
          const valueIsNumber = !isNaN(Number(condition.value))
          const formattedValue = valueIsNumber ? condition.value : `'${condition.value}'`
          clause += `${condition.column} ${condition.operator} ${formattedValue}`
        }
        
        return clause
      })
      .join('')
  }

  const generateOrderByClause = (): string => {
    if (orderByRules.length === 0) return ''
    return orderByRules.map((rule) => `${rule.column} ${rule.direction}`).join(', ')
  }

  const updateWhereClause = (where: string) => {
    onQueryChange({ ...query, where })
  }

  const updateOrderBy = (orderBy: string) => {
    onQueryChange({ ...query, orderBy })
  }

  const updateLimit = (limit: number | undefined) => {
    setLimitValue(limit)
    onQueryChange({ ...query, limit })
  }

  const generateSQL = (): string => {
    if (query.tables.length === 0) return '-- ยังไม่ได้เลือกตาราง'

    let sql = 'SELECT '
    sql += query.columns.length > 0 ? query.columns.join(', ') : '*'
    sql += `\nFROM ${query.tables[0]}`

    for (const join of query.joins) {
      let joinSQL = '\n'
      
      switch (join.joinType) {
        case 'INNER':
          joinSQL += `INNER JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}`
          break
        case 'LEFT':
          joinSQL += `LEFT JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}`
          break
        case 'RIGHT':
          joinSQL += `RIGHT JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}`
          break
        case 'FULL':
          joinSQL += `FULL OUTER JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}`
          break
        case 'LEFT_NULL':
          joinSQL += `LEFT JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}\nWHERE ${join.rightTable}.${join.rightColumn} IS NULL`
          break
        case 'RIGHT_NULL':
          joinSQL += `RIGHT JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}\nWHERE ${join.leftTable}.${join.leftColumn} IS NULL`
          break
        case 'FULL_NULL':
          joinSQL += `FULL OUTER JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}\nWHERE ${join.leftTable}.${join.leftColumn} IS NULL OR ${join.rightTable}.${join.rightColumn} IS NULL`
          break
      }
      
      sql += joinSQL
    }

    if (query.where) {
      sql += `\nWHERE ${query.where}`
    } else if (whereConditions.length > 0) {
      sql += `\nWHERE ${generateWhereClause()}`
    }

    if (query.orderBy) {
      sql += `\nORDER BY ${query.orderBy}`
    } else if (orderByRules.length > 0) {
      sql += `\nORDER BY ${generateOrderByClause()}`
    }

    if (limitValue) {
      sql += `\nLIMIT ${limitValue}`
    } else if (query.limit) {
      sql += `\nLIMIT ${query.limit}`
    }

    return sql
  }

  const executeQuery = async () => {
    setExecuting(true)
    setValidationResult(null)
    setQueryResults([])

    try {
      const response = await fetch('/api/database/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: dbConfig, query, limit: 10 }),
      })

      const result = await response.json()
      
      if (result.success) {
        setQueryResults(result.data)
        setValidationResult({ 
          success: true, 
          message: `รัน Query สำเร็จ! ได้ ${result.data.length} แถว` 
        })
      } else {
        setValidationResult({ success: false, message: result.error || 'การรัน Query ล้มเหลว' })
      }
    } catch (error: any) {
      setValidationResult({ success: false, message: error.message || 'การรัน Query ล้มเหลว' })
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Schema */}
      <div className="w-80 bg-dark-panel border-r border-dark-border flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-dark-border">
          <h3 className="text-lg font-bold mb-3">โครงสร้าง Database</h3>
          {!loadingSchema && (
            <input
              type="text"
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              placeholder="ค้นหาตาราง..."
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm placeholder-gray-500"
            />
          )}
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {loadingSchema ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-500" />
              <p className="text-sm">กำลังโหลดโครงสร้างตาราง...</p>
              <p className="text-xs text-gray-500 mt-1">กรุณารอสักครู่</p>
            </div>
          ) : filteredAndSortedTables.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">ไม่พบตารางที่ตรงกับคำค้นหา</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedTables.map((table) => (
              <div key={table.name} className="bg-dark-bg rounded-lg border border-dark-border overflow-hidden">
                <div className="p-3 flex items-center justify-between bg-dark-hover">
                  <span className="font-medium">{table.name}</span>
                  <button
                    onClick={() => addTable(table.name)}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                  >
                    เพิ่ม
                  </button>
                </div>
                <div className="p-2 space-y-1 text-sm">
                  {table.columns.map((col) => (
                    <div key={col.name} className="flex items-center gap-2 text-gray-400">
                      <span className={col.isPrimaryKey ? 'text-yellow-500' : ''}>{col.name}</span>
                      <span className="text-xs text-gray-500">({col.type})</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Selected Tables */}
        <div className="bg-dark-panel border-b border-dark-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">ตารางที่เลือก</h3>
            <button
              onClick={addJoin}
              disabled={query.tables.length < 2}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm"
            >
              <Plus className="w-4 h-4" />
              เพิ่ม Join
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {query.tables.map((table) => (
              <div
                key={table}
                className="flex items-center gap-2 bg-blue-900/30 border border-blue-500 rounded-lg px-3 py-2"
              >
                <span className="font-medium">{table}</span>
                <button onClick={() => removeTable(table)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column Selection */}
        <div className="bg-dark-panel border-b border-dark-border p-4 max-h-80 overflow-y-auto">
          <h3 className="font-bold mb-3">เลือก Column (เลือกข้อมูลที่ต้องการดึง)</h3>
          <div className="flex gap-4">
            {query.tables.map((tableName) => {
              const table = schema.find((t) => t.name === tableName)
              if (!table) return null

              return (
                <div key={tableName} className="bg-dark-bg rounded-lg border border-dark-border p-3 min-w-[200px]">
                  <div className="font-medium mb-2 text-blue-400">{tableName}</div>
                  <div className="space-y-1">
                    {table.columns.map((col) => {
                      const fullColumn = `${tableName}.${col.name}`
                      const isSelected = query.columns.includes(fullColumn)

                      return (
                        <label key={col.name} className="flex items-center gap-2 cursor-pointer hover:bg-dark-hover p-1 rounded">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleColumn(tableName, col.name)}
                            className="rounded"
                          />
                          <span className="text-sm">{col.name}</span>
                          <span className="text-xs text-gray-500">({col.type})</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Advanced Query Options */}
        <div className="bg-dark-panel border-b border-dark-border p-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-3 py-2 bg-dark-bg hover:bg-dark-hover rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-blue-400" />
              <span className="font-bold">ตัวเลือกขั้นสูง (WHERE, ORDER BY, LIMIT ฯลฯ)</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
          
          {showAdvanced && (
            <div className="mt-3 p-4 bg-dark-bg rounded-lg border border-dark-border space-y-4">
              {/* WHERE Conditions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-blue-400">เงื่อนไข WHERE</label>
                  <button
                    onClick={addWhereCondition}
                    className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                  >
                    <Plus className="w-3 h-3" />
                    เพิ่มเงื่อนไข
                  </button>
                </div>

                {whereConditions.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">ยังไม่มีเงื่อนไข WHERE คลิก "เพิ่มเงื่อนไข" เพื่อกรองผลลัพธ์</p>
                ) : (
                  <div className="space-y-2">
                    {whereConditions.map((condition, index) => {
                      const availableColumns = query.columns.length > 0 ? query.columns : ['*']
                      const needsValue = !['IS NULL', 'IS NOT NULL'].includes(condition.operator)

                      return (
                        <div key={condition.id} className="bg-dark-panel rounded-lg p-3 border border-dark-border">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-purple-400 font-medium">#{index + 1}</span>
                            {index > 0 && (
                              <select
                                value={condition.connector}
                                onChange={(e) => updateWhereCondition(condition.id, { connector: e.target.value as 'AND' | 'OR' })}
                                className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs font-medium"
                              >
                                <option value="AND">AND</option>
                                <option value="OR">OR</option>
                              </select>
                            )}
                            <button
                              onClick={() => removeWhereCondition(condition.id)}
                              className="ml-auto text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {/* Column */}
                            <select
                              value={condition.column}
                              onChange={(e) => updateWhereCondition(condition.id, { column: e.target.value })}
                              className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs"
                            >
                              {availableColumns.map((col) => (
                                <option key={col} value={col}>
                                  {col}
                                </option>
                              ))}
                            </select>

                            {/* Operator */}
                            <select
                              value={condition.operator}
                              onChange={(e) => updateWhereCondition(condition.id, { operator: e.target.value as any })}
                              className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs"
                            >
                              <option value="=">=</option>
                              <option value="!=">≠ (!=)</option>
                              <option value=">">&gt;</option>
                              <option value="<">&lt;</option>
                              <option value=">=">≥ (&gt;=)</option>
                              <option value="<=">≤ (&lt;=)</option>
                              <option value="LIKE">LIKE</option>
                              <option value="IN">IN</option>
                              <option value="IS NULL">IS NULL</option>
                              <option value="IS NOT NULL">IS NOT NULL</option>
                            </select>

                            {/* Value */}
                            {needsValue && (
                              <input
                                type="text"
                                value={condition.value}
                                onChange={(e) => updateWhereCondition(condition.id, { value: e.target.value })}
                                placeholder={condition.operator === 'IN' ? '1,2,3' : condition.operator === 'LIKE' ? '%value%' : 'value'}
                                className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs placeholder-gray-600"
                              />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ORDER BY Rules */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-blue-400">เรียงลำดับ ORDER BY</label>
                  <button
                    onClick={addOrderByRule}
                    className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                  >
                    <Plus className="w-3 h-3" />
                    เพิ่มการเรียง
                  </button>
                </div>

                {orderByRules.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">ยังไม่มีกฎ ORDER BY คลิก "เพิ่มการเรียง" เพื่อเรียงผลลัพธ์</p>
                ) : (
                  <div className="space-y-2">
                    {orderByRules.map((rule, index) => {
                      const availableColumns = query.columns.length > 0 ? query.columns : ['*']

                      return (
                        <div key={rule.id} className="bg-dark-panel rounded-lg p-3 border border-dark-border">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-purple-400 font-medium">#{index + 1}</span>
                            
                            <select
                              value={rule.column}
                              onChange={(e) => updateOrderByRule(rule.id, { column: e.target.value })}
                              className="flex-1 bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs"
                            >
                              {availableColumns.map((col) => (
                                <option key={col} value={col}>
                                  {col}
                                </option>
                              ))}
                            </select>

                            <select
                              value={rule.direction}
                              onChange={(e) => updateOrderByRule(rule.id, { direction: e.target.value as 'ASC' | 'DESC' })}
                              className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs"
                            >
                              <option value="ASC">↑ ASC</option>
                              <option value="DESC">↓ DESC</option>
                            </select>

                            <button
                              onClick={() => removeOrderByRule(rule.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* LIMIT */}
              <div>
                <label className="block text-sm font-medium mb-2 text-blue-400">จำกัดจำนวน LIMIT</label>
                <input
                  type="number"
                  value={limitValue || ''}
                  onChange={(e) => updateLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="เช่น 100"
                  min="1"
                  className="w-full bg-dark-panel border border-dark-border rounded-lg px-3 py-2 text-sm placeholder-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">จำนวนแถวสูงสุดที่จะแสดงผล</p>
              </div>

              {/* Generated SQL Preview */}
              {(whereConditions.length > 0 || orderByRules.length > 0 || limitValue) && (
                <div className="pt-3 border-t border-dark-border">
                  <p className="text-xs font-medium text-gray-400 mb-2">🔍 คำสั่งที่สร้างขึ้น:</p>
                  <div className="space-y-1 text-xs font-mono bg-dark-panel p-2 rounded border border-dark-border">
                    {whereConditions.length > 0 && (
                      <p className="text-green-400">WHERE {generateWhereClause()}</p>
                    )}
                    {orderByRules.length > 0 && (
                      <p className="text-blue-400">ORDER BY {generateOrderByClause()}</p>
                    )}
                    {limitValue && (
                      <p className="text-purple-400">LIMIT {limitValue}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Join Configuration */}
        {query.joins.length > 0 && (
          <div className="bg-dark-panel border-b border-dark-border p-4">
            <h3 className="font-bold mb-3">การตั้งค่า Join (เชื่อมโยงตาราง)</h3>
            <div className="space-y-3">
              {query.joins.map((join) => {
                const leftTable = schema.find((t) => t.name === join.leftTable)
                const rightTable = schema.find((t) => t.name === join.rightTable)

                return (
                  <div key={join.id} className="bg-dark-bg rounded-lg border border-dark-border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-blue-400">Join #{query.joins.indexOf(join) + 1}</span>
                      <button onClick={() => removeJoin(join.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-3 items-center">
                      {/* Left Table */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">ตารางซ้าย</label>
                        <select
                          value={join.leftTable}
                          onChange={(e) => updateJoin(join.id, { leftTable: e.target.value })}
                          className="w-full bg-dark-panel border border-dark-border rounded px-2 py-1 text-sm"
                        >
                          {query.tables.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Left Column */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Column</label>
                        <select
                          value={join.leftColumn}
                          onChange={(e) => updateJoin(join.id, { leftColumn: e.target.value })}
                          className="w-full bg-dark-panel border border-dark-border rounded px-2 py-1 text-sm"
                        >
                          <option value="">เลือก...</option>
                          {leftTable?.columns.map((col) => (
                            <option key={col.name} value={col.name}>
                              {col.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Join Type */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">ประเภท Join</label>
                        <select
                          value={join.joinType}
                          onChange={(e) => updateJoin(join.id, { joinType: e.target.value as any })}
                          className="w-full bg-dark-panel border border-dark-border rounded px-2 py-1 text-sm"
                        >
                          {JOIN_TYPES.map((jt) => (
                            <option key={jt.value} value={jt.value} title={jt.desc}>
                              {jt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Right Table */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">ตารางขวา</label>
                        <select
                          value={join.rightTable}
                          onChange={(e) => updateJoin(join.id, { rightTable: e.target.value })}
                          className="w-full bg-dark-panel border border-dark-border rounded px-2 py-1 text-sm"
                        >
                          {query.tables.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Right Column */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Column</label>
                        <select
                          value={join.rightColumn}
                          onChange={(e) => updateJoin(join.id, { rightColumn: e.target.value })}
                          className="w-full bg-dark-panel border border-dark-border rounded px-2 py-1 text-sm"
                        >
                          <option value="">Select...</option>
                          {rightTable?.columns.map((col) => (
                            <option key={col.name} value={col.name}>
                              {col.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Join Type Description */}
                    <div className="mt-2 text-xs text-gray-500">
                      {JOIN_TYPES.find((jt) => jt.value === join.joinType)?.desc}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SQL Preview & Results */}
        <div className="bg-dark-bg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold mb-1">SQL Query และผลลัพธ์</h3>
              <p className="text-xs text-gray-400">รัน Query เพื่อดูข้อมูลจริงจากฐานข้อมูล</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={executeQuery}
                disabled={executing || query.tables.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium shadow-lg"
              >
                <Eye className="w-4 h-4" />
                {executing ? 'กำลังรัน...' : 'รันและดูตัวอย่าง'}
              </button>
            </div>
          </div>

          {validationResult && (
            <div
              className={`mb-3 p-3 rounded-lg flex items-center gap-2 ${
                validationResult.success ? 'bg-green-900/20 border border-green-500' : 'bg-red-900/20 border border-red-500'
              }`}
            >
              {validationResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${validationResult.success ? 'text-green-300' : 'text-red-300'}`}>
                {validationResult.message}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* SQL Preview */}
            <div>
              <div className="bg-dark-hover px-3 py-2 border-b border-dark-border">
                <h4 className="text-sm font-medium">คำสั่ง SQL</h4>
              </div>
              <div className="h-96 border border-dark-border rounded-b-lg overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="sql"
                  value={generateSQL()}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'off',
                  }}
                />
              </div>
            </div>

            {/* Query Results */}
            <div>
              <div className="bg-dark-hover px-3 py-2 border-b border-dark-border">
                <h4 className="text-sm font-medium">ผลลัพธ์ {queryResults.length > 0 && `(${queryResults.length} แถว)`}</h4>
              </div>
              <div className="h-96 border border-dark-border rounded-b-lg overflow-hidden">
                {queryResults.length > 0 ? (
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={JSON.stringify(queryResults, null, 2)}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: 'off',
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>คลิก "รันและดูตัวอย่าง" เพื่อดูผลลัพธ์</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-dark-panel border-t border-dark-border p-4 flex justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปการเชื่อมต่อ
          </button>
          <button
            onClick={onNext}
            disabled={!validationResult?.success || queryResults.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg"
          >
            ไปที่ออกแบบ JSON Response
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
