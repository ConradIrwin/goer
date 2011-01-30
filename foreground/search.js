/*global document, chrome, window, mode*/
var search = (function () {
    // Thank you very much to Eyal.
    // http://stackoverflow.com/questions/2444430/how-to-get-a-word-under-cursor-using-javascript
    function getWordAtPoint(elem, x, y) {
        var range, currentPos, endPos, i, ret;
        if (elem.nodeType === elem.TEXT_NODE) {
            range = elem.ownerDocument.createRange();
            range.selectNodeContents(elem);
            currentPos = 0;
            endPos = range.endOffset;
            while (currentPos + 1 < endPos) {
                range.setStart(elem, currentPos);
                range.setEnd(elem, currentPos + 1);
                if (range.getBoundingClientRect().left <= x && range.getBoundingClientRect().right  >= x &&
                    range.getBoundingClientRect().top  <= y && range.getBoundingClientRect().bottom >= y) {
                    range.expand("word");
                    ret = range.toString();
                    range.detach();
                    return ret;
                }
                currentPos += 1;
            }
        } else {
            for (i = 0; i < elem.childNodes.length; i += 1) {
                range = elem.childNodes[i].ownerDocument.createRange();
                range.selectNodeContents(elem.childNodes[i]);
                if (range.getBoundingClientRect().left <= x && range.getBoundingClientRect().right  >= x &&
                        range.getBoundingClientRect().top  <= y && range.getBoundingClientRect().bottom >= y) {
                    range.detach();
                    return getWordAtPoint(elem.childNodes[i], x, y);
                } else {
                    range.detach();
                }
            }
        }
        return null;
    }

    var input,
        mouseup;

    function createListener(respond) {
        mouseup = function (e) {
            respond({
                search: this.ownerDocument.getSelection().toString() || getWordAtPoint(e.target, e.x, e.y),
                new_tab: e.ctrlKey,
                background: !e.shiftKey
            });
            e.preventDefault();
            e.stopPropagation();
        };
        document.body.addEventListener('mouseup', mouseup, true);

        // It is necessary to only create one text-box per tab, or they all stack on top of each other
        // and steal each other's focus.
        if (window === window.top) {
            if (!input) {
                input = document.createElement('input');
                input.style.cssText = "position: fixed; top: 0px; right: 0px; width: 200px; height: 20px;";
            }
            input.value = "";
            input.onkeydown = mode({}, {
                '<enter>': function (e) {
                    respond({search: input.value});
                },
                '<c-enter>': function (e) {
                    respond({search: input.value, new_tab: true, background: !e.shiftKey});
                }
            }).handle;

            input.onblur = function () {
                respond({search: null});
            };

            document.body.appendChild(input);
            input.focus();
        }
    }

    function removeListener() {
        document.body.removeEventListener('mouseup', mouseup, true);
        if (input) {
            input.parentElement.removeChild(input);
        }
    }

    chrome.extension.onRequest.addListener(function (request, sender, respond) {
        if (request.action === 'search') {
            createListener(respond);
        } else if (request.action === 'unsearch') {
            removeListener();
        }
    });

}());
