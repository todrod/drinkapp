param(
    [Parameter(Mandatory = $true)][string]$Frames,
    [string]$Destination = 'assets',
    [string]$Work = '..\orb-render\encoding',
    [ValidateRange(480,800)][int]$Width = 640,
    [ValidateRange(1,100)][int]$Quality = 90,
    [ValidateSet('cyclic','gifski')][string]$Encoder = 'cyclic',
    [string]$Python = ''
)
$ErrorActionPreference = 'Stop'
$orbTools = Get-Content -LiteralPath (Join-Path $env:USERPROFILE 'Tools\DrinkShaker\installed-tools.json') -Raw | ConvertFrom-Json
$orbSource = (Resolve-Path -LiteralPath $Frames).Path
foreach ($orbIndex in 1..301) {
    if (-not (Test-Path -LiteralPath (Join-Path $orbSource ('orb_{0:D4}.png' -f $orbIndex)))) {
        throw 'Render all 300 frames and diagnostic frame 301 before encoding.'
    }
}
$orbWorkPath = if ([IO.Path]::IsPathRooted($Work)) { [IO.Path]::GetFullPath($Work) } else { [IO.Path]::GetFullPath((Join-Path (Get-Location) $Work)) }
$orbEncodingFrames = Join-Path $orbWorkPath "frames-$Width"
New-Item -ItemType Directory -Force -Path $orbEncodingFrames, $Destination | Out-Null
$orbFfmpeg = $orbTools.ffmpeg.path
$orbProbe = Join-Path (Split-Path -Parent $orbFfmpeg) 'ffprobe.exe'
& $orbFfmpeg -hide_banner -loglevel error -y -framerate 25 -start_number 1 -i (Join-Path $orbSource 'orb_%04d.png') -frames:v 300 -vf "scale=${Width}:${Width}:flags=lanczos,format=rgb24" (Join-Path $orbEncodingFrames 'orb_%04d.png')
if ($LASTEXITCODE -ne 0) { throw 'Frame conversion failed' }
$orbFiles = @(Get-ChildItem -LiteralPath $orbEncodingFrames -Filter 'orb_*.png' | Sort-Object Name | ForEach-Object { $_.Name })
if ($orbFiles.Count -ne 300) { throw 'Exactly 300 frames are required; use a clean encoding directory.' }
if ($Encoder -eq 'cyclic') {
    $orbGlobalPalette = Join-Path $orbWorkPath "orb-global-${Width}.gif"
    & $orbFfmpeg -hide_banner -loglevel error -y -filter_complex_threads 2 -framerate 25 -start_number 1 -i (Join-Path $orbEncodingFrames 'orb_%04d.png') -filter_complex '[0:v]split[a][b];[a]palettegen=max_colors=256:stats_mode=full:reserve_transparent=0[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle' -frames:v 300 -loop 0 $orbGlobalPalette
    if ($LASTEXITCODE -ne 0) { throw 'Shared palette generation failed' }
    $orbCandidate = Join-Path $orbWorkPath "orb-cyclic-${Width}.gif"
    $orbPython = if ($Python) { $Python } elseif ($orbTools.python.path) { $orbTools.python.path } else { 'python' }
    & $orbPython (Join-Path $PSScriptRoot 'quantize-orb.py') --input $orbGlobalPalette --output $orbCandidate --frames $orbSource
    if ($LASTEXITCODE -ne 0) { throw 'Cyclic color quantization failed' }
    $orbEncodingReceipt = Get-Content -LiteralPath ([IO.Path]::ChangeExtension($orbCandidate, 'json')) -Raw | ConvertFrom-Json
} else {
    $orbCandidate = Join-Path $orbWorkPath "orb-${Width}-q${Quality}.gif"
    Push-Location -LiteralPath $orbEncodingFrames
    try {
        & $orbTools.gifski.path --fps 25 --width $Width --height $Width --quality $Quality --motion-quality 100 --lossy-quality 100 --fixed-color 000000 --repeat 0 --output $orbCandidate @orbFiles
        if ($LASTEXITCODE -ne 0) { throw 'GIF encoding failed' }
    } finally { Pop-Location }
    $orbEncodingReceipt = @{ encoder = 'Gifski'; width = $Width; height = $Width; frames = 300; fps = 25; seconds = 12; quality = $Quality; motionQuality = 100; lossyQuality = 100; loop = 'infinite' }
}
$orbVideo = (& $orbProbe -v error -ignore_loop 1 -count_frames -select_streams v:0 -show_entries stream=width,height,nb_read_frames -show_entries format=duration -of json $orbCandidate | ConvertFrom-Json)
$orbBytes = (Get-Item -LiteralPath $orbCandidate).Length
if ($orbVideo.streams[0].nb_read_frames -ne 300 -or [Math]::Abs([double]$orbVideo.format.duration - 12) -gt .01) { throw 'Encoded frame count or duration is incorrect' }
if ($orbBytes -gt 15000000) { throw "GIF is $orbBytes bytes; encode at a lower palette quality or pixel width before publishing the asset." }
Copy-Item -LiteralPath $orbCandidate -Destination (Join-Path $Destination 'magic-orb.gif') -Force
& $orbFfmpeg -hide_banner -loglevel error -y -i (Join-Path $orbEncodingFrames 'orb_0001.png') -frames:v 1 (Join-Path $Destination 'magic-orb-poster.png')
if ($LASTEXITCODE -ne 0) { throw 'Poster creation failed' }
$orbEncodingReceipt | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $orbWorkPath 'encoded.json') -Encoding UTF8
Write-Output "Published $Width px GIF, 300 frames / 12 seconds, $orbBytes bytes. Verify visual quality and the seam before committing."
