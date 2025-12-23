# SQL to API Builder - Advanced Usage Guide

## 🎓 Advanced Features Deep Dive

### 1. The 7 Join Types Explained

This application implements all 7 fundamental join operations based on Set Theory:

#### Join Type Matrix

| Join Type | Set Theory | SQL Clause | NULL Filter | Use Case |
|-----------|------------|------------|-------------|----------|
| **INNER** | A ∩ B | INNER JOIN | No | Matching records only |
| **LEFT** | A ∪ (A ∩ B) | LEFT JOIN | No | All left + matching right |
| **RIGHT** | B ∪ (A ∩ B) | RIGHT JOIN | No | All right + matching left |
| **FULL** | A ∪ B | FULL OUTER JOIN | No | All records from both |
| **LEFT_NULL** | A - B | LEFT JOIN | WHERE right IS NULL | Left without matches |
| **RIGHT_NULL** | B - A | RIGHT JOIN | WHERE left IS NULL | Right without matches |
| **FULL_NULL** | A △ B | FULL OUTER JOIN | WHERE left IS NULL OR right IS NULL | Non-matching records |

#### Real-World Examples

**Scenario**: E-commerce database with `customers` and `orders` tables

```sql
-- INNER JOIN: Customers who have placed orders
SELECT customers.*, orders.*
FROM customers
INNER JOIN orders ON customers.id = orders.customer_id

-- LEFT JOIN: All customers (including those without orders)
SELECT customers.*, orders.*
FROM customers
LEFT JOIN orders ON customers.id = orders.customer_id

-- LEFT JOIN (NULL): Customers who have NEVER ordered
SELECT customers.*
FROM customers
LEFT JOIN orders ON customers.id = orders.customer_id
WHERE orders.id IS NULL

-- FULL OUTER (NULL): Data integrity check - find mismatches
SELECT *
FROM customers
FULL OUTER JOIN orders ON customers.id = orders.customer_id
WHERE customers.id IS NULL OR orders.id IS NULL
```

### 2. Response Mapper - Advanced Patterns

#### Pattern 1: Flat to Nested Transformation

**SQL Columns**:
```
users.id, users.name, users.email, users.city, users.state, users.zip
```

**Mapping Rules**:
```typescript
[
  { sqlColumn: 'users.id', jsonPath: 'userId', type: 'number' },
  { sqlColumn: 'users.name', jsonPath: 'personalInfo.name', type: 'string' },
  { sqlColumn: 'users.email', jsonPath: 'personalInfo.contact.email', type: 'string' },
  { sqlColumn: 'users.city', jsonPath: 'personalInfo.address.city', type: 'string' },
  { sqlColumn: 'users.state', jsonPath: 'personalInfo.address.state', type: 'string' },
  { sqlColumn: 'users.zip', jsonPath: 'personalInfo.address.zip', type: 'string' }
]
```

**Result**:
```json
{
  "userId": 1,
  "personalInfo": {
    "name": "John Doe",
    "contact": {
      "email": "john@example.com"
    },
    "address": {
      "city": "New York",
      "state": "NY",
      "zip": "10001"
    }
  }
}
```

#### Pattern 2: Join Results with Multiple Tables

**SQL Query** (3-table join):
```sql
SELECT 
  users.id,
  users.name,
  orders.order_id,
  orders.total,
  products.product_name,
  products.price
FROM users
LEFT JOIN orders ON users.id = orders.user_id
LEFT JOIN products ON orders.product_id = products.id
```

**Mapping Rules**:
```typescript
[
  { sqlColumn: 'users.id', jsonPath: 'customer.id', type: 'number' },
  { sqlColumn: 'users.name', jsonPath: 'customer.name', type: 'string' },
  { sqlColumn: 'orders.order_id', jsonPath: 'order.id', type: 'number' },
  { sqlColumn: 'orders.total', jsonPath: 'order.total', type: 'number' },
  { sqlColumn: 'products.product_name', jsonPath: 'order.product.name', type: 'string' },
  { sqlColumn: 'products.price', jsonPath: 'order.product.price', type: 'number' }
]
```

**Result**:
```json
{
  "customer": {
    "id": 1,
    "name": "John Doe"
  },
  "order": {
    "id": 12345,
    "total": 99.99,
    "product": {
      "name": "Widget",
      "price": 99.99
    }
  }
}
```

#### Pattern 3: Type Conversion Examples

```typescript
// Date Conversion
{ sqlColumn: 'created_at', jsonPath: 'metadata.createdAt', type: 'date' }
// Input: "2024-01-15 10:30:00"
// Output: "2024-01-15T10:30:00.000Z"

// Boolean Conversion
{ sqlColumn: 'is_active', jsonPath: 'status.active', type: 'boolean' }
// Input: 1 or "true"
// Output: true

// Number Conversion
{ sqlColumn: 'price', jsonPath: 'pricing.amount', type: 'number' }
// Input: "99.99"
// Output: 99.99
```

