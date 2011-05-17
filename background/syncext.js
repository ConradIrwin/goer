/*global XMLHttpRequest, localStorage, JSON, setInterval */

var syncext = (function () {
    function xhr(method, url, data, callback, errback) {
        var req = new XMLHttpRequest();
        req.open(method, url);
        req.setRequestHeader('Content-Type', 'text/plain');
        req.send(data);
        req.onreadystatechange = function () {
            if (req.readyState === 4) {
                if (req.status >= 200 && req.status < 210) {
                    callback(JSON.parse(req.responseText));
                }
            }
        };
    }

    return function (config, notify) {
        var watch_interval = 1000,
            previous = {};

        if (localStorage['sync.url']) {
            config.url = localStorage['sync.url'];
        }

        function callback() {
            if (config.url) {
                localStorage['sync.url'] = config.url;
            }
            notify(config);
        }

        function upload(next) {
            config.url = config.url || "https://syncext.appspot.com/config/";
            xhr('POST', config.url, JSON.stringify(next), function (response) {
                if (response.success) {
                    config.url = response.url;
                    callback();
                }
            });
        }

        function download() {
            if (config.url) {
                xhr('GET', config.url, '', function (response) {
                    previous = {};
                    Object.keys(localStorage).concat(Object.keys(response)).forEach(function (key) {
                        previous[key] = localStorage[key] = response[key];
                    });
                    callback();
                });
            } else {
                callback();
            }
        }

        download();

        setInterval(function () {
            var next = {}, needs_sync = false;
            Object.keys(localStorage).forEach(function (key) {
                next[key] = localStorage[key];
            });

            Object.keys(next).concat(Object.keys(previous)).forEach(function (key) {
                if (next[key] !== previous[key]) {
                    needs_sync = true;
                }
            });

            previous = next;
            if (needs_sync) {
                upload(next, config, callback);
            }
        }, 5000);

        // TODO: replace this by long-polling/WebSockets
        setInterval(function () {
            if (config.url) {
                xhr('GET', config.url, '', function (response) {
                    var changed = false;
                    previous = {};
                    Object.keys(localStorage).concat(Object.keys(response)).forEach(function (key) {
                        if (localStorage[key] !== response[key]) {
                            changed = true;
                            previous[key] = localStorage[key] = response[key];
                        }
                    });
                    if (changed) {
                        callback();
                    }
                });
            }
        }, 300000);
    };
}());
