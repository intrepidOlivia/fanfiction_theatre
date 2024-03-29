var http = require('http');

const fanficSockets = require('./fanfic_module');

const PORT = process.env.PORT || 8080;

var server = http.createServer(function (request, response) {
    var url = require('url');
    console.log("Request was received from " + request.headers.referer + ": " + request.url);

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
        console.log('Unknown error:', e);
        response.statusCode = 400;
        response.write(JSON.stringify(e));
        response.end();
    }

});
server.on('upgrade', (request, socket, head) => {
	fanficSockets.proxy.ws(request, socket, head);
});
server.listen(PORT, function () {
    console.log(`server listening on port ${PORT}.`);
});
server.on('error', function (err) {
    console.log('The following error has been encountered with the server receiving requests from Pixelstomp: ' + err.message + '\n');
});

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
        console.log(`Responded with: ${status} ${message}`);
    }
    catch (err) {
        response.write('Not found.');
        response.end();
    }
}
