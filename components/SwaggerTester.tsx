'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Download, Upload, Play, Trash2, Copy, CheckCircle2, LogIn, Zap } from 'lucide-react'
import axios from 'axios'

type SwaggerSpec = {
  openapi?: string
  swagger?: string
  info: {
    title: string
    version: string
    description?: string
  }
  servers?: Array<{ url: string; description?: string }>
  paths: {
    [path: string]: {
      [method: string]: {
        summary?: string
        description?: string
        parameters?: any[]
        requestBody?: any
        responses?: any
        tags?: string[]
        security?: any[]
      }
    }
  }
  components?: {
    securitySchemes?: any
    schemas?: any
  }
}

type EndpointTest = {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers: Array<{ key: string; value: string }>
  body: string
  bodyFields?: Array<{ key: string; value: string; type: string; required: boolean; description?: string }>
  useFormFields: boolean
  pathParams: Array<{ key: string; value: string }>
  queryParams: Array<{ key: string; value: string }>
  authType: 'none' | 'bearer' | 'basic' | 'apikey'
  authToken: string
  authUsername: string
  authPassword: string
  apiKeyHeader: string
  apiKeyValue: string
  response?: {
    status: number
    statusText: string
    headers: Record<string, string>
    data: any
    time: number
    size: number
  }
}

type Props = {
  onBack: () => void
}