### 3. Generated API Code - What You Get

The API Generator creates a complete, production-ready Next.js API route:

```typescript
// ✅ Database connection (uses env vars)
// ✅ SQL query execution
// ✅ Data transformation logic
// ✅ Error handling
// ✅ JSON response formatting

// Example response structure:
{
  "success": true,
  "data": [ /* transformed data */ ],
  "count": 10
}

// Error response:
{
  "success": false,
  "error": "Error message"
}
```

### 4. Performance Optimization Tips

#### SQL Query Optimization
1. **Select only needed columns**
   - ❌ `SELECT *`
   - ✅ `SELECT users.id, users.name, users.email`

2. **Use proper indexes**
   - Index columns used in JOIN conditions
   - Index columns used in WHERE clauses

3. **Limit results**
   - Always set a LIMIT for large datasets
   - Implement pagination in your API

#### API Optimization
1. **Caching**
   ```typescript
   // Add to generated API:
   export const revalidate = 60 // Cache for 60 seconds
   ```

2. **Response Compression**
   ```typescript
   // Next.js handles this automatically
   ```

3. **Database Connection Pooling**
   ```typescript
   // Use connection pools instead of new connections
   const pool = new Pool({ /* config */ })
   ```

### 5. Common Use Cases

#### Use Case 1: User Dashboard API
```sql
SELECT 
  users.id,
  users.name,
  COUNT(orders.id) as total_orders,
  SUM(orders.total) as total_spent,
  MAX(orders.created_at) as last_order_date
FROM users
LEFT JOIN orders ON users.id = orders.user_id
GROUP BY users.id, users.name
```

**Mapping**:
- `users.id` → `userId`
- `users.name` → `userName`
- `total_orders` → `stats.orderCount`
- `total_spent` → `stats.totalSpent`
- `last_order_date` → `stats.lastOrderDate`

#### Use Case 2: Product Inventory API
```sql
SELECT 
  products.id,
  products.name,
  products.price,
  categories.name as category,
  inventory.quantity,
  suppliers.name as supplier
FROM products
INNER JOIN categories ON products.category_id = categories.id
LEFT JOIN inventory ON products.id = inventory.product_id
LEFT JOIN suppliers ON products.supplier_id = suppliers.id
```

#### Use Case 3: Analytics Dashboard
```sql
SELECT 
  DATE(orders.created_at) as date,
  COUNT(*) as order_count,
  SUM(orders.total) as revenue,
  AVG(orders.total) as avg_order_value
FROM orders
WHERE orders.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(orders.created_at)
ORDER BY date DESC
```

### 6. Troubleshooting Guide

#### Problem: "Connection failed"
**Solutions**:
- Check database is running
- Verify host/port/credentials
- Check firewall rules
- Test with database client (pgAdmin, MySQL Workbench)

#### Problem: "Validation failed"
**Solutions**:
- Check for typos in table/column names
- Verify JOIN conditions reference correct columns
- Ensure WHERE clause syntax is correct
- Use EXPLAIN to see execution plan

#### Problem: "Transformed data is null"
**Solutions**:
- Check SQL column names match mapping rules
- Verify table aliases are correct
- Test with raw SQL first
- Check case sensitivity

### 7. Best Practices

#### Security
1. **Never expose credentials**
   - Use environment variables
   - Don't commit .env files

2. **Input validation**
   - Sanitize user inputs if using dynamic queries
   - Use parameterized queries

3. **Rate limiting**
   ```typescript
   // Add rate limiting middleware
   import rateLimit from 'express-rate-limit'
   ```

#### Code Organization
1. **Separate concerns**
   - Database logic in separate files
   - Transformation logic in utilities
   - Validation in middleware

2. **Reusable components**
   - Create shared transformation functions
   - Extract common database operations

#### Documentation
1. **Document your APIs**
   ```typescript
   /**
    * GET /api/v1/users
    * Returns list of users with order statistics
    * 
    * Query Parameters:
    * - limit: number (default: 100)
    * - offset: number (default: 0)
    */
   ```

2. **Version your APIs**
   - Use `/api/v1/`, `/api/v2/` etc.
   - Maintain backward compatibility

---

## 🎯 Next Steps

1. **Extend functionality**
   - Add GROUP BY support
   - Implement pagination
   - Add authentication

2. **Deploy to production**
   - Use Vercel/Netlify
   - Set up proper environment variables
   - Enable monitoring

3. **Scale**
   - Implement caching (Redis)
   - Add load balancing
   - Set up read replicas

Happy building! 🚀
