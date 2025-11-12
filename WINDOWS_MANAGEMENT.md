# Gestione Finestre Windows - Documentazione

## 📋 Panoramica

L'app offre 3 modi per gestire le finestre Windows:

### 1️⃣ **Lista Finestre Aperte** (`list-windows.ps1`)
**Cosa fa:** Ottiene lista di tutte le finestre con titolo visibile

**Output:**
```json
[
  {
    "process": "chrome",
    "title": "Google Chrome - Stack Overflow",
    "pid": 12345
  },
  {
    "process": "notepad",
    "title": "Untitled - Notepad",
    "pid": 6789
  }
]
```

**Uso diretto:**
```powershell
.\list-windows.ps1
```

**Uso via API:**
```bash
curl http://127.0.0.1:3000/api/windows -H "X-API-Key: your-key"
```

**A cosa serve:**
- Scoprire quali finestre sono disponibili
- Ottenere titoli esatti per focus-window.ps1
- Debugging
- Mostrare finestre disponibili nell'UI

---

### 2️⃣ **Focus per Titolo** (`focus-window.ps1`)
**Cosa fa:** Cerca finestra per titolo parziale e la porta in primo piano

**Uso:**
```powershell
.\focus-window.ps1 -WindowTitle "Chrome"
.\focus-window.ps1 -WindowTitle "Notepad"
.\focus-window.ps1 -WindowTitle "Visual Studio Code"
```

**Come funziona:**
1. Cerca processi con `MainWindowTitle` che contiene il testo
2. Prende la prima finestra trovata
3. Ripristina se minimizzata (`ShowWindow`)
4. Porta in primo piano (`SetForegroundWindow`)

**Vantaggi:**
- ✅ Non serve conoscere PID
- ✅ Cerca per nome parziale (es. "Chrome" trova "Google Chrome - ...")

**Svantaggi:**
- ❌ Se ci sono più finestre con stesso titolo, prende la prima
- ❌ Non controllabile quale istanza specifica

**Uso in config.json:**
```json
{
  "id": 7,
  "name": "Focus Chrome",
  "command": "powershell.exe -ExecutionPolicy Bypass -File focus-window.ps1 -WindowTitle Chrome",
  "icon": "https://example.com/chrome.png",
  "requiresConfirmation": false,
  "description": "Porta Chrome in primo piano"
}
```

---

### 3️⃣ **Focus per PID** (`focus-window-by-pid.ps1`) ⭐ NOVITÀ
**Cosa fa:** Porta in primo piano finestra specifica tramite Process ID

**Uso:**
```powershell
.\focus-window-by-pid.ps1 -PID 12345
```

**Vantaggi:**
- ✅ **Precisione assoluta** - porta in primo piano ESATTAMENTE il processo lanciato
- ✅ **Integrazione perfetta con API** - usi il PID restituito dal comando
- ✅ Nessuna ambiguità

**Svantaggi:**
- ❌ Devi conoscere il PID
- ❌ Se il processo non ha finestra (background service), fallisce

**Uso via API:**

#### Step 1: Lancia app e ottieni PID
```bash
curl -X POST http://127.0.0.1:3000/api/commands/4 \
  -H "X-API-Key: your-secret-api-key-here"
```

**Response:**
```json
{
  "success": true,
  "pid": 12345,
  "command": "Notepad",
  "message": "Notepad avviato con successo"
}
```

#### Step 2: Porta in primo piano
```bash
curl -X POST http://127.0.0.1:3000/api/focus/12345 \
  -H "X-API-Key: your-secret-api-key-here"
```

**Response:**
```json
{
  "success": true,
  "message": "Finestra portata in primo piano",
  "pid": 12345
}
```

---

## 🎨 Interfaccia Web

Nell'UI, ogni comando in esecuzione mostra:
- **▶ Esegui** - Lancia il comando (disabled se già running)
- **🔍 Focus** - Porta in primo piano (usa PID automaticamente)
- **⏹ Stop** - Termina il processo

Il bottone **Focus** è:
- ✅ Abilitato solo se il processo è in esecuzione
- ✅ Usa automaticamente il PID tracciato dal server
- ✅ Un click e porta la finestra davanti

---

## 🔧 Implementazione Tecnica

### Win32 API utilizzate

Entrambi gli script usano P/Invoke per chiamare Win32 API:

```csharp
[DllImport("user32.dll")]
public static extern bool SetForegroundWindow(IntPtr hWnd);

[DllImport("user32.dll")]
public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
```

**SetForegroundWindow:**
- Porta finestra in primo piano
- Attiva la finestra
- Dà focus input

**ShowWindow:**
- `SW_RESTORE = 9` - Ripristina se minimizzata
- `SW_SHOW = 5` - Mostra finestra

