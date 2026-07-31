$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
Push-Location $ProjectRoot

$NODE_VERSION = "20.19.0"
$RESOURCES_DIR = Join-Path $ProjectRoot "src-tauri\resources"

Write-Host "=== GATSI COMMS Desktop Build ===" -ForegroundColor Cyan

# Read production DATABASE_URL from Vercel env
$envContent = Get-Content ".env.local" -Raw
$match = [regex]::Match($envContent, 'DATABASE_URL="([^"]+)"')
if (-not $match.Success) { throw "DATABASE_URL not found in .env.local" }
$PROD_DB_URL = $match.Groups[1].Value
Write-Host "Using production database" -ForegroundColor Green

# Step 1: Generate Prisma client
Write-Host "[1/4] Generating Prisma client..." -ForegroundColor Yellow
$env:DATABASE_URL = $PROD_DB_URL
npx prisma generate
if (-not $?) { throw "Prisma generate failed" }

# Step 2: Build Next.js standalone
Write-Host "[2/4] Building Next.js..." -ForegroundColor Yellow
$env:DATABASE_URL = $PROD_DB_URL
npm run build
if (-not $?) { throw "Next.js build failed" }

# Step 3: Prepare resources directory
Write-Host "[3/4] Preparing resources..." -ForegroundColor Yellow
if (Test-Path $RESOURCES_DIR) { Remove-Item -Recurse -Force $RESOURCES_DIR }
New-Item -ItemType Directory -Force -Path "$RESOURCES_DIR\nextjs"
New-Item -ItemType Directory -Force -Path "$RESOURCES_DIR\nodejs"

# Copy Next.js standalone
Copy-Item -Recurse -Force "$ProjectRoot\.next\standalone\*" "$RESOURCES_DIR\nextjs\"
Copy-Item -Recurse -Force "$ProjectRoot\.next\static" "$RESOURCES_DIR\nextjs\.next\static"

# Ensure Prisma client is in standalone
if (Test-Path "$ProjectRoot\src\generated\prisma") {
    New-Item -ItemType Directory -Force -Path "$RESOURCES_DIR\nextjs\src\generated\prisma" | Out-Null
    Copy-Item -Recurse -Force "$ProjectRoot\src\generated\prisma\*" "$RESOURCES_DIR\nextjs\src\generated\prisma\"
}

# Copy .prisma directory
if (Test-Path "$ProjectRoot\src\generated\prisma") {
    $prismaClientDir = Join-Path $ProjectRoot "node_modules\.prisma"
    if (Test-Path $prismaClientDir) {
        New-Item -ItemType Directory -Force -Path "$RESOURCES_DIR\nextjs\node_modules\.prisma" | Out-Null
        Copy-Item -Recurse -Force "$prismaClientDir\*" "$RESOURCES_DIR\nextjs\node_modules\.prisma\"
    }
}

# Step 4: Get portable Node.js
Write-Host "[4/4] Getting portable Node.js..." -ForegroundColor Yellow
$nodeZip = "$env:TEMP\node-v$NODE_VERSION-win-x64.zip"
if (-not (Test-Path $nodeZip)) {
    Write-Host "  Downloading Node.js v$NODE_VERSION..." -ForegroundColor Gray
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-win-x64.zip" -OutFile $nodeZip -UseBasicParsing
}
Write-Host "  Extracting Node.js..." -ForegroundColor Gray
Remove-Item -Recurse -Force "$env:TEMP\node-extract" -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path "$env:TEMP\node-extract" | Out-Null
Expand-Archive -Path $nodeZip -DestinationPath "$env:TEMP\node-extract"
Copy-Item -Recurse -Force "$env:TEMP\node-extract\node-v$NODE_VERSION-win-x64\*" "$RESOURCES_DIR\nodejs\"
Remove-Item -Recurse -Force "$env:TEMP\node-extract"

# Build Tauri app
Write-Host "=== Building Tauri app ===" -ForegroundColor Cyan
$env:DATABASE_URL = $PROD_DB_URL
cargo tauri build 2>&1

Pop-Location
