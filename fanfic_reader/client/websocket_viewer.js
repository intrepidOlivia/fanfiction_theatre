const DOMAIN = '146.190.150.79/';
// const DOMAIN = 'localhost';
const PORT = '8080';
const socket = new WebSocket(`ws://${DOMAIN}:${PORT}/`, );
let socketOpen = false;

const SEGMENT_CONTAINER_SELECTOR = '#segmentWrapper';
const WHITESPACE = /[\r\n]+/;

socket.addEventListener('open', (openEvent) => {
    socketOpen = true;
    socket.send(JSON.stringify({ viewer: true }));
});

socket.addEventListener('message', (messageEvent) => {
    const messageString = messageEvent.data;
    let message;
    try {
        message = JSON.parse(messageString);
    } catch {
        throw new Error('Websocket message could not be parsed:', messageString);
    }

    // Format the selected paragraph
    const div = document.querySelector(SEGMENT_CONTAINER_SELECTOR);
    div.innerHTML = formatText(message.text, message.index);
});

/**
 * @param {string} text 
 * @param {number} activeIndex 
 * @returns {string}
 */
 function formatText(text, activeIndex) {
     const paragraphs = extractParagraphs(text);
    return `<p class="text_segment">${paragraphs[activeIndex]}</p>`;
}