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
     * TODO: Words can span nodes, are there other cases to consider?
     */
    function getWordAtPoint(e) {

        console.log("get word at point");
        // The user has actually highlighted stuff.
        if (document.getSelection().toString()) {
            return document.getSelection().toString();

        } else if (document.activeElement !== document.body) {

            // The user is focused in a text-box
            if (document.activeElement.nodeName === "INPUT" || document.activeElement.nodeName == "TEXTAREA") {
                return closestWord(document.activeElement.value, document.activeElement.selectionStart);
            } else {
                // TODO: see google docs.
            }

        // The user clicked somewhere randomly.
        } else {
            var range = document.caretRangeFromPoint(e.x, e.y);
            if (range.startContainer.data) {
                return closestWord(range.startContainer.data, range.startOffset);
            }
        }
    }

    function stop(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    function stopPropagation(e) {
        e.stopPropagation();
        return false;
    }

    function createListener(respond) {
        mouseup = function (e) {
            respond({
                search: getWordAtPoint(e),
                new_tab: e.ctrlKey,
                background: !e.shiftKey
            });
            return stop(e);
        };
        document.addEventListener('mouseup', mouseup, true);
        document.addEventListener('click', stop, true);
        document.addEventListener('mousedown', stopPropagation, true);

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
        document.removeEventListener('click', stop, true);
        document.removeEventListener('mousedown', stopPropagation, true);
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
