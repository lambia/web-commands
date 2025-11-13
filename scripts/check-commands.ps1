# check-commands.ps1
# Verifica quali comandi sono già in esecuzione
# Riceve una lista di comandi in JSON e restituisce i match trovati

param(
    [Parameter(Mandatory=$true)]
    [string]$CommandsJson
)

$ErrorActionPreference = 'SilentlyContinue'

try {
    # Parse dei comandi ricevuti
    $commands = $CommandsJson | ConvertFrom-Json
    $results = @()

    foreach ($cmdObj in $commands) {
        $cmdId = $cmdObj.id
        $cmdFull = $cmdObj.command
        
        # Estrai nome eseguibile (rimuove path, argomenti, .exe)
        $cmdParts = $cmdFull -split '\s+' | Select-Object -First 1  # Rimuove argomenti
        $executable = $cmdParts -replace '^.*[/\\]', ''  # Rimuove path
        $executable = $executable -replace '\.exe$', '' -replace '\.cmd$', '' -replace '\.bat$', ''  # Rimuove estensioni
        
        if (-not $executable) {
            continue
        }
        
        # Cerca processi con nome simile
        $matchingProcesses = Get-Process | Where-Object { 
            $_.ProcessName -like "*$executable*" 
        }
        
        if (-not $matchingProcesses) {
            continue
        }
        
        # Separa processi con/senza finestra
        $processesWithWindow = $matchingProcesses | Where-Object { $_.MainWindowHandle -ne 0 }
        $processesWithoutWindow = $matchingProcesses | Where-Object { $_.MainWindowHandle -eq 0 }
        
        # Caso 1: Processi hanno finestre proprie (app tradizionali)
        if ($processesWithWindow) {
            foreach ($proc in $processesWithWindow) {
                $procPath = ""
                try { $procPath = $proc.Path } catch { }
                
                $results += [PSCustomObject]@{
                    commandId = $cmdId
                    processPid = $proc.Id
                    windowPid = $proc.Id
                    processName = $proc.ProcessName
                    windowProcess = $proc.ProcessName
                    windowTitle = $proc.MainWindowTitle
                    path = $procPath
                    isUWP = $false
                }
            }
        }
        # Caso 2: Processi senza finestra (probabilmente UWP come CalculatorApp)
        elseif ($processesWithoutWindow) {
            # Cerca finestra ApplicationFrameHost con titolo matching
            $uwpWindow = Get-Process | Where-Object { 
                $_.ProcessName -eq "ApplicationFrameHost" -and
                $_.MainWindowTitle -like "*$executable*"
            } | Select-Object -First 1
            
            if ($uwpWindow) {
                # Restituisci un risultato per ogni processo UWP trovato
                # (per kill multiplo se ci sono più istanze)
                foreach ($proc in $processesWithoutWindow) {
                    $procPath = ""
                    try { $procPath = $proc.Path } catch { }
                    
                    $results += [PSCustomObject]@{
                        commandId = $cmdId
                        processPid = $proc.Id
                        windowPid = $uwpWindow.Id
                        processName = $proc.ProcessName
                        windowProcess = $uwpWindow.ProcessName
                        windowTitle = $uwpWindow.MainWindowTitle
                        path = $procPath
                        isUWP = $true
                    }
                }
            }
        }
    }
    
    # Output JSON
    if ($results) {
        $results | ConvertTo-Json -Compress -Depth 2
    } else {
        Write-Output "[]"
    }
    exit 0
    
} catch {
    Write-Error "Errore: $_"
    exit 1
}
