# Define start tag parameters
param (
    [string]$startTag = "D03.04.Jun",  # Default value if parameter not provided
    [string]$outputFile = "CHANGELOG.md"  # Default output filename
)

# Define changelog file
$changelogFile = "CHANGELOG.md"
 
# Read original content of the changelog file
$originalContent = Get-Content $changelogFile -Raw
 
# Verify if tag exists in the repository
$tagExists = git tag --list | Select-String -Pattern "^$startTag$"
if (-not $tagExists) {
    Write-Host "❌ Error: Tag $startTag does not exist in the repository." -ForegroundColor Red
    exit 1
}
 
# Generate raw changelog and store in variable
$log = git log "$startTag..HEAD" --pretty=format:'%s'
if (-not $log) {
    Write-Host "⚠️ Warning: No commits found between $startTag and HEAD. Changelog will not be generated." -ForegroundColor Yellow
    exit 0  # Exit without error
}

# Initialize changelog structure
$changelog = @"
# Changelog from $startTag to HEAD
 
"@
 
# Dictionary to categorize commits
$sections = @{
    "feat"     = @()  # New features
    "fix"      = @()  # Bug fixes
    # "ci"       = @()  # Continuous integration changes
    # "test"     = @()  # Test-related changes
    "refactor" = @()  # Code refactoring
    # "build"    = @()  # Build system changes
    # "PR Merge" = @()  # Merged pull requests
    # "file_changes" = @()  # File operations
}
 
# Categorize commits according to Conventional Commits and special cases
foreach ($line in $log) {
    if ($line -match "^(\w+)(\(.+\))?:\s(.+)$") {
        $type = $matches[1]
        $message = $matches[3]
 
        if ($sections.ContainsKey($type)) {
            $sections[$type] += "- $message"
        } else {
            $sections["feat"] += "- $message"  # Default to 'feat' if type not recognized
        }
    } elseif ($line -match "^Merged PR \d+: (.*)$") {
        $sections["PR Merge"] += "- $($matches[1])"
    } elseif ($line -match "^(Added|Renamed|Deleted).*$") {
        $sections["file_changes"] += "- $line"
    }
}
 
# Build organized changelog
foreach ($category in $sections.Keys) {
    if ($sections[$category].Count -gt 0) {
        $changelog += "`n## $category`n"
        $changelog += ($sections[$category] -join "`n") + "`n"
    }
}
 
# Add two line breaks for better formatting
$changelog += "`n`n"

# Overwrite file with new content at the beginning
$changelog + $originalContent | Set-Content $changelogFile
 
Write-Host "✅ Changelog successfully generated in CHANGELOG.md" -ForegroundColor Green