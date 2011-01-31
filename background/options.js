/*global XMLHttpRequest, chrome, localStorage, window*/
var options = (function () {
    var registrants = {};

    // If we're on the options page, we forward any log messages there.
    // (though there are no doubt more user-friendly mechanisms worth
    // investigating)
    function log(/* arguments */) {
        if (registrants.log) {
            registrants.log.apply(this, arguments);
        }
    }

    // TODO: cache.
    // Load a goer script from a remote URL, basically easy sharing of
    // config across different browsers.
    function load(url) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send(null);

        if (/^(\s|\r|\n)*#!goer/i.test(xhr.responseText || "")) {
            log(xhr.responseText.replace("#!goer", "#!goer " + url));
            return xhr.responseText;
        } else {
            log("Failed to load ", url, " response didn't start with #!goer");
            return "";
        }
    }

    // Given a goer file, parse it.
    // The grammar is pretty simple, each line is either a comment (starts with #),
    // blank, or a command.
    // Commands are of the form <command> <name> [<arg> ]*
    function parse(spec, parsed) {
        if (!parsed) {
            parsed = {};
        }
        spec.split("\n").forEach(function (line) {
            var tokens = line.trim().split(/\s+/),
                name = tokens[0],
                key  = tokens[1],
                args = tokens.slice(2);

            if (name[0] === "#" || name === "") {
                return;
            } else if (!key) {
                log("Incomplete line: ", line);
            } else if (name === "load") {
                parsed = parse(load(key), parsed);
            } else if (name === "log") {
                log.apply(this, [key].concat(args));
            } else if (registrants[name] && key) {
                if (!parsed[name]) {
                    parsed[name] = {};
                }
                if (!parsed[name][key]) {
                    parsed[name][key] = [];
                }
                parsed[name][key].push(args);
            } else {
                log("Unrecognised command: ", name);
            }
        });

        return parsed;
    }

    function defaultOptions() {
        localStorage.options = load(chrome.extension.getURL("/options/default.goer"))
                                .replace('{options-url}', chrome.extension.getURL("/options/index.html"));
        return localStorage.options;
    }

    return {
        reload: function () {
            var parsed = parse(localStorage.options || defaultOptions());
            Object.keys(registrants).forEach(function (name) {
                if (name !== 'log') {
                    registrants[name](parsed[name] || {});
                }
            });
        },
        register: function (name, callback) {
            registrants[name] = callback;
        }
    };
}());

chrome.extension.onConnect.addListener(function (port) {
    if (port.name !== "options") {
        return;
    }

    options.register('log', function (/*arguments*/) {
        port.postMessage({log: Array.apply(Array, arguments)});
    });

    port.onMessage.addListener(function (msg) {
        if (msg.action === "reload") {
            options.reload();
        }
    });

    port.onDisconnect.addListener(function () {
        options.register('log', null);
    });
});
