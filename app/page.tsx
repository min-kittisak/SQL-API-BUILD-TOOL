'use client'

import { useState } from 'react'
import DatabaseConnection from '@/components/DatabaseConnection'
import QueryBuilder from '@/components/QueryBuilder'
import ResponseMapper from '@/components/ResponseMapper'
import APIGenerator from '@/components/APIGenerator'
import { Database, Code2, Zap, Settings } from 'lucide-react'

export type DatabaseConfig = {
  type: 'postgresql' | 'mysql' | 'mssql'
  host: string
  port: number
  database: string
  user: string
  password: string
}

export type TableSchema = {
  name: string
  columns: {
    name: string
    type: string
    nullable: boolean
    isPrimaryKey: boolean
    isForeignKey: boolean
    references?: { table: string; column: string }
  }[]
}

export type JoinConfig = {
  id: string
  leftTable: string
  rightTable: string
  leftColumn: string
  rightColumn: string
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'LEFT_NULL' | 'RIGHT_NULL' | 'FULL_NULL'
}

export type SQLQuery = {
  tables: string[]
  columns: string[]
  joins: JoinConfig[]
  where?: string
  orderBy?: string
  limit?: number
}

export type MappingRule = {
  id: string
  sqlColumn: string
  jsonPath: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
}

export default function Home() {
  const [step, setStep] = useState(1)
  const [dbConfig, setDbConfig] = useState<DatabaseConfig | null>(null)
  const [schema, setSchema] = useState<TableSchema[]>([])
  const [sqlQuery, setSqlQuery] = useState<SQLQuery>({
    tables: [],
    columns: [],
    joins: [],
  })
  const [mappingRules, setMappingRules] = useState<MappingRule[]>([])
  const [apiConfig, setApiConfig] = useState({
    method: 'GET' as 'GET' | 'POST',
    path: '/api/v1/data',
  })

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-dark-panel border-b border-dark-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold">เครื่องมือสร้าง API จาก SQL</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Settings className="w-4 h-4" />
            <span>Build REST API</span>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-dark-panel border-b border-dark-border px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-6">
          {[
            { num: 1, label: 'เชื่อมต่อฐานข้อมูล', icon: Database },
            { num: 2, label: 'สร้าง Query', icon: Code2 },
            { num: 3, label: 'ออกแบบ Response', icon: Settings },
            { num: 4, label: 'สร้าง API', icon: Zap },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                step === s.num
                  ? 'bg-blue-600 text-white'
                  : step > s.num
                  ? 'bg-green-800 text-white'
                  : 'bg-dark-bg text-gray-400 hover:bg-dark-hover'
              }`}
            >
              <s.icon className="w-4 h-4" />
              <span className="font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-h-0">
        {step === 1 && (
          <DatabaseConnection
            config={dbConfig}
            onConfigChange={setDbConfig}
            onSchemaFetched={setSchema}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <QueryBuilder
            schema={schema}
            query={sqlQuery}
            onQueryChange={setSqlQuery}
            dbConfig={dbConfig}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <ResponseMapper
            query={sqlQuery}
            mappingRules={mappingRules}
            onMappingChange={setMappingRules}
            dbConfig={dbConfig}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <APIGenerator
            query={sqlQuery}
            mappingRules={mappingRules}
            dbConfig={dbConfig}
            apiConfig={apiConfig}
            onApiConfigChange={setApiConfig}
            onBack={() => setStep(3)}
          />
        )}
      </main>
    </div>
  )
}
