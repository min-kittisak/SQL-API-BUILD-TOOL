'use client'

import { useState } from 'react'
import { Play, Plus, Trash2, Download, Copy, CheckCircle, ArrowLeft } from 'lucide-react'
import axios from 'axios'

type HeaderParam = {
  id: string
  key: string
  value: string
  enabled: boolean
}

type PathParam = {
  id: string
  key: string
  value: string
}

type QueryParam = {
  id: string
  key: string
  value: string
  enabled: boolean
}

type APITest = {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  endpoint: string
  description: string
  headers: HeaderParam[]
  pathParams: PathParam[]
  queryParams: QueryParam[]
  requestBody: string
  response200?: any
  responseError?: any
  responseTime?: number
  statusCode?: number
}

type Props = {
  onBack: () => void
}

export default function APITester({ onBack }: Props) {
  const [tests, setTests] = useState<APITest[]>([])
  const [currentTest, setCurrentTest] = useState<APITest>({
    id: Date.now().toString(),
    name: 'New API Test',
    method: 'GET',
    endpoint: 'https://api.example.com/users',
    description: 'Test API endpoint',
    headers: [{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true }],
    pathParams: [],
    queryParams: [],
    requestBody: '{}',
  })
  const [testing, setTesting] = useState(false)
  const [copied, setCopied] = useState(false)

  // Header Management
  const addHeader = () => {
    setCurrentTest({
      ...currentTest,
      headers: [
        ...currentTest.headers,
        { id: Date.now().toString(), key: '', value: '', enabled: true },
      ],
    })
  }

  const updateHeader = (id: string, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    setCurrentTest({
      ...currentTest,
      headers: currentTest.headers.map((h) =>
        h.id === id ? { ...h, [field]: value } : h
      ),
    })
  }

  const removeHeader = (id: string) => {
    setCurrentTest({
      ...currentTest,
      headers: currentTest.headers.filter((h) => h.id !== id),
    })
  }

  // Path Param Management
  const addPathParam = () => {
    setCurrentTest({
      ...currentTest,
      pathParams: [
        ...currentTest.pathParams,
        { id: Date.now().toString(), key: '', value: '' },
      ],
    })
  }

  const updatePathParam = (id: string, field: 'key' | 'value', value: string) => {
    setCurrentTest({
      ...currentTest,
      pathParams: currentTest.pathParams.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    })
  }

  const removePathParam = (id: string) => {
    setCurrentTest({
      ...currentTest,
      pathParams: currentTest.pathParams.filter((p) => p.id !== id),
    })
  }

  // Query Param Management
  const addQueryParam = () => {
    setCurrentTest({
      ...currentTest,
      queryParams: [
        ...currentTest.queryParams,
        { id: Date.now().toString(), key: '', value: '', enabled: true },
      ],
    })
  }

  const updateQueryParam = (id: string, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    setCurrentTest({
      ...currentTest,
      queryParams: currentTest.queryParams.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      ),
    })
  }

  const removeQueryParam = (id: string) => {
    setCurrentTest({
      ...currentTest,
      queryParams: currentTest.queryParams.filter((q) => q.id !== id),
    })
  }

  // Build Final Endpoint
  const buildEndpoint = (): string => {
    let endpoint = currentTest.endpoint

    // Replace path params
    currentTest.pathParams.forEach((param) => {
      if (param.key && param.value) {
        endpoint = endpoint.replace(`:${param.key}`, param.value)
        endpoint = endpoint.replace(`{${param.key}}`, param.value)
      }
    })

    // Add query params
    const enabledQueryParams = currentTest.queryParams.filter((q) => q.enabled && q.key && q.value)
    if (enabledQueryParams.length > 0) {
      const queryString = enabledQueryParams
        .map((q) => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`)
        .join('&')
      endpoint += (endpoint.includes('?') ? '&' : '?') + queryString
    }

    return endpoint
  }

  // Test API
  const testAPI = async () => {
    setTesting(true)
    const startTime = Date.now()

    try {
      // Build headers
      const headers: Record<string, string> = {}
      currentTest.headers
        .filter((h) => h.enabled && h.key && h.value)
        .forEach((h) => {
          headers[h.key] = h.value
        })

      const finalEndpoint = buildEndpoint()

      // Make request
      const response = await axios({
        method: currentTest.method,
        url: finalEndpoint,
        headers,
        data: ['POST', 'PUT', 'PATCH'].includes(currentTest.method)
          ? JSON.parse(currentTest.requestBody || '{}')
          : undefined,
        validateStatus: () => true, // Accept all status codes
      })

      const responseTime = Date.now() - startTime

      // Update test with response
      const updatedTest = {
        ...currentTest,
        response200: response.status >= 200 && response.status < 300 ? response.data : undefined,
        responseError: response.status >= 400 ? response.data : undefined,
        responseTime,
        statusCode: response.status,
      }

      setCurrentTest(updatedTest)

      // Check if this test already exists in tests array
      const existingIndex = tests.findIndex((t) => t.id === currentTest.id)
      if (existingIndex >= 0) {
        const newTests = [...tests]
        newTests[existingIndex] = updatedTest
        setTests(newTests)
      } else {
        setTests([...tests, updatedTest])
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      const updatedTest = {
        ...currentTest,
        responseError: {
          message: error.message,
          code: error.code,
          details: error.response?.data || error.toString(),
        },
        responseTime,
        statusCode: error.response?.status || 0,
      }

      setCurrentTest(updatedTest)

      const existingIndex = tests.findIndex((t) => t.id === currentTest.id)
      if (existingIndex >= 0) {
        const newTests = [...tests]
        newTests[existingIndex] = updatedTest
        setTests(newTests)
      } else {
        setTests([...tests, updatedTest])
      }
    } finally {
      setTesting(false)
    }
  }

  const saveTest = () => {
    const existingIndex = tests.findIndex((t) => t.id === currentTest.id)
    if (existingIndex >= 0) {
      const newTests = [...tests]
      newTests[existingIndex] = currentTest
      setTests(newTests)
    } else {
      setTests([...tests, currentTest])
    }
  }

  const newTest = () => {
    setCurrentTest({
      id: Date.now().toString(),
      name: 'New API Test',
      method: 'GET',
      endpoint: 'https://api.example.com/data',
      description: '',
      headers: [{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true }],
      pathParams: [],
      queryParams: [],
      requestBody: '{}',
    })
  }

  const loadTest = (test: APITest) => {
    setCurrentTest({ ...test })
  }

  const deleteTest = (id: string) => {
    setTests(tests.filter((t) => t.id !== id))
    if (currentTest.id === id) {
      newTest()
    }
  }

  const exportTests = () => {
    const dataStr = JSON.stringify(tests, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'api-tests.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyAsTable = () => {
    const tableData = tests
      .map(
        (t) =>
          `${t.name}\t${t.method}\t${t.endpoint}\t${t.description}\t${JSON.stringify(
            t.headers
          )}\t${JSON.stringify(t.pathParams)}\t${JSON.stringify(t.queryParams)}\t${
            t.requestBody
          }\t${JSON.stringify(t.response200 || 'N/A')}\t${JSON.stringify(t.responseError || 'N/A')}`
      )
      .join('\n')

    const header =
      'API Name\tMethod\tEndpoint\tDescription\tHeaders\tPath Params\tQuery Params\tRequest Body\tResponse 200\tResponse Error'
    navigator.clipboard.writeText(header + '\n' + tableData)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full flex">
      {/* Left Panel - Test Configuration */}
      <div className="w-1/2 border-r border-dark-border flex flex-col">
        {/* Header */}
        <div className="bg-dark-panel border-b border-dark-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Play className="w-6 h-6 text-blue-500" />
              ทดสอบ API
            </h2>
            <div className="flex gap-2">
              <button
                onClick={saveTest}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm"
              >
                บันทึก
              </button>
              <button
                onClick={newTest}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-2">
            <input
              type="text"
              value={currentTest.name}
              onChange={(e) => setCurrentTest({ ...currentTest, name: e.target.value })}
              placeholder="ชื่อ API Test"
              className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm"
            />
            <textarea
              value={currentTest.description}
              onChange={(e) => setCurrentTest({ ...currentTest, description: e.target.value })}
              placeholder="คำอธิบาย"
              className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm"
              rows={2}
            />
          </div>
        </div>

        {/* Request Builder - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Method & Endpoint */}
          <div>
            <label className="block text-sm font-bold mb-2">Request</label>
            <div className="flex gap-2">
              <select
                value={currentTest.method}
                onChange={(e) =>
                  setCurrentTest({ ...currentTest, method: e.target.value as any })
                }
                className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                type="text"
                value={currentTest.endpoint}
                onChange={(e) => setCurrentTest({ ...currentTest, endpoint: e.target.value })}
                placeholder="https://api.example.com/users/:id"
                className="flex-1 bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Preview: <code className="text-blue-400">{buildEndpoint()}</code>
            </p>
          </div>

          {/* Headers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold">Headers</label>
              <button
                onClick={addHeader}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> เพิ่ม
              </button>
            </div>
            <div className="space-y-2">
              {currentTest.headers.map((header) => (
                <div key={header.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={header.enabled}
                    onChange={(e) => updateHeader(header.id, 'enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <input
                    type="text"
                    value={header.key}
                    onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                    placeholder="Key"
                    className="flex-1 bg-dark-bg border border-dark-border rounded px-2 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 bg-dark-bg border border-dark-border rounded px-2 py-1.5 text-sm"
                  />
                  <button
                    onClick={() => removeHeader(header.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Path Params */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold">Path Parameters</label>
              <button
                onClick={addPathParam}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> เพิ่ม
              </button>
            </div>
            <div className="space-y-2">
              {currentTest.pathParams.map((param) => (
                <div key={param.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={param.key}
                    onChange={(e) => updatePathParam(param.id, 'key', e.target.value)}
                    placeholder="Key (e.g., id)"
                    className="flex-1 bg-dark-bg border border-dark-border rounded px-2 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) => updatePathParam(param.id, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 bg-dark-bg border border-dark-border rounded px-2 py-1.5 text-sm"
                  />
                  <button
                    onClick={() => removePathParam(param.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Query Params */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold">Query Parameters</label>
              <button
                onClick={addQueryParam}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> เพิ่ม
              </button>
            </div>
            <div className="space-y-2">
              {currentTest.queryParams.map((param) => (
                <div key={param.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={param.enabled}
                    onChange={(e) => updateQueryParam(param.id, 'enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <input
                    type="text"
                    value={param.key}
                    onChange={(e) => updateQueryParam(param.id, 'key', e.target.value)}
                    placeholder="Key"
                    className="flex-1 bg-dark-bg border border-dark-border rounded px-2 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) => updateQueryParam(param.id, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 bg-dark-bg border border-dark-border rounded px-2 py-1.5 text-sm"
                  />
                  <button
                    onClick={() => removeQueryParam(param.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Request Body */}
          {['POST', 'PUT', 'PATCH'].includes(currentTest.method) && (
            <div>
              <label className="block text-sm font-bold mb-2">Request Body (JSON)</label>
              <textarea
                value={currentTest.requestBody}
                onChange={(e) => setCurrentTest({ ...currentTest, requestBody: e.target.value })}
                placeholder='{ "key": "value" }'
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm font-mono"
                rows={6}
              />
            </div>
          )}

          {/* Test Button */}
          <button
            onClick={testAPI}
            disabled={testing}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-bold flex items-center justify-center gap-2"
          >
            {testing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังทดสอบ...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                ทดสอบ API
              </>
            )}
          </button>

          {/* Response */}
          {(currentTest.response200 || currentTest.responseError) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">ผลลัพธ์</h3>
                {currentTest.statusCode && (
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      currentTest.statusCode >= 200 && currentTest.statusCode < 300
                        ? 'bg-green-600'
                        : 'bg-red-600'
                    }`}
                  >
                    {currentTest.statusCode} {currentTest.responseTime}ms
                  </span>
                )}
              </div>

              {currentTest.response200 && (
                <div>
                  <p className="text-xs text-green-400 mb-1">Response 200 (Success)</p>
                  <pre className="bg-dark-bg border border-green-500/30 rounded p-3 text-xs overflow-x-auto">
                    {JSON.stringify(currentTest.response200, null, 2)}
                  </pre>
                </div>
              )}

              {currentTest.responseError && (
                <div>
                  <p className="text-xs text-red-400 mb-1">Response Error</p>
                  <pre className="bg-dark-bg border border-red-500/30 rounded p-3 text-xs overflow-x-auto">
                    {JSON.stringify(currentTest.responseError, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Saved Tests Table */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-dark-panel border-b border-dark-border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">รายการ API ที่บันทึก ({tests.length})</h3>
            <div className="flex gap-2">
              <button
                onClick={copyAsTable}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center gap-2"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'คัดลอกแล้ว!' : 'คัดลอกเป็นตาราง'}
              </button>
              <button
                onClick={exportTests}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                ส่งออก JSON
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-hover sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left border-b border-dark-border">API Name</th>
                <th className="px-3 py-2 text-left border-b border-dark-border">Method</th>
                <th className="px-3 py-2 text-left border-b border-dark-border">Endpoint</th>
                <th className="px-3 py-2 text-left border-b border-dark-border">Description</th>
                <th className="px-3 py-2 text-left border-b border-dark-border">Headers</th>
                <th className="px-3 py-2 text-left border-b border-dark-border">Path Params</th>
                <th className="px-3 py-2 text-left border-b border-dark-border">Query Params</th>
                <th className="px-3 py-2 text-left border-b border-dark-border">Request Body</th>
                <th className="px-3 py-2 text-left border-b border-dark-border">Response 200</th>
                <th className="px-3 py-2 text-left border-b border-dark-border">Response Error</th>
                <th className="px-3 py-2 text-left border-b border-dark-border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr
                  key={test.id}
                  className={`hover:bg-dark-hover cursor-pointer ${
                    currentTest.id === test.id ? 'bg-blue-900/20' : ''
                  }`}
                  onClick={() => loadTest(test)}
                >
                  <td className="px-3 py-2 border-b border-dark-border">{test.name}</td>
                  <td className="px-3 py-2 border-b border-dark-border">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        test.method === 'GET'
                          ? 'bg-blue-600'
                          : test.method === 'POST'
                          ? 'bg-green-600'
                          : test.method === 'PUT'
                          ? 'bg-yellow-600'
                          : test.method === 'DELETE'
                          ? 'bg-red-600'
                          : 'bg-purple-600'
                      }`}
                    >
                      {test.method}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b border-dark-border font-mono text-xs">
                    {test.endpoint}
                  </td>
                  <td className="px-3 py-2 border-b border-dark-border text-xs text-gray-400">
                    {test.description || '-'}
                  </td>
                  <td className="px-3 py-2 border-b border-dark-border">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-400">
                        {test.headers.filter((h) => h.enabled).length} items
                      </summary>
                      <pre className="mt-1 text-xs">
                        {JSON.stringify(
                          test.headers.filter((h) => h.enabled),
                          null,
                          2
                        )}
                      </pre>
                    </details>
                  </td>
                  <td className="px-3 py-2 border-b border-dark-border">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-400">
                        {test.pathParams.length} items
                      </summary>
                      <pre className="mt-1 text-xs">{JSON.stringify(test.pathParams, null, 2)}</pre>
                    </details>
                  </td>
                  <td className="px-3 py-2 border-b border-dark-border">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-400">
                        {test.queryParams.filter((q) => q.enabled).length} items
                      </summary>
                      <pre className="mt-1 text-xs">
                        {JSON.stringify(
                          test.queryParams.filter((q) => q.enabled),
                          null,
                          2
                        )}
                      </pre>
                    </details>
                  </td>
                  <td className="px-3 py-2 border-b border-dark-border">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-400">ดูโค้ด</summary>
                      <pre className="mt-1 text-xs">{test.requestBody}</pre>
                    </details>
                  </td>
                  <td className="px-3 py-2 border-b border-dark-border">
                    {test.response200 ? (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-green-400">✓ Success</summary>
                        <pre className="mt-1 text-xs">
                          {JSON.stringify(test.response200, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-xs text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 border-b border-dark-border">
                    {test.responseError ? (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-red-400">✗ Error</summary>
                        <pre className="mt-1 text-xs">
                          {JSON.stringify(test.responseError, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-xs text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 border-b border-dark-border">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTest(test.id)
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tests.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <p>ยังไม่มีรายการทดสอบ</p>
              <p className="text-sm">เริ่มต้นโดยการสร้าง API Test ด้านซ้าย</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-dark-panel border-t border-dark-border p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้าก่อน
          </button>
        </div>
      </div>
    </div>
  )
}