export default function SwaggerTester({ onBack }: Props) {
  const [inputMode, setInputMode] = useState<'url' | 'json'>('url')
  const [swaggerUrl, setSwaggerUrl] = useState('https://localhost:7140/swagger/v1/swagger.json')
  const [swaggerJson, setSwaggerJson] = useState('')
  const [swaggerSpec, setSwaggerSpec] = useState<SwaggerSpec | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Quick Login
  const [loginUrl, setLoginUrl] = useState('https://localhost:7140/auth/login')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  // Endpoints
  const [endpoints, setEndpoints] = useState<EndpointTest[]>([])
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null)
  const [executing, setExecuting] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('swagger-tester-state')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.swaggerUrl) setSwaggerUrl(data.swaggerUrl)
        if (data.swaggerSpec) setSwaggerSpec(data.swaggerSpec)
        if (data.endpoints) setEndpoints(data.endpoints)
        if (data.selectedEndpoint) setSelectedEndpoint(data.selectedEndpoint)
        if (data.loginUrl) setLoginUrl(data.loginUrl)
        if (data.loginEmail) setLoginEmail(data.loginEmail)
      } catch (err) {
        console.error('Failed to restore state', err)
      }
    }
  }, [])

  // Save to localStorage when key data changes
  useEffect(() => {
    const data = {
      swaggerUrl,
      swaggerSpec,
      endpoints,
      selectedEndpoint,
      loginUrl,
      loginEmail,
    }
    localStorage.setItem('swagger-tester-state', JSON.stringify(data))
  }, [swaggerUrl, swaggerSpec, endpoints, selectedEndpoint, loginUrl, loginEmail])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('swagger-tester-state')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.swaggerUrl) setSwaggerUrl(data.swaggerUrl)
        if (data.swaggerSpec) setSwaggerSpec(data.swaggerSpec)
        if (data.endpoints) setEndpoints(data.endpoints)
        if (data.selectedEndpoint) setSelectedEndpoint(data.selectedEndpoint)
        if (data.loginUrl) setLoginUrl(data.loginUrl)
        if (data.loginEmail) setLoginEmail(data.loginEmail)
      } catch (err) {
        console.error('Failed to restore state', err)
      }
    }
  }, [])

  // Save to localStorage when key data changes
  useEffect(() => {
    const data = {
      swaggerUrl,
      swaggerSpec,
      endpoints,
      selectedEndpoint,
      loginUrl,
      loginEmail,
    }
    localStorage.setItem('swagger-tester-state', JSON.stringify(data))
  }, [swaggerUrl, swaggerSpec, endpoints, selectedEndpoint, loginUrl, loginEmail])

  // Load Swagger Spec from URL
  const loadSwaggerSpec = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get(swaggerUrl, {
        headers: { 'Content-Type': 'application/json' },
      })
      const spec: SwaggerSpec = response.data
      parseAndSetSpec(spec)
    } catch (err: any) {
      setError(err.message || 'Failed to load Swagger spec. ลอง CORS หรือใช้ Paste JSON แทน')
    } finally {
      setLoading(false)
    }
  }

  // Load Swagger Spec from JSON
  const loadSwaggerJson = () => {
    setLoading(true)
    setError('')
    try {
      const spec: SwaggerSpec = JSON.parse(swaggerJson)
      parseAndSetSpec(spec)
    } catch (err: any) {
      setError('Invalid JSON format')
    } finally {
      setLoading(false)
    }
  }

  // Extract fields from schema for form display
  const extractFieldsFromSchema = (schema: any, components?: any, required: string[] = []): Array<{ key: string; value: string; type: string; required: boolean; description?: string }> => {
    if (!schema) return []

    // Handle $ref
    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/components/schemas/', '')
      if (components?.schemas?.[refPath]) {
        return extractFieldsFromSchema(components.schemas[refPath], components, schema.required || required)
      }
    }

    const fields: Array<{ key: string; value: string; type: string; required: boolean; description?: string }> = []

    if (schema.type === 'object' && schema.properties) {
      const requiredFields = schema.required || required || []
      
      Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
        let defaultValue = ''
        let fieldType = prop.type || 'string'

        if (prop.example !== undefined) {
          defaultValue = String(prop.example)
        } else if (prop.default !== undefined) {
          defaultValue = String(prop.default)
        } else {
          switch (prop.type) {
            case 'string':
              defaultValue = prop.format === 'email' ? 'user@example.com' :
                           prop.format === 'date-time' ? '2024-01-01T00:00:00Z' :
                           prop.format === 'date' ? '2024-01-01' :
                           prop.enum ? prop.enum[0] : ''
              break
            case 'number':
            case 'integer':
              defaultValue = String(prop.minimum || 0)
              break
            case 'boolean':
              defaultValue = 'false'
              break
            default:
              defaultValue = ''
          }
        }

        fields.push({
          key,
          value: defaultValue,
          type: fieldType,
          required: requiredFields.includes(key),
          description: prop.description,
        })
      })
    }

    return fields
  }

  // Generate example body from schema
  const generateBodyFromSchema = (schema: any, components?: any): any => {
    if (!schema) return {}

    // Handle $ref
    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/components/schemas/', '')
      if (components?.schemas?.[refPath]) {
        return generateBodyFromSchema(components.schemas[refPath], components)
      }
    }

    if (schema.type === 'object' && schema.properties) {
      const obj: any = {}
      Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
        // Generate example value based on type
        if (prop.example !== undefined) {
          obj[key] = prop.example
        } else if (prop.default !== undefined) {
          obj[key] = prop.default
        } else if (prop.$ref) {
          obj[key] = generateBodyFromSchema(prop, components)
        } else {
          switch (prop.type) {
            case 'string':
              obj[key] = prop.format === 'email' ? 'user@example.com' :
                         prop.format === 'date-time' ? '2024-01-01T00:00:00Z' :
                         prop.format === 'date' ? '2024-01-01' :
                         prop.enum ? prop.enum[0] : 'string'
              break
            case 'number':
            case 'integer':
              obj[key] = prop.minimum || 0
              break
            case 'boolean':
              obj[key] = false
              break
            case 'array':
              obj[key] = prop.items ? [generateBodyFromSchema(prop.items, components)] : []
              break
            case 'object':
              obj[key] = generateBodyFromSchema(prop, components)
              break
            default:
              obj[key] = null
          }
        }
      })
      return obj
    } else if (schema.type === 'array' && schema.items) {
      return [generateBodyFromSchema(schema.items, components)]
    }

    return {}
  }

  // Parse and set spec
  const parseAndSetSpec = (spec: SwaggerSpec) => {
    try {
      setSwaggerSpec(spec)
      
      // Parse endpoints from spec
      const parsedEndpoints: EndpointTest[] = []
      const baseUrl = spec.servers?.[0]?.url || 'https://localhost:7140'
      
      Object.entries(spec.paths).forEach(([path, methods]) => {
        Object.entries(methods).forEach(([method, details]) => {
          if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
            const id = `${method.toUpperCase()}-${path}-${Date.now()}-${Math.random()}`
            
            // Generate body from schema for POST/PUT/PATCH
            let bodyContent = ''
            let contentType = 'application/json'
            let bodyFields: Array<{ key: string; value: string; type: string; required: boolean; description?: string }> = []
            let useFormFields = false
            
            if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
              const requestBody = details.requestBody
              
              if (requestBody?.content) {
                // Check for different content types
                if (requestBody.content['application/json']?.schema) {
                  const schema = requestBody.content['application/json'].schema
                  const exampleBody = generateBodyFromSchema(schema, spec.components)
                  bodyContent = JSON.stringify(exampleBody, null, 2)
                  bodyFields = extractFieldsFromSchema(schema, spec.components)
                  useFormFields = bodyFields.length > 0
                  contentType = 'application/json'
                } else if (requestBody.content['multipart/form-data']?.schema) {
                  // Form data
                  const schema = requestBody.content['multipart/form-data'].schema
                  const exampleBody = generateBodyFromSchema(schema, spec.components)
                  bodyContent = JSON.stringify(exampleBody, null, 2)
                  bodyFields = extractFieldsFromSchema(schema, spec.components)
                  useFormFields = bodyFields.length > 0
                  contentType = 'multipart/form-data'
                } else if (requestBody.content['application/x-www-form-urlencoded']?.schema) {
                  // URL encoded form
                  const schema = requestBody.content['application/x-www-form-urlencoded'].schema
                  const exampleBody = generateBodyFromSchema(schema, spec.components)
                  bodyContent = JSON.stringify(exampleBody, null, 2)
                  bodyFields = extractFieldsFromSchema(schema, spec.components)
                  useFormFields = bodyFields.length > 0
                  contentType = 'application/x-www-form-urlencoded'
                } else {
                  bodyContent = '{}'
                }
              } else {
                bodyContent = '{}'
              }
            }
            
            parsedEndpoints.push({
              id,
              name: details.summary || `${method.toUpperCase()} ${path}`,
              method: method.toUpperCase() as any,
              url: `${baseUrl}${path}`,
              headers: [{ key: 'Content-Type', value: contentType }],
              body: bodyContent,
              bodyFields,
              useFormFields,
              pathParams: [],
              queryParams: [],
              authType: 'bearer',
              authToken: '',
              authUsername: '',
              authPassword: '',
              apiKeyHeader: 'X-API-Key',
              apiKeyValue: '',
            })
          }
        })
      })
      
      setEndpoints(parsedEndpoints)
      if (parsedEndpoints.length > 0) {
        setSelectedEndpoint(parsedEndpoints[0].id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse Swagger spec')
    }
  }

  // Quick Login
  const handleQuickLogin = async () => {
    setLoggingIn(true)
    try {
      const response = await axios.post(loginUrl, {
        email: loginEmail,
        password: loginPassword,
      })
      
      const token = response.data?.token || response.data?.accessToken || response.data?.access_token
      
      if (token) {
        // Auto-fill token to all endpoints
        setEndpoints(prev => prev.map(ep => ({
          ...ep,
          authType: 'bearer',
          authToken: token,
        })))
        alert('เข้าสู่ระบบสำเร็จ! Token ถูกใส่ให้ทุก endpoint แล้ว')
      } else {
        alert('ไม่พบ token ใน response')
      }
    } catch (err: any) {
      alert(`Login ล้มเหลว: ${err.message}`)
    } finally {
      setLoggingIn(false)
    }
  }

  // Execute endpoint
  const executeEndpoint = async (id: string) => {
    const endpoint = endpoints.find(e => e.id === id)
    if (!endpoint) return

    setExecuting(id)
    const startTime = Date.now()

    try {
      let url = endpoint.url
      
      // Replace path params
      endpoint.pathParams.forEach(param => {
        url = url.replace(`{${param.key}}`, param.value)
      })
      
      // Add query params
      if (endpoint.queryParams.length > 0) {
        const params = new URLSearchParams()
        endpoint.queryParams.forEach(p => {
          if (p.key && p.value) params.append(p.key, p.value)
        })
        url += `?${params.toString()}`
      }

      const headers: Record<string, string> = {}
      endpoint.headers.forEach(h => {
        if (h.key && h.value) headers[h.key] = h.value
      })

      // Add auth
      if (endpoint.authType === 'bearer' && endpoint.authToken) {
        headers['Authorization'] = `Bearer ${endpoint.authToken}`
      } else if (endpoint.authType === 'basic' && endpoint.authUsername && endpoint.authPassword) {
        const encoded = btoa(`${endpoint.authUsername}:${endpoint.authPassword}`)
        headers['Authorization'] = `Basic ${encoded}`
      } else if (endpoint.authType === 'apikey' && endpoint.apiKeyHeader && endpoint.apiKeyValue) {
        headers[endpoint.apiKeyHeader] = endpoint.apiKeyValue
      }

      const config: any = {
        method: endpoint.method,
        url,
        headers,
      }

      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.body) {
        try {
          // Build JSON from form fields if using form mode
          if (endpoint.useFormFields && endpoint.bodyFields && endpoint.bodyFields.length > 0) {
            const bodyObj: any = {}
            endpoint.bodyFields.forEach(field => {
              if (field.value) {
                // Convert to proper type
                if (field.type === 'number' || field.type === 'integer') {
                  bodyObj[field.key] = Number(field.value)
                } else if (field.type === 'boolean') {
                  bodyObj[field.key] = field.value === 'true' || field.value === '1'
                } else {
                  bodyObj[field.key] = field.value
                }
              }
            })
            config.data = bodyObj
          } else {
            // Use JSON from textarea
            config.data = JSON.parse(endpoint.body)
          }
        } catch {
          config.data = endpoint.body
        }
      }

      const response = await axios(config)
      const endTime = Date.now()

      setEndpoints(prev => prev.map(e => 
        e.id === id ? {
          ...e,
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers as any,
            data: response.data,
            time: endTime - startTime,
            size: JSON.stringify(response.data).length,
          }
        } : e
      ))
    } catch (err: any) {
      const endTime = Date.now()
      setEndpoints(prev => prev.map(e => 
        e.id === id ? {
          ...e,
          response: {
            status: err.response?.status || 0,
            statusText: err.response?.statusText || 'Error',
            headers: err.response?.headers || {},
            data: err.response?.data || { error: err.message },
            time: endTime - startTime,
            size: 0,
          }
        } : e
      ))
    } finally {
      setExecuting(null)
    }
  }

  const currentEndpoint = endpoints.find(e => e.id === selectedEndpoint)

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-panel border-b border-dark-border p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-purple-500" />
            <div>
              <h2 className="text-xl font-bold">Swagger API Tester</h2>
              <p className="text-sm text-gray-400">Import Swagger/OpenAPI spec และทดสอบ API</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Input & Login */}
        <div className="w-80 bg-dark-panel border-r border-dark-border flex flex-col flex-shrink-0">
          {/* Swagger URL Input */}
          <div className="p-4 border-b border-dark-border">
            <label className="block text-sm font-medium mb-2">Import Swagger/OpenAPI Spec</label>
            
            {/* Mode Selector */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setInputMode('url')}
                className={`flex-1 px-3 py-2 rounded text-sm ${
                  inputMode === 'url'
                    ? 'bg-purple-600 text-white'
                    : 'bg-dark-bg text-gray-400 hover:bg-dark-hover'
                }`}
              >
                Load from URL
              </button>
              <button
                onClick={() => setInputMode('json')}
                className={`flex-1 px-3 py-2 rounded text-sm ${
                  inputMode === 'json'
                    ? 'bg-purple-600 text-white'
                    : 'bg-dark-bg text-gray-400 hover:bg-dark-hover'
                }`}
              >
                Paste JSON
              </button>
            </div>

            {inputMode === 'url' ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={swaggerUrl}
                  onChange={(e) => setSwaggerUrl(e.target.value)}
                  placeholder="https://api.example.com/swagger.json"
                  className="flex-1 bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm"
                />
                <button
                  onClick={loadSwaggerSpec}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded flex items-center gap-2 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {loading ? 'Loading...' : 'Load'}
                </button>
              </div>
            ) : (
              <div>
                <textarea
                  value={swaggerJson}
                  onChange={(e) => setSwaggerJson(e.target.value)}
                  placeholder='{"openapi": "3.0.0", "info": {...}, "paths": {...}}'
                  rows={6}
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs font-mono mb-2"
                />
                <button
                  onClick={loadSwaggerJson}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {loading ? 'Parsing...' : 'Parse JSON'}
                </button>
              </div>
            )}
            
            {error && (
              <div className="mt-2 p-2 bg-red-900/30 border border-red-500/50 rounded">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}
            
            {swaggerSpec && (
              <div className="mt-3 p-2 bg-dark-bg rounded border border-green-500/30">
                <p className="text-xs text-green-400">
                  ✓ {swaggerSpec.info.title} v{swaggerSpec.info.version}
                </p>
                <p className="text-xs text-gray-500">{endpoints.length} endpoints loaded</p>
              </div>
            )}
          </div>

          {/* Quick Login */}
          <div className="p-4 border-b border-dark-border bg-gradient-to-br from-blue-900/20 to-purple-900/20">
            <div className="flex items-center gap-2 mb-3">
              <LogIn className="w-4 h-4 text-blue-400" />
              <h3 className="font-semibold text-sm">Quick Login</h3>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={loginUrl}
                onChange={(e) => setLoginUrl(e.target.value)}
                placeholder="Login API URL"
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm"
              />
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm"
              />
              <button
                onClick={handleQuickLogin}
                disabled={loggingIn}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm disabled:opacity-50"
              >
                {loggingIn ? 'Logging in...' : 'Login & Auto-fill Token'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {currentEndpoint ? (
            <>
              {/* Endpoint Details */}
              <div className="p-4 border-b border-dark-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold px-3 py-1 rounded ${
                      currentEndpoint.method === 'GET' ? 'bg-green-600' :
                      currentEndpoint.method === 'POST' ? 'bg-blue-600' :
                      currentEndpoint.method === 'PUT' ? 'bg-yellow-600' :
                      currentEndpoint.method === 'DELETE' ? 'bg-red-600' :
                      'bg-purple-600'
                    }`}>
                      {currentEndpoint.method}
                    </span>
                    <h3 className="font-semibold">{currentEndpoint.name}</h3>
                  </div>
                  <button
                    onClick={() => executeEndpoint(currentEndpoint.id)}
                    disabled={executing === currentEndpoint.id}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded flex items-center gap-2 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    {executing === currentEndpoint.id ? 'Executing...' : 'Execute'}
                  </button>
                </div>

                {/* URL */}
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">URL</label>
                  <input
                    type="text"
                    value={currentEndpoint.url}
                    onChange={(e) => setEndpoints(prev => prev.map(ep =>
                      ep.id === currentEndpoint.id ? { ...ep, url: e.target.value } : ep
                    ))}
                    className="w-full bg-dark-panel border border-dark-border rounded px-3 py-2 text-sm font-mono"
                  />
                </div>

                {/* Auth */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Auth Type</label>
                    <select
                      value={currentEndpoint.authType}
                      onChange={(e) => setEndpoints(prev => prev.map(ep =>
                        ep.id === currentEndpoint.id ? { ...ep, authType: e.target.value as any } : ep
                      ))}
                      className="w-full bg-dark-panel border border-dark-border rounded px-3 py-2 text-sm"
                    >
                      <option value="none">None</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="basic">Basic Auth</option>
                      <option value="apikey">API Key</option>
                    </select>
                  </div>
                  {currentEndpoint.authType === 'bearer' && (
                    <div className="col-span-3">
                      <label className="block text-sm font-medium mb-1">Bearer Token</label>
                      <input
                        type="text"
                        value={currentEndpoint.authToken}
                        onChange={(e) => setEndpoints(prev => prev.map(ep =>
                          ep.id === currentEndpoint.id ? { ...ep, authToken: e.target.value } : ep
                        ))}
                        className="w-full bg-dark-panel border border-dark-border rounded px-3 py-2 text-sm font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Request Body */}
              {['POST', 'PUT', 'PATCH'].includes(currentEndpoint.method) && (
                <div className="p-4 pb-6 border-b border-dark-border">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium">Request Body</label>
                    {currentEndpoint.bodyFields && currentEndpoint.bodyFields.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEndpoints(prev => prev.map(ep =>
                            ep.id === currentEndpoint.id ? { ...ep, useFormFields: true } : ep
                          ))}
                          className={`px-3 py-1 rounded text-xs ${
                            currentEndpoint.useFormFields
                              ? 'bg-blue-600 text-white'
                              : 'bg-dark-bg text-gray-400'
                          }`}
                        >
                          Form Fields
                        </button>
                        <button
                          onClick={() => setEndpoints(prev => prev.map(ep =>
                            ep.id === currentEndpoint.id ? { ...ep, useFormFields: false } : ep
                          ))}
                          className={`px-3 py-1 rounded text-xs ${
                            !currentEndpoint.useFormFields
                              ? 'bg-blue-600 text-white'
                              : 'bg-dark-bg text-gray-400'
                          }`}
                        >
                          JSON Editor
                        </button>
                      </div>
                    )}
                  </div>

                  {currentEndpoint.useFormFields && currentEndpoint.bodyFields && currentEndpoint.bodyFields.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {currentEndpoint.bodyFields.map((field, idx) => (
                        <div key={idx}>
                          <label className="block text-xs font-medium mb-1">
                            {field.key}
                            {field.required && <span className="text-red-400 ml-1">*</span>}
                            {field.description && (
                              <span className="text-gray-400 font-normal ml-2">- {field.description}</span>
                            )}
                          </label>
                          {field.type === 'boolean' ? (
                            <select
                              value={field.value}
                              onChange={(e) => setEndpoints(prev => prev.map(ep =>
                                ep.id === currentEndpoint.id ? {
                                  ...ep,
                                  bodyFields: ep.bodyFields?.map((f, i) =>
                                    i === idx ? { ...f, value: e.target.value } : f
                                  )
                                } : ep
                              ))}
                              className="w-full bg-dark-panel border border-dark-border rounded px-3 py-2 text-sm"
                            >
                              <option value="false">false</option>
                              <option value="true">true</option>
                            </select>
                          ) : (
                            <input
                              type={field.type === 'number' || field.type === 'integer' ? 'number' : 'text'}
                              value={field.value}
                              onChange={(e) => setEndpoints(prev => prev.map(ep =>
                                ep.id === currentEndpoint.id ? {
                                  ...ep,
                                  bodyFields: ep.bodyFields?.map((f, i) =>
                                    i === idx ? { ...f, value: e.target.value } : f
                                  )
                                } : ep
                              ))}
                              placeholder={`Enter ${field.key}`}
                              className="w-full bg-dark-panel border border-dark-border rounded px-3 py-2 text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={currentEndpoint.body}
                      onChange={(e) => setEndpoints(prev => prev.map(ep =>
                        ep.id === currentEndpoint.id ? { ...ep, body: e.target.value } : ep
                      ))}
                      rows={8}
                      className="w-full bg-dark-panel border border-dark-border rounded px-3 py-2 text-sm font-mono"
                    />
                  )}
                </div>
              )}

              {/* Response */}
              {currentEndpoint.response && (
                <div className="flex-1 overflow-auto p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Response</h3>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`px-3 py-1 rounded ${
                        currentEndpoint.response.status >= 200 && currentEndpoint.response.status < 300
                          ? 'bg-green-600'
                          : 'bg-red-600'
                      }`}>
                        {currentEndpoint.response.status} {currentEndpoint.response.statusText}
                      </span>
                      <span className="text-gray-400">{currentEndpoint.response.time}ms</span>
                      <span className="text-gray-400">{(currentEndpoint.response.size / 1024).toFixed(2)} KB</span>
                    </div>
                  </div>
                  <pre className="bg-dark-panel border border-dark-border rounded p-4 text-sm font-mono overflow-auto">
                    {JSON.stringify(currentEndpoint.response.data, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>เลือก endpoint เพื่อทดสอบ</p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Endpoints List */}
        <div className="w-80 bg-dark-panel border-l border-dark-border flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-dark-border">
            <h3 className="text-sm font-semibold text-gray-400">Endpoints ({endpoints.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {endpoints.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">ยังไม่มี endpoints<br/>Import Swagger spec ก่อน</p>
              ) : (
                endpoints.map(endpoint => (
                  <button
                    key={endpoint.id}
                    onClick={() => setSelectedEndpoint(endpoint.id)}
                    className={`w-full text-left px-3 py-2.5 rounded mb-1 transition-colors ${
                      selectedEndpoint === endpoint.id
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-dark-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        endpoint.method === 'GET' ? 'bg-green-600' :
                        endpoint.method === 'POST' ? 'bg-blue-600' :
                        endpoint.method === 'PUT' ? 'bg-yellow-600' :
                        endpoint.method === 'DELETE' ? 'bg-red-600' :
                        'bg-purple-600'
                      }`}>
                        {endpoint.method}
                      </span>
                      <span className="text-sm truncate">{endpoint.name}</span>
                    </div>
                    {endpoint.response && (
                      <div className="text-xs text-gray-400 mt-1">
                        {endpoint.response.status} • {endpoint.response.time}ms
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-dark-panel border-t border-dark-border p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            🔌 Import Swagger/OpenAPI spec และทดสอบ API ได้ทันที
          </p>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </button>
        </div>
      </div>
    </div>
  )
}
