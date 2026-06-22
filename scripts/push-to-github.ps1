$ErrorActionPreference = "Stop"

Write-Host "Preparing git push for Flashdevnak/hubchecklist..." -ForegroundColor Yellow

if (-not (Test-Path ".git")) {
  git init
}

git add .
git commit -m "MVP-001 project skeleton and Capacitor foundation"
git branch -M main

$remoteExists = $false
try {
  git remote get-url origin | Out-Null
  $remoteExists = $true
} catch {
  $remoteExists = $false
}

if ($remoteExists) {
  git remote set-url origin https://github.com/Flashdevnak/hubchecklist.git
} else {
  git remote add origin https://github.com/Flashdevnak/hubchecklist.git
}

git push -u origin main
Write-Host "Done." -ForegroundColor Green
