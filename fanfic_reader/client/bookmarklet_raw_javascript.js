javascript:(function() {        
    'use strict';
    const DOMAIN = 'fanfictiontheatre.com';
    const PORT = 8080;  
    const PATH = 'fanfic/fic_submit';  

    function getAmpLink(wattpadUrl) {
        return wattpadUrl.replace('.com/', '.com/amp/');
    }

    function submitToReader(text) {
        const form = document.createElement('form');  
        form.action = `https://${DOMAIN}:${PORT}/${PATH}`;  
        form.method = 'post';  
        form.hidden = true;  
        const input = document.createElement('textarea');  
        input.name = 'text';  
        input.value = text;  
        const sourceInput = document.createElement('input');  
        sourceInput.name = 'source';  
        sourceInput.value = document.URL;  
        form.appendChild(input);  
        form.appendChild(sourceInput);  
        document.body.appendChild(form);  
        form.submit();
    }

    function retrieveAndSendText(ficDocument) {
        const FIC_SOURCE_CONTAINERS_MAP = {        
            'fanfiction.net': ['#storytextp'],
            'archiveofourown.org': ['#workskin'],
            'wattpad.com': ['.story-header', '.story-body-type'],
        };  
        
        let selectors;
        const href = location.href;  
        Object.keys(FIC_SOURCE_CONTAINERS_MAP).forEach(key => {        
            if (href.includes(key)) {        
                selectors = FIC_SOURCE_CONTAINERS_MAP[key];  
            }    
        });
        let ficText = '';
        selectors.forEach(selector => {
            if (selector == null) {        
                window.alert('Could not find proper selector for fic source. Please contact Misha for help.');  
                return;  
            }

            const container = ficDocument.querySelector(selector);  
            ficText += container.innerHTML;  
        });
        
        navigator.clipboard.writeText(ficText);  
        submitToReader(ficText);
    }

    if (location.href.includes('wattpad.com')) {
        const iframe = document.createElement('iframe');
        iframe.src = getAmpLink(window.location.href);
        document.body.appendChild(iframe);

        iframe.onload = () => {
            retrieveAndSendText(iframe.contentWindow.document);
        };
    } else {
        retrieveAndSendText(document);
    }
})();