Get-CarbonEnvironment qa-1 | Connect-CarbonEnvironment
$StorageAccountName = 'carbonstatic'
$Keys = Get-AzureRmStorageAccountKey -ResourceGroupName "carbon-common" -Name $StorageAccountName
$k = $Keys[0].value
node .\uploadFonts.js --account carbonstatic --key $k --folder ..\other
node .\uploadFonts.js --account carbonstatic --key $k --folder ..\ofl
node .\uploadFonts.js --account carbonstatic --key $k --folder ..\apache