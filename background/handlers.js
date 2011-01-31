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
    // For search though, we only want one option — the first.
    //
    options.register(name, function (spec) {
        handler[name] = {
            load: function (request) {
                request.respond(Object.keys(spec));
            },
            done: function (request) {
                if (config && config.expand_args) {
                    doer.apply(this, [request].concat(spec[request.value][0]));
                } else {
                    doer(request, spec[request.value]);
                }

            }
        };
    });
}

function open(request, url, new_tab, background) {
    if (new_tab) {
        chrome.tabs.create({url: url, index: request.tab.index + 1, windowId: request.tab.windowId, selected: !background});
    } else {
        chrome.tabs.update(request.tab.id, {url: url});
    }
}

/**
 * The mark command is defined in two possible ways:
 *
 * absolute bookmark: mark m http://mail.google.com/
 * relative bookmark: mark s ^http:// https://
 *
 * We want to find the first bookmark (absolute, or matching relative)
 * that was defined in the options file, and open it.
 */
handler('mark', function (request, spec) {
    var url;

    spec.forEach(function (args) {
        if (url) {
            return;
        }
        if (args.length === 1) {
            url = args[0];
        } else {
            var regex = new RegExp(args[0]),
                replacement = args[1];
            if (request.tab.url.match(regex)) {
                url = request.tab.url.replace(regex, replacement);
            }
        }
    });

    open(request, url, request.modifier === "`");
});

/**
 * The search command is only defined in one way:
 *
 * search p http://en.wikipedia.org/wiki/Special:Search/%s
 *
 * When the user has typed \p, we need them to insert a search term,
 * and then we do the search.
 */
handler('search', function (request, url) {
    chrome.tabs.sendRequest(request.tab.id, {action: "search"}, function (response) {
         // NOTE: because requests sent to tabs are sent to each frame in the tab,
         // when any frame responds, we need to stop all the other frames listening.
        chrome.tabs.sendRequest(request.tab.id, {action: "unsearch"});
        if (response.search) {
            open(request, url.replace("%s", response.search), response.new_tab, response.background);
        }
    });
}, {expand_args: true});

options.reload();

chrome.extension.onRequest.addListener(function (request, sender, respond) {
    if (handler[request.name] && handler[request.name][request.action]) {
        request.tab = sender.tab;
        request.respond = respond;
        handler[request.name][request.action](request, respond);
    }
});
