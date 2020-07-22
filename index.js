const child_process = require('child_process');
const proxy = require('udp-proxy');
let options = {
  address: '127.0.0.1', // address to proxy to
  port: 6010, // port to proxy to
  ipv6: false,

  localaddress: '0.0.0.0', // address to listen on
  localport: 6000, // port to listen on
  localipv6: false,

  //proxyaddress: '0.0.0.0', // address to send outgoing messages from
  timeOutTime: 10000
};

const CHILD_PID = 1097180;

const IDLE_TIME = 30 * 60 * 1000;
let timeout;

let server_up = false;

// This is the function that creates the server, each connection is handled internally
let server = proxy.createServer(options);

// this should be obvious
server.on('listening', function (details) {
  console.log('CryoFallProxy }>=<{ by: Jimbly');
  console.log(`udp-proxy-server ready on ${details.server.family}  ${details.server.address}:${details.server.port}`);
  console.log(`traffic is forwarded to ${details.target.family}  ${details.target.address}:${details.target.port}`);
});

function checkShutdown() {
  timeout = null;
  let num_connections = Object.keys(server.connections).length;
  if (num_connections) {
    return;
  }
  if (server_up) {
    console.log('Timeout expired - SERVER GOING TO SLEEP');
    let ret = child_process.spawnSync('bin/pssuspend64.exe', [String(CHILD_PID)], { encoding: 'utf8' });
    let { stdout, stderr, status, error } = ret;
    if (error || stderr) {
      console.log(`ERROR SLEEPING SERVER (exit status=${status})`);
      console.log(error, stderr, stdout);
    } else {
      console.log(stdout);
    }
    server_up = false;
  }
}

// 'bound' means the connection to server has been made and the proxying is in action
server.on('bound', function (details) {
  console.log(`Proxying from ${details.peer.address}:${details.peer.port} via ${details.route.address}:${details.route.port}, #connections=${Object.keys(server.connections).length}`);
  if (!server_up) {
    console.log('Client connect - SERVER WAKING UP');
    let ret = child_process.spawnSync('bin/pssuspend64.exe', ['-r', String(CHILD_PID)], { encoding: 'utf8' });
    let { stdout, stderr, status, error } = ret;
    if (error || stderr) {
      console.log(`ERROR WAKING SERVER (exit status=${status})`);
      console.log(error, stderr, stdout);
    } else {
      console.log(stdout);
    }
    server_up = true;
  }
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }
});

// 'message' is emitted when the server gets a message
server.on('message', function (message, sender) {
//    console.log('message from ' + sender.address + ':' + sender.port);
});

// 'proxyMsg' is emitted when the bound socket gets a message and it's send back to the peer the socket was bound to
server.on('proxyMsg', function (message, sender, peer) {
//    console.log('answer from ' + sender.address + ':' + sender.port);
});

// 'proxyClose' is emitted when the socket closes (from a timeout) without new messages
server.on('proxyClose', function (peer) {
  let num_connections = Object.keys(server.connections).length - 1;
  console.log(`Disconnecting socket from ${peer && peer.address}, #connections=${num_connections}`);
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }
  if (num_connections <= 0) {
    timeout = setTimeout(checkShutdown, IDLE_TIME);
  }
});

server.on('proxyError', function (err) {
  console.log(`ProxyError! ${err}`);
});

server.on('error', function (err) {
  console.log(`Error! ${err}`);
});
