# SentinelCore SecureOps - Stop Telemetry Services
Write-Host "Stopping windows_exporter..." -ForegroundColor Yellow
Get-Process -Name "windows_exporter" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Stopping Prometheus..." -ForegroundColor Yellow
Get-Process -Name "prometheus" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Stopping Grafana..." -ForegroundColor Yellow
Get-Process -Name "grafana-server" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "All telemetry processes stopped." -ForegroundColor Green
