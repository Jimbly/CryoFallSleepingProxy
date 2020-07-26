# CryoFallSleepingProxy
UDP Proxy for CryoFall that suspends the process when no one is connected.

Simple, no-dependency, Windows instructions:
* Download and unzip `CryoFallSleepingProxy.zip` from [Releases](https://github.com/Jimbly/CryoFallSleepingProxy/releases) (includes a Windows binary of Node.js)
* By default, CryofallSleepingProxy will listen on port 6000 and forward to port 6010, so edit your CryoFall server's settings to listen on 6010.
  * Alternatively, edit `index.js` (in Notepad or your favorite text editor) and change the ports as needed.
* Start your CryoFall server
* Run `run.cmd`

Running from source:
* Install Node.js
* Run `npm i` to install dependencies
* Run `node .` in the repo folder

Linux/docker instructions:
* Adjust the `CMD_SLEEP` and `CMD_WAKE_UP` to something appropriate for your platform, perhaps `kill -STOP` and `kill -CONT` or `docker container pause`.
I'd be happy to assist with getting such things working smoothly if anyone uses this on those platforms, just contact me here or on Discord.

Notes:
* Make sure to connect to the proxyied port, even/especially on localhost, or the proxy might put it to sleep while you're playing!
Moving the actual CryoFall server to a non-standard port (6010) helps avoid any accidental direct connection.
  
Additional options of note in `index.js`:
* ***IDLE_TIME*** Defaults to 60 minutes, adjust as desired.  Any lower than a minute or so and things might get wonky.

Contact
* `Jimbly#7059` on Discord

License
* CryoFallSleepingProxy is released under the MIT License
* Binary dependencies (Node.js and Microsoft's PsUtils) have their own licenses
