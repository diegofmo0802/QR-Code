import ServerCore from 'saml.servercore';

const server = new ServerCore(3000);

server.addFile('/.private', 'assets/Forbidden.html');
server.addFile('/.private/*', 'assets/Forbidden.html');
server.addFile('/favicon.ico', 'assets/Logo.svg');
server.addFolder('/', '../');