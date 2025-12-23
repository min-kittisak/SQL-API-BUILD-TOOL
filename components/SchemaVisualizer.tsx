'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Maximize2, Minimize2, Download, Search } from 'lucide-react'
import type { TableSchema } from '@/app/page'

type Props = {
  schema: TableSchema[]
  onBack: () => void
}

type TablePosition = {
  x: number
  y: number
}

export default function SchemaVisualizer({ schema, onBack }: Props) {
  const [positions, setPositions] = useState<Record<string, TablePosition>>({})
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const canvasRef = useRef<HTMLDivElement>(null)

  // Auto-arrange tables in a grid layout
  useEffect(() => {
    if (schema.length === 0) return

    const cols = Math.ceil(Math.sqrt(schema.length))
    const spacing = 350
    const initialPositions: Record<string, TablePosition> = {}

    schema.forEach((table, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      initialPositions[table.name] = {
        x: col * spacing + 50,
        y: row * spacing + 50,
      }
    })

    setPositions(initialPositions)
  }, [schema])

  // Find all relationships
  const getRelationships = () => {
    const relationships: Array<{
      from: string
      to: string
      fromColumn: string
      toColumn: string
    }> = []

    schema.forEach((table) => {
      table.columns.forEach((col) => {
        if (col.isForeignKey && col.references) {
          relationships.push({
            from: table.name,
            to: col.references.table,
            fromColumn: col.name,
            toColumn: col.references.column,
          })
        }
      })
    })

    return relationships
  }

  // Filter tables by search
  const filteredSchema = schema.filter((table) =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Export as image
  const handleExport = () => {
    alert('ฟีเจอร์ Export ภาพจะพัฒนาในเวอร์ชันถัดไป')
  }

  const relationships = getRelationships()

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-panel border-b border-dark-border p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold mb-1">Database Schema Visualization</h2>
            <p className="text-sm text-gray-400">
              แสดงความสัมพันธ์ระหว่างตาราง ({schema.length} ตาราง, {relationships.length} ความสัมพันธ์)
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              100%
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาตาราง..."
            className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2 text-sm"
          />
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto relative bg-gradient-to-br from-dark-bg to-gray-900">
        <div
          ref={canvasRef}
          className="relative"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            minWidth: '2000px',
            minHeight: '2000px',
          }}
        >
          {/* SVG for relationship lines */}
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: '100%', height: '100%', zIndex: 100 }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
              </marker>
            </defs>
            {relationships.map((rel, idx) => {
              const fromPos = positions[rel.from]
              const toPos = positions[rel.to]
              
              if (!fromPos || !toPos) return null

              // Calculate line positions (center of cards)
              const x1 = fromPos.x + 150
              const y1 = fromPos.y + 50
              const x2 = toPos.x + 150
              const y2 = toPos.y + 50

              // Highlight if selected
              const isSelected =
                selectedTable === rel.from || selectedTable === rel.to

              return (
                <g key={idx}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isSelected ? '#3b82f6' : '#6b7280'}
                    strokeWidth={isSelected ? 3 : 2}
                    markerEnd="url(#arrowhead)"
                    opacity={isSelected ? 1 : 0.4}
                  />
                  {/* Relationship label */}
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 5}
                    fill="#9ca3af"
                    fontSize="10"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {rel.fromColumn} → {rel.toColumn}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Tables */}
          {filteredSchema.map((table) => {
            const pos = positions[table.name]
            if (!pos) return null

            const isSelected = selectedTable === table.name
            const hasRelationship = relationships.some(
              (r) => r.from === table.name || r.to === table.name
            )

            return (
              <div
                key={table.name}
                className={`absolute bg-dark-panel border-2 rounded-lg shadow-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 shadow-blue-500/50'
                    : hasRelationship
                    ? 'border-green-500/50'
                    : 'border-dark-border'
                }`}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: '300px',
                  zIndex: isSelected ? 10 : 2,
                }}
                onClick={() => setSelectedTable(isSelected ? null : table.name)}
              >
                {/* Table Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-t-lg">
                  <h3 className="font-bold text-white">{table.name}</h3>
                  <p className="text-xs text-blue-100">
                    {table.columns.length} columns
                  </p>
                </div>

                {/* Columns List */}
                <div className="p-3 max-h-64 overflow-y-auto">
                  {table.columns.map((col) => (
                    <div
                      key={col.name}
                      className="flex items-center gap-2 py-1.5 border-b border-dark-border last:border-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{col.name}</span>
                          {col.isPrimaryKey && (
                            <span className="px-1.5 py-0.5 bg-yellow-600 text-yellow-100 rounded text-xs font-bold">
                              PK
                            </span>
                          )}
                          {col.isForeignKey && (
                            <span className="px-1.5 py-0.5 bg-blue-600 text-blue-100 rounded text-xs font-bold">
                              FK
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                          <span>{col.type}</span>
                          {!col.nullable && (
                            <span className="text-red-400">NOT NULL</span>
                          )}
                        </div>
                        {col.isForeignKey && col.references && (
                          <div className="text-xs text-blue-400 mt-0.5">
                            → {col.references.table}.{col.references.column}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats Footer */}
                <div className="bg-dark-bg p-2 rounded-b-lg border-t border-dark-border">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>
                      PK:{' '}
                      {table.columns.filter((c) => c.isPrimaryKey).length}
                    </span>
                    <span>
                      FK:{' '}
                      {table.columns.filter((c) => c.isForeignKey).length}
                    </span>
                    <span>
                      Nullable:{' '}
                      {table.columns.filter((c) => c.nullable).length}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-dark-panel border-t border-dark-border p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-600 rounded"></div>
              <span>Primary Key (PK)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span>Foreign Key (FK)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-blue-500"></div>
              <span>Relationship</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-green-500 rounded"></div>
              <span>Has Relationship</span>
            </div>
          </div>

          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </button>
        </div>
      </div>
    </div>
  )
}
