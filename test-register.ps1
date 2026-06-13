$randomId = Get-Random

$body = @{
    name = "Test User Debug $randomId"
    email = "testdebug$randomId@example.com"
    password = "TestPassword123"
} | ConvertTo-Json

Write-Host "Sending registration request..." -ForegroundColor Cyan
Write-Host "Request Body: $body" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 10

    Write-Host "=== REGISTRATION SUCCESSFUL ===" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10)
}
catch {
    Write-Host "=== REGISTRATION FAILED ===" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.Value)" -ForegroundColor Red
    Write-Host "Error Details:" -ForegroundColor Red
    
    try {
        $errorContent = $_.Exception.Response.Content.ToString()
        Write-Host ($errorContent | ConvertFrom-Json | ConvertTo-Json -Depth 10)
    }
    catch {
        Write-Host $_.Exception.Response.Content
    }
    
    Write-Host "Full Exception:" -ForegroundColor DarkRed
    Write-Host $_.Exception.Message
}
