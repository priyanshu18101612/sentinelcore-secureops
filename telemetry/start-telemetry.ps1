# SentinelCore SecureOps - Start Telemetry Services
$TelemetryDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BinDir = Join-Path $TelemetryDir "bin"
$PromConfigFile = Join-Path $TelemetryDir "prometheus.yml"

$WindowsExporterExe = Join-Path $BinDir "windows_exporter.exe"
$PromExe = Join-Path $BinDir "prometheus\prometheus.exe"
$GrafanaExe = Join-Path $BinDir "grafana\bin\grafana-server.exe"

if (-not (Test-Path $WindowsExporterExe) -or -not (Test-Path $PromExe)) {
    Write-Host "Binaries not found. Running setup script first..." -ForegroundColor Yellow
    & (Join-Path $TelemetryDir "setup-telemetry.ps1")
}

Write-Host "Starting windows_exporter on port 9182..." -ForegroundColor Cyan
Start-Process -FilePath $WindowsExporterExe -ArgumentList "--collectors.enabled cpu,cs,logical_disk,net,os,system --telemetry.addr :9182" -WindowStyle Hidden

Start-Sleep -Seconds 1

Write-Host "Starting Prometheus on port 9090..." -ForegroundColor Cyan
Start-Process -FilePath $PromExe -ArgumentList "--config.file=`"$PromConfigFile`" --storage.tsdb.path=`"$BinDir\prom_data`"" -WindowStyle Hidden

if (Test-Path $GrafanaExe) {
    Write-Host "Starting Grafana on port 3000..." -ForegroundColor Cyan
    $GrafanaWorkingDir = Join-Path $BinDir "grafana"
    Start-Process -FilePath $GrafanaExe -WorkingDirectory $GrafanaWorkingDir -WindowStyle Hidden
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Telemetry Services Started Successfully! " -ForegroundColor Green
Write-Host " - windows_exporter: http://localhost:9182/metrics" -ForegroundColor White
Write-Host " - Prometheus:       http://localhost:9090" -ForegroundColor White
if (Test-Path $GrafanaExe) {
    Write-Host " - Grafana:          http://localhost:3000 (admin/admin)" -ForegroundColor White
}
Write-Host "==========================================================" -ForegroundColor Green
