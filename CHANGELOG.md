# Modifiche Implementate - Web Commands v2.1

## ✅ Modifiche Completate

### 1. 🖼️ Icon da Emoji a URL Immagini
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

### 2. 🔒 Server Binding su Loopback ONLY
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

### 3. 🪟 Gestione Finestre Windows in Primo Piano

**File aggiunti:**
- `focus-window.ps1` - Script PowerShell per portare finestra in primo piano
- `list-windows.ps1` - Script PowerShell per ottenere lista finestre aperte

**Comandi aggiunti in config.json:**
- ID 7: Focus Chrome
- ID 8: Focus Notepad  
- ID 9: Focus Calculator

**Nuovo endpoint API:**
```
GET /api/windows
Headers: X-API-Key: your-key
Response: { success: true, windows: [{process, title, pid}] }
```

**Come funziona:**
1. `list-windows.ps1` ottiene tutte le finestre con titolo visibile
2. `focus-window.ps1` cerca finestra per titolo parziale e la porta in primo piano
3. Usa Win32 API tramite P/Invoke in PowerShell

**Esempio uso:**
```powershell
.\focus-window.ps1 -WindowTitle "Chrome"
```

---

## 📋 Risposte alle Domande

### 🛡️ Helmet - Configurazione
**Dove:** `server.js` - `app.use(helmet())`

**Cosa fa Helmet:**
```javascript
app.use(helmet());  // Attiva di default:
```

- ✅ **X-DNS-Prefetch-Control: off** - Disabilita DNS prefetch
- ✅ **X-Frame-Options: DENY** - Previene clickjacking
- ✅ **X-Content-Type-Options: nosniff** - Previene MIME sniffing
- ✅ **Strict-Transport-Security** - Forza HTTPS (se applicabile)
- ✅ **X-Download-Options: noopen** - IE8+ download handling
- ✅ **X-Permitted-Cross-Domain-Policies: none** - Flash/PDF policy
- ✅ **Referrer-Policy: no-referrer** - Non invia referrer
- ✅ Rimuove header **X-Powered-By: Express**

**Non attivo di default:**
- ❌ Content-Security-Policy (può bloccare inline scripts)

### 🔑 API Key - Secret/Token

**Cos'è:** Token di autenticazione (secret string)

**Dove è definita:** `config.json`
```json
"apiKey": "your-secret-api-key-here"  // ⚠️ CAMBIARE!
```

**Come si usa:**
```javascript
// Client
fetch('/api/commands', {
  headers: {
    'X-API-Key': 'your-secret-api-key-here'
  }
})

// Server
function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== config.apiKey) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }
  next();
}
```

**Sicurezza:**
- ⚠️ È un secret - NON commitare su Git con valore reale
- ⚠️ Cambiare prima dell'uso in produzione
- ⚠️ Usare stringhe lunghe e casuali (es. UUID, JWT)

### 🌐 CORS - Chiamate Esterne

**Dove:** `server.js` - `app.use(cors({...}))`

**Configurazione attuale:**
```javascript
app.use(cors({
  origin: config.corsOrigins || ['http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));
```

**In config.json:**
```json
"corsOrigins": ["http://localhost:3000"]
```

**Cosa significa:**
- ✅ **Solo** richieste da `http://localhost:3000` sono permesse
- ❌ Altre origini ricevono errore CORS
- ✅ Metodi permessi: GET, POST (non DELETE, PUT, etc.)
- ✅ Credentials (cookies) permessi

**Ma attenzione:**
- Con binding su `127.0.0.1` → Solo localhost può comunque connettersi
- CORS protegge browser da richieste cross-origin
- Non protegge da client non-browser (curl, Postman, etc.)

### 🔒 Binding Loopback

**Prima della modifica:**
```javascript
app.listen(3000)  // Equivale a 0.0.0.0:3000
```
- ❌ Accessibile da: localhost, LAN, internet (con port forwarding)
- ❌ PERICOLO: Chiunque sulla rete può eseguire comandi!

**Dopo la modifica:**
```javascript
app.listen(3000, '127.0.0.1')
```
- ✅ Accessibile da: SOLO localhost (127.0.0.1)
- ✅ SICURO: Nessuno da rete esterna può accedere
- ✅ Anche sulla stessa macchina: altre app POSSONO accedere

**Test:**
```powershell
# Da stesso PC - ✅ FUNZIONA
curl http://127.0.0.1:3000/api/health

# Da altro PC sulla LAN - ❌ NON FUNZIONA
curl http://192.168.1.100:3000/api/health
# Connection refused
```

---

## 🎯 Raccomandazioni Sicurezza

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
   - Monitorare `error.log`

5. **Comandi critici:**
   - Shutdown, Sleep, Hibernate richiedono conferma ✅
   - Aggiungere `requiresConfirmation: true` per nuovi comandi pericolosi

---

## 🚀 Prossimi Passi Possibili

1. **Autenticazione JWT** invece di API Key statica
2. **Multiple API Keys** per diversi utenti/app
3. **HTTPS** con certificati self-signed per localhost
4. **WebSocket** per notifiche real-time stato processi
5. **Database** per storico comandi eseguiti
6. **Permissions** per limitare comandi per API key

---

## 📝 Esempio Completo Uso

### 1. Avvio Server
```powershell
npm install
npm start
```

### 2. Apertura UI
```
http://127.0.0.1:3000
```

### 3. API Call Manuale
```powershell
# Lista finestre aperte
curl http://127.0.0.1:3000/api/windows `
  -H "X-API-Key: your-secret-api-key-here"

# Porta Chrome in primo piano (comando ID 7)
curl -X POST http://127.0.0.1:3000/api/commands/7 `
  -H "X-API-Key: your-secret-api-key-here"
```

### 4. Script PowerShell Diretto
```powershell
# Porta qualsiasi finestra in primo piano
.\focus-window.ps1 -WindowTitle "Visual Studio Code"

# Lista tutte le finestre
.\list-windows.ps1
```
