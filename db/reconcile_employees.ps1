$ErrorActionPreference = "Stop"

$seedPath = "f:\random folders\salaries_system\db\employees_seed.json"
$seedJson = Get-Content $seedPath -Encoding UTF8 -Raw
$seed     = $seedJson | ConvertFrom-Json

$live = Invoke-RestMethod -Method GET -Uri "http://localhost:8080/api/employees"
if ($live -and $live.value) { $live = $live.value }

$liveNames = @{}
foreach ($e in $live) {
  if ($null -ne $e.name -and ("" + $e.name).Trim().Length -gt 0) {
    $liveNames[$e.name] = $true
  }
}

$missing = @()
foreach ($e in $seed) {
  if (-not $liveNames.ContainsKey($e.name)) { $missing += $e }
}

$out = "f:\random folders\salaries_system\db\employees_missing.json"
$missing | ConvertTo-Json -Depth 10 | Out-File -FilePath $out -Encoding utf8

Write-Host ("Missing employees: {0}" -f $missing.Count)
Write-Host ("Wrote: {0}" -f $out)

