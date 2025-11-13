const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
	name: 'NodeCommandServer',
	description: 'Server Node.js per eseguire comandi Win32 in background',
	script: path.join(__dirname, 'server.js'),
	nodeOptions: ['--harmony', '--max_old_space_size=4096']
});

svc.on('install', () => {
	console.log('Servizio installato');
	svc.start();
});

svc.on('alreadyinstalled', () => console.log('Servizio già installato'));
svc.on('start', () => console.log('Servizio avviato'));
svc.on('error', (err) => console.error('Errore servizio:', err));

svc.install();
