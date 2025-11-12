# Script PowerShell per portare una finestra in primo piano tramite PID
# Uso: .\focus-window-by-pid.ps1 -PID 12345

param(
    [Parameter(Mandatory=$true)]
    [int]$PID
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
    public const int SW_SHOW = 5;
  }
"@

try {
    # Ottieni il processo tramite PID
    $process = Get-Process -Id $PID -ErrorAction Stop
    
    if ($process) {
        $hwnd = $process.MainWindowHandle
        
        if ($hwnd -ne [IntPtr]::Zero) {
            # Ripristina la finestra se minimizzata
            [Win32]::ShowWindow($hwnd, [Win32]::SW_RESTORE) | Out-Null
            Start-Sleep -Milliseconds 100
            
            # Porta in primo piano
            $result = [Win32]::SetForegroundWindow($hwnd)
            
            if ($result) {
                Write-Host "Finestra '$($process.MainWindowTitle)' (PID: $PID) portata in primo piano" -ForegroundColor Green
                exit 0
            } else {
                Write-Host "Impossibile portare in primo piano (PID: $PID)" -ForegroundColor Yellow
                exit 1
            }
        } else {
            Write-Host "Processo PID $PID non ha una finestra principale" -ForegroundColor Yellow
            Write-Host "Nome processo: $($process.ProcessName)" -ForegroundColor Gray
            exit 1
        }
    }
} catch {
    Write-Host "Errore: Processo con PID $PID non trovato" -ForegroundColor Red
    Write-Host "Dettagli: $_" -ForegroundColor Gray
    exit 1
}
