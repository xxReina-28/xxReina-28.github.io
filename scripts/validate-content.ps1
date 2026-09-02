[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$sourceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$failures = [System.Collections.Generic.List[string]]::new()
$allowedStatuses = @("approved", "draft", "future")

function Get-FrontMatter {
    param([string]$Path)

    $content = Get-Content -LiteralPath $Path -Raw -Encoding utf8
    $parts = [regex]::Split($content, '(?m)^---\s*$')
    if ($parts.Count -lt 3) {
        return ""
    }
    return $parts[1]
}

function Get-ScalarValue {
    param(
        [string]$Content,
        [string]$Key
    )

    $pattern = '(?m)^' + [regex]::Escape($Key) + ':\s*"?([^"\r\n]+)"?\s*$'
    $match = [regex]::Match($Content, $pattern)
    if ($match.Success) {
        return $match.Groups[1].Value.Trim()
    }
    return ""
}

function Get-ListValues {
    param(
        [string]$Content,
        [string]$Key
    )

    $match = [regex]::Match(
        $Content,
        "(?ms)^$([regex]::Escape($Key)):\s*\r?\n(?<items>(?:\s+-\s+[^\r\n]+\r?\n?)*)"
    )
    if (-not $match.Success) {
        return @()
    }

    return @([regex]::Matches($match.Groups['items'].Value, '(?m)^\s+-\s+["'']?([^"''\r\n]+)["'']?\s*$') |
        ForEach-Object { $_.Groups[1].Value.Trim() })
}

$requiredDataFiles = @(
    "positioning.yml",
    "homepage.yml",
    "capabilities.yml",
    "operations.yml",
    "services.yml",
    "proof.yml",
    "credentials.yml",
    "testimonials.yml",
    "ctas.yml",
    "featured.yml"
)

foreach ($fileName in $requiredDataFiles) {
    $path = Join-Path $sourceRoot "_data\$fileName"
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $failures.Add("Missing required data file: _data/$fileName")
    }
}

$statusFiles = @(
    Get-ChildItem -LiteralPath (Join-Path $sourceRoot "_data") -Filter "*.yml" -File
    Get-ChildItem -LiteralPath (Join-Path $sourceRoot "_projects") -Filter "*.md" -File
    Get-ChildItem -LiteralPath (Join-Path $sourceRoot "_case_studies") -Filter "*.md" -File
)

foreach ($file in $statusFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding utf8
    foreach ($statusMatch in [regex]::Matches($content, '(?m)^\s*status:\s*["'']?([^"''\s]+)["'']?\s*$')) {
        $status = $statusMatch.Groups[1].Value
        if ($allowedStatuses -notcontains $status) {
            $failures.Add("Invalid status '$status' in $($file.Name)")
        }
    }
}

$capabilitiesPath = Join-Path $sourceRoot "_data\capabilities.yml"
$capabilitiesContent = Get-Content -LiteralPath $capabilitiesPath -Raw -Encoding utf8
$capabilityIds = @([regex]::Matches($capabilitiesContent, '(?m)^\s*- id:\s*["'']?([^"''\s]+)["'']?\s*$') |
    ForEach-Object { $_.Groups[1].Value })
$duplicateCapabilityIds = @($capabilityIds | Group-Object | Where-Object Count -gt 1)
foreach ($duplicate in $duplicateCapabilityIds) {
    $failures.Add("Duplicate capability or claim ID: $($duplicate.Name)")
}

$groupCapabilityIds = @([regex]::Matches($capabilitiesContent, '(?m)^- id:\s*["'']?([^"''\s]+)["'']?\s*$') |
    ForEach-Object { $_.Groups[1].Value })

$credentialContent = Get-Content -LiteralPath (Join-Path $sourceRoot "_data\credentials.yml") -Raw -Encoding utf8
$credentialIds = @([regex]::Matches($credentialContent, '(?m)^- id:\s*["'']?([^"''\s]+)["'']?\s*$') |
    ForEach-Object { $_.Groups[1].Value })
