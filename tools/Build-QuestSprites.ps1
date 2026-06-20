# Extract quest item sprite rects from ripped Unity JSON and copy atlas PNGs.
param(
    [string]$RippedDir = (Join-Path $PSScriptRoot "..\..\ripped\Assets\#Art\Sprites\Items"),
    [string]$OutJson = (Join-Path $PSScriptRoot "..\src\data\quest-sprites.json"),
    [string]$OutCss = (Join-Path $PSScriptRoot "..\src\styles\quest-sprites.css"),
    [string]$PublicSprites = (Join-Path $PSScriptRoot "..\public\sprites"),
    [string]$AssetBase = "/blasphemous2-save-analyzer/",
    [int]$Scale = 2
)

$ErrorActionPreference = "Stop"
$nodeScript = Join-Path $PSScriptRoot "build-quest-sprites.mjs"
node $nodeScript $RippedDir $OutJson $OutCss $PublicSprites $AssetBase $Scale
