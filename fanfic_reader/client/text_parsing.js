/**
 * @param {string} text 
 * @returns {Array<string>}
 */

// TODO: Figure out why whitespaces are getting removed in fics like https://www.fanfiction.net/s/2377431/1/Godzilla-vs-Superman

function extractParagraphs(text) {
    let paragraphs = [];
    if (detectHTML(text)) {
        // Do preformatting on custom tags
        text = replaceCustomTags(text);

        // Extract text from <p> tags
        const match = text.matchAll(/<.+?>/g);
        const matchArray = Array.from(match);
        let pindex = null;
        for (let m of matchArray) {
            // Handle paragraphs
            if (m[0].includes('<p')) {
                pindex = m.index + m[0].length; // Set cursor to start of the paragraph's content
            }
            if (m[0].includes('/p>')) {
                paragraphs.push(text.slice(pindex, m.index));
            }

            // Handle line breaks
            if (m[0].includes('<hr')) {
                let prev = paragraphs[paragraphs.length - 1];
                if (prev !== undefined) {
                    paragraphs[paragraphs.length - 1] = prev.concat(m[0]);
                }
            }

            // Handle headers
            if (startsAHeader(m[0])) {
                // Handle <h1>, <h2>, <h3> etc
                pindex = m.index; // Set cursor to start of header's content
            }
            if (endsAHeader(m[0])) {
                paragraphs.push(text.slice(pindex, m.index + 5));
            }

            // Handle lists
            if (m[0].includes('<li')) {
                pindex = m.index + m[0].length;
            }
            if (m[0].includes('/li>')) {
                paragraphs.push(text.slice(pindex, m.index));
            }
        }

        // If there was no paragraph or header content, try extracting by the StartFragment tag
        if (paragraphs.length < 1) {
            for (let m of matchArray) {
                if (m[0] === "<!--StartFragment-->") {
                    pindex = m.index + 20;
                }
                if (m[0] === "<!--EndFragment-->") {
                    paragraphs.push(text.slice(pindex, m.index));
                }
            }
        }

        // If even that doesn't work, just put the blob of text in.
        if (paragraphs.length < 1) {
            paragraphs = text.split(WHITESPACE);
        }

    } else {
        paragraphs = text.split(WHITESPACE);
    }
    return paragraphs;
}

function replaceCustomTags(text) {
    return text.replaceAll('amp-img', 'img');
}

function startsAHeader(text) {
    return text.includes('<h1') || text.includes('<h2') || text.includes('<h3');
}

function endsAHeader(text) {
    return text.includes('/h1>') || text.includes('/h2>') || text.includes('/h3>');
}

function detectHTML(text) {
    HTMLPattern = new RegExp('<(.*)>.*?|<(.*) />', 'g');
    return HTMLPattern.test(text);
}
