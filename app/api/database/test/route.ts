import { NextRequest, NextResponse } from 'next/server'
import { Client as PgClient } from 'pg'
import mysql from 'mysql2/promise'
import sql, { pool } from 'mssql'

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()
    const { type, host, port, database, user, password } = config

    if (type === 'postgresql') {
      const client = new PgClient({
        host,
        port,
        database,
        user,
        password,
      })
      await client.connect()
      await client.query('SELECT 1')
      await client.end()
    } else if (type === 'mysql') {
      const connection = await mysql.createConnection({
        host,
        port,
        database,
        user,
        password,
      })
      await connection.query('SELECT 1')
      await connection.end()
    } else if (type === 'mssql') {
      await sql.connect({
        server: host,
        port,
        database,
        user,
        password,
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      })
      await sql.query('SELECT 1')
      await pool.close()
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
