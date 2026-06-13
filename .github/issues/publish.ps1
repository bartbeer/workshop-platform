# Publish domain-alignment issues to GitHub

Requires `gh auth login` or `GH_TOKEN` with repo scope.

```powershell
$gh = "$env:TEMP\gh-cli\bin\gh.exe"
$repo = "bartbeer/workshop-platform"

# Parent PRD issue
$prd = Get-Content ".github/issues/prd-domain-alignment.md" -Raw
$parentUrl = & $gh issue create --repo $repo --title "PRD: Align platform with domain model (CONTEXT.md)" --body $prd --label "enhancement" --label "ready-for-agent"

# Extract issue number from URL
$parentNum = ($parentUrl -split '/')[-1]

function Publish-Child($file, $title) {
  $body = (Get-Content $file -Raw) -replace '#PRD_ISSUE', "#$parentNum"
  & $gh issue create --repo $repo --title $title --body $body --label "enhancement" --label "ready-for-agent"
}

$i02 = Publish-Child ".github/issues/02-session-teacher-assignment.md" "Session-level Teacher assignment and status"
$i02Num = ($i02 -split '/')[-1]

Publish-Child ".github/issues/01-rename-participant-role.md" "Rename profile role guest to participant" | Out-Null
$i01Num = (& $gh issue list --repo $repo --limit 1 --json number | ConvertFrom-Json).number

# Re-create 03 with correct blocker ref
$body03 = (Get-Content ".github/issues/03-owner-workshop-creation.md" -Raw) -replace '#PRD_ISSUE', "#$parentNum" -replace '#ISSUE_02', "#$i02Num"
& $gh issue create --repo $repo --title "Owner-only Workshop creation with Session Teacher assignment" --body $body03 --label "enhancement" --label "ready-for-agent"

$body04 = (Get-Content ".github/issues/04-teacher-assigned-sessions-view.md" -Raw) -replace '#PRD_ISSUE', "#$parentNum" -replace '#ISSUE_02', "#$i02Num"
$i04 = & $gh issue create --repo $repo --title "Teacher view of assigned Sessions and attendee list" --body $body04 --label "enhancement" --label "ready-for-agent"
$i04Num = ($i04 -split '/')[-1]

$body05 = (Get-Content ".github/issues/05-teacher-attendance-marking.md" -Raw) -replace '#PRD_ISSUE', "#$parentNum" -replace '#ISSUE_04', "#$i04Num"
& $gh issue create --repo $repo --title "Teacher attendance marking on assigned Sessions" --body $body05 --label "enhancement" --label "ready-for-agent"

$body06 = (Get-Content ".github/issues/06-owner-session-cancellation.md" -Raw) -replace '#PRD_ISSUE', "#$parentNum" -replace '#ISSUE_02', "#$i02Num"
& $gh issue create --repo $repo --title "Owner Session cancellation with Booking cascade" --body $body06 --label "enhancement" --label "ready-for-agent"

$body07 = (Get-Content ".github/issues/07-teacher-application-flow.md" -Raw) -replace '#PRD_ISSUE', "#$parentNum" -replace '#ISSUE_01', "#$i01Num"
& $gh issue create --repo $repo --title "Teacher self-serve application and Owner approval" --body $body07 --label "enhancement" --label "ready-for-agent"

Write-Host "Parent PRD: $parentUrl"
```
