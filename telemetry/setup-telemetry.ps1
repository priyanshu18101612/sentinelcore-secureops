# SentinelCore SecureOps - Telemetry Stack Setup Script (Windows Standalone)
# This script downloads windows_exporter, Prometheus, and portable Grafana binaries using native curl and tar.

$ErrorActionPreference = "Stop"
$TelemetryDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BinDir = Join-Path $TelemetryDir "bin"

if (-not (Test-Path $BinDir)) {
    New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " SentinelCore SecureOps - Setting Up Host Telemetry Stack " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Download windows_exporter
$WindowsExporterExe = Join-Path $BinDir "windows_exporter.exe"
if (-not (Test-Path $WindowsExporterExe)) {
    Write-Host "[1/3] Downloading windows_exporter (v0.25.1)..." -ForegroundColor Yellow
    $weUrl = "https://github.com/prometheus-community/windows_exporter/releases/download/v0.25.1/windows_exporter-0.25.1-amd64.exe"
    curl.exe -L $weUrl -o $WindowsExporterExe
    Write-Host "  -> windows_exporter ready." -ForegroundColor Green
} else {
    Write-Host "[1/3] windows_exporter already exists in bin/." -ForegroundColor Green
}

# 2. Download Prometheus
$PromDir = Join-Path $BinDir "prometheus"
$PromExe = Join-Path $PromDir "prometheus.exe"
if (-not (Test-Path $PromExe)) {
    Write-Host "[2/3] Downloading Prometheus (v2.54.1)..." -ForegroundColor Yellow
    $promZip = Join-Path $BinDir "prometheus.zip"
    $promUrl = "https://github.com/prometheus/prometheus/releases/download/v2.54.1/prometheus-2.54.1.windows-amd64.zip"
    curl.exe -L $promUrl -o $promZip

    Write-Host "  -> Extracting Prometheus..." -ForegroundColor Yellow
    tar.exe -xf $promZip -C $BinDir
    Remove-Item -Path $promZip -Force -ErrorAction SilentlyContinue

    $extractedFolder = Get-ChildItem -Path $BinDir -Filter "prometheus-*" -Directory | Select-Object -First 1
    if ($extractedFolder) {
        Rename-Item -Path $extractedFolder.FullName -NewName "prometheus" -Force
    }
    Write-Host "  -> Prometheus ready." -ForegroundColor Green
} else {
    Write-Host "[2/3] Prometheus already exists in bin/prometheus/." -ForegroundColor Green
}

# 3. Download Portable Grafana (Optional / Zero Admin)
$GrafanaDir = Join-Path $BinDir "grafana"
$GrafanaExe = Join-Path $GrafanaDir "bin\grafana-server.exe"
if (-not (Test-Path $GrafanaExe)) {
    Write-Host "[3/3] Downloading Portable Grafana (v10.4.2)..." -ForegroundColor Yellow
    $grafanaZip = Join-Path $BinDir "grafana.zip"
    $grafanaUrl = "https://dl.grafana.com/oss/release/grafana-10.4.2.windows-amd64.zip"
    curl.exe -L $grafanaUrl -o $grafanaZip

    Write-Host "  -> Extracting Grafana..." -ForegroundColor Yellow
    tar.exe -xf $grafanaZip -C $BinDir
    Remove-Item -Path $grafanaZip -Force -ErrorAction SilentlyContinue

    $extractedGrafana = Get-ChildItem -Path $BinDir -Filter "grafana-*" -Directory | Select-Object -First 1
    if ($extractedGrafana) {
        Rename-Item -Path $extractedGrafana.FullName -NewName "grafana" -Force
    }
    Write-Host "  -> Grafana ready." -ForegroundColor Green
} else {
    Write-Host "[3/3] Grafana already exists in bin/grafana/." -ForegroundColor Green
}

Write-Host ""
Write-Host "Telemetry Stack is ready!" -ForegroundColor Green
Write-Host "To start the telemetry services, run: .\telemetry\start-telemetry.ps1" -ForegroundColor Cyan
