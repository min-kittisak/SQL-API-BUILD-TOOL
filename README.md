# SQL to API Builder 🚀

**Transform Database Queries into Production-Ready APIs**

A powerful visual tool that lets you build REST APIs from SQL queries by **executing real queries first**, then designing custom JSON response structures based on actual data.

## 🎯 Core Workflow: "See Data First, Design API Second"

### The Problem This Solves
Traditional SQL-to-API tools only generate SQL and show you code. You don't know how your data actually looks until deployment. This tool flips the script:

1. **Connect** to your database
2. **Build & Execute** SQL queries → **See real results immediately** (10 rows preview)
3. **Design** JSON structure based on **actual data** you just saw (5 rows for mapping)
4. **Generate** production-ready Next.js API code

**Result**: No surprises. What you see is exactly what your API will return.

## ✨ Key Features

### 1. **Database Connection**
- Support for **PostgreSQL, MySQL, and SQL Server**
- Save/load connection configs as JSON
- Live connection testing and schema fetching
- Secure client-side configuration (no server-side credential storage)

### 2. **Query Builder with Live Execution** ⚡
- **Visual table selection** from database schema sidebar
- **7 Join Types** based on Set Theory:
  - **Inner Join** (A ∩ B): Only matching rows
  - **Left Join**: All from left + matching from right
  - **Right Join**: All from right + matching from left
  - **Full Join** (A ∪ B): All rows from both tables
  - **Left Null** (A - B): Left rows with no match in right
  - **Right Null** (B - A): Right rows with no match in left
  - **Full Null** (A ⊕ B): Rows with no match in either table
- **Column selection** per table
- **Execute & Preview** button → Runs query and shows **real data** (10 rows sample)
- **Split view**: SQL query (left) | Query results (right)
- Must successfully execute before proceeding to next step

### 3. **JSON Response Designer** ⭐ (The Innovation)
- Works with **real query results** (5 rows for preview)
- **Visual mapping rules**: SQL columns → Custom JSON paths
- **Nested structures**: Use dot notation (e.g., `user.profile.email`)
- **6 data types**: string, number, boolean, date, object, array
- **Auto-generate** with intelligent type inference
- **Live preview**: Raw SQL results vs. transformed JSON side-by-side

### 4. **API Code Generator**
- Generate **complete Next.js 14 API route** (`route.ts`)
- Database connection code for your specific DB type
- Built-in transformation logic from your mappings
- Copy or download ready-to-deploy files
- Generates `.env.local` template

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS (Dark Mode)
- **Code Editor**: Monaco Editor
- **Icons**: Lucide React
- **Database Drivers**: 
  - PostgreSQL: `pg`
  - MySQL: `mysql2`
  - SQL Server: `mssql`
- **Font**: Google Fonts "Noto Sans Thai Looped"

## 📦 Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   ```
   http://localhost:3000
   ```

## 🎮 Usage Guide

### Step 1: Database Connection

1. **Upload Config** or **Manual Input**
   - Create a JSON config file (see example below)
   - Upload it or manually enter credentials

   Example config (`db-config.json`):
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

2. **Test Connection**
   - Click "Test Connection"
   - System will fetch and display database schema

### Step 2: Build SQL Query

1. **Select Tables**
   - Browse schema in left sidebar
   - Click "Add" to select tables

2. **Select Columns**
   - Check columns you want to include
   - Or select all with `*`

3. **Configure Joins**
   - Click "Add Join"
   - Choose join type from 7 available options
   - Select columns to join on

4. **Validate Query**
   - Click "Validate SQL"
   - System runs EXPLAIN to catch errors

### Step 3: Map Response Structure

1. **Auto-Generate Mapping** (Recommended for first-time)
   - Click "Auto-Generate Mapping"
   - System creates intelligent mappings with type inference

2. **Manual Mapping**
   - Click "Add Mapping Rule"
   - Select SQL column
   - Define JSON path (use dots for nesting: `user.contact.email`)
   - Choose data type

3. **Preview Results**
   - Left panel: Configuration
   - Right panel: Live preview (Raw SQL vs Transformed JSON)

### Step 4: Generate API

1. **Configure API**
   - Set HTTP method (GET/POST)
   - Define endpoint path (e.g., `/api/v1/users`)

2. **Download Code**
   - Click "Download route.ts"
   - Click "Download .env.local"

3. **Deploy**
   - Place `route.ts` in your Next.js app
   - Add `.env.local` to project root
   - Install dependencies
   - Start server!

## 🔧 Advanced Features

### Custom JSON Mapping Examples

**Flat to Nested**:
```typescript
// SQL Columns: user_id, user_name, user_email, city, zip
// Mapping:
user_id → id
user_name → name
user_email → contact.email
city → contact.address.city
zip → contact.address.zip

