$ErrorActionPreference = "Stop"

$base = "http://localhost:8080/api/departments"

function Invoke-JsonUtf8($method, $url, $obj) {
  $json  = $obj | ConvertTo-Json -Compress -Depth 6
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  return Invoke-RestMethod -Method $method -Uri $url -ContentType "application/json; charset=utf-8" -Body $bytes
}

Write-Host "Fetching existing departments..."
$existing = Invoke-RestMethod -Method GET -Uri $base
if ($existing -and $existing.value) { $existing = $existing.value }

if ($existing -and $existing.Count -gt 0) {
  Write-Host ("Deleting {0} existing departments..." -f $existing.Count)
  foreach ($d in $existing) {
    if ($null -ne $d.id) {
      try {
        Invoke-RestMethod -Method DELETE -Uri ("{0}/{1}" -f $base, $d.id) | Out-Null
        Write-Host ("DEL [{0}]" -f $d.id)
      } catch {
        Write-Host ("DEL-ERR [{0}]" -f $d.id)
      }
    }
  }
} else {
  Write-Host "No existing departments found."
}

Write-Host ""
Write-Host "Creating departments/branches from JSON seed..."
$seedPath = "f:\random folders\salaries_system\db\departments_seed.json"
$seedJson = Get-Content $seedPath -Encoding UTF8 -Raw
$depts    = $seedJson | ConvertFrom-Json

$ok = 0; $fail = 0
foreach ($d in $depts) {
  try {
    $r = Invoke-JsonUtf8 POST $base $d
    Write-Host ("OK  [{0}] {1}" -f $r.id, $r.label)
    $ok++
  } catch {
    Write-Host "ERR (create dept row)"
    $fail++
  }
}

Write-Host ""
Write-Host ("=== DONE: {0} created, {1} errors ===" -f $ok, $fail)

