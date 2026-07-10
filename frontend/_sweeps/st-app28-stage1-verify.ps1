# ST-APP28 stage 1 post-apply verification sweep (frontend, api barrel elimination)
# Run from repo root. Output: frontend/_sweeps/st-app28-stage1-sweep.txt (UTF-16)
$out = "frontend/_sweeps/st-app28-stage1-sweep.txt"
New-Item -ItemType Directory -Force -Path "frontend/_sweeps" | Out-Null
$r = @()
$r += "== P1 deleted files absent (expect 11 x MISSING) =="
@("frontend/src/api/analytics/index.ts","frontend/src/api/analytics/hooks/index.ts",
  "frontend/src/api/inventory/index.ts","frontend/src/api/inventory/hooks/index.ts",
  "frontend/src/api/suppliers/index.ts","frontend/src/api/suppliers/hooks/index.ts",
  "frontend/src/api/shared/index.ts","frontend/src/api/inventory/mutations.ts",
  "frontend/src/api/inventory/list.ts","frontend/src/api/inventory/validation.ts",
  "frontend/src/__tests__/unit/api/inventory/list.test.ts") | ForEach-Object {
    if (Test-Path $_) { $r += "STILL PRESENT: $_" } else { $r += "MISSING (ok): $_" } }
$r += "== P2 zero residual barrel imports (expect no lines) =="
$r += Get-ChildItem frontend/src -Recurse -Include *.ts,*.tsx | Select-String -Pattern "from '[^']*api/(analytics|inventory|suppliers|shared)'|from '[^']*api/(analytics|inventory|suppliers)/hooks'|api/inventory/(mutations|list|validation)'" | ForEach-Object { $_.Path + ":" + $_.LineNumber + " " + $_.Line.Trim() }
$r += "== P3 positive probe: deep imports present (expect >=1 each) =="
$r += (Get-ChildItem frontend/src -Recurse -Include *.ts,*.tsx | Select-String -Pattern "api/shared/errorHandling" | Measure-Object).Count.ToString() + " x api/shared/errorHandling"
$r += (Get-ChildItem frontend/src -Recurse -Include *.ts,*.tsx | Select-String -Pattern "api/inventory/itemMutations" | Measure-Object).Count.ToString() + " x api/inventory/itemMutations"
$r += (Get-ChildItem frontend/src -Recurse -Include *.ts,*.tsx | Select-String -Pattern "pages/inventory/validation/inventoryValidation|api/inventory/hooks/useSuppliersQuery" | Measure-Object).Count.ToString() + " x migrated validation/hooks paths"
$r | Out-File -FilePath $out -Encoding Unicode -Width 500
Write-Output "sweep written to $out"
