import { NextRequest, NextResponse } from 'next/server'
import { Client as PgClient } from 'pg'
import mysql from 'mysql2/promise'
import sql from 'mssql'

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()
    const { type, host, port, database, user, password } = config
    let schema: any[] = []

    if (type === 'postgresql') {
      const client = new PgClient({ host, port, database, user, password })
      await client.connect()

      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `)

      for (const table of tablesResult.rows) {
        const columnsResult = await client.query(
          `
          SELECT 
            c.column_name,
            c.data_type,
            c.is_nullable,
            CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
            CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END as is_foreign_key,
            fk.foreign_table_name,
            fk.foreign_column_name
          FROM information_schema.columns c
          LEFT JOIN (
            SELECT ku.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage ku
              ON tc.constraint_name = ku.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_name = $1
          ) pk ON c.column_name = pk.column_name
          LEFT JOIN (
            SELECT
              kcu.column_name,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name = $1
          ) fk ON c.column_name = fk.column_name
          WHERE c.table_name = $1
        `,
          [table.table_name]
        )

        schema.push({
          name: table.table_name,
          columns: columnsResult.rows.map((col: any) => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            isPrimaryKey: col.is_primary_key,
            isForeignKey: col.is_foreign_key,
            references: col.is_foreign_key
              ? { table: col.foreign_table_name, column: col.foreign_column_name }
              : undefined,
          })),
        })
      }

      await client.end()
    } else if (type === 'mysql') {
      const connection = await mysql.createConnection({ host, port, database, user, password })

      const [tables] = await connection.query<any[]>('SHOW TABLES')
      const tableKey = Object.keys(tables[0])[0]

      for (const table of tables) {
        const tableName = table[tableKey]
        const [columns] = await connection.query<any[]>(`DESCRIBE ${tableName}`)

        schema.push({
          name: tableName,
          columns: columns.map((col: any) => ({
            name: col.Field,
            type: col.Type,
            nullable: col.Null === 'YES',
            isPrimaryKey: col.Key === 'PRI',
            isForeignKey: col.Key === 'MUL',
          })),
        })
      }

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

      const result = await sql.query(`
        SELECT 
          t.name as table_name,
          c.name as column_name,
          ty.name as data_type,
          c.is_nullable,
          CASE WHEN pk.column_name IS NOT NULL THEN 1 ELSE 0 END as is_primary_key,
          CASE WHEN fk.parent_column_id IS NOT NULL THEN 1 ELSE 0 END as is_foreign_key
        FROM sys.tables t
        JOIN sys.columns c ON t.object_id = c.object_id
        JOIN sys.types ty ON c.user_type_id = ty.user_type_id
        LEFT JOIN (
          SELECT ic.object_id, ic.column_id, c.name as column_name
          FROM sys.indexes i
          JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
          JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
          WHERE i.is_primary_key = 1
        ) pk ON t.object_id = pk.object_id AND c.column_id = pk.column_id
        LEFT JOIN sys.foreign_key_columns fk ON t.object_id = fk.parent_object_id AND c.column_id = fk.parent_column_id
        ORDER BY t.name, c.column_id
      `)

      const tableMap = new Map()
      for (const row of result.recordset) {
        if (!tableMap.has(row.table_name)) {
          tableMap.set(row.table_name, { name: row.table_name, columns: [] })
        }
        tableMap.get(row.table_name).columns.push({
          name: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable,
          isPrimaryKey: row.is_primary_key === 1,
          isForeignKey: row.is_foreign_key === 1,
        })
      }

      schema = Array.from(tableMap.values())
      await sql.close()
    }

    return NextResponse.json({ success: true, schema })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
