#!/bin/bash

# 羽球場地管理系統安裝腳本
echo "🏸 歡迎使用羽球場地管理系統安裝腳本"
echo "================================================"

# 檢查Node.js是否已安裝
if ! command -v node &> /dev/null; then
    echo "❌ 錯誤：未找到Node.js"
    echo "請先安裝Node.js (版本14.0或更高)："
    echo "https://nodejs.org/"
    exit 1
fi

# 檢查npm是否已安裝
if ! command -v npm &> /dev/null; then
    echo "❌ 錯誤：未找到npm"
    echo "請確認Node.js安裝正確"
    exit 1
fi

# 顯示版本信息
echo "✅ Node.js版本：$(node --version)"
echo "✅ npm版本：$(npm --version)"
echo ""

# 安裝依賴套件
echo "📦 安裝依賴套件中..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ 依賴套件安裝成功！"
else
    echo "❌ 依賴套件安裝失敗"
    echo "請檢查網路連線或嘗試使用：npm install --verbose"
    exit 1
fi

echo ""
echo "🎉 安裝完成！"
echo ""
echo "🚀 啟動方式："
echo "   npm start"
echo ""
echo "🌐 瀏覽器訪問：http://localhost:3000"
echo ""
echo "📖 更多信息請查看 README.md"
echo "================================================"