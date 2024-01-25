// const DOMAIN = '138.68.243.184';
const DOMAIN = 'localhost';
const PORT = '8080';
const socket = new WebSocket(`ws://${DOMAIN}:${PORT}/`, );
let socketOpen = false;
let currentIndex = 0;
let maxIndex = null;

const TEXT_CONTAINER_SELECTOR = '#chatlog'
const CLIENT_LIST_SELECTOR = '.clientList';
const WHITESPACE = /[\r\n]+/;
const HTML_WHITESPACE = /<p\s*.*>\s*.*<\/p>/;
const PASTE_TEXTAREA_ID = 'ficText';
const HTMLMatcher = new RegExp('<(.*)>.*?|<(.*) />', 'g');

socket.addEventListener('open', (openEvent) => {
    socketOpen = true;
    socket.send(JSON.stringify({ message: 'Connection opened.'}));
    window.addEventListener('keyup', submitChangedIndex);
    checkForLocalUsername();
});

socket.addEventListener('message', (messageEvent) => {
    const messageString = messageEvent.data;
    let message;
    try {
        message = JSON.parse(messageString);
    } catch {
        throw new Error('Websocket message could not be parsed:', messageString);
    }
    if (message.alert) {
        // show alert modal (already on the page)
        // showModal(getUsernameModal());
        document.querySelector('#username_input').focus();
        return;
    }

    if (message.text) {
        // format the selected paragraph
        const div = document.querySelector(TEXT_CONTAINER_SELECTOR);
        div.innerHTML = '';
        const paragraphs = formatTextToParagraphs(message.text, message.index);

        formatTextLinks(paragraphs, message.storySource);

        paragraphs.forEach(p => div.appendChild(p));
        currentIndex = message.index;

        checkForScroll();
    }

    if (message.allClients) {
        // populate the list of clients
        const clientList = document.querySelector(CLIENT_LIST_SELECTOR);
        clientList.innerHTML = formatClientList(message.allClients);
    }

    if (message.storySource) {
        // Add story link to top of the page
        addSourceLink(message.storySource);
    } else {
        removeSourceLink();
    }
});

socket.addEventListener('close', () => {
    socketOpen = false;
    window.alert('Websocket closed!');
});

function formatTextLinks(paragraphs, source) {
    paragraphs.forEach(p => {
        const links = p.querySelectorAll('a');
        links.forEach(a => {
            if (source) {
                const url = new URL(source);
                const currentHref = new URL(a.href);
                if (currentHref.origin !== url.origin) {
                    a.href = `${url.origin}${currentHref.pathname}`;
                }
            }
            a.target = "_blank";
        });
    });
}

function addSourceLink(source) {
    const sourceDiv = document.querySelector('#sourcelink');
    sourceDiv.innerHTML = '';
    const link = document.createElement('a');
    link.href = source;
    link.innerText = source;
    link.target = "_blank";
    sourceDiv.appendChild(link);
}

function removeSourceLink() {
    const sourceDiv = document.querySelector('#sourcelink');
    sourceDiv.innerHTML = '';
}

/**
 * @param {KeyboardEvent} event 
 * @returns {void}
 */
function submitChangedIndex(event) {
    event.preventDefault();
    let modifier = null;
    if (event.key == 'ArrowLeft') {
        // direction = 'up';
        modifier = -1;
    }
    if (event.key == 'ArrowRight') {
        // direction = 'down';
        if (maxIndex == null || currentIndex <= maxIndex) {
            modifier = 1;
        }
    }
    if (modifier == null) {
        return;
    }

    if (socketOpen) {
        socket.send(JSON.stringify({ changeIndex: currentIndex + modifier }));
    } else {
        window.alert('Socket was unexpectedly closed. Please refresh the page.');
    }
}

const SCROLL_BUFFER = .33;
const PADDING = 100;

