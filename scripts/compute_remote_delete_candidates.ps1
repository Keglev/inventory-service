$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$locals = Get-Content (Join-Path $root '..\.git_locals.txt') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
$remotes = Get-Content (Join-Path $root '..\.git_remotes.txt') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
$merged = Get-Content (Join-Path $root '..\.git_merged.txt') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' } | ForEach-Object { $_ -replace '^origin/','' }
$remoteOnly = $remotes | ForEach-Object { ($_ -replace '^origin/','') } | Where-Object { $locals -notcontains $_ }
Write-Output '===== REMOTE-ONLY BRANCHES (no local) ====='
if ($remoteOnly) { $remoteOnly | ForEach-Object { Write-Output "  $_" } } else { Write-Output '  (none)' }
Write-Output ''
Write-Output '===== REMOTE-ONLY MERGED INTO origin/main (SAFE TO DELETE) ====='
$remoteOnlyMerged = $remoteOnly | Where-Object { $merged -contains $_ }
if ($remoteOnlyMerged) { $remoteOnlyMerged | ForEach-Object { Write-Output "  $_" } } else { Write-Output '  (none)' }
Write-Output ''
Write-Output '===== REMOTE-ONLY NOT MERGED (REVIEW BEFORE DELETE) ====='
$remoteOnlyUnmerged = $remoteOnly | Where-Object { $merged -notcontains $_ }
if ($remoteOnlyUnmerged) { $remoteOnlyUnmerged | ForEach-Object { Write-Output "  $_" } } else { Write-Output '  (none)' }
