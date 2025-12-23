# 🚀 Quick Start Guide

Get up and running with SQL to API Builder in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A database (PostgreSQL, MySQL, or SQL Server)
- Basic knowledge of SQL

## Installation

### Step 1: Install Dependencies

```bash
npm install
```

This will install:
- Next.js 14
- React 18
- Tailwind CSS
- Monaco Editor
- Database drivers (pg, mysql2, mssql)
- Lucide React icons

### Step 2: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First API in 5 Minutes

### 1. Connect to Database (1 min)

Create `db-config.json`:
```json
{
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database": "mydb",
  "user": "postgres",
  "password": "password"
}
```

- Click "Upload Config JSON"
- Select your file
- Click "Test Connection"
- ✅ Connection successful!

### 2. Build Query (2 min)

- **Select Tables**: Click "Add" next to `users` table
- **Select Columns**: Check `id`, `name`, `email`
- **Click "Validate SQL"**
- ✅ Query validated!

### 3. Map Response (1 min)

- **Click "Auto-Generate Mapping"**
- **Preview**: See transformed JSON on the right
- ✅ Mapping created!

### 4. Generate API (1 min)

- **Set path**: `/api/v1/users`
- **Click "Download route.ts"**
- **Click "Download .env.local"**
- ✅ Files downloaded!

### 5. Deploy & Test

```bash
# Create API directory
mkdir -p app/api/v1/users

# Move downloaded file
mv ~/Downloads/route.ts app/api/v1/users/route.ts

# Move env file
mv ~/Downloads/.env.local .

# Test your API!
curl http://localhost:3000/api/v1/users
```

## Expected Output

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  ],
  "count": 2
}
```

## Common First-Time Issues

### ❌ "Connection failed"
**Fix**: Check your database is running
```bash
# PostgreSQL
sudo service postgresql status

# MySQL
sudo service mysql status
```

### ❌ "Port already in use"
**Fix**: Change Next.js port
```bash
npm run dev -- -p 3001
```

### ❌ "Module not found"
**Fix**: Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Try Advanced Joins**
   - Add another table
   - Create a LEFT JOIN
   - Test with "Validate SQL"

2. **Custom JSON Structure**
   - Edit mapping rules manually
   - Create nested objects
   - Test with live preview

3. **Deploy to Production**
   - Push to GitHub
   - Deploy to Vercel
   - Add rate limiting

## Video Tutorial (Conceptual)

1. 0:00 - Introduction
2. 0:30 - Database connection
3. 1:30 - Visual query builder
4. 2:30 - Response mapper
5. 3:30 - Code generation
6. 4:30 - Testing the API

## Helpful Resources

- [Full Documentation](./README.md)
- [Advanced Guide](./ADVANCED.md)
- [Example Configs](./EXAMPLES.md)

## Need Help?

- Check the [Troubleshooting Guide](./ADVANCED.md#6-troubleshooting-guide)
- Review [Common Use Cases](./ADVANCED.md#5-common-use-cases)
- Verify database permissions

---

**You're all set! 🎉**

Start building powerful APIs from your SQL queries!
