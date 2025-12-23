'use client'

import { useState } from 'react'
import DatabaseConnection from '@/components/DatabaseConnection'
import QueryBuilder from '@/components/QueryBuilder'
import ResponseMapper from '@/components/ResponseMapper'
import APIGenerator from '@/components/APIGenerator'
import CSharpGenerator from '@/components/CSharpGenerator'
import APITester from '@/components/APITester'
import SchemaVisualizer from '@/components/SchemaVisualizer'
import APIDocumentation from '@/components/APIDocumentation'
import SwaggerTester from '@/components/SwaggerTester'
import GraphQLGenerator from '@/components/GraphQLGenerator'
import { Database, Code2, Zap, Settings, Play, Network, Book, Wrench, FileCode } from 'lucide-react'

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
			<header className="bg-dark-panel border-b border-dark-border px-6 py-4 flex-shrink-0 relative z-10">
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
			<div className="bg-dark-panel border-b border-dark-border px-6 py-3 flex-shrink-0 relative z-10">
				<div className="flex items-center gap-6">
					{/* Database Group */}
					<div className="flex items-center gap-2">
						<div className="text-xs text-gray-500 font-semibold uppercase">Database</div>
						<div className="flex gap-2">
							<button
								onClick={() => setStep(1)}
								className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${step === 1
										? 'bg-blue-600 text-white'
										: 'bg-dark-bg text-gray-400 hover:bg-dark-hover'
									}`}
							>
								<Database className="w-4 h-4" />
								เชื่อมต่อ
							</button>
							<button
								onClick={() => setStep(7)}
								className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${step === 7
										? 'bg-blue-600 text-white'
										: 'bg-dark-bg text-gray-400 hover:bg-dark-hover'
									}`}
							>
								<Network className="w-4 h-4" />
								Schema
							</button>
						</div>
					</div>

					<div className="h-8 w-px bg-dark-border"></div>

					{/* Query Group */}
					<div className="flex items-center gap-2">
						<div className="text-xs text-gray-500 font-semibold uppercase">Query</div>
						<button
							onClick={() => setStep(2)}
							className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${step === 2
									? 'bg-blue-600 text-white'
									: 'bg-dark-bg text-gray-400 hover:bg-dark-hover'
								}`}
						>
							<Code2 className="w-4 h-4" />
							Query Builder
						</button>
					</div>

					<div className="h-8 w-px bg-dark-border"></div>

					{/* Tools Group */}
					<div className="flex items-center gap-2">
						<div className="text-xs text-gray-500 font-semibold uppercase">Tools</div>
						<div className="flex gap-2">
							<button
								onClick={() => setStep(6)}
								className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${step === 6
										? 'bg-blue-600 text-white'
										: 'bg-dark-bg text-gray-400 hover:bg-dark-hover'
									}`}
							>
								<Play className="w-4 h-4" />
								API Tester
							</button>
							<button
								onClick={() => setStep(9)}
								className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${step === 9
										? 'bg-blue-600 text-white'
										: 'bg-dark-bg text-gray-400 hover:bg-dark-hover'
									}`}
							>
								<Zap className="w-4 h-4" />
								Swagger
							</button>
							<button
								onClick={() => setStep(8)}
								className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${step === 8
										? 'bg-blue-600 text-white'
										: 'bg-dark-bg text-gray-400 hover:bg-dark-hover'
									}`}
							>
								<Book className="w-4 h-4" />
								API Docs
							</button>
							<button
								onClick={() => setStep(10)}
								className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${step === 10
										? 'bg-blue-600 text-white'
										: 'bg-dark-bg text-gray-400 hover:bg-dark-hover'
									}`}
							>
								<FileCode className="w-4 h-4" />
								GraphQL
							</button>
						</div>
					</div>
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
						onSchemaFetched={setSchema}
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
						onNext={() => setStep(5)}
					/>
				)}
				{step === 5 && (
					<CSharpGenerator
						schema={schema}
						query={sqlQuery}
						onBack={() => setStep(2)}
					/>
				)}
				{step === 6 && (
					<APITester
						onBack={() => setStep(1)}
					/>
				)}
				{step === 7 && (
					<SchemaVisualizer
						schema={schema}
						onBack={() => setStep(1)}
					/>
				)}
				{step === 8 && (
					<APIDocumentation
						onBack={() => setStep(2)}
					/>
				)}
				{step === 9 && (
					<SwaggerTester
						onBack={() => setStep(1)}
					/>
				)}
				{step === 10 && (
					<GraphQLGenerator
						onBack={() => setStep(1)}
						dbConfig={dbConfig}
						schema={schema}
					/>
				)}
			</main>
		</div>
	)
}
