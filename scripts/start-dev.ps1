param(
  [string]$HostName = "127.0.0.1",
  [int]$Port = 4173
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$PidFile = Join-Path $Root ".dev-server.pid"
$OutLog = Join-Path $Root ".dev-server.out.log"
$ErrLog = Join-Path $Root ".dev-server.err.log"

function Test-ProcessAlive {
  param([int]$ProcessId)
  return [bool](Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)
}

if (Test-Path $PidFile) {
  $ExistingPidText = (Get-Content -Raw $PidFile).Trim()
  $ExistingPid = 0
  if ([int]::TryParse($ExistingPidText, [ref]$ExistingPid) -and (Test-ProcessAlive $ExistingPid)) {
    Write-Output "Dev server already appears to be running. PID: $ExistingPid"
    Write-Output "URL: http://$HostName`:$Port/"
    exit 0
  }

  Remove-Item -LiteralPath $PidFile -Force
}

$EscapedRoot = $Root.Path.Replace("'", "''")
$EscapedHost = $HostName.Replace("'", "''")
$Command = "Set-Location -LiteralPath '$EscapedRoot'; npm run dev -- --host '$EscapedHost' --port $Port --strictPort"

$Process = Start-Process `
  -FilePath "powershell.exe" `
  -ArgumentList @("-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $Command) `
  -WorkingDirectory $Root `
  -RedirectStandardOutput $OutLog `
  -RedirectStandardError $ErrLog `
  -WindowStyle Hidden `
  -PassThru

Set-Content -LiteralPath $PidFile -Value $Process.Id
Start-Sleep -Seconds 2

if (-not (Test-ProcessAlive $Process.Id)) {
  Remove-Item -LiteralPath $PidFile -ErrorAction SilentlyContinue
  Write-Output "Dev server failed to start. Check logs:"
  Write-Output "  $OutLog"
  Write-Output "  $ErrLog"
  exit 1
}

Write-Output "Dev server started."
Write-Output "PID: $($Process.Id)"
Write-Output "URL: http://$HostName`:$Port/"
