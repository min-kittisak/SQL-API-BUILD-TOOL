'use client'

import { useState } from 'react'
import { Download, Copy, CheckCircle, Code2, ArrowLeft, Settings2 } from 'lucide-react'
import type { DatabaseConfig, SQLQuery, MappingRule } from '@/app/page'
import Editor from '@monaco-editor/react'

type Props = {
  query: SQLQuery
  mappingRules: MappingRule[]
  dbConfig: DatabaseConfig | null
  apiConfig: {
    method: 'GET' | 'POST'
    path: string
  }
  onApiConfigChange: (config: { method: 'GET' | 'POST'; path: string }) => void
  onBack: () => void
  onNext?: () => void
}

export default function APIGenerator({ query, mappingRules, dbConfig, apiConfig, onApiConfigChange, onBack, onNext }: Props) {
  const [copied, setCopied] = useState(false)

  const generateAPICode = (): string => {
    const sqlQuery = buildSQL(query)
    const transformCode = generateTransformFunction(mappingRules)

    const dbConnectionCode =
      dbConfig?.type === 'postgresql'
        ? `import { Client } from 'pg'

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})`
        : dbConfig?.type === 'mysql'
        ? `import mysql from 'mysql2/promise'

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})`
        : `import sql from 'mssql'

await sql.connect({
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
})`

    const executeCode =
      dbConfig?.type === 'postgresql'
        ? `await client.connect()
const result = await client.query(sql)
const rawData = result.rows
await client.end()`
        : dbConfig?.type === 'mysql'
        ? `const [rows] = await connection.query(sql)
const rawData = rows as any[]
await connection.end()`
        : `const result = await sql.query(sql)
const rawData = result.recordset
await sql.close()`

    return `import { NextRequest, NextResponse } from 'next/server'
${dbConfig?.type === 'postgresql' ? "import { Client } from 'pg'" : dbConfig?.type === 'mysql' ? "import mysql from 'mysql2/promise'" : "import sql from 'mssql'"}

/**
 * Generated API Endpoint
 * Path: ${apiConfig.path}
 * Method: ${apiConfig.method}
 * 
 * Environment Variables Required:
 * - DB_HOST
 * - DB_PORT
 * - DB_NAME
 * - DB_USER
 * - DB_PASSWORD
 */

${transformCode}

export async function ${apiConfig.method}(request: NextRequest) {
  try {
    // SQL Query
    const sql = \`${sqlQuery.trim()}\`

    // Database Connection
    ${dbConnectionCode}

    // Execute Query
    ${executeCode}

    // Transform Data
    const transformedData = transformData(rawData)

    // Return Response
    return NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
    })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
`
  }

  const buildSQL = (query: SQLQuery): string => {
    let sql = 'SELECT '
    sql += query.columns.length > 0 ? query.columns.join(', ') : '*'
    sql += `\\nFROM ${query.tables[0]}`

    for (const join of query.joins || []) {
      let joinSQL = '\\n'

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
          joinSQL += `LEFT JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}\\nWHERE ${join.rightTable}.${join.rightColumn} IS NULL`
          break
        case 'RIGHT_NULL':
          joinSQL += `RIGHT JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}\\nWHERE ${join.leftTable}.${join.leftColumn} IS NULL`
          break
        case 'FULL_NULL':
          joinSQL += `FULL OUTER JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}\\nWHERE ${join.leftTable}.${join.leftColumn} IS NULL OR ${join.rightTable}.${join.rightColumn} IS NULL`
          break
      }

      sql += joinSQL
    }

    if (query.where) {
      sql += `\\nWHERE ${query.where}`
    }

    if (query.orderBy) {
      sql += `\\nORDER BY ${query.orderBy}`
    }

    if (query.limit) {
      sql += `\\nLIMIT ${query.limit}`
    }

    return sql
  }

  const generateTransformFunction = (rules: MappingRule[]): string => {
    return `// Data Transformation Function
function transformData(rawData: any[]): any[] {
  return rawData.map((row) => {
    const result: any = {}

${rules
  .map((rule) => {
    const accessCode = `row['${rule.sqlColumn}'] || row['${rule.sqlColumn.split('.').pop()}']`
    const convertCode = generateTypeConversion(accessCode, rule.type)
    const setCode = generateSetNestedValue('result', rule.jsonPath, convertCode)
    return `    ${setCode}`
  })
  .join('\n')}

    return result
  })
}

function setNestedValue(obj: any, path: string, value: any) {
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
`
  }

  const generateTypeConversion = (accessor: string, type: string): string => {
    switch (type) {
      case 'number':
        return `Number(${accessor})`
      case 'boolean':
        return `Boolean(${accessor})`
      case 'date':
        return `new Date(${accessor}).toISOString()`
      case 'array':
        return `Array.isArray(${accessor}) ? ${accessor} : [${accessor}]`
      case 'object':
        return `typeof ${accessor} === 'object' ? ${accessor} : { value: ${accessor} }`
      default:
        return `String(${accessor})`
    }
  }

  const generateSetNestedValue = (objName: string, path: string, value: string): string => {
    if (!path.includes('.')) {
      return `${objName}['${path}'] = ${value}`
    }
    return `setNestedValue(${objName}, '${path}', ${value})`
  }

  const generateEnvFile = (): string => {
    return `# Database Configuration
DB_HOST=${dbConfig?.host || 'localhost'}
DB_PORT=${dbConfig?.port || '5432'}
DB_NAME=${dbConfig?.database || 'mydatabase'}
DB_USER=${dbConfig?.user || 'user'}
DB_PASSWORD=${dbConfig?.password || 'password'}
`
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generateAPICode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const code = generateAPICode()
    const blob = new Blob([code], { type: 'text/typescript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `route.ts`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadEnv = () => {
    const env = generateEnvFile()
    const blob = new Blob([env], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `.env.local`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-dark-panel border-b border-dark-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1">
              <Code2 className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-bold">สร้าง API พร้อมใช้งาน</h2>
            </div>
            <p className="text-sm text-gray-400 ml-9">Next.js API route ที่สมบูรณ์พร้อมการเชื่อมต่อฐานข้อมูลและการแปลงผลลัพธ์</p>
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
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm"
            >
              <Download className="w-4 h-4" />
              ดาวน์โหลด route.ts
            </button>
            <button
              onClick={handleDownloadEnv}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm"
            >
              <Download className="w-4 h-4" />
              ดาวน์โหลด .env.local
            </button>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-dark-panel border-b border-dark-border p-3">
        <div className="flex items-center gap-4">
          <Settings2 className="w-5 h-5 text-gray-400" />
          <div className="flex items-center gap-4 flex-1">
            <div>
              <label className="block text-xs text-gray-400 mb-1">HTTP Method</label>
              <select
                value={apiConfig.method}
                onChange={(e) => onApiConfigChange({ ...apiConfig, method: e.target.value as 'GET' | 'POST' })}
                className="bg-dark-bg border border-dark-border rounded px-2 py-1.5 text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">เส้นทาง API Endpoint</label>
              <input
                type="text"
                value={apiConfig.path}
                onChange={(e) => onApiConfigChange({ ...apiConfig, path: e.target.value })}
                placeholder="/api/v1/data"
                className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1.5 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Code Preview - Takes most of the space */}
      <div className="flex-1 min-h-0 flex flex-col bg-dark-bg">
        <div className="bg-dark-hover px-4 py-2 border-b border-dark-border flex-shrink-0">
          <h3 className="font-bold text-sm">โค้ด API ที่สร้าง</h3>
        </div>
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            defaultLanguage="typescript"
            value={generateAPICode()}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: true },
              fontSize: 14,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              padding: { top: 10, bottom: 10 },
            }}
          />
        </div>
      </div>

      {/* Instructions - Compact at bottom */}
      <div className="bg-blue-900/20 border-t border-blue-500/30 p-2 flex-shrink-0">
        <details className="cursor-pointer">
          <summary className="font-bold text-blue-300 text-sm">📋 คำแนะนำการติดตั้ง (คลิกเพื่อขยาย)</summary>
          <ol className="text-xs text-blue-200 space-y-1 list-decimal list-inside mt-2 ml-2">
            <li>สร้างไฟล์: <code className="bg-blue-900/40 px-1 py-0.5 rounded text-xs">app{apiConfig.path}/route.ts</code></li>
            <li>คัดลอกโค้ดที่สร้างไปวางในไฟล์</li>
            <li>ดาวน์โหลด .env.local ไปไว้ที่โฟลเดอร์ root ของโปรเจค</li>
            <li>ติดตั้ง: <code className="bg-blue-900/40 px-1 py-0.5 rounded text-xs">npm install {dbConfig?.type === 'postgresql' ? 'pg @types/pg' : dbConfig?.type === 'mysql' ? 'mysql2' : 'mssql'}</code></li>
            <li>รัน: <code className="bg-blue-900/40 px-1 py-0.5 rounded text-xs">npm run dev</code></li>
            <li>ทดสอบ: <code className="bg-blue-900/40 px-1 py-0.5 rounded text-xs">curl http://localhost:3000{apiConfig.path}</code></li>
          </ol>
        </details>
      </div>

      {/* Actions */}
      <div className="bg-dark-panel border-t border-dark-border p-4 flex justify-between">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
          <ArrowLeft className="w-4 h-4" />
          กลับไป Mapper
        </button>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">API พร้อมใช้งานแล้ว!</span>
          </div>
          {onNext && (
            <button
              onClick={onNext}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              ไปที่ C# Generator
              <Code2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
