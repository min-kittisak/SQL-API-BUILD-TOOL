'use client'

import { useState } from 'react'
import { Upload, Download, Database, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { DatabaseConfig, TableSchema } from '@/app/page'

type Props = {
  config: DatabaseConfig | null
  onConfigChange: (config: DatabaseConfig | null) => void
  onSchemaFetched: (schema: TableSchema[]) => void
  onNext: () => void
}

export default function DatabaseConnection({ config, onConfigChange, onSchemaFetched, onNext }: Props) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [loadingSchema, setLoadingSchema] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        onConfigChange(json)
        setTestResult(null)
      } catch (error) {
        alert('ไฟล์ JSON ไม่ถูกต้อง')
      }
    }
    reader.readAsText(file)
  }

  const handleDownload = () => {
    if (!config) return

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `db-config-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const testConnection = async () => {
    if (!config) return

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/database/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const result = await response.json()

      if (result.success) {
        setTestResult({ success: true, message: 'เชื่อมต่อสำเร็จ!' })
        // Fetch schema
        setLoadingSchema(true)
        const schemaResponse = await fetch('/api/database/schema', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        })
        const schemaData = await schemaResponse.json()
        if (schemaData.success) {
          onSchemaFetched(schemaData.schema)
        }
        setLoadingSchema(false)
      } else {
        setTestResult({ success: false, message: result.error || 'การเชื่อมต่อล้มเหลว' })
      }
    } catch (error) {
      setTestResult({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' })
    } finally {
      setTesting(false)
    }
  }

  const handleManualInput = (field: keyof DatabaseConfig, value: any) => {
    onConfigChange({
      ...config,
      [field]: value,
    } as DatabaseConfig)
  }

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="w-full max-w-3xl">
        <div className="bg-dark-panel rounded-xl border border-dark-border p-8">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-8 h-8 text-blue-500" />
            <h2 className="text-2xl font-bold">เชื่อมต่อฐานข้อมูล</h2>
          </div>

          {/* File Upload/Download */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-dark-border rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-400">อัปโหลดไฟล์ Config JSON</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={handleDownload}
              disabled={!config}
              className="flex flex-col items-center justify-center h-32 border-2 border-dark-border rounded-lg hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-400">ดาวน์โหลด Config</span>
            </button>
          </div>

          {/* Manual Configuration */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">ประเภท Database</label>
              <select
                value={config?.type || 'postgresql'}
                onChange={(e) => handleManualInput('type', e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="mssql">SQL Server</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Host</label>
                <input
                  type="text"
                  value={config?.host || ''}
                  onChange={(e) => handleManualInput('host', e.target.value)}
                  placeholder="localhost"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Port</label>
                <input
                  type="number"
                  value={config?.port || ''}
                  onChange={(e) => handleManualInput('port', parseInt(e.target.value))}
                  placeholder="5432"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ชื่อ Database</label>
              <input
                type="text"
                value={config?.database || ''}
                onChange={(e) => handleManualInput('database', e.target.value)}
                placeholder="my_database"
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">ชื่อผู้ใช้</label>
                <input
                  type="text"
                  value={config?.user || ''}
                  onChange={(e) => handleManualInput('user', e.target.value)}
                  placeholder="postgres"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">รหัสผ่าน</label>
                <input
                  type="password"
                  value={config?.password || ''}
                  onChange={(e) => handleManualInput('password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${
                testResult.success ? 'bg-green-900/20 border border-green-500' : 'bg-red-900/20 border border-red-500'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              <div className="flex-1">
                <span className={`${testResult.success ? 'text-green-300' : 'text-red-300'} font-medium`}>
                  {testResult.message}
                </span>
                {loadingSchema && (
                  <div className="flex items-center gap-2 mt-2 text-yellow-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">กำลังโหลดโครงสร้างตาราง...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={testConnection}
              disabled={!config || testing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังทดสอบ...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5" />
                  ทดสอบการเชื่อมต่อ
                </>
              )}
            </button>

            <button
              onClick={onNext}
              disabled={!testResult?.success}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
            >
              ไปที่ขั้นตอนสร้าง Query
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
