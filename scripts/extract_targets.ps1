$report = 'scripts\missing_html_links_partial_report.txt'
$out = 'scripts\missing_html_links_partial_targets.txt'
if (-not (Test-Path $report)) { Write-Error "Report not found: $report"; exit 1 }
$lines = Get-Content $report -ErrorAction Stop
$targets = @()
foreach ($line in $lines) {
    if ($line -match 'Resolved:\s*(.+)$') {
        $t = $matches[1].Trim()
        $t = $t -replace '&quot;','"'
        $t = $t -replace '&gt;','>'
        $t = $t -replace '&lt;','<'
        $t = $t -replace '&amp;','&'
        $t = $t.Trim()
        $t = $t.TrimEnd('>','"')
        if ($t -ne '') { $targets += $t }
    }
}
$targets = $targets | Where-Object { $_ } | Sort-Object -Unique
$targets | Out-File -FilePath $out -Encoding UTF8
Write-Output "Wrote targets: $out"
Get-Content $out | Select-Object -First 50
