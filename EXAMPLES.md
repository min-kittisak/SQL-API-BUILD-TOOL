# Example Database Configurations

## PostgreSQL Example
```json
{
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database": "northwind",
  "user": "postgres",
  "password": "admin123"
}
```

## MySQL Example
```json
{
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "database": "sakila",
  "user": "root",
  "password": "root123"
}
```

## SQL Server Example
```json
{
  "type": "mssql",
  "host": "localhost",
  "port": 1433,
  "database": "AdventureWorks",
  "user": "sa",
  "password": "YourStrong!Pass"
}
```

## Security Best Practices

1. **Never commit this file to version control**
   - Add `db-config.json` to `.gitignore`

2. **Use strong passwords**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols

3. **Limit database permissions**
   - Grant only SELECT permissions for read-only APIs
   - Use separate users for different applications

4. **Use environment variables in production**
   - The generated API code uses `.env.local`
   - Never hardcode credentials

5. **Rotate credentials regularly**
   - Change passwords every 90 days
   - Update configs accordingly
