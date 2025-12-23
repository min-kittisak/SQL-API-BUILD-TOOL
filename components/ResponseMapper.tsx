'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Eye, ArrowLeft, ArrowRight, FolderTree, PlayCircle } from 'lucide-react'
import type { DatabaseConfig, SQLQuery, MappingRule } from '@/app/page'
import Editor from '@monaco-editor/react'

type Props = {
  query: SQLQuery
  mappingRules: MappingRule[]
  onMappingChange: (rules: MappingRule[]) => void
  dbConfig: DatabaseConfig | null
  onNext: () => void
  onBack: () => void
}

export default function ResponseMapper({ query, mappingRules, onMappingChange, dbConfig, onNext, onBack }: Props) {
  const [sampleData, setSampleData] = useState<any[]>([])
  const [transformedData, setTransformedData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSampleData()
  }, [])

  useEffect(() => {
    if (sampleData.length > 0) {
      transformData()
    }
  }, [mappingRules, sampleData])

  const fetchSampleData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/database/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: dbConfig,
          query,
          limit: 5,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setSampleData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch sample data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addMappingRule = () => {
    const availableColumns = query.columns.length > 0 ? query.columns : ['*']
    const firstColumn = availableColumns[0]

    const newRule: MappingRule = {
      id: Date.now().toString(),
      sqlColumn: firstColumn,
      jsonPath: firstColumn.includes('.') ? firstColumn.split('.')[1] : firstColumn,
      type: 'string',
    }

    onMappingChange([...mappingRules, newRule])
  }

  const updateRule = (id: string, updates: Partial<MappingRule>) => {
    onMappingChange(mappingRules.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule)))
  }

  const removeRule = (id: string) => {
    onMappingChange(mappingRules.filter((rule) => rule.id !== id))
  }

  const transformData = () => {
    if (sampleData.length === 0) {
      setTransformedData(null)
      return
    }

    const transformed = sampleData.map((row) => {
      const result: any = {}

      for (const rule of mappingRules) {
        const value = getNestedValue(row, rule.sqlColumn)
        setNestedValue(result, rule.jsonPath, convertType(value, rule.type))
      }

      return result
    })

    setTransformedData(transformed)
  }

  const getNestedValue = (obj: any, path: string): any => {
    // Handle table.column format
    if (path.includes('.')) {
      const [table, ...rest] = path.split('.')
      const column = rest.join('.')
      // Try both formats: table.column and just column
      return obj[path] !== undefined ? obj[path] : obj[column]
    }
    return obj[path]
  }

  const setNestedValue = (obj: any, path: string, value: any) => {
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

  const convertType = (value: any, type: string): any => {
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

  const autoGenerateMapping = () => {
    const columns = query.columns.length > 0 ? query.columns : []
    const rules: MappingRule[] = columns.map((col, index) => {
      const parts = col.split('.')
      const columnName = parts.length > 1 ? parts[1] : col

      return {
        id: `auto-${index}`,
        sqlColumn: col,
        jsonPath: columnName,
        type: inferType(columnName),
      }
    })

    onMappingChange(rules)
  }

  const inferType = (columnName: string): MappingRule['type'] => {
    const lower = columnName.toLowerCase()
    if (lower.includes('id') || lower.includes('count') || lower.includes('amount')) return 'number'
    if (lower.includes('date') || lower.includes('time') || lower.includes('created') || lower.includes('updated'))
      return 'date'
    if (lower.includes('is') || lower.includes('has') || lower.includes('active')) return 'boolean'
    return 'string'
  }

  const availableColumns = query.columns.length > 0 ? query.columns : sampleData.length > 0 ? Object.keys(sampleData[0]) : []

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-dark-panel border-b border-dark-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1">
              <FolderTree className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold">ออกแบบโครงสร้าง JSON Response</h2>
            </div>
            <p className="text-sm text-gray-400 ml-9">แปลงผลลัพธ์ SQL เป็นรูปแบบ JSON ที่กำหนดเอง - แมปข้อมูลแบบแบนไปเป็นโครงสร้างซ้อนกัน</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={autoGenerateMapping}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm"
            >
              <PlayCircle className="w-4 h-4" />
              สร้างอัตโนมัติ
            </button>
            <button
              onClick={addMappingRule}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              เพิ่มกฎ
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Mapping Configuration */}
        <div className="w-1/2 border-r border-dark-border flex flex-col">
          <div className="bg-dark-panel border-b border-dark-border px-4 py-3">
            <h3 className="font-bold">กฎการแมป</h3>
            <p className="text-sm text-gray-400 mt-1">กำหนดว่า Column แต่ละตัวจะแมปไปที่โครงสร้าง JSON อย่างไร</p>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
            {mappingRules.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>ยังไม่มีกฎการแมป</p>
                  <p className="text-sm mt-1">คลิก "เพิ่มกฎ" หรือ "สร้างอัตโนมัติ" เพื่อเริ่ม</p>
                </div>
              </div>
            ) : (
              mappingRules.map((rule, index) => (
                <div key={rule.id} className="bg-dark-bg rounded-lg border border-dark-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-purple-400">Rule #{index + 1}</span>
                    <button onClick={() => removeRule(rule.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* SQL Column */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">SQL Column</label>
                      <select
                        value={rule.sqlColumn}
                        onChange={(e) => updateRule(rule.id, { sqlColumn: e.target.value })}
                        className="w-full bg-dark-panel border border-dark-border rounded px-3 py-2 text-sm"
                      >
                        {availableColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* JSON Path */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        JSON Path (ใช้จุดเพื่อซ้อนกัน: user.name)
                      </label>
                      <input
                        type="text"
                        value={rule.jsonPath}
                        onChange={(e) => updateRule(rule.id, { jsonPath: e.target.value })}
                        placeholder="เช่น user.email หรือ contact.address.city"
                        className="w-full bg-dark-panel border border-dark-border rounded px-3 py-2 text-sm"
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">ประเภทข้อมูล</label>
                      <select
                        value={rule.type}
                        onChange={(e) => updateRule(rule.id, { type: e.target.value as any })}
                        className="w-full bg-dark-panel border border-dark-border rounded px-3 py-2 text-sm"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date (ISO String)</option>
                        <option value="object">Object</option>
                        <option value="array">Array</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-1/2 flex flex-col">
          <div className="bg-dark-panel border-b border-dark-border px-4 py-3">
            <h3 className="font-bold">ตัวอย่างแบบเรียลไทม์</h3>
            <p className="text-sm text-gray-400 mt-1">
              ข้อมูลจริงจาก Query (สูงสุด 5 แถว) - ดูว่าโครงสร้าง JSON เป็นอย่างไร
            </p>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Raw SQL Result */}
            <div className="flex-1 border-b border-dark-border flex flex-col">
              <div className="bg-dark-hover px-4 py-2 text-sm font-medium text-gray-300">ผลลัพธ์ SQL ดิบ</div>
              <div className="flex-1 overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={JSON.stringify(sampleData, null, 2)}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Transformed JSON Response */}
            <div className="flex-1 flex flex-col">
              <div className="bg-dark-hover px-4 py-2 text-sm font-medium text-green-400">
                JSON Response ที่แปลงแล้ว
              </div>
              <div className="flex-1 overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={JSON.stringify(transformedData, null, 2)}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 12,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-dark-panel border-t border-dark-border p-4 flex justify-between">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
          <ArrowLeft className="w-4 h-4" />
          กลับไป Query Builder
        </button>
        <button
          onClick={onNext}
          disabled={mappingRules.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg"
        >
          ไปที่ API Generator
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
