const express = require('express');
const { spawn, exec, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Setup logger
const logger = winston.createLogger({
	level: 'info',  // Tornato a info
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json()
	),
	transports: [
		// File logging disabled to reduce disk I/O
		// new winston.transports.File({ filename: 'error.log', level: 'error' }),
		// new winston.transports.File({ filename: 'combined.log' }),
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

// Rate limiting - DISABILITATO per sviluppo
// const limiter = rateLimit({
// 	windowMs: config.rateLimitWindowMs || 60000,
// 	max: config.rateLimitMaxRequests || 30,
// 	message: { success: false, error: 'Troppi tentativi, riprova più tardi' }
// });
// app.use('/api/', limiter);

// Mappa per tracciare PID
const runningApps = {};

// Verifica se un processo esiste ancora (Windows-compatible)
// Cerca per PID e opzionalmente per nome processo
function processExists(pid, processName = null) {
	if (!pid || isNaN(pid)) return Promise.resolve(false);
	
	return new Promise((resolve) => {
		// Prima prova per PID esatto
		exec(`tasklist /FI "PID eq ${pid}" /NH`, (err, stdout, stderr) => {
			if (err) {
				resolve(false);
				return;
			}
			
			// Se il PID esiste, perfetto
			if (stdout.includes(String(pid))) {
				resolve(true);
				return;
			}
			
			// Se il PID non esiste MA abbiamo un nome processo, cerca per nome
			// (il processo potrebbe essere stato ricreato con nuovo PID)
			if (processName) {
				exec(`tasklist /FI "IMAGENAME eq ${processName}.exe" /NH`, (err2, stdout2) => {
					if (err2) {
						resolve(false);
						return;
					}
					// Se esiste un processo con quel nome, potrebbe essere quello giusto
					resolve(stdout2.includes(`${processName}.exe`));
				});
			} else {
				resolve(false);
			}
		});
	});
}

// Esegue qualsiasi comando in background usando cmd.exe
function runCommand(cmd) {
	return new Promise((resolve, reject) => {
		try {
			logger.info(`Esecuzione comando: ${cmd.name} (${cmd.action?.value})`);
			
			// Se è un comando PowerShell script, eseguilo ma non tracciarlo
			if (cmd.action?.value?.includes('powershell.exe') && cmd.action?.value?.includes('.ps1')) {
				exec(cmd.action.value, { cwd: __dirname }, (err, stdout, stderr) => {
					if (err) {
						logger.error(`Errore esecuzione comando ${cmd.name}:`, stderr || err);
						return reject(err);
					}
					
					logger.info(`Script ${cmd.name} eseguito (non tracciato)`);
					resolve(null); // null = eseguito ma non tracciato
				});
				return;
			}
			
			// Salva finestre esistenti PRIMA del lancio
			exec('powershell.exe -Command "Get-Process | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object Id, MainWindowTitle, ProcessName | ConvertTo-Json"', 
				{ windowsHide: true },
				(err, stdout) => {
					const existingWindows = err ? [] : (() => {
						try {
							const parsed = JSON.parse(stdout);
							return Array.isArray(parsed) ? parsed : [parsed];
						} catch { return []; }
					})();
					
					// Avvia il comando tramite cmd.exe con start
					const cmdCommand = `cmd.exe /c start "" "${cmd.action.value}" ${cmd.action.arguments || ''}`;
					
					// Usa exec ma ignora output (più veloce di spawn detached)
					exec(cmdCommand, { windowsHide: true }, (err, stdout, stderr) => {
						// Logga solo errori veri (non output dell'app)
						if (err && err.code !== 0) {
							const errorMsg = err.message || stderr || 'Unknown error';
							const truncated = errorMsg.length > 128 
								? errorMsg.substring(0, 128) + '...' 
								: errorMsg;
							logger.error(`Errore avvio ${cmd.name}: ${truncated}`);
						}
					});
					
					// Aspetta che l'app si stabilizzi
					setTimeout(() => {
						// Trova NUOVE finestre
						exec('powershell.exe -Command "Get-Process | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object Id, MainWindowTitle, ProcessName | ConvertTo-Json"',
							{ windowsHide: true },
							(err, stdout) => {
									if (err) {
										// Non tracciamo se non possiamo trovare finestre
										logger.warn(`Impossibile tracciare finestra per ${cmd.name}, comando avviato ma non tracciato`);
										return resolve(null); // null = avviato ma non tracciato
									}
									
									try {
										const allWindows = (() => {
											const parsed = JSON.parse(stdout);
											return Array.isArray(parsed) ? parsed : [parsed];
										})();
										
										// Trova finestre nuove
										const newWindows = allWindows.filter(w => 
											!existingWindows.some(ew => ew.Id === w.Id)
										);
										
										if (newWindows.length > 0) {
											const newWindow = newWindows[0];
											runningApps[cmd.id] = {
												pid: newWindow.Id,
												processName: newWindow.ProcessName,
												windowTitle: newWindow.MainWindowTitle,
												name: cmd.name,
												startTime: new Date()
											};
											logger.info(`Comando ${cmd.name} avviato con PID ${newWindow.Id} (${newWindow.ProcessName}, finestra: ${newWindow.MainWindowTitle})`);
											resolve(newWindow.Id);
										} else {
											// Nessuna finestra nuova = comando avviato ma non tracciabile
											logger.warn(`Nessuna nuova finestra per ${cmd.name}, comando avviato ma non tracciato`);
											resolve(null); // null = avviato ma non tracciato
										}
									} catch (parseError) {
										// Errore parsing = comando avviato ma non tracciabile
										logger.warn(`Errore parsing finestre per ${cmd.name}, comando avviato ma non tracciato`);
										resolve(null); // null = avviato ma non tracciato
									}
								}
							);
						}, 1500); // Aspetta 1.5 secondi per stabilizzazione
				}
			);
		} catch (error) {
			logger.error(`Errore esecuzione comando ${cmd.name}:`, error);
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
		
		// Se è uno script, rimuovi solo il tracking (non c'è processo da killare)
		if (appInfo.isScript) {
			logger.info(`Rimozione tracking script ${appInfo.name}`);
			delete runningApps[id];
			return resolve(true);
		}
		
		const pid = appInfo.pid;
		const processName = appInfo.processName;
		
		// Verifica se il processo esiste ancora (cerca per PID o nome)
		processExists(pid, processName).then(exists => {
			if (!exists) {
				delete runningApps[id];
				return reject(new Error('Processo non più esistente'));
			}
			
			logger.info(`Terminazione processo ${appInfo.name} (PID: ${pid}, Nome: ${processName})`);
			
			// Prova prima per PID, poi per nome se fallisce
			exec(`taskkill /PID ${pid} /T /F`, (err, stdout, stderr) => {
				if (err && processName) {
					// Se taskkill per PID fallisce, prova per nome
					logger.warn(`Taskkill per PID ${pid} fallito, provo per nome: ${processName}`);
					exec(`taskkill /IM ${processName}.exe /T /F`, (err2, stdout2, stderr2) => {
						if (err2) {
							logger.error(`Errore terminazione processo ${processName}:`, err2);
							return reject(err2);
						}
						delete runningApps[id];
						logger.info(`Processo ${appInfo.name} terminato con successo (per nome)`);
						resolve(true);
					});
				} else if (err) {
					logger.error(`Errore terminazione processo ${pid}:`, err);
					return reject(err);
				} else {
					delete runningApps[id];
					logger.info(`Processo ${appInfo.name} terminato con successo`);
					resolve(true);
				}
			});
		}).catch(err => reject(err));
	});
}

// Pulizia processi morti
setInterval(async () => {
	for (const [id, appInfo] of Object.entries(runningApps)) {
		// Skip script (non hanno PID reale da verificare)
		if (appInfo.isScript) {
			continue;
		}
		
		const exists = await processExists(appInfo.pid, appInfo.processName);
		if (!exists) {
			logger.info(`Processo ${appInfo.name} (PID: ${appInfo.pid}, Nome: ${appInfo.processName}) non più attivo, rimozione dalla lista`);
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
app.get('/api/commands', (req, res) => {
	try {
		// Filtra solo i comandi visibili
		const visibleCommands = config.commands.filter(cmd => cmd.visible !== false);
		
		const commandsWithStatus = visibleCommands.map(cmd => ({
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
app.get('/api/running', (req, res) => {
	try {
		res.json({ success: true, running: runningApps });
	} catch (error) {
		logger.error('Errore recupero processi:', error);
		res.status(500).json({ success: false, error: 'Errore interno del server' });
	}
});

// Endpoint: lista finestre Windows aperte
app.get('/api/windows', (req, res) => {
	try {
		logger.info('Richiesta lista finestre aperte');
		const scriptPath = path.join(__dirname, 'scripts', 'list-windows.ps1');
		
		exec(`powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`, (err, stdout, stderr) => {
			if (err) {
				logger.error('Errore lista finestre:', err);
				return res.status(500).json({ success: false, error: 'Errore recupero finestre' });
			}
			
			try {
				// Some PowerShell outputs may include stray control characters or extra text.
				// Try to extract the JSON array from stdout safely.
				const raw = stdout || '';
				const start = raw.indexOf('[');
				const end = raw.lastIndexOf(']');
				let payload = raw;
				if (start !== -1 && end !== -1 && end > start) {
					payload = raw.slice(start, end + 1);
				}

				const windows = JSON.parse(payload.trim());
				res.json({ success: true, windows: Array.isArray(windows) ? windows : [windows] });
			} catch (parseError) {
				logger.error('Errore parsing JSON finestre:', parseError);
				logger.debug('Raw stdout from list-windows:', stdout);
				res.json({ success: true, windows: [] });
			}
		});
	} catch (error) {
		logger.error('Errore recupero finestre:', error);
		res.status(500).json({ success: false, error: 'Errore interno del server' });
	}
});

// Endpoint: controlla quali comandi sono già in esecuzione
app.post('/api/check-commands', (req, res) => {
	try {
		const commandsToCheck = req.body.commands || [];
		
		if (!Array.isArray(commandsToCheck) || commandsToCheck.length === 0) {
			return res.json({ success: true, results: [] });
		}
		
		logger.info(`Controllo ${commandsToCheck.length} comandi in esecuzione`);
		const scriptPath = path.join(__dirname, 'scripts', 'check-commands.ps1');
		const commandsJson = JSON.stringify(commandsToCheck);
		
		execFile('powershell.exe', [
			'-ExecutionPolicy', 'Bypass',
			'-File', scriptPath,
			'-CommandsJson', commandsJson
		], (err, stdout, stderr) => {
				if (err) {
					logger.error('Errore check-commands:', err);
					return res.status(500).json({ success: false, error: 'Errore controllo comandi' });
				}
				
				try {
					const raw = stdout || '';
					const start = raw.indexOf('[');
					const end = raw.lastIndexOf(']');
					let payload = raw;
					if (start !== -1 && end !== -1 && end > start) {
						payload = raw.slice(start, end + 1);
					} else if (raw.startsWith('{')) {
						// Single object, wrap in array
						payload = `[${raw.trim()}]`;
					}

					const results = JSON.parse(payload.trim());
					logger.info(`check-commands trovati ${results.length} match`);
					res.json({ success: true, results: Array.isArray(results) ? results : [results] });
				} catch (parseError) {
					logger.error('Errore parsing JSON check-commands:', parseError);
					res.json({ success: true, results: [] });
				}
			}
		);
	} catch (error) {
		logger.error('Errore controllo comandi:', error);
		res.status(500).json({ success: false, error: 'Errore interno del server' });
	}
});

// Endpoint: porta in primo piano finestra tramite PID
app.post('/api/focus/:pid', async (req, res) => {
	try {
		const pid = parseInt(req.params.pid);
		
		if (isNaN(pid)) {
			return res.status(400).json({ success: false, error: 'PID non valido' });
		}
		
	// Cerca il processo name nei runningApps
	let processName = null;
	let windowTitle = null;
	for (const appInfo of Object.values(runningApps)) {
		if (appInfo.pid === pid) {
			processName = appInfo.processName;
			windowTitle = appInfo.windowTitle;
			break;
		}
	}
	
	logger.info(`Tentativo focus finestra PID: ${pid}${processName ? `, Nome: ${processName}` : ''}${windowTitle ? `, Titolo: ${windowTitle}` : ''}`);
	const scriptPath = path.join(__dirname, 'scripts', 'focus-window-by-pid.ps1');
	
	// Passa window title se disponibile (per UWP apps), altrimenti nome processo
	let psCommand = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" -ProcessPid ${pid}`;
	if (windowTitle) {
		psCommand += ` -WindowTitle "${windowTitle}"`;
	} else if (processName) {
		psCommand += ` -ProcessName "${processName}"`;
	}		exec(psCommand, (err, stdout, stderr) => {
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

// Endpoint: adotta processo già avviato
app.post('/api/commands/:id/adopt', async (req, res) => {
	try {
		const cmdId = parseInt(req.params.id);
		const { pid, processName, windowTitle } = req.body;
		
		if (isNaN(cmdId) || !pid) {
			return res.status(400).json({ success: false, error: 'ID comando o PID invalido' });
		}
		
		const cmd = config.commands.find(c => c.id === cmdId);
		if (!cmd) {
			return res.status(404).json({ success: false, error: 'Comando non trovato' });
		}
		
		// Verifica che il processo esista
		const exists = await processExists(pid, processName);
		if (!exists) {
			return res.status(404).json({ success: false, error: 'Processo non trovato' });
		}
		
		// Adotta il processo
		runningApps[cmdId] = {
			pid: pid,
			processName: processName || '',
			windowTitle: windowTitle || '',
			name: cmd.name,
			startTime: new Date(),
			isScript: false
		};
		
		logger.info(`Processo adottato: ${cmd.name} (PID: ${pid}, Nome: ${processName})`);
		
		res.json({ 
			success: true, 
			message: `${cmd.name} adottato con successo`,
			pid: pid
		});
	} catch (error) {
		logger.error('Errore adozione processo:', error);
		res.status(500).json({ success: false, error: 'Errore interno del server' });
	}
});

// Endpoint: esegue comando
app.post('/api/commands/:id', async (req, res) => {
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
		if (runningApps[cmdId]) {
			const exists = await processExists(runningApps[cmdId].pid);
			if (exists) {
				return res.status(409).json({ 
					success: false, 
					error: 'Comando già in esecuzione',
					pid: runningApps[cmdId].pid
				});
			} else {
				// Processo morto, rimuovi dal tracking
				delete runningApps[cmdId];
			}
		}
		
		const pid = await runCommand(cmd);
		
		// Se pid è null, il comando è stato avviato ma non è tracciabile
		if (pid === null) {
			return res.json({ 
				success: true, 
				pid: null,
				tracked: false,
				command: cmd.name,
				message: `${cmd.name} avviato con successo (non tracciato)`
			});
		}
		
		res.json({ 
			success: true, 
			pid,
			tracked: true,
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
app.post('/api/commands/:id/kill', async (req, res) => {
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
