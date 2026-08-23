param(
    [switch]$NoInfra
)

Write-Host "=== VaultBill Dev Startup ===" -ForegroundColor Cyan

if (-not $NoInfra) {
    $docker = Get-Command "docker" -ErrorAction SilentlyContinue
    if ($docker) {
        Write-Host "Starting infrastructure (Postgres, Redis, Minio)..." -ForegroundColor Yellow
        docker compose -f docker/compose.dev.yml up -d
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Infrastructure started via Docker." -ForegroundColor Green
        } else {
            Write-Host "Failed to start infrastructure via Docker." -ForegroundColor Red
        }
    } else {
        $wsl = Get-Command "wsl" -ErrorAction SilentlyContinue
        if ($wsl) {
            Write-Host "Starting infrastructure via WSL Docker..." -ForegroundColor Yellow
            wsl docker compose -f docker/compose.dev.yml up -d
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Infrastructure started via WSL Docker." -ForegroundColor Green
            } else {
                Write-Host "Failed to start infrastructure via WSL Docker." -ForegroundColor Red
            }
        } else {
            Write-Host "Docker/WSL not found. Please install Docker Desktop or start services manually:" -ForegroundColor Red
            Write-Host "  - Postgres on port 5434" -ForegroundColor Gray
            Write-Host "  - Redis on port 6380" -ForegroundColor Gray
            Write-Host "  - MinIO on port 9003" -ForegroundColor Gray
        }
    }
}

Write-Host "Starting dev servers (API on :3001, Web on :3000)..." -ForegroundColor Yellow
pnpm dev