$salesforceCredentialBlock = [regex]::Match(
    $credentialContent,
    '(?ms)^- id:\s*salesforce[^\r\n]*\r?\n(?<record>.*?)(?=^- id:|\z)'
)
if ($salesforceCredentialBlock.Success -and
    $salesforceCredentialBlock.Value -match '(?im)^\s*status:\s*approved\s*$' -and
    $salesforceCredentialBlock.Value -match '(?i)administrator|certif') {
    $failures.Add("Salesforce Administrator or certification language cannot be an approved credential without verified evidence")
}

$homepageContent = Get-Content -LiteralPath (Join-Path $sourceRoot "index.md") -Raw -Encoding utf8
if ($homepageContent -match '(?i)Salesforce\s+(?:Certified\s+)?Administrator|Salesforce\s+certification') {
    $failures.Add("Homepage contains Salesforce certification language")
}
$proofContent = Get-Content -LiteralPath (Join-Path $sourceRoot "_data\proof.yml") -Raw -Encoding utf8
$proofIds = @([regex]::Matches($proofContent, '(?m)^\s*- id:\s*["'']?([^"''\s]+)["'']?\s*$') |
    ForEach-Object { $_.Groups[1].Value })

$projectRecords = @{}
$caseStudyRecords = @{}
$collectionSlugs = [System.Collections.Generic.List[string]]::new()

foreach ($collection in @("projects", "case_studies")) {
    $directory = Join-Path $sourceRoot "_$collection"
    foreach ($file in Get-ChildItem -LiteralPath $directory -Filter "*.md" -File) {
        $frontMatter = Get-FrontMatter -Path $file.FullName
        if ([string]::IsNullOrWhiteSpace($frontMatter)) {
            $failures.Add("Collection document has no front matter: $($file.FullName)")
            continue
        }

        $slug = Get-ScalarValue -Content $frontMatter -Key "slug"
        $status = Get-ScalarValue -Content $frontMatter -Key "status"
        $title = Get-ScalarValue -Content $frontMatter -Key "title"
        $type = Get-ScalarValue -Content $frontMatter -Key "type"
        if ([string]::IsNullOrWhiteSpace($slug)) {
            $failures.Add("Collection document has no slug: $($file.Name)")
            continue
        }
        if ([string]::IsNullOrWhiteSpace($title)) {
            $failures.Add("Collection document has no title: $($file.Name)")
        }
        if ([string]::IsNullOrWhiteSpace($status)) {
            $failures.Add("Collection document has no status: $($file.Name)")
        }
        if ($collection -eq "projects" -and [string]::IsNullOrWhiteSpace($type)) {
            $failures.Add("Project document has no type: $($file.Name)")
        }
        $collectionSlugs.Add($slug)

        $record = @{ Status = $status; Title = $title; Path = $file.FullName }
        if ($collection -eq "projects") {
            $projectRecords[$slug] = $record
        } else {
            $caseStudyRecords[$slug] = $record
        }

        foreach ($capabilityId in Get-ListValues -Content $frontMatter -Key "capability_ids") {
            if ($groupCapabilityIds -notcontains $capabilityId) {
                $failures.Add("Broken capability reference '$capabilityId' in $($file.Name)")
            }
        }
    }
}

foreach ($duplicate in @($collectionSlugs | Group-Object | Where-Object Count -gt 1)) {
    $failures.Add("Duplicate collection slug: $($duplicate.Name)")
}

foreach ($evidenceMatch in [regex]::Matches($capabilitiesContent, '(?ms)^\s*- type:\s*([^\s]+)\s*\r?\n\s+id:\s*([^\s]+)\s*$')) {
    $type = $evidenceMatch.Groups[1].Value.Trim('"', "'")
    $id = $evidenceMatch.Groups[2].Value.Trim('"', "'")
    $isValid = switch ($type) {
        "project" { $projectRecords.ContainsKey($id) }
        "case_study" { $caseStudyRecords.ContainsKey($id) }
        "credential" { $credentialIds -contains $id }
        "proof" { $proofIds -contains $id }
        default { $false }
    }
    if (-not $isValid) {
        $failures.Add("Broken evidence reference: ${type}:${id}")
    }
}

