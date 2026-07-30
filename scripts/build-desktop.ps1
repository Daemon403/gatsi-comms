$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
Push-Location $ProjectRoot

$PG_VERSION = "16"
$NODE_VERSION = "20.19.0"
$PG_PORT = "5434"
$RESOURCES_DIR = Join-Path $ProjectRoot "src-tauri\resources"

Write-Host "=== GATSI COMMS Desktop Build ===" -ForegroundColor Cyan

# Step 1: Build Next.js standalone
Write-Host "[1/6] Building Next.js..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://postgres@localhost:5433/gatsi_comms"
npm run build
if (-not $?) { throw "Next.js build failed" }

# Step 2: Generate init SQL
Write-Host "[2/6] Generating database init SQL..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://postgres@localhost:$PG_PORT/gatsi_comms"
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script | Out-File -FilePath "prisma/init.sql" -Encoding utf8
if (-not $?) { throw "SQL generation failed" }

# Step 3: Prepare resources directory
Write-Host "[3/6] Preparing resources..." -ForegroundColor Yellow
if (Test-Path $RESOURCES_DIR) { Remove-Item -Recurse -Force $RESOURCES_DIR }
New-Item -ItemType Directory -Force -Path "$RESOURCES_DIR\nextjs"
New-Item -ItemType Directory -Force -Path "$RESOURCES_DIR\nodejs"
New-Item -ItemType Directory -Force -Path "$RESOURCES_DIR\postgres"

# Step 4: Copy Next.js standalone
Write-Host "[4/6] Copying Next.js standalone..." -ForegroundColor Yellow
Copy-Item -Recurse -Force "$ProjectRoot\.next\standalone\*" "$RESOURCES_DIR\nextjs\"
Copy-Item -Recurse -Force "$ProjectRoot\.next\static" "$RESOURCES_DIR\nextjs\.next\static"
New-Item -ItemType Directory -Force -Path "$RESOURCES_DIR\nextjs\prisma" | Out-Null
Copy-Item -Force "$ProjectRoot\prisma\init.sql" "$RESOURCES_DIR\nextjs\prisma\init.sql"
New-Item -ItemType Directory -Force -Path "$RESOURCES_DIR\nextjs\node_modules\.prisma" -ErrorAction SilentlyContinue | Out-Null
if (Test-Path "$ProjectRoot\src\generated\prisma") {
    Copy-Item -Recurse -Force "$ProjectRoot\src\generated\prisma" "$RESOURCES_DIR\nextjs\src\generated\prisma"
}

# Step 5: Get portable Node.js
Write-Host "[5/6] Getting portable Node.js..." -ForegroundColor Yellow
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

# Step 6: Get portable PostgreSQL
Write-Host "[6/6] Getting portable PostgreSQL..." -ForegroundColor Yellow
$pgZip = "$env:TEMP\postgresql-$PG_VERSION-windows-x64-binaries.zip"
$pgDownloaded = $false
if (-not (Test-Path $pgZip)) {
    Write-Host "  Downloading PostgreSQL $PG_VERSION from EDB..." -ForegroundColor Gray
    $pgUrl = "https://get.enterprisedb.com/postgresql/postgresql-${PG_VERSION}.14-1-windows-x64-binaries.zip"
    try {
        Invoke-WebRequest -Uri $pgUrl -OutFile $pgZip -UseBasicParsing -ErrorAction Stop
        $pgDownloaded = $true
    } catch {
        Write-Host "  EDB download failed, trying alternate URL..." -ForegroundColor Yellow
        $pgUrl = "https://get.enterprisedb.com/postgresql/postgresql-${PG_VERSION}.6-1-windows-x64-binaries.zip"
        try {
            Invoke-WebRequest -Uri $pgUrl -OutFile $pgZip -UseBasicParsing -ErrorAction Stop
            $pgDownloaded = $true
        } catch {
            Write-Host "  Download failed, falling back to local installation." -ForegroundColor Yellow
        }
    }
} else {
    $pgDownloaded = $true
}
if ($pgDownloaded) {
    Write-Host "  Extracting PostgreSQL..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "$env:TEMP\pg-extract" -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path "$env:TEMP\pg-extract" | Out-Null
    Expand-Archive -Path $pgZip -DestinationPath "$env:TEMP\pg-extract"
    $pgsqlSrc = "$env:TEMP\pg-extract\pgsql"
    if (-not (Test-Path $pgsqlSrc)) {
        $pgsqlSrc = "$env:TEMP\pg-extract\postgresql"
    }
    if (Test-Path $pgsqlSrc\bin) { Copy-Item -Recurse -Force "$pgsqlSrc\bin" "$RESOURCES_DIR\postgres\bin" }
    if (Test-Path $pgsqlSrc\lib) { Copy-Item -Recurse -Force "$pgsqlSrc\lib" "$RESOURCES_DIR\postgres\lib" }
    if (Test-Path $pgsqlSrc\share) { Copy-Item -Recurse -Force "$pgsqlSrc\share" "$RESOURCES_DIR\postgres\share" }
    Remove-Item -Recurse -Force "$env:TEMP\pg-extract"
} else {
    $localPg = "C:\Program Files\PostgreSQL\$PG_VERSION"
    if (Test-Path $localPg) {
        Write-Host "  Copying essential files from: $localPg" -ForegroundColor Gray
        Copy-Item -Recurse -Force "$localPg\bin" "$RESOURCES_DIR\postgres\bin"
        Copy-Item -Recurse -Force "$localPg\lib" "$RESOURCES_DIR\postgres\lib"
        Copy-Item -Recurse -Force "$localPg\share" "$RESOURCES_DIR\postgres\share"
        # Strip unnecessary files
        Get-ChildItem "$RESOURCES_DIR\postgres\bin" -Filter *.pdb -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
        Get-ChildItem "$RESOURCES_DIR\postgres\bin" -Filter *.msi -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
        Get-ChildItem "$RESOURCES_DIR\postgres\lib" -Filter *.pdb -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
        Get-ChildItem "$RESOURCES_DIR\postgres\share" -Filter *.html -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
        Get-ChildItem "$RESOURCES_DIR\postgres\share" -Filter *.txt -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
    } else {
        throw "PostgreSQL not found locally and download failed."
    }
}

# Build Tauri app
Write-Host "=== Building Tauri app ===" -ForegroundColor Cyan
cargo tauri build 2>&1

Pop-Location