### Process.MainWindowHandle

```powershell
$process = Get-Process -Id $PID
$hwnd = $process.MainWindowHandle  # IntPtr della finestra principale
```

**Attenzione:**
- Processi background (servizi) hanno `MainWindowHandle = 0`
- App console hanno finestra, ma potrebbe essere nascosta
- App GUI (notepad, calc, chrome) hanno sempre MainWindowHandle valido

---

## 📊 Confronto Metodi

| Metodo | Use Case | Precisione | API Integration |
|--------|----------|------------|-----------------|
| **list-windows** | Discovery | N/A | ✅ Ottimo per UI |
| **focus-window** (titolo) | Comandi manuali | ⚠️ Prima match | ❌ Ambiguo |
| **focus-window-by-pid** | Dopo lancio API | ✅ Esatto | ✅ Perfetto |

---

## 💡 Esempi Pratici

### Scenario 1: Lancia e porta in primo piano
```bash
# Lancia Notepad
RESPONSE=$(curl -s -X POST http://127.0.0.1:3000/api/commands/4 \
  -H "X-API-Key: your-key")

# Estrai PID
PID=$(echo $RESPONSE | jq -r '.pid')

# Aspetta che la finestra si apra
sleep 1

# Porta in primo piano
curl -X POST http://127.0.0.1:3000/api/focus/$PID \
  -H "X-API-Key: your-key"
```

### Scenario 2: Lista finestre e focus su specifica
```bash
# Lista tutte le finestre
curl http://127.0.0.1:3000/api/windows -H "X-API-Key: your-key"

# Output: Trova il PID di Chrome (es. 8888)

# Porta Chrome in primo piano
curl -X POST http://127.0.0.1:3000/api/focus/8888 \
  -H "X-API-Key: your-key"
```

### Scenario 3: Task switcher custom
```javascript
// Ottieni finestre aperte
const windows = await fetch('/api/windows', {
  headers: { 'X-API-Key': apiKey }
}).then(r => r.json());

// Mostra menu
windows.windows.forEach(w => {
  console.log(`${w.pid}: ${w.title}`);
});

// User sceglie PID 12345
await fetch('/api/focus/12345', {
  method: 'POST',
  headers: { 'X-API-Key': apiKey }
});
```

---

## 🚨 Gestione Errori

### focus-window-by-pid.ps1

**Errore: Processo non trovato**
```
Exit Code: 1
Message: "Errore: Processo con PID 12345 non trovato"
```
→ Processo terminato o PID invalido

**Errore: Nessuna finestra principale**
```
Exit Code: 1
Message: "Processo PID 12345 non ha una finestra principale"
```
→ Processo background/servizio senza GUI

**Errore: Impossibile portare in primo piano**
```
Exit Code: 1
Message: "Impossibile portare in primo piano (PID: 12345)"
```
→ Windows ha bloccato l'operazione (focus steal protection)

### API `/api/focus/:pid`

**400 Bad Request**
```json
{ "success": false, "error": "PID non valido" }
```

**404 Not Found**
```json
{ "success": false, "error": "Processo non trovato" }
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Impossibile portare finestra in primo piano",
  "details": "Processo PID 12345 non ha una finestra principale"
}
```

---

## 🔐 Sicurezza

**Focus steal protection:**
Windows può bloccare `SetForegroundWindow` se:
- L'app chiamante non è in foreground
- L'utente sta attivamente usando un'altra app
- Timeout restrizioni attive

**Mitigazioni:**
- `ShowWindow(SW_RESTORE)` prima di `SetForegroundWindow`
- Sleep 100ms tra le chiamate
- Retry logic (non implementato, ma possibile)

**Permessi:**
- ✅ Non richiede permessi amministratore
- ✅ Funziona con processi dello stesso utente
- ❌ Non può fare focus su processi di altri utenti

---

## 📝 Note Implementative

1. **Tracking PID:** Il server traccia PID in `runningApps[cmdId]`
2. **Process cleanup:** Ogni 30s verifica se processi esistono ancora
3. **UI auto-refresh:** Ogni 5s aggiorna stato comandi (running/stopped)
4. **Bottone Focus:** Abilitato solo se `cmd.isRunning === true`

---

## 🎯 Raccomandazioni

✅ **Usa `focus-window-by-pid.ps1`** quando:
- Hai appena lanciato un'app tramite API
- Vuoi controllo preciso su quale istanza
- Integri con automazione

✅ **Usa `focus-window.ps1`** quando:
- Comando manuale/script standalone
- Non hai accesso al PID
- Basta trovare "una" finestra con quel nome

✅ **Usa `list-windows.ps1`** quando:
- Debugging
- Discovery di finestre disponibili
- UI picker per selezione manuale
