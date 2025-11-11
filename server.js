const express = require('express');
const { spawn, exec } = require('child_process');
const app = express();
const PORT = 3000;

// Array di comandi/app
const commands = [
	{ id: 1, name: "Shutdown", command: "shutdown /s /t 0" },
	{ id: 2, name: "Sleep", command: "rundll32.exe powrprof.dll,SetSuspendState 0,1,0" },
	{ id: 3, name: "Hibernate", command: "shutdown /h" },
	{ id: 4, name: "Notepad", command: "notepad", icon: "📝" },
	{ id: 5, name: "Calculator", command: "calc", icon: "🧮" },
	{ id: 6, name: "Paint", command: "mspaint", icon: "🎨" }
];

// Mappa per tracciare PID
const runningApps = {};

// Esegue qualsiasi comando in background senza output
function runCommand(cmd) {
	const child = spawn(cmd.command, { shell: true, detached: true, stdio: 'ignore' });
	child.unref();
	runningApps[cmd.id] = child.pid;
	return child.pid;
}

// Termina processo
function killCommand(id) {
	const pid = runningApps[id];
	if (!pid) return false;
	exec(`taskkill /PID ${pid} /T /F`, (err) => { if (err) console.error(err); });
	delete runningApps[id];
	return true;
}

// Endpoint: lista comandi
app.get('/api/commands', (req, res) => res.json(commands));

// Endpoint: esegue comando
app.post('/api/commands/:id', (req, res) => {
	const cmdId = parseInt(req.params.id);
	const cmd = commands.find(c => c.id === cmdId);
	if (!cmd) return res.status(404).json({ success: false, error: "Comando non trovato" });
	const pid = runCommand(cmd);
	res.json({ success: true, pid });
});

// Endpoint: termina comando/app
app.post('/api/commands/:id/kill', (req, res) => {
	const cmdId = parseInt(req.params.id);
	if (!killCommand(cmdId)) return res.status(404).json({ success: false, error: "Processo non in esecuzione" });
	res.json({ success: true });
});

// Avvio server
app.listen(PORT, () => console.log(`Server in ascolto su http://localhost:${PORT}`));
