'use client'

import { useState } from 'react'
import { Play, Plus, Trash2, Download, Copy, CheckCircle, ArrowLeft, Upload } from 'lucide-react'
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

type AuthConfig = {
  type: 'none' | 'bearer' | 'basic' | 'apikey'
  token?: string
  username?: string
  password?: string
  apiKey?: string
  apiKeyName?: string
  apiKeyIn?: 'header' | 'query'
}

type APITest = {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  endpoint: string
  description: string
  auth: AuthConfig
  headers: HeaderParam[]
  pathParams: PathParam[]
  queryParams: QueryParam[]
  requestBody: string
  response200?: any
  responseError?: any
  responseHeaders?: Record<string, string>
  responseTime?: number
  statusCode?: number
  responseSize?: number
}

type SwaggerSpec = {
  openapi?: string
  swagger?: string
  info: {
    title: string
    version: string
  }
  servers?: Array<{ url: string }>
  paths: {
    [path: string]: {
      [method: string]: {
        summary?: string
        description?: string
        parameters?: any[]
        requestBody?: any
        responses?: any
      }
    }
  }
  components?: any
}

type SwaggerEndpoint = {
  id: string
  path: string
  method: string
  summary: string
  baseUrl: string
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
    auth: { type: 'none' },
    headers: [{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true }],
    pathParams: [],
    queryParams: [],
    requestBody: '{}',
  })
  const [testing, setTesting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body')
  
  // Swagger State
  const [swaggerInputMode, setSwaggerInputMode] = useState<'url' | 'json'>('url')
  const [swaggerUrl, setSwaggerUrl] = useState('https://localhost:7140/swagger/v1/swagger.json')
  const [swaggerJson, setSwaggerJson] = useState('')
  const [swaggerEndpoints, setSwaggerEndpoints] = useState<SwaggerEndpoint[]>([])
  const [loadingSwagger, setLoadingSwagger] = useState(false)
  const [swaggerError, setSwaggerError] = useState('')
  
  // Login API State
  const [loginEndpoint, setLoginEndpoint] = useState('https://localhost:7140/auth/login')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [loginMessage, setLoginMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  // Parse Swagger Spec
  const parseSwaggerSpec = (spec: SwaggerSpec) => {
    const endpoints: SwaggerEndpoint[] = []
    const baseUrl = spec.servers?.[0]?.url || ''
    
    Object.entries(spec.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, details]) => {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
          endpoints.push({
            id: `${method.toUpperCase()}-${path}`,
            path,
            method: method.toUpperCase(),
            summary: details.summary || `${method.toUpperCase()} ${path}`,
            baseUrl,
          })
        }
      })
    })
    
    setSwaggerEndpoints(endpoints)
    if (endpoints.length > 0) {
      alert(`✓ โหลด ${endpoints.length} endpoints สำเร็จ`)
    }
  }

  // Load Swagger from URL
  const loadSwagger = async () => {
    setLoadingSwagger(true)
    setSwaggerError('')
    try {
      const response = await axios.get(swaggerUrl)
      const spec: SwaggerSpec = response.data
      parseSwaggerSpec(spec)
    } catch (err: any) {
      setSwaggerError(err.message || 'ไม่สามารถโหลด Swagger spec ได้')
    } finally {
      setLoadingSwagger(false)
    }
  }

  // Load Swagger from JSON
  const loadSwaggerJson = () => {
    setLoadingSwagger(true)
    setSwaggerError('')
    try {
      const spec: SwaggerSpec = JSON.parse(swaggerJson)
      parseSwaggerSpec(spec)
    } catch (err: any) {
      setSwaggerError('Invalid JSON format')
    } finally {
      setLoadingSwagger(false)
    }
  }

  // Select Swagger Endpoint
  const selectSwaggerEndpoint = (endpointId: string) => {
    const endpoint = swaggerEndpoints.find(e => e.id === endpointId)
    if (!endpoint) return

    setCurrentTest({
      id: Date.now().toString(),
      name: endpoint.summary,
      method: endpoint.method as any,
      endpoint: `${endpoint.baseUrl}${endpoint.path}`,
      description: `From Swagger: ${endpoint.summary}`,
      auth: currentTest.auth, // Keep current auth
      headers: [{ id: '1', key: 'Content-Type', value: 'application/json', enabled: true }],
      pathParams: [],
      queryParams: [],
      requestBody: '{}',
    })
  }

  // Login API Function
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginMessage({ type: 'error', text: 'กรุณากรอก Email และ Password' })
      return
    }

    setLoggingIn(true)
    setLoginMessage(null)

    try {
      const response = await axios({
        method: 'POST',
        url: loginEndpoint,
        data: {
          email: loginEmail,
          password: loginPassword,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      })

      if (response.status === 200 && response.data.token) {
        // Auto-fill JWT Token
        setCurrentTest({
          ...currentTest,
          auth: {
            type: 'bearer',
            token: response.data.token,
          },
        })
        setLoginMessage({ type: 'success', text: `✓ Login สำเร็จ! Token ถูกใส่อัตโนมัติแล้ว` })
      } else {
        setLoginMessage({ 
          type: 'error', 
          text: `✗ Login ไม่สำเร็จ: ${response.data.message || 'Invalid credentials'}` 
        })
      }
    } catch (error: any) {
      setLoginMessage({ 
        type: 'error', 
        text: `✗ เกิดข้อผิดพลาด: ${error.message}` 
      })
    } finally {
      setLoggingIn(false)
    }
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

      // Add Authorization based on auth type
      if (currentTest.auth.type === 'bearer' && currentTest.auth.token) {
        headers['Authorization'] = `Bearer ${currentTest.auth.token}`
      } else if (currentTest.auth.type === 'basic' && currentTest.auth.username && currentTest.auth.password) {
        const credentials = btoa(`${currentTest.auth.username}:${currentTest.auth.password}`)
        headers['Authorization'] = `Basic ${credentials}`
      } else if (currentTest.auth.type === 'apikey' && currentTest.auth.apiKey && currentTest.auth.apiKeyName) {
        if (currentTest.auth.apiKeyIn === 'header') {
          headers[currentTest.auth.apiKeyName] = currentTest.auth.apiKey
        }
      }

      const finalEndpoint = buildEndpoint()

      // Add API Key to query params if needed
      let urlWithApiKey = finalEndpoint
      if (currentTest.auth.type === 'apikey' && currentTest.auth.apiKey && currentTest.auth.apiKeyName && currentTest.auth.apiKeyIn === 'query') {
        const separator = urlWithApiKey.includes('?') ? '&' : '?'
        urlWithApiKey += `${separator}${currentTest.auth.apiKeyName}=${currentTest.auth.apiKey}`
      }

      // Make request
      const response = await axios({
        method: currentTest.method,
        url: urlWithApiKey,
        headers,
        data: ['POST', 'PUT', 'PATCH'].includes(currentTest.method)
          ? JSON.parse(currentTest.requestBody || '{}')
          : undefined,
        validateStatus: () => true, // Accept all status codes
      })

      const responseTime = Date.now() - startTime
      
      // Calculate response size
      const responseSize = new Blob([JSON.stringify(response.data)]).size

      // Update test with response
      const updatedTest = {
        ...currentTest,
        response200: response.status >= 200 && response.status < 300 ? response.data : undefined,
        responseError: response.status >= 400 ? response.data : undefined,
        responseHeaders: response.headers as Record<string, string>,
        responseTime,
        statusCode: response.status,
        responseSize,
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
        responseHeaders: error.response?.headers as Record<string, string>,
        responseTime,
        statusCode: error.response?.status || 0,
        responseSize: error.response?.data ? new Blob([JSON.stringify(error.response.data)]).size : 0,
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
      auth: { type: 'none' },
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

  const importTests = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        const text = await file.text()
        const importedTests = JSON.parse(text)

        // Validate structure
        if (!Array.isArray(importedTests)) {
          alert('❌ ไฟล์ JSON ไม่ถูกต้อง: ต้องเป็น Array')
          return
        }

        // Validate each test
        const validTests = importedTests.filter((test) => {
          return test.id && test.name && test.method && test.endpoint
        })

        if (validTests.length === 0) {
          alert('❌ ไม่พบข้อมูลที่ถูกต้องในไฟล์')
          return
        }

        // Merge with existing tests (avoid duplicates by id)
        const existingIds = new Set(tests.map((t) => t.id))
        const newTests = validTests.filter((t) => !existingIds.has(t.id))
        
        setTests([...tests, ...newTests])
        alert(`✓ นำเข้าสำเร็จ ${newTests.length} รายการ (ข้ามรายการซ้ำ ${validTests.length - newTests.length} รายการ)`)
      } catch (error: any) {
        alert(`❌ ไม่สามารถอ่านไฟล์ได้: ${error.message}`)
      }
    }
    input.click()
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
          {/* Quick Login for JWT */}
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <h3 className="text-sm font-bold text-purple-300">🔐 Quick Login (Auto JWT)</h3>
            </div>
            
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Login Endpoint</label>
                <input
                  type="text"
                  value={loginEndpoint}
                  onChange={(e) => setLoginEndpoint(e.target.value)}
                  placeholder="https://localhost:7140/auth/login"
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm font-mono"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="test@ditruz.com"
                    className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="password"
                    className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={loggingIn}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded font-medium text-sm flex items-center justify-center gap-2"
              >
                {loggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลัง Login...
                  </>
                ) : (
                  <>
                    🔓 Login & Get JWT Token
                  </>
                )}
              </button>

              {loginMessage && (
                <div
                  className={`text-xs p-2 rounded ${
                    loginMessage.type === 'success'
                      ? 'bg-green-900/30 text-green-300 border border-green-500/30'
                      : 'bg-red-900/30 text-red-300 border border-red-500/30'
                  }`}
                >
                  {loginMessage.text}
                </div>
              )}
            </div>

            {/* Swagger Loader */}
            <div className="bg-dark-bg rounded-lg p-4 border border-dark-border mt-4">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-orange-500" />
                Load from Swagger
              </h3>

              <div className="space-y-3">
                {/* Mode Selector */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSwaggerInputMode('url')}
                    className={`flex-1 px-3 py-1.5 rounded text-xs ${
                      swaggerInputMode === 'url'
                        ? 'bg-orange-600 text-white'
                        : 'bg-dark-bg text-gray-400 hover:bg-dark-hover'
                    }`}
                  >
                    Load from URL
                  </button>
                  <button
                    onClick={() => setSwaggerInputMode('json')}
                    className={`flex-1 px-3 py-1.5 rounded text-xs ${
                      swaggerInputMode === 'json'
                        ? 'bg-orange-600 text-white'
                        : 'bg-dark-bg text-gray-400 hover:bg-dark-hover'
                    }`}
                  >
                    Paste JSON
                  </button>
                </div>

                {swaggerInputMode === 'url' ? (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Swagger URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={swaggerUrl}
                        onChange={(e) => setSwaggerUrl(e.target.value)}
                        placeholder="https://api.example.com/swagger.json"
                        className="flex-1 bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm font-mono"
                      />
                      <button
                        onClick={loadSwagger}
                        disabled={loadingSwagger}
                        className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 rounded text-sm font-medium"
                      >
                        {loadingSwagger ? 'Loading...' : 'Load'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Paste Swagger JSON</label>
                    <textarea
                      value={swaggerJson}
                      onChange={(e) => setSwaggerJson(e.target.value)}
                      placeholder='{"openapi": "3.0.0", "info": {...}, "paths": {...}}'
                      rows={4}
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs font-mono"
                    />
                    <button
                      onClick={loadSwaggerJson}
                      disabled={loadingSwagger}
                      className="w-full mt-2 px-4 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 rounded text-sm font-medium"
                    >
                      {loadingSwagger ? 'Parsing...' : 'Parse JSON'}
                    </button>
                  </div>
                )}

                {swaggerError && (
                  <div className="p-2 bg-red-900/30 text-red-400 border border-red-500/30 rounded text-xs">
                    {swaggerError}
                  </div>
                )}

                {swaggerEndpoints.length > 0 && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Select Endpoint ({swaggerEndpoints.length} available)
                    </label>
                    <select
                      onChange={(e) => selectSwaggerEndpoint(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm"
                    >
                      <option value="">-- เลือก Endpoint --</option>
                      {swaggerEndpoints.map(endpoint => (
                        <option key={endpoint.id} value={endpoint.id}>
                          {endpoint.method} {endpoint.path} - {endpoint.summary}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

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

          {/* Authorization */}
          <div>
            <label className="block text-sm font-bold mb-2">🔐 Authorization</label>
            <div className="space-y-3">
              <select
                value={currentTest.auth.type}
                onChange={(e) =>
                  setCurrentTest({
                    ...currentTest,
                    auth: { type: e.target.value as any },
                  })
                }
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm"
              >
                <option value="none">No Auth</option>
                <option value="bearer">Bearer Token (JWT)</option>
                <option value="basic">Basic Auth</option>
                <option value="apikey">API Key</option>
              </select>

              {/* Bearer Token */}
              {currentTest.auth.type === 'bearer' && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Token (JWT)</label>
                  <textarea
                    value={currentTest.auth.token || ''}
                    onChange={(e) =>
                      setCurrentTest({
                        ...currentTest,
                        auth: { ...currentTest.auth, token: e.target.value },
                      })
                    }
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm font-mono"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 จะถูกส่งเป็น: <code className="text-blue-400">Authorization: Bearer [token]</code>
                  </p>
                </div>
              )}

              {/* Basic Auth */}
              {currentTest.auth.type === 'basic' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Username</label>
                    <input
                      type="text"
                      value={currentTest.auth.username || ''}
                      onChange={(e) =>
                        setCurrentTest({
                          ...currentTest,
                          auth: { ...currentTest.auth, username: e.target.value },
                        })
                      }
                      placeholder="username"
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Password</label>
                    <input
                      type="password"
                      value={currentTest.auth.password || ''}
                      onChange={(e) =>
                        setCurrentTest({
                          ...currentTest,
                          auth: { ...currentTest.auth, password: e.target.value },
                        })
                      }
                      placeholder="password"
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 จะถูกส่งเป็น: <code className="text-blue-400">Authorization: Basic [base64]</code>
                  </p>
                </div>
              )}

              {/* API Key */}
              {currentTest.auth.type === 'apikey' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Key Name</label>
                    <input
                      type="text"
                      value={currentTest.auth.apiKeyName || ''}
                      onChange={(e) =>
                        setCurrentTest({
                          ...currentTest,
                          auth: { ...currentTest.auth, apiKeyName: e.target.value },
                        })
                      }
                      placeholder="X-API-Key"
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">API Key Value</label>
                    <input
                      type="text"
                      value={currentTest.auth.apiKey || ''}
                      onChange={(e) =>
                        setCurrentTest({
                          ...currentTest,
                          auth: { ...currentTest.auth, apiKey: e.target.value },
                        })
                      }
                      placeholder="your-api-key-here"
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Add To</label>
                    <select
                      value={currentTest.auth.apiKeyIn || 'header'}
                      onChange={(e) =>
                        setCurrentTest({
                          ...currentTest,
                          auth: {
                            ...currentTest.auth,
                            apiKeyIn: e.target.value as 'header' | 'query',
                          },
                        })
                      }
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm"
                    >
                      <option value="header">Header</option>
                      <option value="query">Query Parameter</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 จะถูกส่งเป็น:{' '}
                    <code className="text-blue-400">
                      {currentTest.auth.apiKeyIn === 'header'
                        ? `${currentTest.auth.apiKeyName || 'X-API-Key'}: [value]`
                        : `?${currentTest.auth.apiKeyName || 'api_key'}=[value]`}
                    </code>
                  </p>
                </div>
              )}
            </div>
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
            <div className="space-y-3 border-t border-dark-border pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">📥 Response</h3>
                <div className="flex items-center gap-2">
                  {currentTest.responseSize !== undefined && (
                    <span className="text-xs text-gray-400">
                      {(currentTest.responseSize / 1024).toFixed(2)} KB
                    </span>
                  )}
                  {currentTest.statusCode && (
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        currentTest.statusCode >= 200 && currentTest.statusCode < 300
                          ? 'bg-green-600'
                          : currentTest.statusCode >= 400
                          ? 'bg-red-600'
                          : 'bg-yellow-600'
                      }`}
                    >
                      {currentTest.statusCode} {currentTest.responseTime}ms
                    </span>
                  )}
                </div>
              </div>

              {/* Response Tabs */}
              <div className="flex gap-2 border-b border-dark-border">
                <button
                  onClick={() => setResponseTab('body')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    responseTab === 'body'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Body
                </button>
                <button
                  onClick={() => setResponseTab('headers')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    responseTab === 'headers'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Headers {currentTest.responseHeaders && `(${Object.keys(currentTest.responseHeaders).length})`}
                </button>
              </div>

              {/* Body Tab */}
              {responseTab === 'body' && (
                <>
                  {currentTest.response200 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-green-400 font-bold">✓ Success Response</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(currentTest.response200, null, 2))
                          }}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          คัดลอก
                        </button>
                      </div>
                      <pre className="bg-dark-bg border border-green-500/30 rounded p-3 text-xs overflow-x-auto max-h-96">
                        {JSON.stringify(currentTest.response200, null, 2)}
                      </pre>
                    </div>
                  )}

                  {currentTest.responseError && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-red-400 font-bold">✗ Error Response</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(currentTest.responseError, null, 2))
                          }}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          คัดลอก
                        </button>
                      </div>
                      <pre className="bg-dark-bg border border-red-500/30 rounded p-3 text-xs overflow-x-auto max-h-96">
                        {JSON.stringify(currentTest.responseError, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}

              {/* Headers Tab */}
              {responseTab === 'headers' && currentTest.responseHeaders && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-bold">Response Headers</p>
                  <div className="bg-dark-bg border border-dark-border rounded overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-dark-hover">
                        <tr>
                          <th className="px-3 py-2 text-left font-bold">Header Name</th>
                          <th className="px-3 py-2 text-left font-bold">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(currentTest.responseHeaders).map(([key, value]) => (
                          <tr key={key} className="border-t border-dark-border hover:bg-dark-hover">
                            <td className="px-3 py-2 font-mono text-blue-400">{key}</td>
                            <td className="px-3 py-2 font-mono text-gray-300">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                onClick={importTests}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                นำเข้า JSON
              </button>
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
                <th className="px-3 py-2 text-left border-b border-dark-border">Auth</th>
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
                    {test.auth.type !== 'none' ? (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          test.auth.type === 'bearer'
                            ? 'bg-purple-600'
                            : test.auth.type === 'basic'
                            ? 'bg-orange-600'
                            : 'bg-teal-600'
                        }`}
                      >
                        {test.auth.type === 'bearer'
                          ? '🔐 JWT'
                          : test.auth.type === 'basic'
                          ? '🔐 Basic'
                          : '🔑 API Key'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">-</span>
                    )}
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
