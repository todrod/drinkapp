# Official portable releases, installed per user without changing system policy.
$ErrorActionPreference = 'Stop'
$orbToolsRoot = Join-Path $env:USERPROFILE 'Tools\DrinkShaker'
$orbDownloads = Join-Path $orbToolsRoot 'downloads'
New-Item -ItemType Directory -Force -Path $orbDownloads | Out-Null

function Get-OrbToolFile([string]$url, [string]$path) {
    if (-not (Test-Path -LiteralPath $path)) {
        & curl.exe --location --fail --silent --show-error --retry 2 --output $path $url
        if ($LASTEXITCODE -ne 0) { throw "Download failed: $url" }
    }
}
function Assert-OrbHash([string]$path, [string]$expected) {
    if (-not $expected -or (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash -ne $expected) {
        throw "Checksum mismatch: $path"
    }
}

$orbBlenderUrl = 'https://download.blender.org/release/Blender4.5/blender-4.5.14-windows-x64.zip'
$orbBlenderZip = Join-Path $orbDownloads 'blender-4.5.14-windows-x64.zip'
Get-OrbToolFile $orbBlenderUrl $orbBlenderZip
$orbBlenderHashes = (Invoke-WebRequest -UseBasicParsing 'https://download.blender.org/release/Blender4.5/blender-4.5.14.sha256').Content
$orbBlenderHash = [regex]::Match($orbBlenderHashes, '(?m)^([a-fA-F0-9]{64})\s+\*?blender-4\.5\.14-windows-x64\.zip\s*$').Groups[1].Value
Assert-OrbHash $orbBlenderZip $orbBlenderHash
$orbBlenderBin = Join-Path $orbToolsRoot 'blender-4.5.14-windows-x64'
if (-not (Test-Path -LiteralPath (Join-Path $orbBlenderBin 'blender.exe'))) {
    & tar.exe -xf $orbBlenderZip -C $orbToolsRoot
    if ($LASTEXITCODE -ne 0) { throw 'Blender extraction failed' }
}

$orbFfmpegUrl = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip'
$orbFfmpegZip = Join-Path $orbDownloads 'ffmpeg-release-essentials.zip'
Get-OrbToolFile $orbFfmpegUrl $orbFfmpegZip
$orbFfmpegHashes = (Invoke-WebRequest -UseBasicParsing "$orbFfmpegUrl.sha256").Content
Assert-OrbHash $orbFfmpegZip ([regex]::Match($orbFfmpegHashes, '[a-fA-F0-9]{64}').Value)
$orbFfmpegDirectory = Get-ChildItem -LiteralPath $orbToolsRoot -Filter 'ffmpeg-*-essentials_build' -Directory | Select-Object -First 1
if (-not $orbFfmpegDirectory) {
    & tar.exe -xf $orbFfmpegZip -C $orbToolsRoot
    if ($LASTEXITCODE -ne 0) { throw 'FFmpeg extraction failed' }
    $orbFfmpegDirectory = Get-ChildItem -LiteralPath $orbToolsRoot -Filter 'ffmpeg-*-essentials_build' -Directory | Select-Object -First 1
}
$orbFfmpegBin = Join-Path $orbFfmpegDirectory.FullName 'bin'

$orbGifskiUrl = 'https://github.com/ImageOptim/gifski/releases/download/1.34.0/gifski-1.34.0.tar.xz'
$orbGifskiArchive = Join-Path $orbDownloads 'gifski-1.34.0.tar.xz'
Get-OrbToolFile $orbGifskiUrl $orbGifskiArchive
$orbGifskiRelease = Invoke-RestMethod 'https://api.github.com/repos/ImageOptim/gifski/releases/tags/1.34.0'
$orbGifskiAsset = $orbGifskiRelease.assets | Where-Object name -eq 'gifski-1.34.0.tar.xz'
if ($orbGifskiAsset.digest -match '^sha256:(.*)$') { Assert-OrbHash $orbGifskiArchive $Matches[1] }
$orbGifskiDirectory = Join-Path $orbToolsRoot 'gifski-1.34.0'
New-Item -ItemType Directory -Force -Path $orbGifskiDirectory | Out-Null
if (-not (Test-Path -LiteralPath (Join-Path $orbGifskiDirectory 'win\gifski.exe'))) {
    & tar.exe -xf $orbGifskiArchive -C $orbGifskiDirectory
    if ($LASTEXITCODE -ne 0) { throw 'Gifski extraction failed' }
}
$orbGifskiBin = Join-Path $orbGifskiDirectory 'win'

$orbPythonBin = Join-Path $orbToolsRoot 'authoring-python\Scripts'
$orbPython = Join-Path $orbPythonBin 'python.exe'
if (-not (Test-Path -LiteralPath $orbPython)) {
    & (Join-Path $orbBlenderBin '4.5\python\bin\python.exe') -m venv (Join-Path $orbToolsRoot 'authoring-python')
    if ($LASTEXITCODE -ne 0) { throw 'Authoring Python environment creation failed' }
}
& $orbPython -m pip install --disable-pip-version-check --quiet Pillow==12.3.0 numpy==2.3.5
if ($LASTEXITCODE -ne 0) { throw 'Authoring image dependencies failed to install' }

$orbUserPaths = @([Environment]::GetEnvironmentVariable('Path', 'User') -split ';' | Where-Object { $_ })
foreach ($orbBin in @($orbBlenderBin, $orbFfmpegBin, $orbGifskiBin)) {
    if ($orbUserPaths -notcontains $orbBin) { $orbUserPaths += $orbBin }
}
[Environment]::SetEnvironmentVariable('Path', ($orbUserPaths -join ';'), 'User')
$orbReceipt = @{
    blender = @{ path = (Join-Path $orbBlenderBin 'blender.exe'); url = $orbBlenderUrl; sha256 = $orbBlenderHash }
    ffmpeg = @{ path = (Join-Path $orbFfmpegBin 'ffmpeg.exe'); url = $orbFfmpegUrl; sha256 = (Get-FileHash -LiteralPath $orbFfmpegZip).Hash }
    gifski = @{ path = (Join-Path $orbGifskiBin 'gifski.exe'); url = $orbGifskiUrl; sha256 = (Get-FileHash -LiteralPath $orbGifskiArchive).Hash }
    python = @{ path = $orbPython; pillow = '12.3.0'; numpy = '2.3.5'; base = 'Blender bundled Python' }
}
$orbReceipt | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $orbToolsRoot 'installed-tools.json') -Encoding UTF8
& $orbReceipt.blender.path --version | Select-Object -First 1
& $orbReceipt.ffmpeg.path -version | Select-Object -First 1
& $orbReceipt.gifski.path --version
Write-Output "Installed in $orbToolsRoot. Open a new terminal to use the PATH entries."
