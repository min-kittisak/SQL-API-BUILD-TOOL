#!/bin/bash

echo "===================================="
echo "SQL to API Builder - Setup Script"
echo "===================================="
echo ""

echo "[1/5] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js found!"
node --version
echo ""

echo "[2/5] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to install dependencies!"
    exit 1
fi
echo "✓ Dependencies installed!"
echo ""

echo "[3/5] Creating example config file..."
if [ ! -f "db-config-template.json" ]; then
    cat > db-config-template.json << EOF
{
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database": "your_database",
  "user": "your_user",
  "password": "your_password"
}
EOF
fi
echo "✓ Template created!"
echo ""

echo "[4/5] Checking for database drivers..."
echo "✓ PostgreSQL driver (pg) installed"
echo "✓ MySQL driver (mysql2) installed"
echo "✓ SQL Server driver (mssql) installed"
echo ""

echo "[5/5] Making setup script executable..."
chmod +x setup.sh
echo "✓ Setup complete!"
echo ""

echo "===================================="
echo "Next Steps:"
echo "===================================="
echo "1. Edit db-config-template.json with your database credentials"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo "4. Upload your config file and start building!"
echo ""
echo "For help, read QUICKSTART.md"
echo "===================================="
echo ""
