# Web Commands

Server Express.js per eseguire comandi Windows tramite API REST con interfaccia web.

## 🚀 Caratteristiche

- **API REST sicura** con autenticazione tramite API Key
- **Rate limiting** per protezione da abusi
- **CORS configurabile** per accessi cross-origin
- **Logging strutturato** con Winston (file e console)
- **Tracking processi** con verifica automatica dello stato
- **Interfaccia web moderna** per gestire i comandi
- **Graceful shutdown** per chiusura pulita del server
- **Installabile come servizio Windows** con node-windows

## 📋 Prerequisiti

- Node.js >= 18.0.0
- Windows (per l'esecuzione dei comandi Windows)
- Privilegi amministratore (per installazione come servizio)

## 🔧 Installazione

1. Clona o scarica il repository
2. Installa le dipendenze:

```powershell
npm install
```

3. Configura l'API Key in `config.json`:

```json
{
  "apiKey": "your-secret-api-key-here"
}
```

## 🎯 Utilizzo

### Avvio normale

```powershell
npm start
```

### Avvio con auto-restart (sviluppo)

```powershell
npm run dev
```

### Installazione come servizio Windows

```powershell
npm run install-service
```

### Disinstallazione servizio

```powershell
npm run uninstall-service
```

## 🌐 Interfaccia Web

Apri il browser su: `http://localhost:3000`

L'interfaccia permette di:
- Visualizzare tutti i comandi disponibili
- Eseguire comandi con un click
- Terminare processi in esecuzione
- Vedere statistiche in tempo reale
- Conferma richiesta per comandi critici (shutdown, sleep, hibernate)

## 🔐 API Endpoints

Tutti gli endpoint richiedono l'header `X-API-Key` con la chiave configurata.

### Health Check
```
GET /api/health
```

### Lista comandi
```
GET /api/commands
Headers: X-API-Key: your-secret-api-key-here
```

### Esegui comando
```
POST /api/commands/:id
Headers: X-API-Key: your-secret-api-key-here
```

### Termina processo
```
POST /api/commands/:id/kill
Headers: X-API-Key: your-secret-api-key-here
```

### Processi in esecuzione
```
GET /api/running
Headers: X-API-Key: your-secret-api-key-here
```

### Lista finestre Windows aperte
```
GET /api/windows
Headers: X-API-Key: your-secret-api-key-here
Response: { success: true, windows: [{process, title, pid}] }
```

### Porta finestra in primo piano (tramite PID)
```
POST /api/focus/:pid
Headers: X-API-Key: your-secret-api-key-here
Response: { success: true, message: "Finestra portata in primo piano", pid: 12345 }
```

## ⚙️ Configurazione

Il file `config.json` permette di configurare:

- **port**: Porta del server (default: 3000)
- **apiKey**: Chiave per autenticazione API
- **corsOrigins**: Array di origini permesse
- **rateLimitWindowMs**: Finestra temporale rate limit (ms)
- **rateLimitMaxRequests**: Numero massimo richieste per finestra
- **commands**: Array di comandi disponibili

### Esempio comando:

```json
{
  "id": 1,
  "name": "Shutdown",
  "command": "shutdown /s /t 0",
  "icon": "https://example.com/shutdown-icon.png",
  "requiresConfirmation": true,
  "description": "Spegne il computer immediatamente"
}
```

**Nota:** Le icone sono URL di immagini, non emoji. L'UI mostra le immagini con dimensione 80x80px.

## 📊 Logging

I log sono salvati in:
- `error.log` - Solo errori
- `combined.log` - Tutti i log
- Console - Output in tempo reale

## 🔒 Sicurezza

- **Autenticazione**: API Key obbligatoria
- **Rate Limiting**: Protezione da attacchi brute force
- **CORS**: Controllo origini permesse
- **Helmet**: Headers di sicurezza HTTP
- **Validazione input**: Verifica parametri richieste
- **Process isolation**: Processi spawn in modalità detached
- **Loopback Only**: Server ascolta SOLO su 127.0.0.1 (NON accessibile da rete esterna)

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

### Gestione Finestre Windows

L'app include funzionalità per portare finestre in primo piano:

```json
{
  "id": 8,
  "name": "Focus Chrome",
  "command": "powershell.exe -ExecutionPolicy Bypass -File focus-window.ps1 -WindowTitle Chrome",
  "icon": "https://example.com/chrome-icon.png",
  "requiresConfirmation": false,
  "description": "Porta Chrome in primo piano"
}
```

**Script disponibili:**
- `focus-window.ps1` - Porta una finestra in primo piano (cerca per titolo)
- `focus-window-by-pid.ps1` - Porta una finestra in primo piano tramite PID
- `list-windows.ps1` - Lista tutte le finestre aperte

**Uso API per focus tramite PID:**
Quando lanci un comando tramite API, ricevi il PID. Puoi poi usare `/api/focus/:pid` per portare quella finestra in primo piano:

```bash
# 1. Lancia un'app
curl -X POST http://127.0.0.1:3000/api/commands/4 -H "X-API-Key: your-key"
# Response: { "success": true, "pid": 12345 }

# 2. Porta in primo piano tramite PID
curl -X POST http://127.0.0.1:3000/api/focus/12345 -H "X-API-Key: your-key"
```

Nell'interfaccia web, ogni app in esecuzione ha un bottone **🔍 Focus** che automaticamente porta la finestra in primo piano!

## 📝 Note

- I processi vengono tracciati e verificati ogni 30 secondi
- I processi terminati automaticamente vengono rimossi dalla lista
- Il server supporta graceful shutdown con SIGTERM/SIGINT
- Comandi critici richiedono conferma sia via API che via UI

## 🐛 Troubleshooting

### Server non si avvia
- Verifica che la porta 3000 sia libera
- Controlla i log in `error.log`

### Comandi non si eseguono
- Verifica l'API Key
- Controlla i permessi Windows
- Vedi i log per dettagli errori

### Servizio Windows non si installa
- Esegui come Amministratore
- Verifica node-windows sia installato

## 📄 Licenza

MIT