// Result:
{
  "id": 1,
  "name": "John Doe",
  "contact": {
    "email": "john@example.com",
    "address": {
      "city": "New York",
      "zip": "10001"
    }
  }
}
```

**Type Conversions**:
- `created_at` (string) → Date (ISO string)
- `is_active` (int) → Boolean
- `age` (string) → Number

### Join Type Examples

**Left Join (NULL)**: Find users without orders
```sql
SELECT users.*, orders.id as order_id
FROM users
LEFT JOIN orders ON users.id = orders.user_id
WHERE orders.id IS NULL
```

**Full Outer (NULL)**: Find mismatches in both tables
```sql
SELECT *
FROM table_a
FULL OUTER JOIN table_b ON table_a.id = table_b.id
WHERE table_a.id IS NULL OR table_b.id IS NULL
```

## 📁 Project Structure

```
BaaS/
├── app/
│   ├── api/
│   │   └── database/
│   │       ├── test/route.ts         # Connection testing
│   │       ├── schema/route.ts       # Schema fetching
│   │       ├── validate/route.ts     # SQL validation
│   │       └── execute/route.ts      # Query execution
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                      # Main dashboard
├── components/
│   ├── DatabaseConnection.tsx        # Step 1: DB connection
│   ├── QueryBuilder.tsx              # Step 2: SQL builder
│   ├── ResponseMapper.tsx            # Step 3: JSON mapper ⭐
│   └── APIGenerator.tsx              # Step 4: Code generator
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 🎨 UI/UX Features

- **Dark Mode**: Optimized for extended coding sessions
- **Responsive**: Works on all screen resolutions (optimized for 16:9)
- **Typography**: Clean "Noto Sans Thai Looped" font throughout
- **Color Coding**: Different colors for each step (Blue → Purple → Green)
- **Live Feedback**: Real-time validation and previews

## 🔒 Security Notes

- **Client-side Only**: Database credentials never stored on server
- **Environment Variables**: Generated code uses env vars, not hardcoded credentials
- **Download Config**: Save/load configs locally via JSON files

## 🚀 Deployment

### Generate API Endpoint

1. Complete all 4 steps in the builder
2. Download `route.ts` and `.env.local`
3. In your Next.js project:
   ```bash
   mkdir -p app/api/v1/users
   # Move route.ts to app/api/v1/users/route.ts
   # Move .env.local to project root
   ```

4. Install database driver:
   ```bash
   npm install pg @types/pg       # PostgreSQL
   npm install mysql2             # MySQL
   npm install mssql              # SQL Server
   ```

5. Test:
   ```bash
   npm run dev
   curl http://localhost:3000/api/v1/users
   ```

## 🤝 Contributing

This is a production-ready application. Feel free to extend with:
- Additional database support (SQLite, MongoDB)
- Query builder features (GROUP BY, HAVING)
- Authentication layers
- Rate limiting
- Caching strategies

## 📄 License

MIT License - Free to use for commercial and personal projects

## 🙏 Credits

Built with modern web technologies and best practices for enterprise-grade API development.

---

**Happy Building! 🎉**
