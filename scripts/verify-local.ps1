<#
Local verification script for the AI Interview platform (PowerShell).
Run from repo root in an elevated PowerShell session.
#>

param()

Write-Host "1) Ensure Docker Desktop is running"
Write-Host "2) Building backend image (no cache, BuildKit disabled)"
$env:DOCKER_BUILDKIT = 0

docker build -t ai-server ./server --no-cache
if ($LASTEXITCODE -ne 0) {
    Write-Error "Backend image build failed. Check the output above and paste the last 30-50 lines to the assistant."
    exit 1
}

Write-Host "3) Starting compose stack (no-build)"
docker compose -f docker-compose.prod.yml up -d --no-build
if ($LASTEXITCODE -ne 0) {
    Write-Error "docker compose failed to start. Inspect docker compose logs."
    exit 1
}

Write-Host "Waiting 10s for services to settle..."
Start-Sleep -Seconds 10

Write-Host "=== Server logs (last 200 lines) ==="
docker compose logs --no-color --tail=200 server

Write-Host "=== Health endpoints ==="
try {
    $health = Invoke-WebRequest -UseBasicParsing -Uri http://localhost:5000/health -TimeoutSec 5
n    Write-Host "/health returned:" $health.StatusCode
} catch {
    Write-Warning "/health check failed: $_"
}

try {
    $ready = Invoke-WebRequest -UseBasicParsing -Uri http://localhost:5000/ready -TimeoutSec 5
    Write-Host "/ready returned:" $ready.StatusCode
} catch {
    Write-Warning "/ready check failed: $_"
}

Write-Host "=== Redis ping ==="
try {
    docker compose exec -T redis redis-cli PING | Write-Host
} catch {
    Write-Warning "Redis PING failed: $_"
}

Write-Host "=== Run DB seed (non-forced) ==="
try {
    docker compose exec -T server npm run seed | Write-Host
} catch {
    Write-Warning "Seed command failed: $_"
}

Write-Host "=== Quick auth test: register -> login ==="
$registerBody = @{ email = "test@example.com"; password = "Passw0rd!" } | ConvertTo-Json
try {
    $reg = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/register -Body $registerBody -ContentType 'application/json' -TimeoutSec 10
    Write-Host "Register response:" ($reg | ConvertTo-Json -Depth 3)
} catch {
    Write-Warning "Register failed (might already exist): $_"
}

try {
    $login = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/login -Body $registerBody -ContentType 'application/json' -TimeoutSec 10
    Write-Host "Login response keys:" ($login | Get-Member -MemberType NoteProperty | Select -Expand Name -Unique)
} catch {
    Write-Warning "Login failed: $_"
}

Write-Host "Local verification script finished. If any step failed, copy the relevant logs and share them with the assistant."
