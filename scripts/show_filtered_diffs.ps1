# Read lists of changed files from a temp file and print git diffs for those that are not pipeline workflows or coverage artifacts
$changedFileList = Join-Path $PSScriptRoot 'changed_files_temp.txt'
if (-not (Test-Path $changedFileList)) {
    Write-Error "Changed files list not found: $changedFileList"
    exit 2
}
$files = Get-Content $changedFileList | Where-Object { $_ -and ($_ -notmatch '^\.github/workflows/') -and ($_ -notmatch '^docs/backend/coverage') }
if (-not $files) {
    Write-Output 'No non-pipeline/non-coverage diffs found.'
    exit 0
}
foreach ($f in $files) {
    Write-Output "--- DIFF: $f ---"
    git --no-pager diff origin/main origin/ci/fix-publish-archive-url -- $f
}
