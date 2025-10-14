# Check remote branches for merge conflicts against origin/main (non-destructive)
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check_remote_conflicts.ps1

git fetch origin --prune
$base = 'origin/main'

$remoteHeads = git for-each-ref refs/remotes/origin --format="%(refname:short)" | Where-Object { $_ -ne 'origin/HEAD' }
$remoteBranches = $remoteHeads | ForEach-Object { $_.Replace('origin/','') } | Where-Object { $_ -ne 'main' }

if ($remoteBranches.Count -eq 0) {
    Write-Host "No remote branches found (except main)." -ForegroundColor Yellow
    exit 0
}

$results = @()

foreach ($b in $remoteBranches) {
    $branchRef = "origin/$b"
    $mb = git merge-base $base $branchRef 2>$null
    if (-not $mb) { $mb = "" }
    $mt = git merge-tree $mb $base $branchRef 2>$null
    if ($mt -and ($mt -match '<<<<<<<')) {
        Write-Host "CONFLICT: $b" -ForegroundColor Red
        $results += @{ branch = $b; conflict = $true }
    } else {
        Write-Host "OK: $b" -ForegroundColor Green
        $results += @{ branch = $b; conflict = $false }
    }
}

# Output JSON summary
$results | ConvertTo-Json -Depth 4
