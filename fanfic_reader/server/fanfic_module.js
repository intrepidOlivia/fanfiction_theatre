
const WebSocket = require('ws');
const fs = require('fs');
var httpProxy = require('http-proxy');
const { IncomingMessage } = require('http');

const PORT = process.env.WSPORT || 8081;

let fullText = '';
let ficSource = '';
const sockets = {};
const viewers = {};
let clientCount = 0;
let sectionIndex = 0;
let RATE_LIMIT = 500;
let rateTimer = Date.now();
const READER_URL = "http://pixelstomp.com/apps/fanfic_theater/fanfic_reader.html";

// FOR REFERENCE ONLY
const MESSAGE_STRUCTURE = {
    alert: 'string',
    text: 'string',
    index: 'number',
    allClients: 'Array<string>',
    viewer: 'boolean',
    storySource: 'string',
};

// DEBUG - READ SAMPLE TEXT
const readStream = fs.createReadStream('./public/fanfic_sample.txt', { encoding: 'utf8' });
readStream.on('data', chunk => {
    fullText += chunk;
});
readStream.on('end', () => {
    readStream.close();
});

// Upgrade proxy
const wsProxy = new httpProxy.createProxyServer({
	target: {
		host: 'localhost',
		port: PORT,
	},
});

// Server
const server = new WebSocket.Server({ port: PORT });
server.on('connection', function connect(socket) {
    const clientId = ++clientCount;
    console.info(`connection established with client ${clientId}`);
    sockets[clientId] = new SocketClient(socket, clientId);

    socket.on('message', function incoming(messageString) {
        const response = {};
        let message;

        // Parse message
        try {
            message = JSON.parse(messageString);
        } catch {
            throw new Error(`Unable to parse incoming message: ${messageString}`);
        }

        if (message.viewer) {
            // TODO: Send only the index of the current text
            registerViewer(sockets[clientId]);
            feedToViewers();
            return;
        }

        // find socket of sender
        const user = sockets[clientId];
        if (!user.name && !message.username) {
            response.alert = 'username',
                socket.send(JSON.stringify(response));
                return;
        }

        // Check for username in message
        if (message.username) {
            user.name = message.username;
        }

        // check for keyup or down event
        if (message.changeIndex !== undefined && Date.now() - rateTimer >= RATE_LIMIT) {
            sectionIndex = message.changeIndex;
            if (sectionIndex < 0) {
                sectionIndex = 0;
            }
            rateTimer = Date.now();
        }

        feedToReaders();
        feedToViewers();
    })

    socket.on('close', function () {
        delete sockets[clientId];
        const socketsRemaining = Object.keys(sockets).length;
        console.info(`Removing client ${clientId}. Number of sockets remaining:`, socketsRemaining);
    });
});

function registerViewer(socketClient) {
    socketClient.isViewer = true;
}

function feedToReaders() {
    Object.values(sockets).forEach(s => {
        if (!s.isViewer) {
            // Keep this structure aligned with MESSAGE_STRUCTURE
            s.socket.send(JSON.stringify({
                text: fullText,
                index: sectionIndex,
                allClients: Object.values(sockets).filter(client => !client.isViewer).map(client => client.name),
                storySource: ficSource,
            }));
        }
    });
}

function feedToViewers() {
    Object.values(sockets).forEach(s => {
        if (s.isViewer) {
            s.socket.send(JSON.stringify({
                text: fullText,
                index: sectionIndex,
            }));
        }
    });
}

class SocketClient {
    constructor(socket, id) {
        this.socket = socket;
        this.id = id;
        this.name = null;
        this.isViewer = false;
    }
}

function resetFanfic() {
    sectionIndex = 0;
    // TODO: Reset loaded fanfic
}

/**
 * 
 * @param {IncomingMessage} request 
 * @param {OutgoingMessage} response
 */
async function loadNewFanfic(request, response) {
    if (request.headers['content-type'] === 'application/x-www-form-urlencoded') {
        await loadNewFanficFromForm(request, response);
    } else {
        await loadNewFanficFromPaste(request, response);
    }    

    feedToReaders();
    feedToViewers();
}

async function loadNewFanficFromPaste(request, response) {
    return new Promise(resolve => {
        let bodyString = '';
        request.on('data', chunk => {
            bodyString += chunk;
        });
        request.on('end', () => {
            let body;
            try {
                body = JSON.parse(bodyString);
                updateFicText(body.text);
                updateFicSource();
                response.statusCode = 200;
                response.write('Successfully updated fic');
                response.end();
                resolve();
            } catch (e) {
                response.statusCode = 400;
                console.error('ERROR:', e);
                response.write('Unable to process request: ' + e);
                response.end();
                resolve();
            }
        });
    });
}

/**
 * Used when request is of type application/x-www-form-urlencoded
 * @param {IncomingMessage} request 
 * @param {OutgoingMessage} response
 */
async function loadNewFanficFromForm(request, response) {
    return new Promise(resolve => {
        let bodyString = '';
        request.on('data', chunk => {
            bodyString += chunk;
        });

        request.on('end', () => {
            let body = new URLSearchParams(bodyString);
            updateFicSource(body.get('source'));
            updateFicText(body.get('text'));
            response.statusCode = 303;
            response.setHeader('Location', READER_URL);
            response.end();
            resolve();
        });
    });
}

function updateFicSource(source) {
    if (source) {
        ficSource = source;
    } else {
        ficSource = '';
    }
}

function updateFicText(text) {
    fullText = text;
    sectionIndex = 0;
}

module.exports = {
    server,
    PORT,
    proxy: wsProxy,
    api: {
        loadNewFanfic,
    },
};