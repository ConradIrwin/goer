/*global window, document, chrome, XMLHttpRequest, console, localStorage */
window.setTimeout(function () {
    // Reload everything when the options change.
    // TODO: add some syntax validity checking
    var textarea = document.getElementsByTagName('textarea')[0],
        timeout = null,
        port = chrome.extension.connect({name: "options"}),
        xhr = new XMLHttpRequest();

    port.onMessage.addListener(function (msg) {
        if (msg.log) {
            console.log.apply(console, msg.log);
        } else {
            console.log(msg);
        }
    });

    textarea.onchange = function () {
        localStorage.options = textarea.value;
        if (timeout) {
            window.clearTimeout(timeout);
        }
        port.postMessage({action: 'reload'});
    };
    textarea.value = localStorage.options;


    // Import all our normal content scripts, which gives us the right
    // event handling et.al.
    xhr.open("GET", chrome.extension.getURL("manifest.json"), false);
    xhr.send();

    (function (manifest) {
        manifest.content_scripts.forEach(function (cs) {
            cs.js.forEach(function (script) {
                var s = document.createElement('script');
                s.src = "/" + script;
                document.body.appendChild(s);
            });
        });
    }(JSON.parse(xhr.responseText)));
}, 0);

