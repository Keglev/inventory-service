param(
    [Parameter(Mandatory=$true)][string]$BranchName
)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Output "Checking branch: $BranchName"
# Check local existence
git rev-parse --verify $BranchName 2>$null > $null
$localExists = ($LASTEXITCODE -eq 0)
Write-Output "  Local exists: $localExists"
# Check if branch is merged into main (i.e., branch is ancestor of main)
git merge-base --is-ancestor $BranchName main
$merged = ($LASTEXITCODE -eq 0)
Write-Output "  Merged into main: $merged"
# Check remote existence
$remoteRef = git ls-remote --heads origin $BranchName
$remoteExists = ($remoteRef -ne '')
Write-Output "  Remote exists: $remoteExists"
if (-not $merged) {
    Write-Output "  SKIP: Branch '$BranchName' is not merged into 'main' according to git. Not deleting."
    exit 0
}
# Delete local if present
if ($localExists) {
    git branch -D $BranchName
    if ($LASTEXITCODE -eq 0) { Write-Output "  Deleted local branch: $BranchName" } else { Write-Output "  Failed deleting local branch: $BranchName" }
} else {
    Write-Output "  No local branch to delete"
}
# Delete remote if present
if ($remoteExists) {
    git push origin --delete $BranchName
    if ($LASTEXITCODE -eq 0) { Write-Output "  Deleted remote branch: origin/$BranchName" } else { Write-Output "  Failed deleting remote branch: origin/$BranchName" }
} else {
    Write-Output "  No remote branch to delete"
}
