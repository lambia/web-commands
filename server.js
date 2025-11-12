const express = require('express');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Setup logger
const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json()
	),
	transports: [
		new winston.transports.File({ filename: 'error.log', level: 'error' }),
		new winston.transports.File({ filename: 'combined.log' }),
		new winston.transports.Console({
			format: winston.format.simple()
		})
	]
});

// Carica configurazione
let config;
try {
	const configPath = path.join(__dirname, 'config.json');
	config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
	logger.info('Configurazione caricata con successo');
} catch (error) {
	logger.error('Errore caricamento configurazione:', error);
	process.exit(1);
}

const app = express();
const PORT = config.port || 3000;

// Middleware di sicurezza - Helmet senza CSP (che blocca inline scripts)
app.use(helmet({
	contentSecurityPolicy: false  // Disabilita CSP per permettere script inline
}));
app.use(cors({
	origin: config.corsOrigins || ['http://localhost:3000'],
	methods: ['GET', 'POST'],
	credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
	windowMs: config.rateLimitWindowMs || 60000,
	max: config.rateLimitMaxRequests || 30,
	message: { success: false, error: 'Troppi tentativi, riprova più tardi' }
});
app.use('/api/', limiter);

// Middleware autenticazione
function authenticate(req, res, next) {
	const apiKey = req.headers['x-api-key'];
	if (!apiKey || apiKey !== config.apiKey) {
		logger.warn(`Tentativo di accesso non autorizzato da ${req.ip}`);
		return res.status(401).json({ success: false, error: 'Non autorizzato' });
	}
	next();
}

// Mappa per tracciare PID
const runningApps = {};

// Verifica se un processo esiste ancora
function processExists(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch (e) {
		return false;
	}
}

// Esegue qualsiasi comando in background senza output
function runCommand(cmd) {
	return new Promise((resolve, reject) => {
		try {
			logger.info(`Esecuzione comando: ${cmd.name} (${cmd.command})`);
			const child = spawn(cmd.command, { 
				shell: true, 
				detached: true, 
				stdio: 'ignore',
				windowsHide: true,
				cwd: __dirname  // Esegue dalla directory del server per script PowerShell
			});
			
			child.on('error', (error) => {
				logger.error(`Errore esecuzione comando ${cmd.name}:`, error);
				reject(error);
			});
			
			child.unref();
			runningApps[cmd.id] = {
				pid: child.pid,
				name: cmd.name,
				startTime: new Date()
			};
			
			logger.info(`Comando ${cmd.name} avviato con PID ${child.pid}`);
			resolve(child.pid);
		} catch (error) {
			logger.error(`Errore spawn comando ${cmd.name}:`, error);
			reject(error);
		}
	});
}

// Termina processo
function killCommand(id) {
	return new Promise((resolve, reject) => {
		const appInfo = runningApps[id];
		if (!appInfo) {
			return reject(new Error('Processo non in esecuzione'));
		}
		
		const pid = appInfo.pid;
		
		// Verifica se il processo esiste ancora
		if (!processExists(pid)) {
			delete runningApps[id];
			return reject(new Error('Processo non più esistente'));
		}
		
		logger.info(`Terminazione processo ${appInfo.name} (PID: ${pid})`);
		
		exec(`taskkill /PID ${pid} /T /F`, (err, stdout, stderr) => {
			if (err) {
				logger.error(`Errore terminazione processo ${pid}:`, err);
				return reject(err);
			}
			delete runningApps[id];
			logger.info(`Processo ${appInfo.name} terminato con successo`);
			resolve(true);
		});
	});
}

// Pulizia processi morti
setInterval(() => {
	for (const [id, appInfo] of Object.entries(runningApps)) {
		if (!processExists(appInfo.pid)) {
			logger.info(`Processo ${appInfo.name} (PID: ${appInfo.pid}) non più attivo, rimozione dalla lista`);
			delete runningApps[id];
		}
	}
}, 30000); // Ogni 30 secondi

// Endpoint: health check
app.get('/api/health', (req, res) => {
	res.json({ 
		success: true, 
		status: 'running',
		uptime: process.uptime(),
		timestamp: new Date().toISOString()
	});
});

// Endpoint: lista comandi
app.get('/api/commands', authenticate, (req, res) => {
	try {
		const commandsWithStatus = config.commands.map(cmd => ({
			...cmd,
			isRunning: runningApps[cmd.id] ? true : false,
			pid: runningApps[cmd.id]?.pid
		}));
		res.json({ success: true, commands: commandsWithStatus });
	} catch (error) {
		logger.error('Errore recupero comandi:', error);
		res.status(500).json({ success: false, error: 'Errore interno del server' });
	}
});

// Endpoint: lista processi in esecuzione
app.get('/api/running', authenticate, (req, res) => {
	try {
		res.json({ success: true, running: runningApps });
	} catch (error) {
		logger.error('Errore recupero processi:', error);
		res.status(500).json({ success: false, error: 'Errore interno del server' });
	}
});

// Endpoint: lista finestre Windows aperte
app.get('/api/windows', authenticate, (req, res) => {
	try {
		logger.info('Richiesta lista finestre aperte');
		const scriptPath = path.join(__dirname, 'list-windows.ps1');
		
		exec(`powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`, (err, stdout, stderr) => {
			if (err) {
				logger.error('Errore lista finestre:', err);
				return res.status(500).json({ success: false, error: 'Errore recupero finestre' });
			}
			
			try {
				const windows = JSON.parse(stdout);
				res.json({ success: true, windows: Array.isArray(windows) ? windows : [windows] });
			} catch (parseError) {
				logger.error('Errore parsing JSON finestre:', parseError);
				res.json({ success: true, windows: [] });
			}
		});
	} catch (error) {
		logger.error('Errore recupero finestre:', error);
		res.status(500).json({ success: false, error: 'Errore interno del server' });
	}
});

// Endpoint: porta in primo piano finestra tramite PID
app.post('/api/focus/:pid', authenticate, async (req, res) => {
	try {
		const pid = parseInt(req.params.pid);
		
		if (isNaN(pid)) {
			return res.status(400).json({ success: false, error: 'PID non valido' });
		}
		
		// Verifica se il processo esiste
		if (!processExists(pid)) {
			return res.status(404).json({ success: false, error: 'Processo non trovato' });
		}
		
		logger.info(`Tentativo focus finestra PID: ${pid}`);
		const scriptPath = path.join(__dirname, 'focus-window-by-pid.ps1');
		
		exec(`powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" -PID ${pid}`, (err, stdout, stderr) => {
			if (err) {
				logger.error(`Errore focus finestra PID ${pid}:`, stderr);
				return res.status(500).json({ 
					success: false, 
					error: 'Impossibile portare finestra in primo piano',
					details: stderr || err.message
				});
			}
			
			logger.info(`Finestra PID ${pid} portata in primo piano`);
			res.json({ 
				success: true, 
				message: 'Finestra portata in primo piano',
				pid: pid
			});
		});
	} catch (error) {
		logger.error('Errore focus finestra:', error);
		res.status(500).json({ success: false, error: 'Errore interno del server' });
	}
});

// Endpoint: esegue comando
app.post('/api/commands/:id', authenticate, async (req, res) => {
	try {
		const cmdId = parseInt(req.params.id);
		
		if (isNaN(cmdId)) {
			return res.status(400).json({ success: false, error: 'ID comando non valido' });
		}
		
		const cmd = config.commands.find(c => c.id === cmdId);
		if (!cmd) {
			return res.status(404).json({ success: false, error: 'Comando non trovato' });
		}
		
		// Verifica se è già in esecuzione
		if (runningApps[cmdId] && processExists(runningApps[cmdId].pid)) {
			return res.status(409).json({ 
				success: false, 
				error: 'Comando già in esecuzione',
				pid: runningApps[cmdId].pid
			});
		}
		
		const pid = await runCommand(cmd);
		res.json({ 
			success: true, 
			pid,
			command: cmd.name,
			message: `${cmd.name} avviato con successo`
		});
	} catch (error) {
		logger.error('Errore esecuzione comando:', error);
		res.status(500).json({ 
			success: false, 
			error: 'Errore esecuzione comando',
			details: error.message
		});
	}
});

// Endpoint: termina comando/app
app.post('/api/commands/:id/kill', authenticate, async (req, res) => {
	try {
		const cmdId = parseInt(req.params.id);
		
		if (isNaN(cmdId)) {
			return res.status(400).json({ success: false, error: 'ID comando non valido' });
		}
		
		await killCommand(cmdId);
		res.json({ 
			success: true,
			message: 'Processo terminato con successo'
		});
	} catch (error) {
		logger.error('Errore terminazione processo:', error);
		res.status(404).json({ 
			success: false, 
			error: error.message
		});
	}
});

// Gestione errori 404
app.use((req, res) => {
	res.status(404).json({ success: false, error: 'Endpoint non trovato' });
});

// Gestione errori generali
app.use((err, req, res, next) => {
	logger.error('Errore non gestito:', err);
	res.status(500).json({ 
		success: false, 
		error: 'Errore interno del server' 
	});
});

// Graceful shutdown
process.on('SIGTERM', () => {
	logger.info('SIGTERM ricevuto, chiusura server...');
	server.close(() => {
		logger.info('Server chiuso');
		process.exit(0);
	});
});

process.on('SIGINT', () => {
	logger.info('SIGINT ricevuto, chiusura server...');
	server.close(() => {
		logger.info('Server chiuso');
		process.exit(0);
	});
});

// Avvio server - SOLO su loopback (127.0.0.1) per sicurezza
const server = app.listen(PORT, '127.0.0.1', () => {
	logger.info(`Server in ascolto su http://127.0.0.1:${PORT} (loopback only)`);
	logger.info(`Caricati ${config.commands.length} comandi`);
	logger.info('⚠️ Server accessibile SOLO localmente, NON dalla rete');
});
