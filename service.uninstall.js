const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
	name: 'NodeCommandServer',
	script: path.join(__dirname, 'server.js')
});

svc.on('uninstall', () => console.log('Servizio disinstallato'));
svc.on('alreadyuninstalled', () => console.log('Servizio già disinstallato'));
svc.on('stop', () => console.log('Servizio fermato'));
svc.on('error', (err) => console.error('Errore servizio:', err));

svc.uninstall();
