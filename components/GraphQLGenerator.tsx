'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Copy, Download, CheckCircle2, Code2 } from 'lucide-react'
import type { DatabaseConfig, TableSchema } from '@/app/page'

type Props = {
  onBack: () => void
  dbConfig: DatabaseConfig | null
  schema: TableSchema[]
}

type GenerateMode = 'types' | 'queries' | 'mutations' | 'full'
type ViewMode = 'schema' | 'usage' | 'resolver'

export default function GraphQLGenerator({ onBack, dbConfig, schema }: Props) {
  const [mode, setMode] = useState<GenerateMode>('full')
  const [viewMode, setViewMode] = useState<ViewMode>('schema')
  const [copied, setCopied] = useState(false)
  const [includeSubscriptions, setIncludeSubscriptions] = useState(false)
  const [includeInputTypes, setIncludeInputTypes] = useState(true)

  // SQL Type to GraphQL Type mapping
  const sqlToGraphQLType = (sqlType: string): string => {
    const type = sqlType.toLowerCase()
    if (type.includes('int') || type.includes('serial') || type.includes('bigint')) return 'Int'
    if (type.includes('float') || type.includes('double') || type.includes('decimal') || type.includes('numeric')) return 'Float'
    if (type.includes('bool')) return 'Boolean'
    if (type.includes('date') || type.includes('time')) return 'String' // Can be custom DateTime scalar
    if (type.includes('json')) return 'JSON' // Custom JSON scalar
    return 'String'
  }

  // Generate GraphQL Types
  const generateTypes = (): string => {
    let output = '# GraphQL Types\n\n'
    
    schema.forEach(table => {
      const typeName = table.name.charAt(0).toUpperCase() + table.name.slice(1).replace(/_([a-z])/g, (g) => g[1].toUpperCase())
      
      output += `type ${typeName} {\n`
      table.columns.forEach(col => {
        const fieldName = col.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
        const fieldType = sqlToGraphQLType(col.type)
        const nullable = col.nullable ? '' : '!'
        output += `  ${fieldName}: ${fieldType}${nullable}\n`
      })
      output += `}\n\n`
    })

    return output
  }

  // Generate Input Types
  const generateInputTypes = (): string => {
    let output = '# Input Types\n\n'
    
    schema.forEach(table => {
      const typeName = table.name.charAt(0).toUpperCase() + table.name.slice(1).replace(/_([a-z])/g, (g) => g[1].toUpperCase())
      
      // Create Input
      output += `input Create${typeName}Input {\n`
      table.columns
        .filter(col => !col.isPrimaryKey) // Exclude primary keys from create input
        .forEach(col => {
          const fieldName = col.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
          const fieldType = sqlToGraphQLType(col.type)
          const nullable = col.nullable ? '' : '!'
          output += `  ${fieldName}: ${fieldType}${nullable}\n`
        })
      output += `}\n\n`

      // Update Input
      output += `input Update${typeName}Input {\n`
      table.columns
        .filter(col => !col.isPrimaryKey)
        .forEach(col => {
          const fieldName = col.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
          const fieldType = sqlToGraphQLType(col.type)
          output += `  ${fieldName}: ${fieldType}\n` // All optional for updates
        })
      output += `}\n\n`

      // Filter Input
      output += `input ${typeName}FilterInput {\n`
      table.columns.forEach(col => {
        const fieldName = col.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
        const fieldType = sqlToGraphQLType(col.type)
        output += `  ${fieldName}: ${fieldType}\n`
      })
      output += `  AND: [${typeName}FilterInput!]\n`
      output += `  OR: [${typeName}FilterInput!]\n`
      output += `}\n\n`
    })

    return output
  }

  // Generate Queries
  const generateQueries = (): string => {
    let output = '# Queries\n\ntype Query {\n'
    
    schema.forEach(table => {
      const typeName = table.name.charAt(0).toUpperCase() + table.name.slice(1).replace(/_([a-z])/g, (g) => g[1].toUpperCase())
      const pkColumn = table.columns.find(col => col.isPrimaryKey)
      const pkType = pkColumn ? sqlToGraphQLType(pkColumn.type) : 'ID'
      
      // Get single item
      output += `  ${table.name}(id: ${pkType}!): ${typeName}\n`
      
      // Get list with filters
      output += `  ${table.name}s(\n`
      output += `    filter: ${typeName}FilterInput\n`
      output += `    limit: Int\n`
      output += `    offset: Int\n`
      output += `    orderBy: String\n`
      output += `  ): [${typeName}!]!\n`
    })
    
    output += `}\n\n`
    return output
  }

  // Generate Mutations
  const generateMutations = (): string => {
    let output = '# Mutations\n\ntype Mutation {\n'
    
    schema.forEach(table => {
      const typeName = table.name.charAt(0).toUpperCase() + table.name.slice(1).replace(/_([a-z])/g, (g) => g[1].toUpperCase())
      const pkColumn = table.columns.find(col => col.isPrimaryKey)
      const pkType = pkColumn ? sqlToGraphQLType(pkColumn.type) : 'ID'
      
      // Create
      output += `  create${typeName}(input: Create${typeName}Input!): ${typeName}!\n`
      
      // Update
      output += `  update${typeName}(id: ${pkType}!, input: Update${typeName}Input!): ${typeName}!\n`
      
      // Delete
      output += `  delete${typeName}(id: ${pkType}!): Boolean!\n`
    })
    
    output += `}\n\n`
    return output
  }

  // Generate Subscriptions
  const generateSubscriptions = (): string => {
    let output = '# Subscriptions\n\ntype Subscription {\n'
    
    schema.forEach(table => {
      const typeName = table.name.charAt(0).toUpperCase() + table.name.slice(1).replace(/_([a-z])/g, (g) => g[1].toUpperCase())
      const pkColumn = table.columns.find(col => col.isPrimaryKey)
      const pkType = pkColumn ? sqlToGraphQLType(pkColumn.type) : 'ID'
      
      output += `  ${table.name}Created: ${typeName}!\n`
      output += `  ${table.name}Updated: ${typeName}!\n`
      output += `  ${table.name}Deleted: ${pkType}!\n`
    })
    
    output += `}\n\n`
    return output
  }

  // Generate Custom Scalars
  const generateScalars = (): string => {
    return `# Custom Scalars\n\nscalar DateTime\nscalar JSON\n\n`
  }

  // Full Schema Generation
  const fullSchema = useMemo(() => {
    if (!schema || schema.length === 0) return '# No schema available. Please connect to database first.'

    let output = `# GraphQL Schema\n# Generated from ${dbConfig?.type} database: ${dbConfig?.database}\n# Generated at: ${new Date().toISOString()}\n\n`
    
    output += generateScalars()
    output += generateTypes()
    
    if (includeInputTypes) {
      output += generateInputTypes()
    }
    
    output += generateQueries()
    output += generateMutations()
    
    if (includeSubscriptions) {
      output += generateSubscriptions()
    }

    return output
  }, [schema, dbConfig, includeInputTypes, includeSubscriptions])

  const currentOutput = useMemo(() => {
    if (!schema || schema.length === 0) return '# No schema available'
    
    switch (mode) {
      case 'types':
        return generateScalars() + generateTypes() + (includeInputTypes ? generateInputTypes() : '')
      case 'queries':
        return generateQueries()
      case 'mutations':
        return generateMutations()
      case 'full':
        return fullSchema
      default:
        return fullSchema
    }
  }, [mode, schema, includeInputTypes, fullSchema])

  // Generate Usage Guide
  const usageGuide = useMemo(() => {
    if (!schema || schema.length === 0) return '# No schema available'
    
    const firstTable = schema[0]
    const typeName = firstTable.name.charAt(0).toUpperCase() + firstTable.name.slice(1).replace(/_([a-z])/g, (g) => g[1].toUpperCase())
    const pkColumn = firstTable.columns.find(col => col.isPrimaryKey)
    
    return `# 📘 คู่มือการใช้งาน GraphQL Schema

## 🚀 วิธีใช้งาน Schema นี้

### 1. ติดตั้ง GraphQL Server

\`\`\`bash
# ใช้ Apollo Server (แนะนำ)
npm install apollo-server graphql

# หรือ GraphQL Yoga
npm install graphql-yoga graphql
\`\`\`

### 2. สร้างไฟล์ schema.graphql
- บันทึก schema ที่ generate ออกมาเป็นไฟล์ \`schema.graphql\`

### 3. ตัวอย่างการ Query

\`\`\`graphql
# ดึงข้อมูลทั้งหมด
query {
  ${firstTable.name}s {
    ${firstTable.columns.slice(0, 3).map(c => c.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())).join('\n    ')}
  }
}

# ดึงข้อมูลตาม ID
query {
  ${firstTable.name}(id: 1) {
    ${firstTable.columns.slice(0, 3).map(c => c.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())).join('\n    ')}
  }
}

# ดึงข้อมูลพร้อมกรอง
query {
  ${firstTable.name}s(
    filter: { ${firstTable.columns[0].name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())}: "value" }
    limit: 10
    offset: 0
  ) {
    ${firstTable.columns.slice(0, 3).map(c => c.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())).join('\n    ')}
  }
}
\`\`\`

### 4. ตัวอย่างการ Mutation

\`\`\`graphql
# สร้างข้อมูลใหม่
mutation {
  create${typeName}(input: {
    ${firstTable.columns.filter(c => !c.isPrimaryKey).slice(0, 2).map(c => 
      `${c.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())}: "value"`
    ).join('\n    ')}
  }) {
    ${pkColumn?.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase()) || 'id'}
    ${firstTable.columns.slice(0, 2).map(c => c.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())).join('\n    ')}
  }
}

# อัพเดตข้อมูล
mutation {
  update${typeName}(
    id: 1
    input: {
      ${firstTable.columns.filter(c => !c.isPrimaryKey)[0]?.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())}: "new value"
    }
  ) {
    ${pkColumn?.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase()) || 'id'}
  }
}

# ลบข้อมูล
mutation {
  delete${typeName}(id: 1)
}
\`\`\`

## 🔧 เครื่องมือแนะนำ

1. **Apollo Server** - GraphQL server สำหรับ Node.js
2. **GraphQL Playground** - UI สำหรับทดสอบ queries
3. **Apollo Client** - Client library สำหรับ React/Vue
4. **Hasura** - Instant GraphQL API (ไม่ต้องเขียน resolver)
5. **Prisma** - ORM ที่รองรับ GraphQL

## 📚 Next Steps

1. เขียน Resolvers สำหรับแต่ละ query/mutation
2. เชื่อมต่อกับฐานข้อมูล (ใช้ Prisma, Sequelize, หรือ SQL โดยตรง)
3. เพิ่ม Authentication & Authorization
4. Deploy ไปยัง server (Vercel, Railway, Heroku)
`
  }, [schema])

  // Generate Resolver Example
  const resolverExample = useMemo(() => {
    if (!schema || schema.length === 0) return '# No schema available'
    
    const firstTable = schema[0]
    const typeName = firstTable.name.charAt(0).toUpperCase() + firstTable.name.slice(1).replace(/_([a-z])/g, (g) => g[1].toUpperCase())
    
    return `// 💡 ตัวอย่าง Resolver สำหรับ ${typeName}
// File: resolvers/${firstTable.name}.js

import db from './db' // ใช้ database connection ของคุณ

export const ${firstTable.name}Resolvers = {
  Query: {
    // ดึงข้อมูลตาม ID
    ${firstTable.name}: async (_, { id }) => {
      return await db.query(
        'SELECT * FROM ${firstTable.name} WHERE ${firstTable.columns.find(c => c.isPrimaryKey)?.name || 'id'} = $1',
        [id]
      )
    },

    // ดึงข้อมูลทั้งหมดพร้อมกรอง
    ${firstTable.name}s: async (_, { filter, limit = 100, offset = 0, orderBy }) => {
      let query = 'SELECT * FROM ${firstTable.name}'
      const params = []
      
      // Apply filters
      if (filter) {
        const conditions = []
        let paramIndex = 1
        
        ${firstTable.columns.slice(0, 2).map(c => `
        if (filter.${c.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())}) {
          conditions.push(\`${c.name} = $\${paramIndex++}\`)
          params.push(filter.${c.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())})
        }`).join('\n        ')}
        
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ')
        }
      }
      
      // Order by
      if (orderBy) {
        query += \` ORDER BY \${orderBy}\`
      }
      
      // Pagination
      query += \` LIMIT \${limit} OFFSET \${offset}\`
      
      const result = await db.query(query, params)
      return result.rows
    }
  },

  Mutation: {
    // สร้างข้อมูลใหม่
    create${typeName}: async (_, { input }) => {
      const columns = Object.keys(input)
      const values = Object.values(input)
      const placeholders = values.map((_, i) => \`$\${i + 1}\`).join(', ')
      
      const query = \`
        INSERT INTO ${firstTable.name} (\${columns.join(', ')})
        VALUES (\${placeholders})
        RETURNING *
      \`
      
      const result = await db.query(query, values)
      return result.rows[0]
    },

    // อัพเดตข้อมูล
    update${typeName}: async (_, { id, input }) => {
      const updates = Object.keys(input)
        .map((key, i) => \`\${key} = $\${i + 2}\`)
        .join(', ')
      
      const query = \`
        UPDATE ${firstTable.name}
        SET \${updates}
        WHERE ${firstTable.columns.find(c => c.isPrimaryKey)?.name || 'id'} = $1
        RETURNING *
      \`
      
      const values = [id, ...Object.values(input)]
      const result = await db.query(query, values)
      return result.rows[0]
    },

    // ลบข้อมูล
    delete${typeName}: async (_, { id }) => {
      const query = 'DELETE FROM ${firstTable.name} WHERE ${firstTable.columns.find(c => c.isPrimaryKey)?.name || 'id'} = $1'
      await db.query(query, [id])
      return true
    }
  }
}

// 🚀 วิธีใช้งาน
// 1. Import resolver นี้ไปยัง server หลัก
// 2. รวม resolver ทั้งหมดเข้าด้วยกัน
// 3. ส่งให้ Apollo Server

// ตัวอย่าง server setup:
/*
import { ApolloServer } from 'apollo-server'
import { readFileSync } from 'fs'
import { ${firstTable.name}Resolvers } from './resolvers/${firstTable.name}'

const typeDefs = readFileSync('./schema.graphql', 'utf-8')

const resolvers = {
  Query: {
    ...${firstTable.name}Resolvers.Query,
    // ...other resolvers
  },
  Mutation: {
    ...${firstTable.name}Resolvers.Mutation,
    // ...other resolvers
  }
}

const server = new ApolloServer({ typeDefs, resolvers })

server.listen().then(({ url }) => {
  console.log(\`🚀 Server ready at \${url}\`)
})
*/
`
  }, [schema])

  const handleCopy = () => {
    const textToCopy = viewMode === 'schema' ? currentOutput : viewMode === 'usage' ? usageGuide : resolverExample
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const content = viewMode === 'schema' ? currentOutput : viewMode === 'usage' ? usageGuide : resolverExample
    const extension = viewMode === 'schema' ? 'graphql' : viewMode === 'usage' ? 'md' : 'js'
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = viewMode === 'schema' ? `schema-${mode}.${extension}` : `${viewMode}.${extension}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-panel border-b border-dark-border p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code2 className="w-6 h-6 text-purple-500" />
            <div>
              <h2 className="text-xl font-bold">GraphQL Schema Generator</h2>
              <p className="text-sm text-gray-400">แปลง SQL Schema เป็น GraphQL Schema</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Options */}
        <div className="w-80 bg-dark-panel border-r border-dark-border p-4 overflow-y-auto flex-shrink-0">
          <div className="space-y-4">
            {/* Database Info */}
            <div className="bg-dark-bg rounded-lg p-3 border border-dark-border">
              <h3 className="text-sm font-semibold mb-2 text-gray-400">Database Info</h3>
              {dbConfig ? (
                <div className="space-y-1 text-xs">
                  <p><span className="text-gray-500">Type:</span> {dbConfig.type}</p>
                  <p><span className="text-gray-500">Database:</span> {dbConfig.database}</p>
                  <p><span className="text-gray-500">Tables:</span> {schema.length}</p>
                </div>
              ) : (
                <p className="text-xs text-red-400">Not connected</p>
              )}
            </div>

            {/* Generation Mode */}
            <div>
              <label className="block text-sm font-medium mb-2">Generation Mode</label>
              <div className="space-y-2">
                <button
                  onClick={() => setMode('types')}
                  className={`w-full px-3 py-2 rounded text-sm text-left ${
                    mode === 'types'
                      ? 'bg-purple-600 text-white'
                      : 'bg-dark-bg hover:bg-dark-hover'
                  }`}
                >
                  Types Only
                </button>
                <button
                  onClick={() => setMode('queries')}
                  className={`w-full px-3 py-2 rounded text-sm text-left ${
                    mode === 'queries'
                      ? 'bg-purple-600 text-white'
                      : 'bg-dark-bg hover:bg-dark-hover'
                  }`}
                >
                  Queries Only
                </button>
                <button
                  onClick={() => setMode('mutations')}
                  className={`w-full px-3 py-2 rounded text-sm text-left ${
                    mode === 'mutations'
                      ? 'bg-purple-600 text-white'
                      : 'bg-dark-bg hover:bg-dark-hover'
                  }`}
                >
                  Mutations Only
                </button>
                <button
                  onClick={() => setMode('full')}
                  className={`w-full px-3 py-2 rounded text-sm text-left ${
                    mode === 'full'
                      ? 'bg-purple-600 text-white'
                      : 'bg-dark-bg hover:bg-dark-hover'
                  }`}
                >
                  Full Schema
                </button>
              </div>
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium mb-2">Options</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeInputTypes}
                    onChange={(e) => setIncludeInputTypes(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-dark-bg"
                  />
                  <span className="text-sm">Include Input Types</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSubscriptions}
                    onChange={(e) => setIncludeSubscriptions(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-dark-bg"
                  />
                  <span className="text-sm">Include Subscriptions</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4">
              <button
                onClick={handleCopy}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Schema
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download .graphql
              </button>
            </div>

            {/* Stats */}
            <div className="bg-dark-bg rounded-lg p-3 border border-dark-border">
              <h3 className="text-sm font-semibold mb-2 text-gray-400">Statistics</h3>
              <div className="space-y-1 text-xs">
                <p><span className="text-gray-500">Types:</span> {schema.length}</p>
                <p><span className="text-gray-500">Lines:</span> {currentOutput.split('\n').length}</p>
                <p><span className="text-gray-500">Characters:</span> {currentOutput.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Schema Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* View Mode Tabs */}
          <div className="p-4 border-b border-dark-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('schema')}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    viewMode === 'schema'
                      ? 'bg-purple-600 text-white'
                      : 'bg-dark-bg text-gray-400 hover:bg-dark-hover'
                  }`}
                >
                  📄 Schema
                </button>
                <button
                  onClick={() => setViewMode('usage')}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    viewMode === 'usage'
                      ? 'bg-purple-600 text-white'
                      : 'bg-dark-bg text-gray-400 hover:bg-dark-hover'
                  }`}
                >
                  📘 Usage Guide
                </button>
                <button
                  onClick={() => setViewMode('resolver')}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    viewMode === 'resolver'
                      ? 'bg-purple-600 text-white'
                      : 'bg-dark-bg text-gray-400 hover:bg-dark-hover'
                  }`}
                >
                  ⚙️ Resolver Example
                </button>
              </div>
              <span className="text-sm text-gray-400">
                {viewMode === 'schema' && (
                  <>
                    {mode === 'types' && 'Types & Input Types'}
                    {mode === 'queries' && 'Query Operations'}
                    {mode === 'mutations' && 'Mutation Operations'}
                    {mode === 'full' && 'Complete Schema'}
                  </>
                )}
                {viewMode === 'usage' && 'วิธีใช้งาน Schema'}
                {viewMode === 'resolver' && 'ตัวอย่าง Resolver Code'}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <pre className="bg-dark-panel border border-dark-border rounded p-4 text-sm font-mono overflow-auto whitespace-pre-wrap">
              {viewMode === 'schema' && currentOutput}
              {viewMode === 'usage' && usageGuide}
              {viewMode === 'resolver' && resolverExample}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
