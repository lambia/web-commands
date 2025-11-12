# Frontend Vue.js - Web Commands

## 📁 Struttura

```
public/
├── index.html              # Entry point HTML
├── css/
│   └── main.css           # Stili completi dell'app
└── js/
    ├── app.js             # Vue app principale
    └── components/
        └── CommandCard.js # Componente carta comando
```

## 🎯 Architettura

### Vue 3 Composition
- **Vue 3** caricato da CDN (unpkg)
- **Component-based** con template string
- **Reactive data** con data(), computed, methods
- **Event emitters** per comunicazione componenti

### Componenti

#### 1. **App Root** (`js/app.js`)
**Responsabilità:**
- Gestione autenticazione
- State management (commands, alerts, server status)
- API calls (fetch)
- Auto-refresh ogni 5 secondi
- Alert system con auto-dismiss

**Data:**
```javascript
{
    authenticated: false,
    apiKey: '',
    commands: [],
    serverOnline: false,
    alerts: [],
    // ...
}
```

**Computed:**
- `runningCount` - Conta comandi in esecuzione

**Methods:**
- `authenticate()` - Login con API key
- `loadCommands()` - Fetch comandi da API
- `executeCommand()` - Lancia comando
- `focusWindow()` - Porta finestra in primo piano
- `killCommand()` - Termina processo
- `showAlert()` - Mostra notifica

#### 2. **CommandCard** (`js/components/CommandCard.js`)
**Responsabilità:**
- Visualizzazione singolo comando
- UI per status (running/stopped)
- Bottoni azione (execute, focus, kill)
- Gestione immagini con fallback

**Props:**
```javascript
{
    command: {
        id: Number,
        name: String,
        icon: String,
        description: String,
        isRunning: Boolean,
        pid: Number,
        requiresConfirmation: Boolean
    }
}
```

**Emits:**
- `@execute(id, name, requiresConfirmation)`
- `@focus(pid, name)`
- `@kill(id, name)`

## 🎨 Styling

### CSS Organization
**main.css** è organizzato in sezioni:

1. **Reset & Base** - Reset CSS e body
2. **Header** - Titolo e subtitle
3. **Auth Section** - Schermata login
4. **Buttons** - Stili bottoni (primary, danger, focus)
5. **Alerts** - Notifiche animate
6. **Stats Section** - Card statistiche
7. **Commands Section** - Griglia comandi
8. **Command Card** - Stile singola carta
9. **Responsive** - Media queries
10. **Animations** - Keyframes

### Design System
**Colori:**
- Primary: `#667eea` (blu-viola)
- Success: `#48bb78` (verde)
- Danger: `#f56565` (rosso)
- Warning: `#ed8936` (arancione)
- Background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

**Spacing:**
- Card padding: `25px`
- Gap grid: `20px`
- Border radius: `8px` (small), `15px` (large)

**Shadows:**
- Card: `0 5px 20px rgba(0,0,0,0.1)`
- Hover: `0 10px 30px rgba(0,0,0,0.2)`

## 🔄 Data Flow

```
┌─────────────┐
│   App Root  │ ← API calls, State management
└──────┬──────┘
       │
       │ props (command)
       ↓
┌─────────────┐
│ CommandCard │ → emits (execute, focus, kill)
└─────────────┘
       │
       │ events
       ↑
┌──────┴──────┐
│   App Root  │ ← Handles events, updates state
└─────────────┘
```

## 🚀 Features

### Autenticazione
- Input API key con validazione
- Health check endpoint
- Persiste apiKey in app state
- Enter key per submit

### Gestione Comandi
- Lista comandi da API
- Status real-time (running/stopped)
- PID tracking
- Conferma per comandi critici

### UI/UX
- **Auto-refresh** - Ogni 5s aggiorna comandi
- **Animations** - Transizioni smooth
- **Alerts** - Notifiche auto-dismiss (5s)
- **Responsive** - Mobile-friendly
- **Hover effects** - Feedback visivo
- **Disabled states** - Bottoni disabilitati quando non applicabile

### API Integration
- **GET /api/health** - Check server
- **GET /api/commands** - Lista comandi
- **POST /api/commands/:id** - Esegui comando
- **POST /api/focus/:pid** - Focus finestra
- **POST /api/commands/:id/kill** - Termina processo

## 🔧 Customization

### Aggiungere componenti
```javascript
// 1. Crea componente in js/components/
const MyComponent = {
    name: 'MyComponent',
    props: { /* ... */ },
    template: `<div>...</div>`,
    // ...
};

// 2. Registra in app.js
app.component('my-component', MyComponent);
```

### Modificare stili
Edita `css/main.css` - è organizzato per sezioni

### Cambiare API base
In `app.js`:
```javascript
data() {
    return {
        apiBase: '/api'  // ← Modifica qui
    }
}
```

## 📊 Performance

- **Vue 3** - Più veloce di Vue 2
- **Component reusability** - Una sola definizione CommandCard
- **Computed properties** - Cache automatica
- **Event delegation** - Eventi gestiti da Vue
- **Auto-cleanup** - `beforeUnmount` rimuove interval

## 🐛 Debugging

### Vue DevTools
Usa Vue DevTools browser extension per:
- Ispezionare state
- Vedere events
- Performance profiling

### Console logging
Aggiungi in methods:
```javascript
console.log('State:', this.$data);
console.log('Commands:', this.commands);
```

## 🔐 Sicurezza

- **No eval()** - Template sicuri
- **XSS protection** - Vue escape automatico
- **API key** - Header X-API-Key
- **CORS** - Server configurato per localhost
- **Loopback only** - Server su 127.0.0.1

## 📱 Browser Support

- Chrome/Edge (moderni)
- Firefox (moderni)
- Safari (moderni)
- **NO IE11** (Vue 3 richiede ES6+)

## 🎓 Learning Resources

- [Vue 3 Docs](https://vuejs.org/)
- [Composition API](https://vuejs.org/guide/introduction.html)
- [Component Basics](https://vuejs.org/guide/essentials/component-basics.html)

## ⚡ Future Enhancements

Possibili miglioramenti:
- [ ] Vue Router per multi-page
- [ ] Vuex/Pinia per state management complesso
- [ ] Build process con Vite
- [ ] TypeScript
- [ ] Unit tests (Vitest)
- [ ] Service Worker per offline
- [ ] WebSocket per real-time updates
