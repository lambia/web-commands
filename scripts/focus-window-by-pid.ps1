# Script PowerShell per portare una finestra in primo piano tramite PID
# Uso: .\focus-window-by-pid.ps1 -ProcessPid 12345 [-ProcessName "Calculator"] [-WindowTitle "Calculator"]

param(
    [Parameter(Mandatory=$true)]
    [int]$ProcessPid,
    
    [Parameter(Mandatory=$false)]
    [string]$ProcessName,
    
    [Parameter(Mandatory=$false)]
    [string]$WindowTitle
)

Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  using System.Text;
  public class Win32 {
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    
    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
    
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    
    public const int SW_RESTORE = 9;
    public const int SW_SHOW = 5;
  }
"@

function Get-WindowHandleByPid($targetPid) {
    $script:foundWindows = @()
    $callback = {
        param($hWnd, $lParam)
        
        if ([Win32]::IsWindowVisible($hWnd)) {
            $processId = 0
            [Win32]::GetWindowThreadProcessId($hWnd, [ref]$processId) | Out-Null
            
            if ($processId -eq $targetPid) {
                $title = New-Object System.Text.StringBuilder 256
                [Win32]::GetWindowText($hWnd, $title, $title.Capacity) | Out-Null
                
                if ($title.Length -gt 0) {
                    $script:foundWindows += [PSCustomObject]@{
                        Handle = $hWnd
                        Title = $title.ToString()
                    }
                }
            }
        }
        return $true
    }
    
    [Win32]::EnumWindows($callback, [IntPtr]::Zero) | Out-Null
    
    return $script:foundWindows
}

function Try-FocusProcess($proc) {
    if ($proc -and $proc.MainWindowHandle -ne [IntPtr]::Zero) {
        # Ripristina la finestra se minimizzata
        [Win32]::ShowWindow($proc.MainWindowHandle, [Win32]::SW_RESTORE) | Out-Null
        Start-Sleep -Milliseconds 100
        
        # Porta in primo piano
        $result = [Win32]::SetForegroundWindow($proc.MainWindowHandle)
        
        if ($result) {
            Write-Host "Finestra '$($proc.MainWindowTitle)' (PID: $($proc.Id)) portata in primo piano" -ForegroundColor Green
            return $true
        }
    }
    return $false
}

try {
    # Prova prima con Win32 API per trovare finestre del PID
    $windows = Get-WindowHandleByPid $ProcessPid
    
    if ($windows -and $windows.Count -gt 0) {
        $window = $windows[0]
        Write-Host "Trovata finestra '$($window.Title)' per PID $ProcessPid" -ForegroundColor Green
        
        # Ripristina e porta in primo piano
        [Win32]::ShowWindow($window.Handle, [Win32]::SW_RESTORE) | Out-Null
        Start-Sleep -Milliseconds 100
        $result = [Win32]::SetForegroundWindow($window.Handle)
        
        if ($result) {
            Write-Host "Finestra portata in primo piano con successo" -ForegroundColor Green
            exit 0
        }
    }
    
    # Fallback: prova con Get-Process
    $process = Get-Process -Id $ProcessPid -ErrorAction SilentlyContinue
    
    if (Try-FocusProcess $process) {
        exit 0
    }
    
    # Se il PID non funziona MA abbiamo un WindowTitle, cerca per titolo
    if ($WindowTitle) {
        Write-Host "PID $ProcessPid non trovato o senza finestra, cerco per titolo: $WindowTitle" -ForegroundColor Yellow
        
        # Cerca processi con finestra che contengono il titolo
        $processes = Get-Process | Where-Object { 
            $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -like "*$WindowTitle*"
        }
        
        if ($processes) {
            # Prendi il primo match
            $process = $processes | Select-Object -First 1
            
            if (Try-FocusProcess $process) {
                exit 0
            }
        }
    }
    
    # Se abbiamo solo ProcessName (fallback)
    if ($ProcessName -and -not $WindowTitle) {
        Write-Host "PID $ProcessPid non trovato, cerco per nome: $ProcessName" -ForegroundColor Yellow
        
        # Cerca tutti i processi con quel nome
        $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue | 
                     Where-Object { $_.MainWindowHandle -ne 0 }
        
        if ($processes) {
            # Prendi il primo con finestra
            $process = $processes | Select-Object -First 1
            
            if (Try-FocusProcess $process) {
                exit 0
            }
        }
    }
    
    # Se arriviamo qui, nessun metodo ha funzionato
    if ($WindowTitle) {
        Write-Host "Finestra con titolo '$WindowTitle' non trovata" -ForegroundColor Yellow
    } elseif ($ProcessName) {
        Write-Host "Processo PID $ProcessPid o nome $ProcessName non ha una finestra principale" -ForegroundColor Yellow
    } else {
        Write-Host "Processo PID $ProcessPid non ha una finestra principale" -ForegroundColor Yellow
    }
    exit 1
    
} catch {
    Write-Host "Errore: $_" -ForegroundColor Red
    exit 1
}
