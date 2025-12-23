import { NextRequest, NextResponse } from 'next/server'
import { Client as PgClient } from 'pg'
import mysql from 'mysql2/promise'
import sql from 'mssql'

function buildSQL(query: any, limit?: number): string {
  let sqlString = 'SELECT '
  sqlString += query.columns.length > 0 ? query.columns.join(', ') : '*'
  sqlString += `\nFROM ${query.tables[0]}`

  for (const join of query.joins || []) {
    let joinSQL = '\n'

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
        joinSQL += `LEFT JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}\nWHERE ${join.rightTable}.${join.rightColumn} IS NULL`
        break
      case 'RIGHT_NULL':
        joinSQL += `RIGHT JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}\nWHERE ${join.leftTable}.${join.leftColumn} IS NULL`
        break
      case 'FULL_NULL':
        joinSQL += `FULL OUTER JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}\nWHERE ${join.leftTable}.${join.leftColumn} IS NULL OR ${join.rightTable}.${join.rightColumn} IS NULL`
        break
    }

    sqlString += joinSQL
  }

  if (query.where) {
    sqlString += `\nWHERE ${query.where}`
  }

  if (query.orderBy) {
    sqlString += `\nORDER BY ${query.orderBy}`
  }

  const finalLimit = limit || query.limit
  if (finalLimit) {
    sqlString += `\nLIMIT ${finalLimit}`
  }

  return sqlString
}

export async function POST(request: NextRequest) {
  try {
    const { config, query, limit } = await request.json()
    const { type, host, port, database, user, password } = config

    const sqlQuery = buildSQL(query, limit)
    let data: any[] = []

    if (type === 'postgresql') {
      const client = new PgClient({ host, port, database, user, password })
      await client.connect()
      const result = await client.query(sqlQuery)
      data = result.rows
      await client.end()
    } else if (type === 'mysql') {
      const connection = await mysql.createConnection({ host, port, database, user, password })
      const [rows] = await connection.query(sqlQuery)
      data = rows as any[]
      await connection.end()
    } else if (type === 'mssql') {
      await sql.connect({
        server: host,
        port,
        database,
        user,
        password,
        options: { encrypt: false, trustServerCertificate: true },
      })
      const result = await sql.query(sqlQuery)
      data = result.recordset
      await sql.close()
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
