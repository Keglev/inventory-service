# simulate_merge_docs_fix_links.ps1
# Non-destructive merge simulation: create temp branch from origin/docs/fix-links, merge origin/main, list conflicts and diffs, then abort and delete temp

git fetch origin --prune
$orig = git rev-parse --abbrev-ref HEAD
$tmp = 'tmp/merge-docs-fix-links'
if (git rev-parse --verify $tmp 2>$null) { git branch -D $tmp }

# create temp branch from remote tip
git checkout -b $tmp origin/docs/fix-links

# attempt merge
$mergeOut = git merge origin/main --no-commit --no-ff 2>&1

$conflicts = git diff --name-only --diff-filter=U | Where-Object { $_ -ne '' }

if ($conflicts.Count -eq 0) {
    Write-Host 'No conflicts detected.' -ForegroundColor Green
} else {
    Write-Host "Conflicting files ($($conflicts.Count)):" -ForegroundColor Red
    foreach ($f in $conflicts) {
        Write-Host " - $f" -ForegroundColor Yellow
    }

    foreach ($f in $conflicts) {
        Write-Host "`n==== DIFF for: $f (first 200 lines) ====" -ForegroundColor Magenta
        $diff = git diff -- $f 2>$null
        if ($diff) {
            $lines = $diff -split "`n"
            $lines[0..[Math]::Min(199, $lines.Length-1)] | ForEach-Object { Write-Host $_ }
        } else {
            Write-Host '(no git-diff output available)' -ForegroundColor DarkGray
        }
    }
}

if ($mergeOut) {
    Write-Host "`nMerge output:`n"
    Write-Host $mergeOut
}

# abort merge and cleanup
git merge --abort 2>$null | Out-Null
if ($orig) { git checkout $orig } else { git checkout docs/fix-links }
if (git rev-parse --verify $tmp 2>$null) { git branch -D $tmp }

Write-Host 'Merge simulation finished and cleaned up.' -ForegroundColor Cyan
