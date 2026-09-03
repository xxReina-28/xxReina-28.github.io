[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$sourceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$failures = [System.Collections.Generic.List[string]]::new()
$allowedStatuses = @("approved", "draft", "future")
$allowedWorkKinds = @("professional", "portfolio-simulation", "technical-project", "educational-capstone", "proposed-system", "pending-classification")
$allowedEvidenceStatuses = @("verified", "artifact-supported", "self-reported", "unverified", "synthetic", "not-applicable")
$allowedVerificationStatuses = @("verified", "artifact-supported", "self-reported", "unverified", "not-applicable")
$allowedImplementationStatuses = @("implemented", "completed-project", "documented-demonstration", "simulated", "proposed", "not-applicable")
$allowedDataClassifications = @("professional", "synthetic", "mixed", "not-applicable")
$allowedOutcomeStatuses = @("verified", "artifact-supported", "self-reported", "unverified", "synthetic", "not-applicable")
$allowedCredentialStatuses = @("verified", "artifact-supported", "self-reported", "unverified")

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

    $pattern = '(?m)^\s*' + [regex]::Escape($Key) + ':\s*"?([^"\r\n]+)"?\s*$'
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
    "profile.yml",
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

$profileContent = Get-Content -LiteralPath (Join-Path $sourceRoot "_data\profile.yml") -Raw -Encoding utf8
foreach ($requiredProfileField in @("name", "role", "value_proposition", "supporting_statement", "location_label")) {
    if ([string]::IsNullOrWhiteSpace((Get-ScalarValue -Content $profileContent -Key $requiredProfileField))) {
        $failures.Add("Profile is missing required field: $requiredProfileField")
    }
}
if ((Get-ScalarValue -Content $profileContent -Key "name") -ne "Nina Suico") {
    $failures.Add("Canonical public profile name must be Nina Suico")
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

foreach ($credentialBlock in [regex]::Matches($credentialContent, '(?ms)^- id:\s*[^\r\n]+\r?\n(?<record>.*?)(?=^- id:|\z)')) {
    $record = $credentialBlock.Value
    $credentialId = [regex]::Match($record, '(?m)^- id:\s*["'']?([^"''\s]+)').Groups[1].Value
    $credentialStatus = Get-ScalarValue -Content $record -Key "credential_status"
    $verificationStatus = Get-ScalarValue -Content $record -Key "verification_status"
    if ([string]::IsNullOrWhiteSpace($credentialStatus) -or $allowedCredentialStatuses -notcontains $credentialStatus) {
        $failures.Add("Credential '$credentialId' has missing or invalid credential_status")
    }
    if ([string]::IsNullOrWhiteSpace($verificationStatus) -or $allowedVerificationStatuses -notcontains $verificationStatus) {
        $failures.Add("Credential '$credentialId' has missing or invalid verification_status")
    }
    if ($record -match '(?im)^\s*status:\s*approved\s*$' -and
        $verificationStatus -eq "verified" -and
        [string]::IsNullOrWhiteSpace((Get-ScalarValue -Content $record -Key "evidence_url"))) {
        $failures.Add("Published verified credential '$credentialId' must include evidence_url")
    }
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
$caseStudyArtifacts = [System.Collections.Generic.List[string]]::new()

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
        $workKind = Get-ScalarValue -Content $frontMatter -Key "work_kind"
        $evidenceStatus = Get-ScalarValue -Content $frontMatter -Key "evidence_status"
        $verificationStatus = Get-ScalarValue -Content $frontMatter -Key "verification_status"
        $implementationStatus = Get-ScalarValue -Content $frontMatter -Key "implementation_status"
        $dataClassification = Get-ScalarValue -Content $frontMatter -Key "data_classification"
        $outcomeStatus = Get-ScalarValue -Content $frontMatter -Key "outcome_status"
        $disclosure = Get-ScalarValue -Content $frontMatter -Key "disclosure"
        $artifactUrl = Get-ScalarValue -Content $frontMatter -Key "artifact_url"
        $artifactLabel = Get-ScalarValue -Content $frontMatter -Key "artifact_label"
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
        if ($allowedWorkKinds -notcontains $workKind) {
            $failures.Add("Work document has missing or invalid work_kind: $($file.Name)")
        }
        if ($allowedEvidenceStatuses -notcontains $evidenceStatus) {
            $failures.Add("Work document has missing or invalid evidence_status: $($file.Name)")
        }
        if ($allowedVerificationStatuses -notcontains $verificationStatus) {
            $failures.Add("Work document has missing or invalid verification_status: $($file.Name)")
        }
        if ($allowedImplementationStatuses -notcontains $implementationStatus) {
            $failures.Add("Work document has missing or invalid implementation_status: $($file.Name)")
        }
        if ($allowedDataClassifications -notcontains $dataClassification) {
            $failures.Add("Work document has missing or invalid data_classification: $($file.Name)")
        }
        if ($allowedOutcomeStatuses -notcontains $outcomeStatus) {
            $failures.Add("Work document has missing or invalid outcome_status: $($file.Name)")
        }
        if ($status -eq "approved" -and
            ($workKind -eq "portfolio-simulation" -or $dataClassification -eq "synthetic") -and
            ($disclosure -notmatch '(?i)synthetic|simulat')) {
            $failures.Add("Published simulation or synthetic work lacks a disclosure: $($file.Name)")
        }
        if ($frontMatter -match '(?m)^date:\s*["'']?\d{4}-\d{2}["'']?\s*$') {
            $failures.Add("Collection document uses an incomplete reserved Jekyll date: $($file.Name)")
        }
        if ($collection -eq "case_studies" -and $status -eq "approved") {
            $rawDocument = Get-Content -LiteralPath $file.FullName -Raw -Encoding utf8
            $body = [regex]::Replace($rawDocument, '(?s)^---\s*.*?\s*---\s*', '')
            if ([string]::IsNullOrWhiteSpace((Get-ScalarValue -Content $frontMatter -Key "summary")) -or
                [string]::IsNullOrWhiteSpace($body)) {
                $failures.Add("Published case study is empty or missing its summary: $($file.Name)")
            }
            if ([string]::IsNullOrWhiteSpace($artifactUrl) -or $artifactUrl -notmatch '^/assets/case-studies/[^/]+\.pdf$') {
                $failures.Add("Published case study has a missing or invalid artifact_url: $($file.Name)")
            } else {
                $artifactPath = Join-Path $sourceRoot $artifactUrl.TrimStart('/')
                if (-not (Test-Path -LiteralPath $artifactPath -PathType Leaf)) {
                    $failures.Add("Published case study PDF does not exist: $artifactUrl")
                }
                $caseStudyArtifacts.Add($artifactUrl)
            }
            if ([string]::IsNullOrWhiteSpace($artifactLabel) -or $artifactLabel -notmatch '(?i)PDF') {
                $failures.Add("Published case study needs a descriptive PDF artifact_label: $($file.Name)")
            }
            if ($workKind -eq "portfolio-simulation" -and $outcomeStatus -notin @("synthetic", "not-applicable")) {
                $failures.Add("Portfolio simulation has an outcome status that could imply realized results: $($file.Name)")
            }
            if ($body -match '\d+(?:\.\d+)?\s*%') {
                $failures.Add("Published case-study summary contains a percentage metric requiring evidence review: $($file.Name)")
            }
            if ($body -match '(?i)\b(?:achieved|resulted in|reduced by|increased by|saved)\b') {
                $failures.Add("Published simulation may state an outcome as realized: $($file.Name)")
            }
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

foreach ($duplicate in @($caseStudyArtifacts | Group-Object | Where-Object Count -gt 1)) {
    $failures.Add("Case-study PDF is associated with multiple canonical records: $($duplicate.Name)")
}
$caseStudyPdfDirectory = Join-Path $sourceRoot "assets\case-studies"
foreach ($pdf in Get-ChildItem -LiteralPath $caseStudyPdfDirectory -Filter "*.pdf" -File) {
    $publicPath = "/assets/case-studies/$($pdf.Name)"
    if (@($caseStudyArtifacts | Where-Object { $_ -eq $publicPath }).Count -ne 1) {
        $failures.Add("Case-study PDF must be associated with exactly one approved canonical record: $publicPath")
    }
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
if ($config -notmatch '(?ms)case_studies:\s*\r?\n\s+output:\s+true\s*\r?\n\s+permalink:\s*/work/:slug/') {
    $failures.Add("Case-study collection must output at /work/:slug/")
}
if ($config -notmatch '(?ms)projects:\s*\r?\n\s+output:\s+true\s*\r?\n\s+permalink:\s*/work/:slug/') {
    $failures.Add("Project collection must output at /work/:slug/")
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
$groupedWork = Get-Content -LiteralPath (Join-Path $sourceRoot "_includes\grouped-work.html") -Raw -Encoding utf8
if ($workPage -notmatch 'include\s+grouped-work\.html' -or
    $groupedWork -notmatch "site\.projects\s*\|\s*where:\s*'status',\s*'approved'" -or
    $groupedWork -notmatch "site\.case_studies\s*\|\s*where:\s*'status',\s*'approved'") {
    $failures.Add("Work page and grouped work include must filter projects and case studies to approved status")
}

$navigationContent = Get-Content -LiteralPath (Join-Path $sourceRoot "_data\navigation.yml") -Raw -Encoding utf8
foreach ($requiredRoute in @("/", "/work/", "/about/", "/contact/")) {
    if ($navigationContent -notmatch ('(?m)^\s*url:\s*' + [regex]::Escape($requiredRoute) + '\s*$')) {
        $failures.Add("Primary navigation is missing required route: $requiredRoute")
    }
}
if ($navigationContent -match '(?m)^\s*url:\s*/(?:operations|services)/\s*$') {
    $failures.Add("Unfinished Operations or Services page appears in primary navigation")
}

$publicTextFiles = @(
    Join-Path $sourceRoot "index.md"
    Join-Path $sourceRoot "_config.yml"
    Get-ChildItem -LiteralPath (Join-Path $sourceRoot "_data") -File | Select-Object -ExpandProperty FullName
    Get-ChildItem -LiteralPath (Join-Path $sourceRoot "_includes") -File | Select-Object -ExpandProperty FullName
    Get-ChildItem -LiteralPath (Join-Path $sourceRoot "_layouts") -File | Select-Object -ExpandProperty FullName
    Get-ChildItem -LiteralPath (Join-Path $sourceRoot "work") -File -Recurse | Select-Object -ExpandProperty FullName
    Get-ChildItem -LiteralPath (Join-Path $sourceRoot "about") -File -Recurse | Select-Object -ExpandProperty FullName
    Get-ChildItem -LiteralPath (Join-Path $sourceRoot "contact") -File -Recurse | Select-Object -ExpandProperty FullName
    Get-ChildItem -LiteralPath (Join-Path $sourceRoot "_projects") -Filter "*.md" -File | Select-Object -ExpandProperty FullName
    Get-ChildItem -LiteralPath (Join-Path $sourceRoot "_case_studies") -Filter "*.md" -File | Select-Object -ExpandProperty FullName
)
foreach ($publicTextFile in $publicTextFiles) {
    $publicText = Get-Content -LiteralPath $publicTextFile -Raw -Encoding utf8
    if ($publicText -match '(?i)Salesforce\s+(?:Certified\s+)?Administrator|Salesforce\s+certification') {
        $failures.Add("Prohibited Salesforce credential language in publishable source: $publicTextFile")
    }
    if ($publicText -match 'Niña|Peterine|Sheen') {
        $failures.Add("Non-canonical public name in publishable source: $publicTextFile")
    }
    $withoutAllowedGithubIdentity = $publicText -replace '(?i)https?://[^\s"'']*xxReina-28[^\s"'']*', ''
    if ($withoutAllowedGithubIdentity -match '(?i)\bReina\b') {
        $failures.Add("Non-canonical Reina display name in publishable source: $publicTextFile")
    }
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output "Content validation passed: $($groupCapabilityIds.Count) capability groups, $($projectRecords.Count) projects, $($caseStudyRecords.Count) case studies, and approved-only publication guards."
