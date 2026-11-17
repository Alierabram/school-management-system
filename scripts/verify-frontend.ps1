$base = 'http://localhost:3002'
$stuS = $null
Invoke-WebRequest -Uri "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body '{"email":"student@school.local","password":"ChangeMe-Student-2026"}' -SessionVariable stuS -UseBasicParsing | Out-Null
$idx = (Invoke-WebRequest -Uri "$base/" -WebSession $stuS -UseBasicParsing).Content
$app = (Invoke-WebRequest -Uri "$base/app.js" -WebSession $stuS -UseBasicParsing).Content
$css = (Invoke-WebRequest -Uri "$base/styles.css" -WebSession $stuS -UseBasicParsing).Content
Write-Output ("index.html bytes: " + $idx.Length)
Write-Output ("app.js bytes: " + $app.Length)
Write-Output ("styles.css bytes: " + $css.Length)
$checks = [ordered]@{
  'studentView shell'     = ($idx -match 'id="studentView"')
  'studentNav tabs'       = ($idx -match 'data-student-tab')
  'showStudentApp'        = ($app -match 'function showStudentApp')
  'goToStudentTab'        = ($app -match 'goToStudentTab')
  'renderStudentOverview' = ($app -match 'function renderStudentOverview')
  'renderStudentFees'     = ($app -match 'function renderStudentFees')
  'printStudentReceipt'   = ($app -match 'function printStudentReceipt')
  'student-role branch'   = ($app -match "result.role === 'STUDENT'")
  'stat-icon.red'         = ($css -match 'stat-icon.red')
  'report-card-list'      = ($css -match 'report-card-list')
}
foreach ($k in $checks.Keys) {
  $v = if ($checks[$k]) { 'OK' } else { 'MISSING' }
  Write-Output ("  [" + $v + "] " + $k)
}
