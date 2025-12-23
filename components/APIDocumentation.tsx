'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Copy, Download, CheckCircle2, Book, Upload } from 'lucide-react'
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

type ParsedEndpoint = {
  id: string
  path: string
  method: string
  summary: string
  description?: string
  parameters?: any[]
  requestBody?: any
  responses?: any
  tags?: string[]
}

type Props = {
  onBack: () => void
}

export default function APIDocumentation({ onBack }: Props) {
  const [inputMode, setInputMode] = useState<'url' | 'json'>('url')
  const [swaggerUrl, setSwaggerUrl] = useState('https://localhost:7140/swagger/v1/swagger.json')
  const [swaggerJson, setSwaggerJson] = useState('')
  const [swaggerSpec, setSwaggerSpec] = useState<SwaggerSpec | null>(null)
  const [endpoints, setEndpoints] = useState<ParsedEndpoint[]>([])
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [format, setFormat] = useState<'openapi' | 'markdown' | 'postman'>('markdown')

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
      setError(err.message || 'Failed to load Swagger spec. Try CORS or use Paste JSON')
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

  // Parse and set spec
  const parseAndSetSpec = (spec: SwaggerSpec) => {
    setSwaggerSpec(spec)
    
    const parsedEndpoints: ParsedEndpoint[] = []
    
    Object.entries(spec.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, details]) => {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
          parsedEndpoints.push({
            id: `${method.toUpperCase()}-${path}`,
            path,
            method: method.toUpperCase(),
            summary: details.summary || `${method.toUpperCase()} ${path}`,
            description: details.description,
            parameters: details.parameters,
            requestBody: details.requestBody,
            responses: details.responses,
            tags: details.tags,
          })
        }
      })
    })
    
    setEndpoints(parsedEndpoints)
    if (parsedEndpoints.length > 0) {
      setSelectedEndpoint(parsedEndpoints[0].id)
    }
  }

  // Generate documentation for single endpoint
  const generateEndpointDoc = (endpoint: ParsedEndpoint) => {
    if (!swaggerSpec) return ''

    const baseUrl = swaggerSpec.servers?.[0]?.url || 'https://api.example.com'

    if (format === 'markdown') {
      return generateMarkdownForEndpoint(endpoint, baseUrl)
    } else if (format === 'openapi') {
      return generateOpenAPIForEndpoint(endpoint)
    } else {
      return generatePostmanForEndpoint(endpoint, baseUrl)
    }
  }

  // Generate Markdown for single endpoint
  const generateMarkdownForEndpoint = (endpoint: ParsedEndpoint, baseUrl: string) => {
    let md = `# ${endpoint.method} ${endpoint.path}\n\n`
    
    if (endpoint.summary) {
      md += `**${endpoint.summary}**\n\n`
    }
    
    if (endpoint.description) {
      md += `${endpoint.description}\n\n`
    }

    if (endpoint.tags && endpoint.tags.length > 0) {
      md += `**Tags:** ${endpoint.tags.join(', ')}\n\n`
    }

    md += `## Request\n\n`
    md += `**URL:** \`${baseUrl}${endpoint.path}\`\n\n`
    md += `**Method:** \`${endpoint.method}\`\n\n`

    // Parameters
    if (endpoint.parameters && endpoint.parameters.length > 0) {
      md += `### Parameters\n\n`
      endpoint.parameters.forEach((param: any) => {
        md += `- **${param.name}** (${param.in})`
        if (param.required) md += ` *required*`
        md += `\n`
        if (param.description) md += `  - ${param.description}\n`
        if (param.schema) md += `  - Type: \`${param.schema.type}\`\n`
      })
      md += `\n`
    }

    // Request Body
    if (endpoint.requestBody) {
      md += `### Request Body\n\n`
      const content = endpoint.requestBody.content
      if (content?.['application/json']?.schema) {
        md += `\`\`\`json\n${JSON.stringify(content['application/json'].schema, null, 2)}\n\`\`\`\n\n`
      }
    }

    // Responses
    if (endpoint.responses) {
      md += `## Responses\n\n`
      Object.entries(endpoint.responses).forEach(([code, response]: [string, any]) => {
        md += `### ${code} - ${response.description || 'Response'}\n\n`
        if (response.content?.['application/json']?.schema) {
          md += `\`\`\`json\n${JSON.stringify(response.content['application/json'].schema, null, 2)}\n\`\`\`\n\n`
        }
      })
    }

    // Example cURL
    md += `## Example\n\n`
    md += `**cURL:**\n\`\`\`bash\n`
    md += `curl -X ${endpoint.method} "${baseUrl}${endpoint.path}" \\\n`
    md += `  -H "Content-Type: application/json" \\\n`
    md += `  -H "Authorization: Bearer YOUR_TOKEN"\n`
    md += `\`\`\`\n\n`

    return md
  }

  // Generate OpenAPI for single endpoint
  const generateOpenAPIForEndpoint = (endpoint: ParsedEndpoint) => {
    if (!swaggerSpec) return ''

    const pathObj: any = {}
    pathObj[endpoint.path] = {}
    pathObj[endpoint.path][endpoint.method.toLowerCase()] = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags,
      parameters: endpoint.parameters,
      requestBody: endpoint.requestBody,
      responses: endpoint.responses,
    }

    const spec = {
      openapi: swaggerSpec.openapi || '3.0.0',
      info: swaggerSpec.info,
      servers: swaggerSpec.servers,
      paths: pathObj,
      components: swaggerSpec.components,
    }

    return JSON.stringify(spec, null, 2)
  }

  // Generate Postman for single endpoint  
  const generatePostmanForEndpoint = (endpoint: ParsedEndpoint, baseUrl: string) => {
    const collection = {
      info: {
        name: `${endpoint.method} ${endpoint.path}`,
        description: endpoint.description || endpoint.summary,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: endpoint.summary,
          request: {
            method: endpoint.method,
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{token}}' },
            ],
            url: {
              raw: `${baseUrl}${endpoint.path}`,
              host: [baseUrl],
              path: endpoint.path.split('/').filter((p) => p),
            },
            body: endpoint.requestBody?.content?.['application/json']?.schema
              ? {
                  mode: 'raw',
                  raw: JSON.stringify(endpoint.requestBody.content['application/json'].schema, null, 2),
                }
              : undefined,
          },
        },
      ],
    }

    return JSON.stringify(collection, null, 2)
  }

  const currentEndpoint = endpoints.find(e => e.id === selectedEndpoint)
  const documentation = currentEndpoint ? generateEndpointDoc(currentEndpoint) : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(documentation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const extension = format === 'markdown' ? 'md' : 'json'
    const filename = currentEndpoint 
      ? `${currentEndpoint.method.toLowerCase()}-${currentEndpoint.path.replace(/\//g, '-')}.${extension}`
      : `api-documentation.${extension}`
    const blob = new Blob([documentation], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex bg-dark-bg">
      {/* Sidebar - Endpoints List */}
      <div className="w-80 bg-dark-panel border-r border-dark-border flex flex-col">
        {/* Swagger URL Input */}
        <div className="p-4 border-b border-dark-border">
          <label className="block text-sm font-medium mb-2">Import Swagger/OpenAPI Spec</label>
          
          {/* Mode Selector */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setInputMode('url')}
              className={`flex-1 px-3 py-2 rounded text-sm ${
                inputMode === 'url'
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-bg text-gray-400 hover:bg-dark-hover'
              }`}
            >
              Load from URL
            </button>
            <button
              onClick={() => setInputMode('json')}
              className={`flex-1 px-3 py-2 rounded text-sm ${
                inputMode === 'json'
                  ? 'bg-blue-600 text-white'
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {loading ? '...' : 'Load'}
              </button>
            </div>
          ) : (
            <div>
              <textarea
                value={swaggerJson}
                onChange={(e) => setSwaggerJson(e.target.value)}
                placeholder='{"openapi": "3.0.0", ...}'
                rows={4}
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs font-mono mb-2"
              />
              <button
                onClick={loadSwaggerJson}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center gap-2 disabled:opacity-50"
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
              <p className="text-xs text-gray-500">{endpoints.length} endpoints</p>
            </div>
          )}
        </div>

        {/* Endpoints List */}
        <div className="flex-1 overflow-y-auto p-3">
          <h3 className="text-sm font-semibold mb-2 text-gray-400">API Endpoints</h3>
          {endpoints.map(endpoint => (
            <button
              key={endpoint.id}
              onClick={() => setSelectedEndpoint(endpoint.id)}
              className={`w-full text-left px-3 py-2 rounded mb-1 transition-colors ${
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
                <span className="text-sm truncate">{endpoint.path}</span>
              </div>
              {endpoint.summary && (
                <p className="text-xs text-gray-400 mt-1 truncate">{endpoint.summary}</p>
              )}
            </button>
          ))}
          {endpoints.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">
              Import Swagger spec to view endpoints
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-dark-panel border-b border-dark-border p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Book className="w-6 h-6 text-blue-500" />
              <div>
                <h2 className="text-xl font-bold">API Documentation Generator</h2>
                <p className="text-sm text-gray-400">
                  {currentEndpoint 
                    ? `${currentEndpoint.method} ${currentEndpoint.path}`
                    : 'Import Swagger spec to generate docs'}
                </p>
              </div>
            </div>
            {currentEndpoint && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            )}
          </div>

          {/* Format Selector */}
          {currentEndpoint && (
            <div className="flex gap-2">
              {[
                { id: 'markdown', label: 'Markdown' },
                { id: 'openapi', label: 'OpenAPI 3.0' },
                { id: 'postman', label: 'Postman Collection' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id as any)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    format === f.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-dark-bg text-gray-400 hover:bg-dark-hover'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Documentation Preview */}
        <div className="flex-1 overflow-auto p-6">
          {currentEndpoint ? (
            <div className="max-w-5xl mx-auto">
              <pre className="bg-dark-panel border border-dark-border rounded-lg p-6 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                {documentation}
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Book className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No endpoint selected</p>
                <p className="text-sm">Import a Swagger spec and select an endpoint to generate documentation</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-dark-panel border-t border-dark-border p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              <p>
                📄 Generate docs: Markdown, OpenAPI 3.0 Spec, Postman Collection
              </p>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
