/*global document, chrome, window, mode*/
var search = (function () {

    var input,
        mouseup;


    /**
     * Given a string and an offset, which word (if any) spans that offset.
     * Include intermediary punctuation, but not final or initial, so that words
     * like it's, and email address work; while full stops are excluded.
     */
    function closestWord(string, offset) {
        var fragments = string.split(/(\W*\s+\W*)/),
            fragment;

        while (fragment = fragments.shift()) {
            offset -= fragment.length;

            if (offset <= 0) {
                return fragment.match(/\s+/) ? "" : fragment;
            }
        }
    }

    /**
     * Given an element, and an x, y offset, find the word (if any) at that position.
     * This uses  a simple recursive algorithm to move down through layers of DOM to the
     * textNode, and then uses closestWord to finish the deal.
     *
     * TODO: Words can span nodes, this doesn't work for text-boxes...
     *
     * Thank you very much to Eyal.
     * http://stackoverflow.com/questions/2444430/how-to-get-a-word-under-cursor-using-javascript
     */
    function getWordAtPoint(elem, x, y) {
        var range, currentPos, endPos, i, ret;

        function containsPoint(range) {
            var rect = range.getBoundingClientRect();
            return (rect.left <= x) && (rect.right >= x) && (rect.top  <= y) && (rect.bottom >= y);
        }

        if (elem.nodeType === elem.TEXT_NODE) {
            range = elem.ownerDocument.createRange();
            range.selectNodeContents(elem);
            currentPos = 0;
            endPos = range.endOffset;
            while (currentPos + 1 < endPos) {
                range.setStart(elem, currentPos);
                range.setEnd(elem, currentPos + 1);
                if (containsPoint(range)) {
                    if (range.toString().match(/\s/)) {
                        return "";
                    } else {
                        return closestWord(elem.data, currentPos);
                    }
                }
                currentPos += 1;
            }
        } else {
            for (i = 0; i < elem.childNodes.length; i += 1) {
                range = elem.childNodes[i].ownerDocument.createRange();
                range.selectNodeContents(elem.childNodes[i]);
                if (containsPoint(range)) {
                    range.detach();
                    return getWordAtPoint(elem.childNodes[i], x, y);
                } else {
                    range.detach();
                }
            }
        }
        return null;
    }

    function createListener(respond) {
        mouseup = function (e) {
            respond({
                search: document.getSelection().toString() || getWordAtPoint(e.target, e.x, e.y),
                new_tab: e.ctrlKey,
                background: !e.shiftKey
            });
            e.preventDefault();
            e.stopPropagation();
        };
        document.addEventListener('mouseup', mouseup, true);

        // It is necessary to only create one text-box per tab, or they all stack on top of each other
        // and steal each other's focus.
        if (window === window.top) {
            if (!input) {
                input = document.createElement('input');
                input.style.cssText = "position: fixed; top: 0px; right: 0px; width: 200px; height: 20px;";
            }
            input.value = "";
            input.onkeydown = mode({}, {
                '<enter>':  function (e) {
                    respond({search: input.value, new_tab: !!e.ctrlKey, background: !e.shiftKey});
                },
                '<esc>': function (e) {
                    respond({search: null});
                },
                '<c-enter>': '<enter>',
                '<tab>': '<esc>'
            }).handle;

            document.body.appendChild(input);
            input.focus();
        }
    }

    function removeListener() {
        document.removeEventListener('mouseup', mouseup, true);
        if (input) {
            input.onblur = false;
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
