#!/bin/bash

# 快速修复TypeScript错误的脚本

echo "修复TypeScript错误..."

# 修复TransactionController中的错误
sed -i '' 's/error instanceof Error ? error.message : '\''数据格式错误'\''/error instanceof Error ? error.message : String(error) || '\''数据格式错误'\''/g' backend/src/controllers/TransactionController.ts

# 修复req.file可能为undefined的错误
sed -i '' 's/req\.file\.buffer/req.file!.buffer/g' backend/src/controllers/TransactionController.ts

echo "TypeScript错误修复完成"