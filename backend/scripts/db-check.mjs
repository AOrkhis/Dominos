import 'dotenv/config'
import mysql from 'mysql2/promise'

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env

const conn = await mysql.createConnection({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  connectTimeout: 10000,
})

const [tables] = await conn.query('SHOW TABLES')
console.log(`Tables in ${DB_NAME}:`)
for (const t of tables) {
  const name = Object.values(t)[0]
  console.log(`\n== ${name}`)
  const [cols] = await conn.query(`SHOW COLUMNS FROM \`${name}\``)
  for (const c of cols) console.log(`   ${c.Field} ${c.Type}${c.Key ? ` [${c.Key}]` : ''}`)
  const [[{ n }]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${name}\``)
  console.log(`   (${n} rows)`)
}
await conn.end()
