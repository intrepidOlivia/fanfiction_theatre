var https = require('https');
const http = require('http');
const fs = require('fs');

const fanficSockets = require('./fanfic_module');

const PORT = process.env.PORT || 8080;
const isDevMode = process.env.MODE === 'localhost';

const options = isDevMode ? {} : {
    key: fs.readFileSync('/etc/letsencrypt/live/fanfictiontheatre.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/fanfictiontheatre.com/cert.pem'),
};

const protocol = isDevMode ? http : https;

var server = protocol.createServer(options, function (request, response) {
    setupServer(request, response);
});
server.listen(PORT, function () {
    console.log(`Reader server listening on port ${PORT}.`);
});
server.on('error', function (err) {
    console.error('The following error has been encountered with the server receiving requests from Pixelstomp: ' + err.message + '\n');
});
fanficSockets.initWebsocketServer(server);
if (isDevMode) {
    serveLocalClient();
}

function setupServer(request, response) {
    var url = require('url');

    var reqUrl = url.parse(request.url, true);
    var path = reqUrl.pathname;
    var queries = reqUrl.query;

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Content-Type', 'application/json');

    try {
        switch (path) {
			
			case '/fanfic/fic_submit':
				fanficSockets.api.loadNewFanfic(request, response);
				break;

            default:
                ServeError(response);
        }
    }
    catch (e) {
        console.error('Unknown error:', e);
        response.statusCode = 400;
        response.write(JSON.stringify(e));
        response.end();
    }
}

function serveLocalClient() {
    // Serve local client files on localhost
    const handler = require('serve-handler');

    const localServer = http.createServer((request, response) => {
    // You can customize the options passed to serve-handler here
    return handler(request, response, {
        public: 'client', // Path to the directory you want to serve
        cleanUrls: true, // Removes .html extension from URLs
    });
    });

    localServer.listen(80, () => {
    console.log('Static file server running at http://localhost');
    });
}

// MISC QUERIES
// ------------

//TODO: improve this to function better with the path that is actually going to be requested
function ServePage(request, response) {
    var path = request.url;
    try {
        var fs = require('fs');
        var rs = fs.createReadStream(path);
        rs.on('error', function (err) {
            response.write('Error while accessing ' + path + ': ' + err.message);
            response.end();
            return response;
        });
        rs.pipe(response);
        rs.on('end', function () {
            response.end();
            return response;
        });
    }
    catch (err) {
        response.write("There was an error accessing the file at " + path);
        response.end();
        return response;
    }

}

function ServeError(response, status = 404, message = 'Not found.') {
    response.writeHead(status, message);
    try {
        var fs = require('fs');
        var rs = fs.createReadStream('404.html');
        rs.on('error', function (err) {
            response.write(message);
            response.end();
        });
        rs.pipe(response);
        rs.on('end', function () {
            response.end();
        });
    }
    catch (err) {
        response.write('Not found.');
        response.end();
    }
}
