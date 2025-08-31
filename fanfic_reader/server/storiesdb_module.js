const pg = require('pg');

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

    response.statusCode = 200;
    response.write(`Successfully queried for a story with handle: ${handle}`);
    response.end();
}

function loadStoryList(request, response) {
    response.statusCode = 200;
    response.write('Successfully queried for all stories');
    response.end();
}

module.exports = {
    api: {
        loadStory,
        loadStoryList,
    },
};