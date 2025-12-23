'use client'

import { useState } from 'react'
import { Download, Copy, CheckCircle, Code2, ArrowLeft } from 'lucide-react'
import type { TableSchema, SQLQuery } from '@/app/page'
import Editor from '@monaco-editor/react'

type Props = {
  schema: TableSchema[]
  query: SQLQuery
  onBack: () => void
}

export default function CSharpGenerator({ schema, query, onBack }: Props) {
  const [copied, setCopied] = useState(false)
  const [namespace, setNamespace] = useState('DZ_RAOT_API.ViewModels')

  const toPascalCase = (str: string): string => {
    return str
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }

  const mapSqlTypeToCSharp = (sqlType: string): string => {
    const type = sqlType.toLowerCase()
    
    if (type.includes('int') || type.includes('serial')) return 'int'
    if (type.includes('bigint') || type.includes('bigserial')) return 'long'
    if (type.includes('decimal') || type.includes('numeric') || type.includes('money')) return 'decimal'
    if (type.includes('float') || type.includes('double') || type.includes('real')) return 'double'
    if (type.includes('bool')) return 'bool'
    if (type.includes('date') || type.includes('time')) return 'DateTime?'
    if (type.includes('char') || type.includes('text') || type.includes('varchar')) return 'string'
    if (type.includes('uuid') || type.includes('guid')) return 'Guid'
    if (type.includes('json')) return 'string'
    if (type.includes('blob') || type.includes('bytea') || type.includes('binary')) return 'byte[]'
    
    return 'string' // default
  }

  const getStringLength = (sqlType: string): number | null => {
    const match = sqlType.match(/\((\d+)\)/)
    return match ? parseInt(match[1]) : null
  }

  const generateCSharpModel = (table: TableSchema): string => {
    const className = `${toPascalCase(table.name)}Model`
    const properties = table.columns.map((col) => {
      const propName = toPascalCase(col.name)
      const csharpType = mapSqlTypeToCSharp(col.type)
      const stringLength = getStringLength(col.type)
      const isRequired = !col.nullable

      let attributes = []
      
      // Add Required attribute for non-nullable fields
      if (isRequired && !csharpType.includes('?')) {
        attributes.push('        [Required]')
      }
      
      // Add StringLength for string types
      if (csharpType === 'string' && stringLength) {
        attributes.push(`        [StringLength(${stringLength})]`)
      }

      const attributesStr = attributes.length > 0 ? attributes.join('\n') + '\n' : ''
      
      return `        /// <summary>
        /// ${col.name}
        /// </summary>
${attributesStr}        public ${csharpType} ${propName} { get; set; }`
    }).join('\n\n')

    return `using System.ComponentModel.DataAnnotations;

namespace ${namespace}
{
    /// <summary>
    /// ViewModel สำหรับตาราง ${table.name}
    /// </summary>
    public class ${className}
    {
${properties}
    }
}`
  }

  const generateAllModels = (): string => {
    const selectedTables = schema.filter((table) => query.tables.includes(table.name))
    
    if (selectedTables.length === 0) {
      return '// กรุณาเลือกตารางก่อน'
    }

    return selectedTables.map((table) => generateCSharpModel(table)).join('\n\n' + '='.repeat(80) + '\n\n')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generateAllModels())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const selectedTables = schema.filter((table) => query.tables.includes(table.name))
    
    if (selectedTables.length === 0) return

    if (selectedTables.length === 1) {
      // Download single file
      const table = selectedTables[0]
      const code = generateCSharpModel(table)
      const fileName = `${toPascalCase(table.name)}Model.cs`
      downloadFile(code, fileName)
    } else {
      // Download as ZIP (simplified - download all in one file)
      const code = generateAllModels()
      downloadFile(code, 'ViewModels.cs')
    }
  }

  const downloadFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-panel border-b border-dark-border p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1">
              <Code2 className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold">สร้าง C# ViewModels</h2>
            </div>
            <p className="text-sm text-gray-400 ml-9">สร้าง C# ViewModel classes จากตารางที่เลือก</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}
            </button>
            <button
              onClick={handleDownload}
              disabled={query.tables.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm"
            >
              <Download className="w-4 h-4" />
              ดาวน์โหลด .cs
            </button>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-dark-panel border-b border-dark-border p-4 flex-shrink-0">
        <div className="max-w-2xl">
          <label className="block text-sm font-medium mb-2">Namespace</label>
          <input
            type="text"
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm"
            placeholder="DZ_RAOT_API.ViewModels"
          />
          <p className="text-xs text-gray-500 mt-1">กำหนด namespace สำหรับ ViewModels</p>
        </div>
      </div>

      {/* Selected Tables Info */}
      <div className="bg-dark-panel border-b border-dark-border px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">ตารางที่เลือก:</span>
          {query.tables.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {query.tables.map((table) => (
                <span key={table} className="px-2 py-1 bg-blue-900/30 border border-blue-500 rounded text-blue-300">
                  {table} → {toPascalCase(table)}Model.cs
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-500 italic">ยังไม่ได้เลือกตาราง</span>
          )}
        </div>
      </div>

      {/* Code Preview */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full border border-dark-border rounded-lg overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="csharp"
            value={generateAllModels()}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: true },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="bg-dark-panel border-t border-dark-border p-4 flex justify-between flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับไป Query Builder
        </button>
        <div className="text-sm text-gray-400">
          💡 ใช้ Data Annotations: [Required], [StringLength], และ XML Comments
        </div>
      </div>
    </div>
  )
}
