/*global chrome*/
function handler(spec, done) {
    return  {
        load: function (request) {
            request.respond(Object.keys(spec));
        },
        done: function (request) {
            done(spec[request.value], request);
        }
    };
}

handler.mark = handler({
    "m": ["https://mail.google.com/"],
    "e": ["chrome://extensions/"],
    "s": ["chrome://settings/"]
}, function (line, request) {

    function open(url) {
        if (request.modifier === "'") {
            chrome.tabs.update(request.tab.id, {url: url});
        } else if (request.modifier === "`") {
            chrome.tabs.create({url: url, index: request.tab.index + 1, windowId: request.tab.windowId});
        }
    }
    if (line.length === 1) {
        open(line[0]);
    }
});

chrome.extension.onRequest.addListener(function (request, sender, respond) {
    if (handler[request.name] && handler[request.name][request.action]) {
        request.tab = sender.tab;
        request.respond = respond;
        handler[request.name][request.action](request, respond);
    }
});
