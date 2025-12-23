# 🚀 Welcome to SQL to API Builder!

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**Transform complex SQL queries into production-ready API endpoints with custom JSON responses**

[Quick Start](#-quick-start) • [Features](#-features) • [Documentation](#-documentation) • [Examples](#-examples)

</div>

---

## ✨ What Is This?

SQL to API Builder is a **revolutionary web application** that bridges the gap between database queries and API development. In just 4 simple steps, you can:

1. 🔌 **Connect** to your database (PostgreSQL, MySQL, SQL Server)
2. 🔨 **Build** SQL queries visually with advanced join operations
3. 🎨 **Transform** flat SQL results into custom nested JSON structures
4. 🚀 **Generate** production-ready Next.js API code

### 💡 The Innovation

Unlike traditional query builders, this app includes a **Custom Response Mapper** that lets you:

- ✅ Map SQL columns to **nested JSON structures**
- ✅ Apply **type conversions** (string, number, boolean, date, array, object)
- ✅ Preview transformations **in real-time**
- ✅ Download **complete API code** ready for deployment

## 🎯 Quick Start

### Prerequisites
- Node.js 18+
- A database (PostgreSQL, MySQL, or SQL Server)

### Installation (2 minutes)

```bash
# Clone or download this project
cd BaaS

# Run setup script
# Windows:
setup.bat

# Mac/Linux:
chmod +x setup.sh
./setup.sh

# Start development server
npm run dev

# Open browser
# http://localhost:3000
```

### First API (3 minutes)

1. **Upload your database config** or enter manually
2. **Select tables and columns** from the visual schema
3. **Auto-generate JSON mapping** or customize it
4. **Download your API code** and deploy!

📖 **Detailed Guide**: [QUICKSTART.md](./QUICKSTART.md)

## 🌟 Features

### 🔌 Database Support
- **PostgreSQL**: Full support with schema introspection
- **MySQL**: Complete compatibility
- **SQL Server**: Enterprise-ready

### 🛠️ Visual SQL Builder
- Drag-and-drop table selection
- Interactive column chooser
- **7 Join Types** (based on Set Theory):
  - Inner Join (A ∩ B)
  - Left Join (A ∪ (A ∩ B))
  - Right Join (B ∪ (A ∩ B))
  - Full Outer Join (A ∪ B)
  - Left Join (NULL) - Left difference
  - Right Join (NULL) - Right difference
  - Full Outer (NULL) - Symmetric difference
- Real-time SQL preview with syntax highlighting
- Built-in validation and error checking

### 🎨 Response Mapper (⭐ Core Innovation)
- **Custom JSON Structure**: Transform flat SQL to nested JSON
- **Dot Notation**: `user.contact.email` creates `{ user: { contact: { email: ... } } }`
- **Type Conversion**: Automatic or manual type casting
- **Live Preview**: See raw SQL vs transformed JSON side-by-side
- **Auto-Generate**: Intelligent mapping with type inference

### 🚀 API Code Generator
- Generates complete Next.js API routes
- Includes database connection logic
- Includes transformation functions
- Environment variable configuration
- One-click download (.ts + .env files)

### 🎨 Modern UI/UX
- Dark mode optimized
- "Noto Sans Thai Looped" font
- Responsive design (all resolutions)
- Step-by-step workflow
- Real-time feedback

## 📚 Documentation

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **[INDEX.md](./INDEX.md)** | Complete documentation index | 5 min |
| **[QUICKSTART.md](./QUICKSTART.md)** | Get started in 5 minutes | 10 min |
| **[README.md](./README.md)** | Full feature guide (you are here) | 25 min |
| **[ADVANCED.md](./ADVANCED.md)** | Deep dive into features | 40 min |
| **[FILE_STRUCTURE.md](./FILE_STRUCTURE.md)** | Project organization | 15 min |
| **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** | Executive summary | 30 min |
| **[EXAMPLES.md](./EXAMPLES.md)** | Database configurations | 5 min |

## 🔧 Technology Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18** (TypeScript)
- **Tailwind CSS** (Dark theme)
- **Monaco Editor** (Code editing)
- **Lucide React** (Icons)

### Backend
- **Next.js API Routes**
- **pg** (PostgreSQL)
- **mysql2** (MySQL)
- **mssql** (SQL Server)

## 📖 Examples

### Example 1: Simple User API

**SQL Query**:
```sql
SELECT id, name, email FROM users
```

**Mapping**:
```
users.id → userId
users.name → userName  
users.email → userEmail
```

**Generated API Response**:
```json
{
  "success": true,
  "data": [
    { "userId": 1, "userName": "John", "userEmail": "john@example.com" }
  ],
  "count": 1
}
```

### Example 2: Nested JSON from Join

**SQL Query**:
```sql
SELECT 
  users.id, users.name,
  orders.order_id, orders.total
FROM users
LEFT JOIN orders ON users.id = orders.user_id
```

**Mapping**:
```
users.id → customer.id
users.name → customer.name
orders.order_id → order.id
orders.total → order.total
```

**Generated API Response**:
```json
{
  "success": true,
  "data": [
    {
      "customer": { "id": 1, "name": "John" },
      "order": { "id": 101, "total": 99.99 }
    }
  ],
  "count": 1
}
```

📖 **More Examples**: [ADVANCED.md](./ADVANCED.md)

## 🎓 Use Cases

### 1. **E-commerce Analytics**
Build APIs for dashboards showing sales, customer stats, and inventory.

### 2. **User Management**
Create user profile APIs with nested data (address, preferences, orders).

### 3. **Reporting Systems**
Generate complex reports with multiple table joins and aggregations.

### 4. **Data Integration**
Transform legacy database structures into modern REST APIs.

### 5. **Prototyping**
Rapidly create API endpoints for testing and prototyping.

## 🚀 Deployment

### Step 1: Generate API Code
1. Complete the 4-step workflow in the application
2. Download `route.ts` and `.env.local`

### Step 2: Integrate with Your Project
```bash
# Copy generated files
mkdir -p app/api/v1/users
cp ~/Downloads/route.ts app/api/v1/users/
cp ~/Downloads/.env.local .

# Install database driver
npm install pg  # or mysql2, or mssql
```

### Step 3: Deploy
```bash
# Local test
npm run dev

# Production build
npm run build
npm start

# Deploy to Vercel (recommended)
vercel deploy
```

📖 **Deployment Guide**: [README.md - Deployment](./README.md#-deployment)

## 🔒 Security

### ✅ Implemented
- Environment variables for credentials
- Client-side config (no server storage)
- Sanitized error messages
- TypeScript type safety

### 📝 Recommended
- Add authentication (JWT/OAuth)
- Implement rate limiting
- Use HTTPS in production
- Regular credential rotation

📖 **Security Guide**: [PROJECT_SUMMARY.md - Security](./PROJECT_SUMMARY.md#-security-features)

## 🤝 Contributing

This is a complete, production-ready application. To extend:

1. **Read the documentation** (especially FILE_STRUCTURE.md)
2. **Study the components** (components/)
3. **Add features** (see PROJECT_SUMMARY.md for ideas)
4. **Test thoroughly**
5. **Document your changes**

### Suggested Enhancements
- GraphQL support
- Query history/favorites
- Additional database support (SQLite, MongoDB)
- Real-time collaboration
- AI-powered query suggestions

## 📊 Project Stats

- **Total Files**: 20+ source files
- **Lines of Code**: ~4,250
- **Components**: 4 main components
- **API Routes**: 4 endpoints
- **Documentation**: 6 comprehensive guides
- **Supported Databases**: 3 (PostgreSQL, MySQL, SQL Server)
- **Join Types**: 7 (all set theory operations)

## 📄 License

**MIT License** - Free for commercial and personal use

Copyright (c) 2025 SQL to API Builder

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.

## 🙏 Acknowledgments

Built with modern web technologies:
- Next.js team for the amazing framework
- Vercel for deployment platform
- Microsoft for Monaco Editor
- Tailwind CSS team for the styling framework
- Database driver maintainers (pg, mysql2, mssql)

## 📞 Support

### Documentation
- **Start Here**: [INDEX.md](./INDEX.md) - Complete documentation index
- **Quick Help**: [QUICKSTART.md](./QUICKSTART.md) - Common issues
- **Deep Dive**: [ADVANCED.md](./ADVANCED.md) - Troubleshooting section

### Resources
- Project structure: [FILE_STRUCTURE.md](./FILE_STRUCTURE.md)
- Architecture: [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
- Examples: [EXAMPLES.md](./EXAMPLES.md)

---

<div align="center">

## 🎉 Ready to Build Amazing APIs?

**[Get Started Now](./QUICKSTART.md)** • **[View Full Docs](./INDEX.md)** • **[See Examples](./EXAMPLES.md)**

Built with ❤️ using Next.js, TypeScript, and modern web technologies

**Version 1.0.0** | December 23, 2025

</div>
