const pg = require('pg');

let client;

async function initialize() {
    client = new Client();
    await client.connect();
}

function loadStoryList() {

}

/**
 * Loads the stored info for the provided story
 * @param {string} handle 
 */
function loadStory(handle, request, response) {
    if (!handle) {
        response.statusCode = 400;
        throw new Error("No handle was provided when requesting a Story");
    }

    try {
        client.query(`SELECT `)
    } catch (err) {
        // Handle error in some way
    }

    response.statusCode = 200;
    response.write(`Successfully queried for a story with handle: ${handle}`);
    response.end();
}

function loadStoryList(request, response) {
    response.statusCode = 200;
    response.write('Successfully queried for all stories');
    response.end();
}

/**
 * 
 * @param {*} storyData properties must match column names
 */
function createStory(storyData) {
    
}

module.exports = {
    api: {
        initialize,
        loadStory,
        loadStoryList,
    },
};

/**
 * 
 import { Client } from 'pg'
const client = new Client()
await client.connect()
 
const res = await client.query('SELECT $1::text as message', ['Hello world!'])
console.log(res.rows[0].message) // Hello world!
await client.end()
 */