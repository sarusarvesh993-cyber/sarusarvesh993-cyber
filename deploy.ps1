#requires -Version 7.2
[CmdletBinding()]
param(
    [string]$ProjectRef,
    [string]$VercelProject,
    [switch]$SkipDatabase,
    [switch]$SkipVercel,
    [switch]$DeployProduction,
    [switch]$ProtectionConfirmed,
    [switch]$Yes
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$RepositoryRoot = (Resolve-Path -LiteralPath $PSScriptRoot).Path

function Write-Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Require-Command([string]$Name, [string]$Recovery) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found. $Recovery"
    }
}

function Invoke-Checked([string]$Name, [string[]]$Arguments, [string]$Recovery = '') {
    Write-Host "+ $Name $($Arguments -join ' ')" -ForegroundColor DarkGray
    & $Name @Arguments
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        $suffix = if ($Recovery) { " Recovery: $Recovery" } else { '' }
        throw "Command '$Name' failed with exit code $exitCode.$suffix"
    }
}

function Confirm-Action([string]$Prompt, [string]$RequiredWord) {
    if ($Yes) { return }
    $answer = Read-Host "$Prompt Type '$RequiredWord' to continue"
    if ($answer -cne $RequiredWord) { throw "Cancelled. No remote change was made for this step." }
}

function Read-EnvFileWithoutPrintingValues([string]$Path) {
    $values = @{}
    foreach ($line in Get-Content -LiteralPath $Path) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$') {
            $key = $Matches[1]
            $value = $Matches[2]
            if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            $values[$key] = $value
        }
    }
    return $values
}

