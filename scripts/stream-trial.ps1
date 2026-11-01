[CmdletBinding()]
param([switch]$Restore,[string]$ProfilePath=(Join-Path $env:USERPROFILE '.dsh\profiles\desktop'))
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$trialRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$stateRoot=Join-Path ([IO.Path]::GetFullPath((Join-Path $trialRoot '..'))) '.scratch\ui-smooth-stream-opt'
$stateFile=Join-Path $stateRoot 'runtime-state.json'
$packageFile=Join-Path $ProfilePath 'package.json'
$moduleRoot=Join-Path $ProfilePath 'node_modules'
$modulePath=Join-Path $moduleRoot 'dsh-ui-beautify'
$trialLink='link:'+($trialRoot.Replace('\','/'))
$utf8=New-Object Text.UTF8Encoding($false)
function Save-Package([string]$Before,[string]$Next){
  # Some profiles allow file writes but deny removing directory children.
  # Keep those permissions intact and lock out concurrent writers while the
  # existing metadata file is updated; preserve exact bytes for rollback.
  $handle=New-Object IO.FileStream($packageFile,[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::Read)
  try{
    $original=New-Object byte[] ([int]$handle.Length)
    $offset=0
    while($offset-lt $original.Length){$read=$handle.Read($original,$offset,$original.Length-$offset);if(-not $read){throw 'Could not read complete profile metadata.'};$offset+=$read}
    if($utf8.GetString($original).TrimStart([char]0xFEFF)-ne $Before){throw 'Profile changed concurrently; no package metadata was replaced.'}
    $bytes=$utf8.GetBytes($Next)
    try{$handle.Position=0;$handle.Write($bytes,0,$bytes.Length);$handle.SetLength($bytes.Length);$handle.Flush($true)}
    catch{$handle.Position=0;$handle.Write($original,0,$original.Length);$handle.SetLength($original.Length);$handle.Flush($true);throw}
  }finally{$handle.Dispose()}
}
function With-Dependency([string]$Raw,[string]$Value){
  $pattern='("dsh-ui-beautify"\s*:\s*)"(?:\\.|[^"\\])*"'
  if([regex]::Matches($Raw,$pattern).Count-ne 1){throw 'Expected exactly one dsh-ui-beautify dependency.'}
  $encoded=ConvertTo-Json -InputObject $Value -Compress
  return [regex]::Replace($Raw,$pattern,[Text.RegularExpressions.MatchEvaluator]{param($match) $match.Groups[1].Value+$encoded})
}
if(-not (Test-Path -LiteralPath $packageFile)){throw 'DSH profile package.json was not found.'}
$raw=[IO.File]::ReadAllText($packageFile)
$package=$raw|ConvertFrom-Json
$currentLink=$package.dependencies.'dsh-ui-beautify'
$module=Get-Item -LiteralPath $modulePath -Force
if($module.LinkType-notin @('Junction','SymbolicLink')){throw 'The installed plugin is a physical directory; nothing was moved.'}
$currentTarget=[IO.Path]::GetFullPath(@($module.Target)[0])
$id=[guid]::NewGuid().ToString('N')
New-Item -ItemType Directory -Path $stateRoot -Force|Out-Null
if($Restore){
  if(-not(Test-Path -LiteralPath $stateFile)){throw 'No saved trial wiring was found.'}
  $saved=Get-Content -LiteralPath $stateFile -Raw|ConvertFrom-Json
  if($saved.status-ne 'active'){throw 'The trial wiring is not active.'}
  if($currentLink-ne $trialLink-or $currentTarget-ne $trialRoot){throw 'Plugin wiring changed elsewhere; nothing was restored.'}
  if(-not(Test-Path -LiteralPath $saved.previousJunction)){throw 'The saved original junction was not found.'}
  $original=Get-Item -LiteralPath $saved.previousJunction -Force
  if([IO.Path]::GetFullPath(@($original.Target)[0])-ne $saved.previousTarget){throw 'Saved original junction changed; nothing was restored.'}
  $parked=Join-Path $moduleRoot ('.dsh-ui-beautify.trial-saved-'+$id)
  Rename-Item -LiteralPath $modulePath -NewName ([IO.Path]::GetFileName($parked))
  try{
    Rename-Item -LiteralPath $saved.previousJunction -NewName 'dsh-ui-beautify'
    Save-Package $raw (With-Dependency $raw $saved.previousDependency)
  }catch{
    if(Test-Path -LiteralPath $modulePath){Rename-Item -LiteralPath $modulePath -NewName ([IO.Path]::GetFileName($saved.previousJunction))}
    Rename-Item -LiteralPath $parked -NewName 'dsh-ui-beautify'
    throw
  }
  $saved.status='restored'
  [IO.File]::WriteAllText($stateFile,($saved|ConvertTo-Json -Depth 6),$utf8)
  Write-Output 'Original plugin wiring restored. Restart DSH to load it.'
  exit 0
}
if($currentTarget-eq $trialRoot){Write-Output 'This trial is already active.';exit 0}
if(Test-Path -LiteralPath $stateFile){$prior=Get-Content -LiteralPath $stateFile -Raw|ConvertFrom-Json;if($prior.status-eq 'active'){throw 'Another trial wiring is already active.'}}
$previousJunction=Join-Path $moduleRoot ('.dsh-ui-beautify.before-stream-opt-'+$id)
$staged=Join-Path $moduleRoot ('.dsh-ui-beautify.trial-next-'+$id)
Copy-Item -LiteralPath $packageFile -Destination (Join-Path $stateRoot ('profile-package-before-'+$id+'.json'))
$saved=@{status='prepared';profilePath=$ProfilePath;previousDependency=$currentLink;previousTarget=$currentTarget;previousJunction=$previousJunction;trialRoot=$trialRoot}
[IO.File]::WriteAllText($stateFile,($saved|ConvertTo-Json -Depth 6),$utf8)
New-Item -ItemType Junction -Path $staged -Target $trialRoot|Out-Null
Rename-Item -LiteralPath $modulePath -NewName ([IO.Path]::GetFileName($previousJunction))
try{
  Rename-Item -LiteralPath $staged -NewName 'dsh-ui-beautify'
  Save-Package $raw (With-Dependency $raw $trialLink)
}catch{
  if(Test-Path -LiteralPath $modulePath){Rename-Item -LiteralPath $modulePath -NewName ('.dsh-ui-beautify.trial-failed-'+$id)}
  Rename-Item -LiteralPath $previousJunction -NewName 'dsh-ui-beautify'
  throw
}
$saved.status='active'
[IO.File]::WriteAllText($stateFile,($saved|ConvertTo-Json -Depth 6),$utf8)
Write-Output ('Trial wiring active: '+$trialRoot+'. Restart DSH to load it.')
