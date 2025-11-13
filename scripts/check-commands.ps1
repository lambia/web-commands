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
        
        # Estrai comando (rimuove solo argomenti, mantieni path se presente)
        $cmdParts = $cmdFull -split '\s+' | Select-Object -First 1  # Rimuove argomenti
        $commandClean = $cmdParts.Trim()
        
        if (-not $commandClean) {
            continue
        }
        
        # Normalizza per confronto case-insensitive
        $commandLower = $commandClean.ToLower()
        
        # Estrai anche varianti per matching flessibile
        $commandFileName = Split-Path -Leaf $commandClean  # Es: "notepad.exe" o "notepad"
        $commandFileNameLower = $commandFileName.ToLower()
        
        $commandNoExt = [System.IO.Path]::GetFileNameWithoutExtension($commandFileName)  # Es: "notepad"
        $commandNoExtLower = $commandNoExt.ToLower()
        
        # Cerca processi che matchano
        $matchingProcesses = Get-Process | Where-Object { 
            try {
                if ($_.Path) {
                    $procPathLower = $_.Path.ToLower()
                    
                    # 1. Match esatto path completo: "c:\percorso\notepad.exe" == "c:\percorso\notepad.exe"
                    if ($procPathLower -eq $commandLower) {
                        return $true
                    }
                    
                    # 2. Match nome file con estensione: "notepad.exe" == basename del path processo
                    $procFileName = [System.IO.Path]::GetFileName($procPathLower)
                    if ($procFileName -eq $commandFileNameLower) {
                        return $true
                    }
                    
                    # 3. Match nome senza estensione: "notepad" == basename senza .exe
                    $procFileNoExt = [System.IO.Path]::GetFileNameWithoutExtension($procPathLower)
                    if ($procFileNoExt -eq $commandNoExtLower) {
                        return $true
                    }
                    
                    # 4. Match parziale per UWP (CalculatorApp contiene "calc")
                    if ($procFileNoExt -like "*$commandNoExtLower*") {
                        return $true
                    }
                }
            } catch {
                # Ignora errori (processi di sistema senza accesso)
            }
            return $false
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
