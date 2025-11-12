# Script PowerShell per portare una finestra in primo piano
# Uso: .\focus-window.ps1 "Nome Parziale Finestra"

param(
    [Parameter(Mandatory=$true)]
    [string]$WindowTitle
)

Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  public class Win32 {
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    
    public const int SW_RESTORE = 9;
  }
"@

try {
    # Cerca il processo con finestra corrispondente
    $process = Get-Process | Where-Object { $_.MainWindowTitle -like "*$WindowTitle*" } | Select-Object -First 1
    
    if ($process) {
        $hwnd = $process.MainWindowHandle
        
        if ($hwnd -ne [IntPtr]::Zero) {
            # Ripristina la finestra se minimizzata
            [Win32]::ShowWindow($hwnd, [Win32]::SW_RESTORE) | Out-Null
            
            # Porta in primo piano
            [Win32]::SetForegroundWindow($hwnd) | Out-Null
            
            Write-Host "Finestra '$($process.MainWindowTitle)' portata in primo piano" -ForegroundColor Green
            exit 0
        } else {
            Write-Host "Processo trovato ma senza finestra principale" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "Nessuna finestra trovata con titolo: $WindowTitle" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Errore: $_" -ForegroundColor Red
    exit 1
}
