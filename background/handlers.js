/*global chrome, options*/
function handler(name, doer, config) {
    // Spec is an Object mapping names to arrays of arrays of arguments that
    // were added in the config file.
    //
    // i.e.
    //
    // mark a http://google.com/
    // mark a http://google.com/ dummy
    //
    // gives:
    // {a: [["http://google.com/"], ["http://google.com/", "dummy"]]}
    //
    // For mark itself though, we only want one url.
    // Thus we take only the last array, and the first value in that array.
    //
    options.register(name, function (spec) {
        handler[name] = {
            load: function (request) {
                request.respond(Object.keys(spec));
            },
            done: function (request) {
                if (config && config.expand_args) {
                    var poss = spec[request.value],
                        args = poss[poss.length - 1];
                    doer.apply(this, [request].concat(args));
                } else {
                    doer(request, spec[request.value])
                }

            }
        };
    });
}

handler('mark', function (request, url) {
    function open(url) {
        if (request.modifier === "'") {
            chrome.tabs.update(request.tab.id, {url: url});
        } else if (request.modifier === "`") {
            chrome.tabs.create({url: url, index: request.tab.index + 1, windowId: request.tab.windowId});
        }
    }
    open(url);
}, {expand_args: true});

options.reload();

chrome.extension.onRequest.addListener(function (request, sender, respond) {
    if (handler[request.name] && handler[request.name][request.action]) {
        request.tab = sender.tab;
        request.respond = respond;
        handler[request.name][request.action](request, respond);
    }
});
