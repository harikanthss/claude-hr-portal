param(
  [string]$ProjectId = $env:SUPABASE_PROJECT_ID,
  [string]$OutFile = "frontend/src/types/supabase.ts"
)

if (-not $ProjectId) {
  Write-Error "SUPABASE_PROJECT_ID is required. Pass -ProjectId or set the environment variable."
  exit 1
}

supabase gen types typescript --project-id $ProjectId --schema public > $OutFile
Write-Host "Generated $OutFile"
