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
  const [codeType, setCodeType] = useState<'composition' | 'options' | 'composable'>('composition')

  const generateVueCode = (): string => {
    if (codeType === 'composition') {
      return generateCompositionAPI()
    } else if (codeType === 'options') {
      return generateOptionsAPI()
    } else {
      return generateComposable()
    }
  }

  const generateCompositionAPI = (): string => {
    const endpoint = apiConfig.path
    const method = apiConfig.method

    return `<template>
  <div class="data-viewer">
    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>กำลังโหลดข้อมูล...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error">
      <h3>เกิดข้อผิดพลาด</h3>
      <p>{{ error }}</p>
      <button @click="fetchData">ลองอีกครั้ง</button>
    </div>

    <!-- Data Display -->
    <div v-else-if="data.length > 0" class="data-container">
      <div class="header">
        <h2>ข้อมูลทั้งหมด ({{ data.length }} รายการ)</h2>
        <button @click="fetchData" class="refresh-btn">รีเฟรช</button>
      </div>

      <!-- Table View -->
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column">{{ column }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in data" :key="index">
            <td v-for="column in columns" :key="column">
              {{ getNestedValue(item, column) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- JSON View -->
      <details class="json-view">
        <summary>ดู JSON แบบเต็ม</summary>
        <pre>{{ JSON.stringify(data, null, 2) }}</pre>
      </details>
    </div>

    <!-- Empty State -->
    <div v-else class="empty">
      <p>ไม่พบข้อมูล</p>
      <button @click="fetchData">โหลดข้อมูล</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

// API Configuration
const API_URL = '${endpoint}'
const API_METHOD = '${method}'

// State Management
const data = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Computed Properties
const columns = computed(() => {
  if (data.value.length === 0) return []
  return extractColumns(data.value[0])
})

// Helper Functions
function extractColumns(obj: any, prefix = ''): string[] {
  const cols: string[] = []
  for (const key in obj) {
    const fullKey = prefix ? \`\${prefix}.\${key}\` : key
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      cols.push(...extractColumns(obj[key], fullKey))
    } else {
      cols.push(fullKey)
    }
  }
  return cols
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// API Call Function
async function fetchData() {
  loading.value = true
  error.value = null

  try {
    const response = await axios({
      method: API_METHOD,
      url: API_URL,
      ${method === 'POST' ? '// data: { /* your POST data here */ },' : ''}
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.data.success) {
      data.value = response.data.data
    } else {
      throw new Error(response.data.error || 'Failed to fetch data')
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || err.message || 'Unknown error occurred'
    console.error('API Error:', err)
  } finally {
    loading.value = false
  }
}

// Lifecycle Hook
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.data-viewer {
  padding: 20px;
  font-family: 'Noto Sans Thai Looped', sans-serif;
}

.loading, .error, .empty {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #e74c3c;
}

.error button, .empty button, .refresh-btn {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
}

.error button:hover, .empty button:hover, .refresh-btn:hover {
  background: #2980b9;
}

.data-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.data-table th {
  background: #3498db;
  color: white;
  font-weight: bold;
}

.data-table tr:hover {
  background: #f5f5f5;
}

.json-view {
  margin-top: 20px;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
}

.json-view summary {
  cursor: pointer;
  font-weight: bold;
  padding: 5px;
}

.json-view pre {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
  margin-top: 10px;
}
</style>
`
  }

  const generateOptionsAPI = (): string => {
    const endpoint = apiConfig.path
    const method = apiConfig.method

    return `<template>
  <div class="data-viewer">
    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>กำลังโหลดข้อมูล...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error">
      <h3>เกิดข้อผิดพลาด</h3>
      <p>{{ error }}</p>
      <button @click="fetchData">ลองอีกครั้ง</button>
    </div>

    <!-- Data Display -->
    <div v-else-if="data.length > 0" class="data-container">
      <div class="header">
        <h2>ข้อมูลทั้งหมด ({{ data.length }} รายการ)</h2>
        <button @click="fetchData" class="refresh-btn">รีเฟรช</button>
      </div>

      <!-- Table View -->
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column">{{ column }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in data" :key="index">
            <td v-for="column in columns" :key="column">
              {{ getNestedValue(item, column) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- JSON View -->
      <details class="json-view">
        <summary>ดู JSON แบบเต็ม</summary>
        <pre>{{ JSON.stringify(data, null, 2) }}</pre>
      </details>
    </div>

    <!-- Empty State -->
    <div v-else class="empty">
      <p>ไม่พบข้อมูล</p>
      <button @click="fetchData">โหลดข้อมูล</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import axios from 'axios'

export default defineComponent({
  name: 'DataViewer',
  
  data() {
    return {
      data: [] as any[],
      loading: false,
      error: null as string | null,
      apiUrl: '${endpoint}',
      apiMethod: '${method}'
    }
  },

  computed: {
    columns(): string[] {
      if (this.data.length === 0) return []
      return this.extractColumns(this.data[0])
    }
  },

  mounted() {
    this.fetchData()
  },

  methods: {
    extractColumns(obj: any, prefix = ''): string[] {
      const cols: string[] = []
      for (const key in obj) {
        const fullKey = prefix ? \`\${prefix}.\${key}\` : key
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          cols.push(...this.extractColumns(obj[key], fullKey))
        } else {
          cols.push(fullKey)
        }
      }
      return cols
    },

    getNestedValue(obj: any, path: string): any {
      return path.split('.').reduce((current, key) => current?.[key], obj)
    },

    async fetchData() {
      this.loading = true
      this.error = null

      try {
        const response = await axios({
          method: this.apiMethod,
          url: this.apiUrl,
          ${method === 'POST' ? '// data: { /* your POST data here */ },' : ''}
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.data.success) {
          this.data = response.data.data
        } else {
          throw new Error(response.data.error || 'Failed to fetch data')
        }
      } catch (err: any) {
        this.error = err.response?.data?.error || err.message || 'Unknown error occurred'
        console.error('API Error:', err)
      } finally {
        this.loading = false
      }
    }
  }
})
</script>

<style scoped>
.data-viewer {
  padding: 20px;
  font-family: 'Noto Sans Thai Looped', sans-serif;
}

.loading, .error, .empty {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #e74c3c;
}

.error button, .empty button, .refresh-btn {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
}

.error button:hover, .empty button:hover, .refresh-btn:hover {
  background: #2980b9;
}

.data-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.data-table th {
  background: #3498db;
  color: white;
  font-weight: bold;
}

.data-table tr:hover {
  background: #f5f5f5;
}

.json-view {
  margin-top: 20px;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
}

.json-view summary {
  cursor: pointer;
  font-weight: bold;
  padding: 5px;
}

.json-view pre {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
  margin-top: 10px;
}
</style>
`
  }

  const generateComposable = (): string => {
    const endpoint = apiConfig.path
    const method = apiConfig.method

    return `// composables/useDataFetcher.ts
import { ref, computed } from 'vue'
import axios from 'axios'

export function useDataFetcher(apiUrl: string, apiMethod: 'GET' | 'POST' = 'GET') {
  // State
  const data = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const columns = computed(() => {
    if (data.value.length === 0) return []
    return extractColumns(data.value[0])
  })

  const hasData = computed(() => data.value.length > 0)
  const isEmpty = computed(() => !loading.value && data.value.length === 0)

  // Helper Functions
  function extractColumns(obj: any, prefix = ''): string[] {
    const cols: string[] = []
    for (const key in obj) {
      const fullKey = prefix ? \`\${prefix}.\${key}\` : key
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        cols.push(...extractColumns(obj[key], fullKey))
      } else {
        cols.push(fullKey)
      }
    }
    return cols
  }

  function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  // API Call
  async function fetchData(params?: any) {
    loading.value = true
    error.value = null

    try {
      const response = await axios({
        method: apiMethod,
        url: apiUrl,
        ${method === 'POST' ? 'data: params,' : 'params: params,'}
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        data.value = response.data.data
      } else {
        throw new Error(response.data.error || 'Failed to fetch data')
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Unknown error occurred'
      console.error('API Error:', err)
    } finally {
      loading.value = false
    }
  }

  // Refresh function
  const refresh = () => fetchData()

  return {
    // State
    data,
    loading,
    error,
    
    // Computed
    columns,
    hasData,
    isEmpty,
    
    // Methods
    fetchData,
    refresh,
    getNestedValue
  }
}

// ==========================================
// Component Usage Example
// ==========================================

// DataViewer.vue
<template>
  <div class="data-viewer">
    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>กำลังโหลดข้อมูล...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error">
      <h3>เกิดข้อผิดพลาด</h3>
      <p>{{ error }}</p>
      <button @click="refresh">ลองอีกครั้ง</button>
    </div>

    <!-- Data Display -->
    <div v-else-if="hasData" class="data-container">
      <div class="header">
        <h2>ข้อมูลทั้งหมด ({{ data.length }} รายการ)</h2>
        <button @click="refresh" class="refresh-btn">รีเฟรช</button>
      </div>

      <!-- Table View -->
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column">{{ column }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in data" :key="index">
            <td v-for="column in columns" :key="column">
              {{ getNestedValue(item, column) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- JSON View -->
      <details class="json-view">
        <summary>ดู JSON แบบเต็ม</summary>
        <pre>{{ JSON.stringify(data, null, 2) }}</pre>
      </details>
    </div>

    <!-- Empty State -->
    <div v-else class="empty">
      <p>ไม่พบข้อมูล</p>
      <button @click="fetchData">โหลดข้อมูล</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDataFetcher } from '@/composables/useDataFetcher'

// Use the composable
const {
  data,
  loading,
  error,
  columns,
  hasData,
  isEmpty,
  fetchData,
  refresh,
  getNestedValue
} = useDataFetcher('${endpoint}', '${method}')

// Auto-fetch on mount
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.data-viewer {
  padding: 20px;
  font-family: 'Noto Sans Thai Looped', sans-serif;
}

.loading, .error, .empty {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #e74c3c;
}

.error button, .empty button, .refresh-btn {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
}

.error button:hover, .empty button:hover, .refresh-btn:hover {
  background: #2980b9;
}

.data-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.data-table th {
  background: #3498db;
  color: white;
  font-weight: bold;
}

.data-table tr:hover {
  background: #f5f5f5;
}

.json-view {
  margin-top: 20px;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
}

.json-view summary {
  cursor: pointer;
  font-weight: bold;
  padding: 5px;
}

.json-view pre {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
  margin-top: 10px;
}
</style>
`
  }

  const generateAPICode = (): string => {
    return generateVueCode()
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

  const generatePackageJson = (): string => {
    return `{
  "dependencies": {
    "axios": "^1.6.2",
    "vue": "^3.3.8"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.2"
  }
}

// ติดตั้งโดยใช้คำสั่ง:
// npm install axios
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

  const handleCopy = () => {
    navigator.clipboard.writeText(generateAPICode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const code = generateAPICode()
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const fileName = codeType === 'composable' 
      ? 'useDataFetcher.ts' 
      : 'DataViewer.vue'
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadPackage = () => {
    const pkg = generatePackageJson()
    const blob = new Blob([pkg], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'package.json'
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
              <h2 className="text-xl font-bold">เชื่อมต่อ API ด้วย Vue.js</h2>
            </div>
            <p className="text-sm text-gray-400 ml-9">Vue Component พร้อมใช้งานทุกรูปแบบ (Composition API, Options API, Composable)</p>
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
              ดาวน์โหลด {codeType === 'composable' ? 'Composable' : 'Component'}
            </button>
            <button
              onClick={handleDownloadPackage}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm"
            >
              <Download className="w-4 h-4" />
              ดาวน์โหลด package.json
            </button>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-dark-panel border-b border-dark-border p-3">
        <div className="flex items-center gap-4">
          <Settings2 className="w-5 h-5 text-gray-400" />
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">รูปแบบโค้ด Vue</label>
            <select
              value={codeType}
              onChange={(e) => setCodeType(e.target.value as 'composition' | 'options' | 'composable')}
              className="bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm"
            >
              <option value="composition">Composition API (setup script)</option>
              <option value="options">Options API</option>
              <option value="composable">Composable (ใช้ซ้ำได้)</option>
            </select>
          </div>

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

      {/* Code Preview - Takes most of the space */}
      <div className="flex-1 min-h-0 flex flex-col bg-dark-bg">
        <div className="bg-dark-hover px-4 py-2 border-b border-dark-border flex-shrink-0">
          <h3 className="font-bold text-sm">
            {codeType === 'composition' && 'Vue Composition API Component'}
            {codeType === 'options' && 'Vue Options API Component'}
            {codeType === 'composable' && 'Reusable Composable + Component Example'}
          </h3>
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
      <div className="bg-green-900/20 border-t border-green-500/30 p-2 flex-shrink-0">
        <details className="cursor-pointer">
          <summary className="font-bold text-green-300 text-sm">📋 คำแนะนำการใช้งาน (คลิกเพื่อขยาย)</summary>
          <div className="text-xs text-green-200 space-y-2 mt-2 ml-2">
            {codeType === 'composition' && (
              <ol className="list-decimal list-inside space-y-1">
                <li>ติดตั้ง: <code className="bg-green-900/40 px-1 py-0.5 rounded">npm install axios</code></li>
                <li>สร้างไฟล์: <code className="bg-green-900/40 px-1 py-0.5 rounded">src/components/DataViewer.vue</code></li>
                <li>คัดลอกโค้ดไปวาง</li>
                <li>เรียกใช้: <code className="bg-green-900/40 px-1 py-0.5 rounded">&lt;DataViewer /&gt;</code> ใน App.vue</li>
                <li>Component จะ auto-fetch ข้อมูลเมื่อ mount</li>
              </ol>
            )}
            {codeType === 'options' && (
              <ol className="list-decimal list-inside space-y-1">
                <li>ติดตั้ง: <code className="bg-green-900/40 px-1 py-0.5 rounded">npm install axios</code></li>
                <li>สร้างไฟล์: <code className="bg-green-900/40 px-1 py-0.5 rounded">src/components/DataViewer.vue</code></li>
                <li>คัดลอกโค้ดไปวาง</li>
                <li>เรียกใช้: <code className="bg-green-900/40 px-1 py-0.5 rounded">&lt;DataViewer /&gt;</code> ใน App.vue</li>
                <li>Component จะ auto-fetch ข้อมูลเมื่อ mount</li>
              </ol>
            )}
            {codeType === 'composable' && (
              <ol className="list-decimal list-inside space-y-1">
                <li>ติดตั้ง: <code className="bg-green-900/40 px-1 py-0.5 rounded">npm install axios</code></li>
                <li>สร้างไฟล์ composable: <code className="bg-green-900/40 px-1 py-0.5 rounded">src/composables/useDataFetcher.ts</code></li>
                <li>สร้างไฟล์ component: <code className="bg-green-900/40 px-1 py-0.5 rounded">src/components/DataViewer.vue</code></li>
                <li>แยกโค้ดไปวางตามไฟล์ (มีเส้นแบ่งใน code)</li>
                <li>ใช้ซ้ำได้หลาย component: <code className="bg-green-900/40 px-1 py-0.5 rounded">useDataFetcher('/api/endpoint')</code></li>
              </ol>
            )}
            <p className="mt-2 text-yellow-300">✨ Features: Auto-fetch, Loading state, Error handling, Table display, JSON viewer, Refresh button</p>
          </div>
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
            <span className="font-medium">Vue Component พร้อมใช้งานแล้ว!</span>
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
