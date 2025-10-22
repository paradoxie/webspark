#!/bin/bash

echo "Fixing remaining return statement errors..."

# Fix all remaining return res.status().json() patterns
find src/ -name "*.ts" -type f -exec sed -i '' -E 's/return res\.status\(([^)]*)\)\.json\(([^;]*)\);/res.status(\1).json(\2); return;/g' {} \;

echo "Fixing multi-line return statement patterns..."

# Handle multi-line patterns - this is more complex but let's try
find src/ -name "*.ts" -type f -exec sed -i '' -E 's/return res\.status\(([^)]*)\)\.json\(/res.status(\1).json(/g' {} \;

echo "Completed return statement fixes."