function checkForScroll() {
    // if selected index is at upper/lower percentage, scroll to center
    const selectedP = document.querySelector(".selectedP");
    if (!selectedP) {
        return;
    }

    const container = document.getElementById('chatlog');
    if (!container) {
        return;
    }

    const selectedBox = selectedP.getBoundingClientRect();
    const containerBox = container.getBoundingClientRect();

    // If element isn't even visible, scroll into view
    if (selectedBox.top < containerBox.top || selectedBox.top > containerBox.bottom) {
        selectedP.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    // If element is near bottom of box, scroll into view
    const pixelBuffer = containerBox.height * SCROLL_BUFFER;
    if (selectedBox.top > containerBox.bottom - pixelBuffer) {
        selectedP.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // If element is an img, scroll into view
    if (selectedP.innerHTML.includes('<img')) {
        selectedP.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
}

/**
 * @param {number} index 
 */
function doManualSelect(index) {
    if (socketOpen) {
        socket.send(JSON.stringify({ changeIndex: index }));
    } else {
        window.alert('Socket was unexpectedly closed. Please refresh the page.');
    }
}

function setLocalUsername(username) {
    window.localStorage.setItem('username', username);
}

function setRemoteUsername(username) {
    if (socketOpen) {
        const message = { username };
        socket.send(JSON.stringify(message));
    } else {
        window.alert('Session was unexpectedly closed. Please refresh the page.')
    }
}

/**
 * Checks if the user has already set a username in their browser, and registers that instead
 * @returns 
 */
function checkForLocalUsername() {
    const username = window.localStorage.getItem('username');
    if (username) {
        setRemoteUsername(username);
        closeUsernameModal();
    } else {
        return false;
    }
}

function submitUsername(event) {
    event.preventDefault();
    const input = document.querySelector('#username_input');
    setLocalUsername(input.value);
    setRemoteUsername(input.value)
    closeUsernameModal();
    return false;
}

function closeUsernameModal() {
    const modal = document.querySelector('#usernameModal');
    modal.classList.add('hidden');
}

function openUsernameModal() {
    const modal = document.querySelector('#usernameModal');
    modal.classList.remove('hidden');
    document.querySelector('#username_input').focus();
}

/**
 * @param {Array<string>} clientList 
 * @returns {string}
 */
function formatClientList(clientList) {
    return clientList.map(client => {
        return `<p class="clientName" onclick="openUsernameModal()">${client}</p>`
    }).join("");
}

function formatTextToParagraphs(htmlText, activeIndex) {
    const paragraphs = extractParagraphs(htmlText);
    maxIndex = paragraphs.length - 1;
    return styleActiveAndInactiveParagraphs(paragraphs, activeIndex);
}

/**
 * 
 * @param {Array<string>} pHTMLStrings 
 * @param {number} activeIndex 
 * @returns {Array<HTMLElement>}
 */
function styleActiveAndInactiveParagraphs(pHTMLStrings, activeIndex) {
    return pHTMLStrings.map((p, i) => {

        const paragraph = document.createElement('p');
        paragraph.className = 'ficParagraph';
        paragraph.classList.add(getReadStatusClassname(i, activeIndex));

        if (i !== activeIndex) {
            const selectParagraphArrow = document.createElement('span');
            selectParagraphArrow.className = 'p_selector';
            selectParagraphArrow.onclick = () => doManualSelect(i);
            selectParagraphArrow.innerText = '>';
            paragraph.appendChild(selectParagraphArrow);
        }

        const text = document.createElement('span');
        text.innerHTML = p;

        paragraph.appendChild(text);
        return paragraph;
    });
}

function getReadStatusClassname(i, activeIndex) {
    if (i < activeIndex) {
        return 'alreadyReadP';
    }
    if (i === activeIndex) {
        return 'selectedP';
    }
    if (i > activeIndex) {
        return 'unreadP';
    }
}

function matchParaStylingToActive(paragraphs, activeIndex) {
    return paragraphs.map((p, i) => {
        if (i < activeIndex) {
            return `<p class="ficParagraph alreadyReadP"><span class="p_selector" onclick="doManualSelect(${i})">></span><span>${p}</span></p>`;
        }
        if (i === activeIndex) {
            return `<p class="ficParagraph selectedP"><span>${p}</span></p>`;
        }
        return `<p class="ficParagraph unreadP"><span class="p_selector" onclick="doManualSelect(${i})">></span><span>${p}</span></p>`;
    }).join("");
}

function openPasteModal() {
    document.querySelector('#ficSubmitModal').classList.remove('hidden');
}

function closePasteModal() {
    document.getElementById(PASTE_TEXTAREA_ID).value = '';
    document.querySelector('#ficSubmitModal').classList.add('hidden');
}

function interceptFicPaste(event) {
    if (event.clipboardData && event.clipboardData.getData) {
        const htmlData = event.clipboardData.getData('text/html');
        if (!htmlData) {
            return;
        }
        const textArea = document.getElementById(PASTE_TEXTAREA_ID);
        if (!textArea) {
            console.error('No applicable text area found for paste.');
            return;
        }
        textArea.value = htmlData;
        event.preventDefault();
    }
    
}

function submitFicText(event) {
    event.preventDefault();
    const textArea = document.getElementById(PASTE_TEXTAREA_ID);
    const fanficText = textArea.value;
    if (fanficText.length > 0) {
        fetch(`http://${DOMAIN}:${PORT}/fanfic/fic_submit`,
        { 
            method: 'POST',
            body: JSON.stringify(
                { text: fanficText }
                )
        })
        .then(response => {
            closePasteModal();
            return false;
        })
        .catch(err => {
            window.alert('There was an error when trying to submit a new fic:' + err);
        });
    }
}

// DEPRECATED UNTIL FURTHER NOTICE
// Fanfic utilizes Cloudflare to circumvent automated network requests.
// function submitFicURL(submitEvent) {
//     submitEvent.preventDefault();
//     // Check that URL is valid
//     const urlInput = document.querySelector('#fic_url');
//     const url = urlInput.value;
//     const ficInfo = getFanficNetId(url);
//     // makeHTTPRequest(`http://${DOMAIN}:${PORT}/fanfic/url_submit`)
//     if (ficInfo) {
//         fetch(
//             `http://${DOMAIN}:${PORT}/fanfic/url_submit`,
//             {
//                 method: 'POST',
//                 body: JSON.stringify(ficInfo)
//             })
//             .then(response => {
//                 
//             });
//     }
    
//     return false;
// }

// NOT IN USE
// function getFanficNetId(url) {
//     if (url.includes('fanfiction.net')) {
//         const splitURL = url.split('/');
//         const storyIndicator = splitURL[3];
//         if (storyIndicator !== 's') {
//             window.alert('That is not a valid fanfic URL.');
//             return null;
//         }
//         const id = splitURL[4];
//         const chapter = splitURL[5];
//         return { id, chapter };
//     } else {
//         window.alert('That is not a valid fanfiction.net URL!');
//     }
//     return null;
// }