Push-Location -LiteralPath $RepositoryRoot
try {
    if ($DeployProduction -and $SkipVercel) { throw 'Cannot request -DeployProduction together with -SkipVercel.' }
    if ($DeployProduction -and $SkipDatabase) { throw 'Production deployment requires the Supabase migration dry run and history check. Do not combine -DeployProduction with -SkipDatabase.' }

    Write-Step 'Check repository and toolchain'
    if (-not (Test-Path -LiteralPath 'package.json') -or -not (Test-Path -LiteralPath 'supabase/migrations/202610070001_initial_schema.sql')) {
        throw 'Run this script from the UPSC Study Desk repository root; expected package.json and the initial Supabase migration.'
    }
    Require-Command 'git' 'Install Git and reopen PowerShell.'
    Require-Command 'node' 'Install supported Node.js 20.19+, 22.13+, or 24+, then reopen PowerShell.'
    Require-Command 'npm' 'Install npm with Node.js, then reopen PowerShell.'

    $nodeVersion = (& node --version).Trim().TrimStart('v')
    $parsedNodeVersion = [version]$nodeVersion
    $supportedNode = ($parsedNodeVersion.Major -eq 20 -and $parsedNodeVersion -ge [version]'20.19') -or ($parsedNodeVersion.Major -eq 22 -and $parsedNodeVersion -ge [version]'22.13') -or ($parsedNodeVersion.Major -ge 24)
    if (-not $supportedNode) { throw "Node.js 20.19+, 22.13+ or 24+ is required; found $nodeVersion." }

    $rootFromGit = (& git rev-parse --show-toplevel 2>$null)
    if ($LASTEXITCODE -ne 0 -or -not $rootFromGit) { throw 'This folder is not inside a Git working tree.' }
    if ([IO.Path]::GetFullPath($rootFromGit.Trim()) -ne [IO.Path]::GetFullPath($RepositoryRoot)) {
        throw 'The script directory is not the Git repository root. Move to the repository root and rerun; the script will not operate on a parent repository.'
    }
    $branch = (& git branch --show-current).Trim()
    if (-not $branch) { throw 'Git is in a detached-HEAD state. Check out your intended working branch before deploying.' }
    Write-Host "Repository branch: $branch"
    $origin = (& git remote get-url origin 2>$null)
    if ($LASTEXITCODE -eq 0 -and $origin) { Write-Host 'GitHub/Git remote: configured (URL not repeated).' }
    else { Write-Warning 'No origin remote is configured. This script does not create or change GitHub repositories.' }

    if (Get-Command gh -ErrorAction SilentlyContinue) {
        try { Invoke-Checked 'gh' @('auth', 'status', '--hostname', 'github.com') 'Reconnect GitHub in Arena or run gh auth login.' }
        catch { Write-Warning 'GitHub CLI is not authenticated. Database/deployment setup can continue, but GitHub operations need an authenticated gh session.' }
    } else {
        Write-Warning 'GitHub CLI (gh) is not installed. This script will not create or change a GitHub repository.'
    }

    $envPath = Join-Path $RepositoryRoot '.env.local'
    if (-not (Test-Path -LiteralPath $envPath)) {
        Copy-Item -LiteralPath '.env.example' -Destination '.env.local'
        Write-Warning 'Created .env.local from the safe placeholder template. Fill it with your own Supabase owner settings, keep it out of Git, and rerun. No service or account was provisioned.'
        throw 'Setup paused until .env.local is complete.'
    }
    $trackedEnv = & git ls-files --error-unmatch -- '.env.local' 2>$null
    if ($LASTEXITCODE -eq 0) { throw '.env.local is tracked by Git. Remove it from the repository history and rotate any exposed secrets before continuing.' }
    $ignoredEnv = & git check-ignore -q -- '.env.local' 2>$null
    if ($LASTEXITCODE -ne 0) { throw '.env.local is not ignored by Git. Fix .gitignore before placing secrets in it.' }

    $envValues = Read-EnvFileWithoutPrintingValues $envPath
    $requiredEnv = @('SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'OWNER_EMAIL', 'CRON_SECRET')
    $missingEnv = @($requiredEnv | Where-Object { -not $envValues.ContainsKey($_) -or [string]::IsNullOrWhiteSpace($envValues[$_]) })
    if ($missingEnv.Count -gt 0) { throw "Missing required .env.local keys: $($missingEnv -join ', '). Values are never printed by this script." }
    if ($envValues['CRON_SECRET'].Length -lt 32) { throw 'CRON_SECRET must contain at least 32 characters. Generate a fresh random value; the value is not printed.' }
    if ($envValues['SUPABASE_URL'] -notmatch '^https://') { throw 'SUPABASE_URL must use HTTPS.' }
    $placeholderValues = @('your-project-ref', 'your-supabase-publishable-or-anon-key', 'server-only-service-role-secret', 'you@example.com', 'generate-a-long-random-value')
    $hasPlaceholder = $false
    foreach ($key in $requiredEnv) {
        foreach ($placeholder in $placeholderValues) {
            if ($envValues[$key].Contains($placeholder, [StringComparison]::OrdinalIgnoreCase)) { $hasPlaceholder = $true }
        }
    }
    if ($hasPlaceholder -or $envValues['SUPABASE_URL'] -match 'example\.supabase\.co') {
        throw 'One or more required .env.local values still look like placeholders. Replace them with your own values and rerun.'
    }
    $publicSecretKeys = @($envValues.Keys | Where-Object { $_ -match '^NEXT_PUBLIC_.*(SECRET|SERVICE_ROLE|RESEND|PRIVATE_KEY)' })
    if ($publicSecretKeys.Count -gt 0) { throw "Remove public-prefixed secret keys from .env.local: $($publicSecretKeys -join ', '). Key values are not printed." }
    $hasResendKey = -not [string]::IsNullOrWhiteSpace($envValues['RESEND_API_KEY'])
    $hasResendFrom = -not [string]::IsNullOrWhiteSpace($envValues['RESEND_FROM_EMAIL'])
    if ($hasResendKey -xor $hasResendFrom) { throw 'Set both RESEND_API_KEY and RESEND_FROM_EMAIL, or leave both blank. Email is optional.' }
    Write-Host 'Required local environment keys are present (values hidden).'

    Write-Step 'Install dependencies and run verification'
    if (-not (Test-Path -LiteralPath 'package-lock.json')) { throw 'package-lock.json is missing. Restore the lockfile and rerun; deployment uses npm ci for repeatable installs.' }
    Invoke-Checked 'npm' @('ci', '--no-audit', '--no-fund') 'Check npm registry connectivity and retry npm ci.'
    Invoke-Checked 'npm' @('run', 'typecheck') 'Fix TypeScript errors before deploying.'
    Invoke-Checked 'npm' @('run', 'test') 'Fix failing unit tests before deploying.'
    Invoke-Checked 'npm' @('run', 'lint') 'Fix lint errors before deploying.'
    Invoke-Checked 'npm' @('run', 'build') 'Check the build log and server environment, then rerun the failed check.'

    if (-not $SkipDatabase) {
        Write-Step 'Check Supabase and review the pending migration'
        Require-Command 'supabase' 'Install the Supabase CLI, run supabase login, then rerun deploy.ps1.'
        $linkedRefPath = Join-Path $RepositoryRoot 'supabase/.temp/project-ref'
        $linkedRef = if (Test-Path -LiteralPath $linkedRefPath) { (Get-Content -LiteralPath $linkedRefPath -Raw).Trim() } else { '' }
        if (-not $ProjectRef) { $ProjectRef = $linkedRef }
        if (-not $ProjectRef) {
            if ($Yes) { throw 'Pass -ProjectRef when running non-interactively, or run without -Yes and enter the Supabase project ref when prompted.' }
            $ProjectRef = Read-Host 'Supabase project ref from your project URL'
        }
        if ($ProjectRef -notmatch '^[a-zA-Z0-9-]{6,64}$') { throw 'The Supabase project ref format looks invalid. Find it in Project Settings → General and rerun with -ProjectRef.' }
        if ($linkedRef -ne $ProjectRef) {
            Invoke-Checked 'supabase' @('link', '--project-ref', $ProjectRef) 'Run supabase login, confirm the correct project, and rerun. The database password is requested by the Supabase CLI and is not stored by this script.'
        } else { Write-Host 'Supabase project link already matches; no relink needed.' }
        Invoke-Checked 'supabase' @('db', 'push', '--dry-run') 'Check the linked project and migration history before applying changes.'
        Confirm-Action 'Apply the pending SQL migration(s) to the linked Supabase database?' 'APPLY'
        Invoke-Checked 'supabase' @('db', 'push') 'Review Supabase CLI output and project migration history; rerunning after a successful push is safe.'
    } else {
        Write-Warning 'Supabase migration push skipped by -SkipDatabase.'
    }

    if (-not $SkipVercel) {
        Write-Step 'Link and review the Vercel project'
        Require-Command 'vercel' 'Install the Vercel CLI and run vercel login, then rerun deploy.ps1.'
        Invoke-Checked 'vercel' @('whoami') 'Run vercel login with the account that owns the private deployment.'
        if ($VercelProject) {
            Invoke-Checked 'vercel' @('link', '--yes', '--project', $VercelProject) 'Check the project name/team and Vercel account permissions.'
        } elseif (-not (Test-Path -LiteralPath '.vercel/project.json')) {
            if ($Yes) { throw 'Pass -VercelProject for non-interactive linking, or run without -Yes to select the Vercel project interactively.' }
            Invoke-Checked 'vercel' @('link') 'Run vercel login and select the correct project.'
        } else {
            Write-Host 'A Vercel project is already linked in the ignored .vercel directory.'
        }

        Write-Host "`nReview environment variable NAMES for production. This command does not display secret values:" -ForegroundColor Yellow
        Invoke-Checked 'vercel' @('env', 'ls', 'production') 'Add the required variables in Vercel Project Settings → Environment Variables, then rerun.'
        Write-Warning 'Verify the required values are set for the environments you use: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, OWNER_EMAIL and CRON_SECRET. Optional email requires both RESEND variables.'
        Write-Warning 'Before any production deployment, set Vercel Deployment Protection to Vercel Authentication + All Deployments (including production domains), remove shareable links/bypass routes, and grant access only to your account.'

        if ($DeployProduction) {
            if (-not $ProtectionConfirmed) { throw 'Production deploy refused. Complete the manual All Deployments protection check in Vercel, then rerun with -DeployProduction -ProtectionConfirmed.' }
            $workingTree = (& git status --porcelain)
            if ($workingTree) { throw 'Production deploy refused because Git has uncommitted changes. Review, test and commit the intended files, then rerun.' }
            Confirm-Action 'Create/promote a production deployment from this clean, committed checkout?' 'DEPLOY'
            Invoke-Checked 'vercel' @('--prod') 'Review the Vercel build/deployment logs. The local build and database migration have already run.'
        } else {
            Write-Host 'No deployment was requested. Rerun with -DeployProduction only after configuring Vercel access protection and environment variables.' -ForegroundColor Green
        }
    } else {
        Write-Warning 'Vercel linking and deployment skipped by -SkipVercel.'
    }

    Write-Step 'Setup pass finished'
    Write-Host 'The app does not create external accounts, change GitHub repository visibility, configure private deployment access, or email secrets.'
    Write-Host 'Read README.md → Deployment and privacy checks for the remaining dashboard-only steps, verification checklist, and recovery guidance.'
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
