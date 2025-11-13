# Web Commands v2.2# Web Commands



Server Express.js per eseguire comandi Windows tramite API REST con interfaccia web.Server Express.js per eseguire comandi Windows tramite API REST con interfaccia web.



## 📋 Prerequisiti## 🚀 Caratteristiche



- Node.js >= 18.0.0- **API REST sicura** con autenticazione tramite API Key

- Windows (per l'esecuzione dei comandi Windows)- **Rate limiting** per protezione da abusi

- Privilegi amministratore (per installazione come servizio)- **CORS configurabile** per accessi cross-origin

- **Logging strutturato** con Winston (file e console)

## 🔧 Installazione- **Tracking processi** con verifica automatica dello stato

- **Interfaccia web moderna** per gestire i comandi

1. Clona o scarica il repository- **Graceful shutdown** per chiusura pulita del server

2. Installa le dipendenze:- **Installabile come servizio Windows** con node-windows



```powershell## 📋 Prerequisiti

npm install

```- Node.js >= 18.0.0

- Windows (per l'esecuzione dei comandi Windows)

3. Configura l'API Key in `config.json`:- Privilegi amministratore (per installazione come servizio)



```json## 🔧 Installazione

{

  "apiKey": "your-secret-api-key-here"1. Clona o scarica il repository

}2. Installa le dipendenze:

```

```powershell

### Installazione come servizio Windowsnpm install

```

Esegui con privilegi amministratore:

3. Configura l'API Key in `config.json`:

```powershell

npm run install-service```json

```{

  "apiKey": "your-secret-api-key-here"

Per disinstallare:}

```

```powershell

npm run uninstall-service## 🎯 Utilizzo

```

### Avvio normale

## 🎯 Utilizzo

```powershell

### Avvio normalenpm start

```

```powershell

npm start### Avvio con auto-restart (sviluppo)

```

```powershell

### Avvio con auto-restart (sviluppo)npm run dev

```

```powershell

npm run dev### Installazione come servizio Windows

```

```powershell

## 🌐 Interfaccia Webnpm run install-service

```

Apri il browser su: `http://localhost:3000`

### Disinstallazione servizio

**Tecnologia:** Vue.js 3 (CDN)

```powershell

L'interfaccia permette di:npm run uninstall-service

- Visualizzare tutti i comandi disponibili```

- Eseguire comandi con un click

- Portare finestre in primo piano (Focus)## 🌐 Interfaccia Web

- Terminare processi in esecuzione

- Vedere statistiche in tempo realeApri il browser su: `http://localhost:3000`

- Conferma richiesta per comandi critici (shutdown, sleep, hibernate)

- Alert system con notifiche auto-dismiss**Tecnologia:** Vue.js 3 (CDN)



### Struttura FrontendL'interfaccia permette di:

- Visualizzare tutti i comandi disponibili

```- Eseguire comandi con un click

public/- Portare finestre in primo piano (Focus)

├── index.html              # Entry point HTML- Terminare processi in esecuzione

├── css/- Vedere statistiche in tempo reale

│   └── main.css           # Stili completi dell'app- Conferma richiesta per comandi critici (shutdown, sleep, hibernate)

└── js/- Alert system con notifiche auto-dismiss

    ├── app.js             # Vue app principale

    └── components/**Struttura:**

        └── CommandCard.js # Componente carta comando- `public/index.html` - Entry point HTML

```- `public/js/app.js` - Vue app principale

- `public/js/components/CommandCard.js` - Componente carta comando

### Componenti- `public/css/main.css` - Stili completi



#### 1. **App Root** (`js/app.js`)Vedi [FRONTEND_VUE.md](FRONTEND_VUE.md) per documentazione dettagliata.

**Responsabilità:**

- Gestione autenticazione## 🔐 API Endpoints

- State management (commands, alerts, server status)

- API calls (fetch)Tutti gli endpoint richiedono l'header `X-API-Key` con la chiave configurata.

- Auto-refresh ogni 5 secondi

- Alert system con auto-dismiss### Health Check

```

**Data:**GET /api/health

```javascript```

{

    authenticated: false,### Lista comandi

    apiKey: '',```

    commands: [],GET /api/commands

    serverOnline: false,Headers: X-API-Key: your-secret-api-key-here

    alerts: [],```

    // ...

}### Esegui comando

``````

POST /api/commands/:id

**Computed:**Headers: X-API-Key: your-secret-api-key-here

- `runningCount` - Conta comandi in esecuzione```



**Methods:**### Termina processo

- `authenticate()` - Login con API key```

- `loadCommands()` - Fetch comandi da APIPOST /api/commands/:id/kill

- `executeCommand()` - Lancia comandoHeaders: X-API-Key: your-secret-api-key-here

- `focusWindow()` - Porta finestra in primo piano```

- `killCommand()` - Termina processo

- `showAlert()` - Mostra notifica### Processi in esecuzione

```

#### 2. **CommandCard** (`js/components/CommandCard.js`)GET /api/running

**Responsabilità:**Headers: X-API-Key: your-secret-api-key-here

- Visualizzazione singolo comando```

- UI per status (running/stopped)

- Bottoni azione (execute, focus, kill)### Lista finestre Windows aperte

- Gestione immagini con fallback```

GET /api/windows

**Props:**Headers: X-API-Key: your-secret-api-key-here

```javascriptResponse: { success: true, windows: [{process, title, pid}] }

{```

    command: {

        id: Number,### Porta finestra in primo piano (tramite PID)

        name: String,```

        icon: String,POST /api/focus/:pid

        description: String,Headers: X-API-Key: your-secret-api-key-here

        isRunning: Boolean,Response: { success: true, message: "Finestra portata in primo piano", pid: 12345 }

        pid: Number,```

        requiresConfirmation: Boolean

    }## ⚙️ Configurazione

}

```Il file `config.json` permette di configurare:



**Emits:**- **port**: Porta del server (default: 3000)

- `@execute(id, name, requiresConfirmation)`- **apiKey**: Chiave per autenticazione API

- `@focus(pid, name)`- **corsOrigins**: Array di origini permesse

- `@kill(id, name)`- **rateLimitWindowMs**: Finestra temporale rate limit (ms)

- **rateLimitMaxRequests**: Numero massimo richieste per finestra

### Data Flow- **commands**: Array di comandi disponibili



```### Esempio comando:

┌─────────────┐

│   App Root  │ ← API calls, State management```json

└──────┬──────┘{

       │  "id": 1,

       │ props (command)  "name": "Shutdown",

       ↓  "command": "shutdown /s /t 0",

┌─────────────┐  "icon": "https://example.com/shutdown-icon.png",

│ CommandCard │ → emits (execute, focus, kill)  "requiresConfirmation": true,

└─────────────┘  "description": "Spegne il computer immediatamente"

       │}

       │ events```

       ↑

┌──────┴──────┐**Nota:** Le icone sono URL di immagini, non emoji. L'UI mostra le immagini con dimensione 80x80px.

│   App Root  │ ← Handles events, updates state

└─────────────┘## 📊 Logging

```

I log vengono stampati sulla console in tempo reale.

### API Integration Frontend

**File logging disabilitato** per ridurre I/O su disco:

**Headers:** Tutte le richieste includono `X-API-Key: ${apiKey}`- `error.log` - Disabilitato (commentato in server.js)

- `combined.log` - Disabilitato (commentato in server.js)

**Endpoints usati:**- Console - Output in tempo reale ✅

- `GET /api/health` - Verifica server online

- `GET /api/commands` - Carica lista comandi e stato running## 🔒 Sicurezza

- `POST /api/commands/:id` - Esegue comando, ritorna `{success, pid}`

- `POST /api/focus/:pid` - Porta finestra in primo piano- **Autenticazione**: API Key obbligatoria

- `POST /api/commands/:id/kill` - Termina processo- **Rate Limiting**: Protezione da attacchi brute force

- **CORS**: Controllo origini permesse

**Refresh automatico:**- **Helmet**: Headers di sicurezza HTTP

- Ogni 5 secondi chiama `loadCommands()` per aggiornare stato comandi in esecuzione- **Validazione input**: Verifica parametri richieste

- **Process isolation**: Processi spawn in modalità detached

## 🔐 API Endpoints- **Loopback Only**: Server ascolta SOLO su 127.0.0.1 (NON accessibile da rete esterna)



Tutti gli endpoint richiedono l'header `X-API-Key` con la chiave configurata.## 🛠️ Personalizzazione



### Health CheckPer aggiungere nuovi comandi, modifica l'array `commands` in `config.json`:

```

GET /api/health```json

```{

  "id": 7,

### Lista comandi  "name": "Nome Comando",

```  "command": "comando.exe",

GET /api/commands  "icon": "https://example.com/icon.png",

Headers: X-API-Key: your-secret-api-key-here  "requiresConfirmation": false,

```  "description": "Descrizione del comando"

}

### Esegui comando```

```

POST /api/commands/:id### Gestione Finestre Windows

Headers: X-API-Key: your-secret-api-key-here

```L'app include funzionalità per portare finestre in primo piano:



### Termina processo```json

```{

POST /api/commands/:id/kill  "id": 8,

Headers: X-API-Key: your-secret-api-key-here  "name": "Focus Chrome",

```  "command": "powershell.exe -ExecutionPolicy Bypass -File scripts\\focus-window.ps1 -WindowTitle Chrome",

  "icon": "https://example.com/chrome-icon.png",

### Processi in esecuzione  "requiresConfirmation": false,

```  "description": "Porta Chrome in primo piano"

GET /api/running}

Headers: X-API-Key: your-secret-api-key-here```

```

**Script disponibili** (nella cartella `scripts/`):

### Lista finestre Windows aperte- `start-and-track-process.ps1` - Avvia processo e rileva PID finale (gestisce UWP apps)

```- `focus-window.ps1` - Porta una finestra in primo piano (cerca per titolo)

GET /api/windows- `focus-window-by-pid.ps1` - Porta una finestra in primo piano tramite PID

Headers: X-API-Key: your-secret-api-key-here- `list-windows.ps1` - Lista tutte le finestre aperte con PID e titoli

Response: { success: true, windows: [{process, title, pid}] }

```**Gestione app UWP (Calculator, Paint):**

Lo script `start-and-track-process.ps1` rileva automaticamente le app UWP che:

### Porta finestra in primo piano (tramite PID)- Usano un processo host temporaneo che termina subito

```- Il processo reale è ApplicationFrameHost con PID diverso

POST /api/focus/:pid- Possono avere multiple finestre nello stesso processo

Headers: X-API-Key: your-secret-api-key-here

Response: { success: true, message: "Finestra portata in primo piano", pid: 12345 }Il rilevamento è completamente dinamico, senza hardcoding di app specifiche.

```

**Uso API per focus tramite PID:**

## ⚙️ ConfigurazioneQuando lanci un comando tramite API, ricevi il PID. Puoi poi usare `/api/focus/:pid` per portare quella finestra in primo piano:



Il file `config.json` permette di configurare:```bash

# 1. Lancia un'app

- **port**: Porta del server (default: 3000)curl -X POST http://127.0.0.1:3000/api/commands/4 -H "X-API-Key: your-key"

- **apiKey**: Chiave per autenticazione API# Response: { "success": true, "pid": 12345 }

- **corsOrigins**: Array di origini permesse

- **rateLimitWindowMs**: Finestra temporale rate limit (ms)# 2. Porta in primo piano tramite PID

- **rateLimitMaxRequests**: Numero massimo richieste per finestracurl -X POST http://127.0.0.1:3000/api/focus/12345 -H "X-API-Key: your-key"

- **commands**: Array di comandi disponibili```



### Esempio comando:Nell'interfaccia web, ogni app in esecuzione ha un bottone **🔍 Focus** che automaticamente porta la finestra in primo piano!



```json## 📝 Note

{

  "id": 1,- I processi vengono tracciati e verificati ogni 30 secondi

  "name": "Shutdown",- I processi terminati automaticamente vengono rimossi dalla lista

  "command": "shutdown /s /t 0",- Il server supporta graceful shutdown con SIGTERM/SIGINT

  "icon": "https://example.com/shutdown-icon.png",- Comandi critici richiedono conferma sia via API che via UI

  "requiresConfirmation": true,

  "description": "Spegne il computer immediatamente"## 🐛 Troubleshooting

}

```### Server non si avvia

- Verifica che la porta 3000 sia libera

**Nota:** Le icone sono URL di immagini, non emoji. L'UI mostra le immagini con dimensione 80x80px.- Controlla i log in `error.log`



## 📊 Logging### Comandi non si eseguono

- Verifica l'API Key

I log vengono stampati sulla console in tempo reale.- Controlla i permessi Windows

- Vedi i log per dettagli errori

**File logging disabilitato** per ridurre I/O su disco:

- `error.log` - Disabilitato (commentato in server.js)### Servizio Windows non si installa

- `combined.log` - Disabilitato (commentato in server.js)- Esegui come Amministratore

- Console - Output in tempo reale ✅- Verifica node-windows sia installato



## 🔒 Sicurezza## 📄 Licenza



- **Autenticazione**: API Key obbligatoriaMIT

- **Rate Limiting**: Protezione da attacchi brute force (30 req/min per IP)
- **CORS**: Controllo origini permesse (default: localhost:3000)
- **Helmet**: Headers di sicurezza HTTP (X-Frame-Options, X-Content-Type-Options, etc.)
- **Validazione input**: Verifica parametri richieste
- **Process isolation**: Processi spawn in modalità detached
- **Loopback Only**: Server ascolta SOLO su 127.0.0.1 (NON accessibile da rete esterna)

### Raccomandazioni Sicurezza

1. **API Key:**
   - Generare con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Salvare in file `.env` (non commitato)
   - Usare `dotenv` per caricare

2. **CORS:**
   - Attualmente limitato a `localhost:3000` ✅
   - Con loopback binding, CORS è meno critico

3. **Rate Limiting:**
   - 30 richieste/minuto per IP ✅
   - Previene brute force API key

4. **Logging:**
   - Tutti i tentativi non autorizzati loggati ✅
   - Monitorare console output

5. **Comandi critici:**
   - Shutdown, Sleep, Hibernate richiedono conferma ✅
   - Aggiungere `requiresConfirmation: true` per nuovi comandi pericolosi

## 🪟 Gestione Finestre Windows

L'app offre gestione completa delle finestre Windows con supporto per app UWP (Calculator, Paint, etc.).

### Script PowerShell

**Script disponibili** (nella cartella `scripts/`):
- `start-and-track-process.ps1` - Avvia e traccia processi (gestisce UWP)
- `list-windows.ps1` - Lista finestre aperte
- `focus-window-by-pid.ps1` - Focus per PID

### Gestione App UWP (Calculator, Paint)

#### Problema
Le app UWP moderne hanno un'architettura complessa:
- Usano un **processo host temporaneo** che termina subito dopo il lancio
- Il processo reale è **ApplicationFrameHost** con PID diverso
- Un singolo ApplicationFrameHost può ospitare **multiple finestre** (stesso PID)

**Esempio Calculator:**
```
calc.exe (PID 1000) → lancia e termina
└─> ApplicationFrameHost (PID 2000) ← finestra visibile
    ├─> CalculatorApp (PID 3000) ← background, nessuna finestra
    └─> CalculatorApp (PID 4000) ← background, nessuna finestra
```

#### Soluzione: start-and-track-process.ps1

**Rilevamento dinamico senza hardcoding:**
1. Salva lista finestre esistenti prima del lancio
2. Lancia il processo con `Start-Process -PassThru`
3. Attende 1500ms per stabilizzazione
4. Confronta nuove finestre apparse
5. Se processo iniziale morto + ApplicationFrameHost presente → app UWP
6. Ritorna PID finale (ApplicationFrameHost) + titolo finestra

**Output:**
```json
{
  "success": true,
  "pid": 2000,
  "initialPid": 1000,
  "processName": "ApplicationFrameHost",
  "windowTitle": "Calculator"
}
```

**Funziona con:**
- ✅ App UWP (Calculator, Paint, Windows Terminal, etc.)
- ✅ App Win32 tradizionali (Notepad, Chrome, etc.)
- ✅ App già aperte (trova finestra esistente)
- ✅ Qualsiasi app Windows (nessun mapping hardcoded)

### 1️⃣ Lista Finestre Aperte (`list-windows.ps1`)

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
.\scripts\list-windows.ps1
```

**Uso via API:**
```bash
curl http://127.0.0.1:3000/api/windows -H "X-API-Key: your-key"
```

### 2️⃣ Focus per PID (`focus-window-by-pid.ps1`)

**Cosa fa:** Porta in primo piano finestra specifica tramite Process ID

**Uso:**
```powershell
.\scripts\focus-window-by-pid.ps1 -ProcessPid 12345
.\scripts\focus-window-by-pid.ps1 -ProcessPid 12345 -WindowTitle "Calculator"  # Fallback per UWP
```

**Parametri:**
- `-ProcessPid` (obbligatorio): PID del processo
- `-WindowTitle` (opzionale): Titolo finestra per fallback se PID non ha finestra
- `-ProcessName` (opzionale): Nome processo per fallback

**Logica fallback:**
1. Prova focus con PID esatto
2. Se fallisce + WindowTitle fornito → cerca per titolo finestra
3. Se fallisce + ProcessName fornito → cerca per nome processo

**Vantaggi:**
- ✅ **Precisione assoluta** - porta in primo piano ESATTAMENTE il processo lanciato
- ✅ **Integrazione perfetta con API** - usi il PID restituito dal comando
- ✅ Nessuna ambiguità

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

### UI Web per Focus

Nell'interfaccia web, ogni comando in esecuzione mostra:
- **▶ Esegui** - Lancia il comando (disabled se già running)
- **🔍 Focus** - Porta in primo piano (usa PID automaticamente)
- **⏹ Stop** - Termina il processo

Il bottone **Focus** è:
- ✅ Abilitato solo se il processo è in esecuzione
- ✅ Usa automaticamente il PID tracciato dal server
- ✅ Un click e porta la finestra davanti

### Gestione Errori

**focus-window-by-pid.ps1:**

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

**API `/api/focus/:pid`:**

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

## 🛠️ Personalizzazione

Per aggiungere nuovi comandi, modifica l'array `commands` in `config.json`:

```json
{
  "id": 7,
  "name": "Nome Comando",
  "command": "comando.exe",
  "icon": "https://example.com/icon.png",
  "requiresConfirmation": false,
  "description": "Descrizione del comando"
}
```

## 📝 Note

- I processi vengono tracciati e verificati ogni 30 secondi
- I processi terminati automaticamente vengono rimossi dalla lista
- Il server supporta graceful shutdown con SIGTERM/SIGINT
- Comandi critici richiedono conferma sia via API che via UI

---

# 📋 Changelog

## v2.2

### 🐛 Fix Critico: Gestione App UWP (Calculator, Paint)
**Problema:** Calculator e Paint non funzionavano con kill/focus perché sono app UWP che usano ApplicationFrameHost
**Soluzione:**
- Creato `scripts/start-and-track-process.ps1` per rilevamento dinamico PID finale
- Rilevamento automatico UWP senza hardcoding (verifica se processo iniziale termina)
- Supporto multiple finestre nello stesso processo ApplicationFrameHost
- Fallback su window title per focus quando PID non è sufficiente

**File modificati:**
- `scripts/start-and-track-process.ps1` - Nuovo script con rilevamento dinamico
- `scripts/focus-window-by-pid.ps1` - Fix variabile `$PID` → `$ProcessPid` (riservata PowerShell)
- `server.js` - Tracking `windowTitle` per fallback, `processExists()` con nome processo

**File eliminati:**
- `start-process-get-pid.ps1` - Sostituito da start-and-track-process.ps1
- `launch-command.ps1` - Non utilizzato
- `focus-window.ps1` - Non utilizzato (solo comandi manuali rimossi)

### 📁 Riorganizzazione Struttura File
**Cosa:** Creata cartella `scripts/` per script PowerShell e servizi Windows
**File spostati:**
- `start-and-track-process.ps1` → `scripts/`
- `focus-window-by-pid.ps1` → `scripts/`
- `list-windows.ps1` → `scripts/`
- `service.install.js` → `scripts/`
- `service.uninstall.js` → `scripts/`

**File modificati:**
- `server.js` - Path aggiornati a `scripts/`
- `config.json` - Rimossi 3 comandi manuali focus (id 7,8,9)
- `package.json` - Script servizio aggiornati a `scripts/`

### 🔇 Logging su File Disabilitato
**Cosa:** Logging su file disabilitato per ridurre I/O disco
**File modificato:** `server.js`
```javascript
// File logging disabled to reduce disk I/O
// new winston.transports.File({ filename: 'error.log', level: 'error' }),
// new winston.transports.File({ filename: 'combined.log' }),
```
Solo console logging attivo ✅

### 📚 Documentazione Unificata
**Cosa:** Tutta la documentazione consolidata in un unico README.md
**File rimossi:**
- `FRONTEND_VUE.md` - Integrato nella sezione "Interfaccia Web"
- `WINDOWS_MANAGEMENT.md` - Integrato nella sezione "Gestione Finestre Windows"
- `CHANGELOG.md` - Integrato alla fine del README

---

## v2.1

### 🖼️ Icon da Emoji a URL Immagini
**Cosa:** Le icone ora sono URL di immagini invece di emoji
**File modificati:**
- `config.json` - Tutte le icone ora usano URL
- `public/index.html` - CSS cambiato per usare `<img>` invece di `<span>`
  - Dimensione: 80x80px
  - Border-radius: 8px
  - Fallback automatico se immagine non carica

**Uso:**
```json
"icon": "https://esempio.com/immagine.png"
```

### 🔒 Server Binding su Loopback ONLY
**Cosa:** Server ora ascolta SOLO su 127.0.0.1 (localhost)
**File modificato:** `server.js`

**Prima:**
```javascript
app.listen(PORT, () => {...})  // Accessibile da tutta la rete!
```

**Dopo:**
```javascript
app.listen(PORT, '127.0.0.1', () => {...})  // SOLO locale!
```

**Risultato:** ✅ Nessun accesso da rete esterna possibile

### 🪟 Gestione Finestre Windows in Primo Piano

**File aggiunti:**
- `focus-window.ps1` - Script PowerShell per portare finestra in primo piano
- `list-windows.ps1` - Script PowerShell per ottenere lista finestre aperte

**Nuovo endpoint API:**
```
GET /api/windows
Headers: X-API-Key: your-key
Response: { success: true, windows: [{process, title, pid}] }
```

**Come funziona:**
1. `list-windows.ps1` ottiene tutte le finestre con titolo visibile
2. `focus-window-by-pid.ps1` porta finestra in primo piano tramite PID
3. Usa Win32 API tramite P/Invoke in PowerShell

---

## 📄 Licenza

MIT
