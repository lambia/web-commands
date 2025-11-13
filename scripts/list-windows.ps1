# list-windows.ps1
# Lista tutte le finestre aperte
$ErrorActionPreference = 'SilentlyContinue'
try {
    $windows = @()
    Get-Process | Where-Object { 
        $_.MainWindowHandle -ne 0 -and 
        $_.MainWindowTitle -ne "" 
    } | ForEach-Object {
        $procPath = ""
        try { $procPath = $_.Path } catch { }
        $windows += @{
            process = $_.ProcessName
            pid = $_.Id
            path = $procPath
        }
    }
    if ($windows.Count -gt 0) {
        $windows | ConvertTo-Json -Compress -Depth 2
    } else {
        Write-Output "[]"
    }
    exit 0
} catch {
    Write-Error "Errore: $_"
    exit 1
}
