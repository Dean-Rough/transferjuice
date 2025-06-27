#!/bin/bash

# Pre-deployment checks for Transfer Juice
echo "🔍 Pre-deployment Checks"
echo "========================"

# Check if required files exist
echo "📁 Checking required files..."
required_files=("vercel.json" "package.json" "prisma/schema.prisma" ".env.local")
missing_files=()

for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        missing_files+=("$file")
    fi
done

if [[ ${#missing_files[@]} -gt 0 ]]; then
    echo ""
    echo "❌ Missing required files. Please create them before deploying."
    exit 1
fi

# Check environment variables
echo ""
echo "🔧 Checking environment variables..."
required_vars=("DATABASE_URL" "OPENAI_API_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if grep -q "^$var=" .env.local; then
        echo "✅ $var"
    else
        echo "❌ $var (missing from .env.local)"
        missing_vars+=("$var")
    fi
done

if [[ ${#missing_vars[@]} -gt 0 ]]; then
    echo ""
    echo "❌ Missing required environment variables. Please add them to .env.local"
    exit 1
fi

# Test build
echo ""
echo "🏗️ Testing build..."
if npm run build > /tmp/build-test.log 2>&1; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Check /tmp/build-test.log for details"
    echo "Last 10 lines of build log:"
    tail -10 /tmp/build-test.log
    exit 1
fi

# Test database connection
echo ""
echo "🗄️ Testing database connection..."
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "Please check your DATABASE_URL"
    exit 1
fi

# Check TypeScript
echo ""
echo "📝 Checking TypeScript..."
if npm run type-check > /tmp/type-check.log 2>&1; then
    echo "✅ TypeScript check passed"
else
    echo "❌ TypeScript errors found. Check /tmp/type-check.log"
    echo "First 10 errors:"
    head -10 /tmp/type-check.log
    exit 1
fi

# Check linting
echo ""
echo "🧹 Checking linting..."
if npm run lint > /tmp/lint-check.log 2>&1; then
    echo "✅ Linting passed"
else
    echo "⚠️ Linting issues found (non-blocking)"
    echo "Run 'npm run lint' to see details"
fi

# Check for sensitive files
echo ""
echo "🔒 Checking for sensitive files..."
sensitive_patterns=(".env" "*.key" "*.pem" "*.p12")
found_sensitive=()

for pattern in "${sensitive_patterns[@]}"; do
    if ls $pattern > /dev/null 2>&1; then
        found_sensitive+=($(ls $pattern))
    fi
done

if [[ ${#found_sensitive[@]} -gt 0 ]]; then
    echo "⚠️ Sensitive files found (ensure they're in .gitignore):"
    for file in "${found_sensitive[@]}"; do
        echo "   - $file"
    done
else
    echo "✅ No sensitive files found in root"
fi

# Summary
echo ""
echo "📊 Pre-deployment Summary"
echo "========================="
echo "✅ All required files present"
echo "✅ Environment variables configured"
echo "✅ Build successful"
echo "✅ Database connection working"
echo "✅ TypeScript compilation passed"

echo ""
echo "🚀 Ready to deploy!"
echo ""
echo "Next steps:"
echo "1. Run: ./scripts/setup-vercel-env.sh  (if not done)"
echo "2. Run: vercel --prod"
echo "3. Test deployment with: curl https://your-app.vercel.app/api/health"

echo ""
echo "⏰ After deployment, test cron endpoints:"
echo "curl -H \"Authorization: Bearer YOUR_CRON_SECRET\" https://your-app.vercel.app/api/cron/monitoring"