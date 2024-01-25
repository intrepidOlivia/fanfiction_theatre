# How to start the fanfic reader server:

1. Have Node installed on your computer
2. From the `fanfic_reader` directory, run `npm install` to install all dependencies.
3. Run `npm run start` to start the server.

Tip: Remember to direct all website requests to `localhost` to access the server running locally on your machine.

# How to serve the fanfic reader website locally:

1. Run `npm install -g serve` to install npm's serve library.
2. Navigate to the `fanfic_reader/public` directory.
3. Run `serve . -p 80` to serve all files in that directory on port 80 (default).
4. In a browser, visit `http://localhost/fanfic_reader.html` to view the fanfic reader page.