const assert = require('assert');
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

function detectDotNetPID() {
  // Alternative: spawn the process here, something like:
  // return child_process.spawn('dotnet CryoFall_Server.dll load', { stdio: 'inherit' }).pid;

  let output = child_process.execSync('tasklist /fi "imagename eq dotnet.exe" /fo csv /nh', { encoding: 'utf8' });
  let lines = output.trim().split('\n');
  if (lines.length !== 1 || !lines[0].startsWith('"dotnet.exe"')) {
    console.log(output);
    throw new Error('Could not find single running dotnet.exe process');
  }
  let columns = lines[0].split('","');
  assert.equal(columns.length, 5);
  return Number(columns[1]);
}

const CHILD_PID = detectDotNetPID(); // Can explicitly specify a process ID here

const CMD_WAKE_UP = `bin\\pssuspend64.exe -r ${CHILD_PID}`;
const CMD_SLEEP = `bin\\pssuspend64.exe ${CHILD_PID}`;

const IDLE_TIME = 60 * 60 * 1000;
let timeout;

let server_up = false;

// This is the function that creates the server, each connection is handled internally
let server = proxy.createServer(options);

// this should be obvious
server.on('listening', function (details) {
  console.log('UDP Sleeping Proxy by: Jimbly');
  console.log(`udp-proxy-server ready on ${details.server.family}  ${details.server.address}:${details.server.port}`);
  console.log(`traffic is forwarded to ${details.target.family}  ${details.target.address}:${details.target.port}`);
});

function runCmd(cmd) {
  let ret = child_process.spawnSync(cmd, { encoding: 'utf8', shell: true });
  let { stdout, stderr, status, error } = ret;
  if (error || stderr) {
    console.log(`ERROR WAKING/SLEEPING (exit status=${status})`);
    console.log(error, stderr, stdout);
  } else {
    console.log(stdout);
  }
}

function checkShutdown() {
  timeout = null;
  let num_connections = Object.keys(server.connections).length;
  if (num_connections) {
    return;
  }
  if (server_up) {
    console.log('Timeout expired - SERVER GOING TO SLEEP');
    runCmd(CMD_SLEEP);
    server_up = false;
  }
}

// 'bound' means the connection to server has been made and the proxying is in action
server.on('bound', function (details) {
  console.log(`Proxying from ${details.peer.address}:${details.peer.port} via ${details.route.address}:${details.route.port}, #connections=${Object.keys(server.connections).length}`);
  if (!server_up) {
    console.log('Client connect - SERVER WAKING UP');
    runCmd(CMD_WAKE_UP);
    server_up = true;
  }
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }
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
