$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$PidFile = Join-Path $Root ".dev-server.pid"

function Get-ChildProcessIds {
  param([int]$ProcessId)

  $Children = Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq $ProcessId }
  foreach ($Child in $Children) {
    Get-ChildProcessIds -ProcessId $Child.ProcessId
    $Child.ProcessId
  }
}

function Stop-ProcessTree {
  param([int]$ProcessId)

  $Process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if (-not $Process) {
    return $false
  }

  $Ids = @(Get-ChildProcessIds -ProcessId $ProcessId) + $ProcessId
  foreach ($Id in ($Ids | Select-Object -Unique)) {
    Stop-Process -Id $Id -Force -ErrorAction SilentlyContinue
  }

  return $true
}

$Stopped = $false

if (Test-Path $PidFile) {
  $PidText = (Get-Content -Raw $PidFile).Trim()
  $ServerPid = 0
  if ([int]::TryParse($PidText, [ref]$ServerPid)) {
    $Stopped = Stop-ProcessTree -ProcessId $ServerPid
  }

  Remove-Item -LiteralPath $PidFile -ErrorAction SilentlyContinue
}

if (-not $Stopped) {
  $RootPattern = [regex]::Escape($Root.Path)
  $Matches = Get-CimInstance Win32_Process | Where-Object {
    $_.CommandLine -and
    $_.CommandLine -match $RootPattern -and
    ($_.CommandLine -match "npm run dev" -or $_.CommandLine -match "vite")
  }

  foreach ($Match in $Matches) {
    if (Stop-ProcessTree -ProcessId $Match.ProcessId) {
      $Stopped = $true
    }
  }
}

if ($Stopped) {
  Write-Output "Dev server stopped."
} else {
  Write-Output "No dev server process found."
}
