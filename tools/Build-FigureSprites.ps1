# Extract Argent Board figure sprite rects from ripped Unity JSON and copy atlas PNGs.
param(
    [string]$RippedDir = (Join-Path $PSScriptRoot "..\..\ripped\Assets\#Art\Sprites\UI\Argent Board"),
    [string]$OutJson = (Join-Path $PSScriptRoot "..\src\data\figure-sprites.json"),
    [string]$OutCss = (Join-Path $PSScriptRoot "..\src\styles\figure-sprites.css"),
    [string]$PublicSprites = (Join-Path $PSScriptRoot "..\public\sprites"),
    [string]$AssetBase = "/blasphemous2-save-analyzer/",
    [int]$Scale = 2
)

$ErrorActionPreference = "Stop"
$nodeScript = Join-Path $PSScriptRoot "build-figure-sprites.mjs"
node $nodeScript $RippedDir $OutJson $OutCss $PublicSprites $AssetBase $Scale
