$ErrorActionPreference = "Continue"

$json = Get-Content "f:\random folders\salaries_system\db\employees_seed.json" -Encoding UTF8 -Raw
$employees = $json | ConvertFrom-Json
$url = "http://localhost:8080/api/employees"

function Post-JsonUtf8($obj) {
    $json  = $obj | ConvertTo-Json -Compress -Depth 6
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    return Invoke-RestMethod -Uri $url -Method POST -ContentType "application/json; charset=utf-8" -Body $bytes
}

$ok = 0; $fail = 0
foreach ($emp in $employees) {
    try {
        $r = Post-JsonUtf8 $emp
        Write-Host "OK  [$($r.employeeCode)]  $($r.name)"
        $ok++
    } catch {
        $errText = $null
        try {
            $stream  = $_.Exception.Response.GetResponseStream()
            $reader  = New-Object System.IO.StreamReader($stream)
            $errText = $reader.ReadToEnd()
        } catch {}
        if (-not $errText) { $errText = $_.Exception.Message }
        Write-Host ("ERR  {0} -- {1}" -f $emp.name, $errText)
        $fail++
    }
}
Write-Host ""
Write-Host ("=== DONE: {0} created, {1} errors ===" -f $ok, $fail)
