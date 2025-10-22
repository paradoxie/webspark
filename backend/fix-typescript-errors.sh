#!/bin/bash

# Fix TypeScript errors by pattern

echo "Fixing return statement errors..."

# Fix return res.status().json() patterns
find src/ -name "*.ts" -type f -exec sed -i '' 's/return res\.status(\([^)]*\))\.json(\([^)]*\);/res.status(\1).json(\2); return;/g' {} \;

echo "Removing mode: 'insensitive' from Prisma filters..."

# Remove mode: 'insensitive' from Prisma filters
find src/ -name "*.ts" -type f -exec sed -i '' 's/, mode: '\''insensitive'\''//g' {} \;

echo "Fixing Promise<void> return types..."

# Find async functions without Promise<void> return type
find src/ -name "*.ts" -type f -exec sed -i '' 's/async (req: [^,]*, res: Response): Promise<void>/async (req: AuthenticatedRequest, res: Response): Promise<void>/g' {} \;

echo "Completed basic fixes."