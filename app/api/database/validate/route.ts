import { NextRequest, NextResponse } from 'next/server'
import { Client as PgClient } from 'pg'
import mysql from 'mysql2/promise'
import sql from 'mssql'

export async function POST(request: NextRequest) {
  try {
    const { config, sql: querySQL } = await request.json()
    const { type, host, port, database, user, password } = config

    if (type === 'postgresql') {
      const client = new PgClient({ host, port, database, user, password })
      await client.connect()
      await client.query(`EXPLAIN ${querySQL}`)
      await client.end()
    } else if (type === 'mysql') {
      const connection = await mysql.createConnection({ host, port, database, user, password })
      await connection.query(`EXPLAIN ${querySQL}`)
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
      await sql.query(`SET SHOWPLAN_TEXT ON; GO; ${querySQL}; GO; SET SHOWPLAN_TEXT OFF;`)
      await sql.close()
    }

    return NextResponse.json({ success: true, message: 'Query is valid' })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message })
  }
}
