[CmdletBinding()]
param(
    [string]$SiteDirectory = "_site",
    [switch]$SourceOnly
)

$ErrorActionPreference = "Stop"
$contentValidator = Join-Path $PSScriptRoot "validate-content.ps1"
& $contentValidator

if ($SourceOnly) {
    Write-Output "Source-only validation complete."
    exit 0
}

$siteRoot = Join-Path $PSScriptRoot "..\$SiteDirectory"
$siteRoot = [System.IO.Path]::GetFullPath($siteRoot)

if (-not (Test-Path -LiteralPath $siteRoot -PathType Container)) {
    throw "Generated site not found at '$siteRoot'. Run 'bundle exec jekyll build' first."
}

$requiredRoutes = @(
    "index.html",
    "work\index.html",
    "about\index.html",
    "contact\index.html",
    "work\business-operations-diagnostic-process-redesign\index.html",
    "work\revenue-operations-sales-performance-system\index.html",
    "work\strategic-procurement-supplier-decision-system\index.html",
    "work\project-delivery-recovery-scrum-operating-system\index.html"
)

$failures = [System.Collections.Generic.List[string]]::new()

foreach ($route in $requiredRoutes) {
    $routePath = Join-Path $siteRoot $route
    if (-not (Test-Path -LiteralPath $routePath -PathType Leaf)) {
        $failures.Add("Missing route output: $route")
    }
}

$htmlFiles = Get-ChildItem -LiteralPath $siteRoot -Filter "*.html" -File -Recurse
$attributePattern = '(?:href|src)=["'']([^"'']+)["'']'

foreach ($htmlFile in $htmlFiles) {
    $html = Get-Content -LiteralPath $htmlFile.FullName -Raw -Encoding utf8
    foreach ($match in [regex]::Matches($html, $attributePattern, "IgnoreCase")) {
        $url = $match.Groups[1].Value
        if ($url -match '^(?:https?:|mailto:|tel:|data:|#|//)') {
            continue
        }

        $pathOnly = ($url -split '[?#]', 2)[0]
        if ([string]::IsNullOrWhiteSpace($pathOnly)) {
            continue
        }

        if ($pathOnly.StartsWith('/')) {
            $candidate = Join-Path $siteRoot $pathOnly.TrimStart('/')
        } else {
            $candidate = Join-Path $htmlFile.DirectoryName $pathOnly
        }

        $candidate = [System.IO.Path]::GetFullPath($candidate)
        if ($candidate.EndsWith([System.IO.Path]::DirectorySeparatorChar) -or
            (Test-Path -LiteralPath $candidate -PathType Container)) {
            $candidate = Join-Path $candidate "index.html"
        }

        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            $relativeHtml = [System.IO.Path]::GetRelativePath($siteRoot, $htmlFile.FullName)
            $failures.Add("Broken local reference in ${relativeHtml}: $url")
        }
    }
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output "Validated $($requiredRoutes.Count) required routes and local references in $($htmlFiles.Count) HTML files."