$servicesContent = Get-Content -LiteralPath (Join-Path $sourceRoot "_data\services.yml") -Raw -Encoding utf8
foreach ($relatedBlock in [regex]::Matches($servicesContent, '(?ms)^\s+related_capabilities:\s*\r?\n(?<items>(?:\s+-\s+[^\r\n]+\r?\n?)*)')) {
    foreach ($itemMatch in [regex]::Matches($relatedBlock.Groups['items'].Value, '(?m)^\s+-\s+([^\s]+)\s*$')) {
        $id = $itemMatch.Groups[1].Value.Trim('"', "'")
        if ($groupCapabilityIds -notcontains $id) {
            $failures.Add("Broken service capability reference: $id")
        }
    }
}

$featuredContent = Get-Content -LiteralPath (Join-Path $sourceRoot "_data\featured.yml") -Raw -Encoding utf8
$featuredProjectIds = @(Get-ListValues -Content $featuredContent -Key "projects")
$featuredCaseStudyIds = @(Get-ListValues -Content $featuredContent -Key "case_studies")
foreach ($projectId in $featuredProjectIds) {
    if (-not $projectRecords.ContainsKey($projectId)) {
        $failures.Add("Featured project does not exist: $projectId")
    } elseif ($projectRecords[$projectId].Status -ne "approved") {
        $failures.Add("Featured project is not approved: $projectId")
    }
}
foreach ($caseStudyId in $featuredCaseStudyIds) {
    if (-not $caseStudyRecords.ContainsKey($caseStudyId)) {
        $failures.Add("Featured case study does not exist: $caseStudyId")
    } elseif ($caseStudyRecords[$caseStudyId].Status -ne "approved") {
        $failures.Add("Featured case study is not approved: $caseStudyId")
    }
}

foreach ($projectId in $projectRecords.Keys) {
    $frontMatter = Get-FrontMatter -Path $projectRecords[$projectId].Path
    if ((Get-ScalarValue -Content $frontMatter -Key "featured") -eq "true" -and
        $featuredProjectIds -notcontains $projectId) {
        $failures.Add("Featured project is missing from _data/featured.yml: $projectId")
    }
}
foreach ($caseStudyId in $caseStudyRecords.Keys) {
    $frontMatter = Get-FrontMatter -Path $caseStudyRecords[$caseStudyId].Path
    if ((Get-ScalarValue -Content $frontMatter -Key "featured") -eq "true" -and
        $featuredCaseStudyIds -notcontains $caseStudyId) {
        $failures.Add("Featured case study is missing from _data/featured.yml: $caseStudyId")
    }
}

$config = Get-Content -LiteralPath (Join-Path $sourceRoot "_config.yml") -Raw -Encoding utf8
if ($config -notmatch '(?ms)case_studies:\s*\r?\n\s+output:\s+false') {
    $failures.Add("Case-study collection must keep output disabled")
}
if ($config -notmatch '(?ms)projects:\s*\r?\n\s+output:\s+false') {
    $failures.Add("Project collection must keep output disabled")
}

$publicationGuards = @(
    "_includes\capability-card.html",
    "_includes\work-card.html",
    "_includes\proof-card.html",
    "_includes\service-card.html",
    "_includes\cta-block.html",
    "_includes\credential-item.html"
)
foreach ($relativePath in $publicationGuards) {
    $content = Get-Content -LiteralPath (Join-Path $sourceRoot $relativePath) -Raw -Encoding utf8
    if ($content -notmatch "status\s*==\s*'approved'") {
        $failures.Add("Missing approved-only publication guard: $relativePath")
    }
}

$workPage = Get-Content -LiteralPath (Join-Path $sourceRoot "work\index.md") -Raw -Encoding utf8
if ($workPage -notmatch "where:\s*'status',\s*'approved'") {
    $failures.Add("Work page must filter projects to approved status")
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output "Content validation passed: $($groupCapabilityIds.Count) capability groups, $($projectRecords.Count) projects, $($caseStudyRecords.Count) case studies, and approved-only publication guards."
