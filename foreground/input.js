/*global document, window, chrome*/
/* The input object is a singleton that deals with getting the name of an
 * action from the user.
 *
 * The way event handling works is first there is an indicator keydown
 * event (which can only be reliably identified by keyCode), this then
 * opens the input in order to read the rest of the event string, which may
 * be any text identifiable by the actual characters.
 *
 * public:
 *  .activate(name, modifier) - A function to start accepting user-input for
 *                              the given mode with the given modifier.
 * 
 * TODO: Rigourously test this, user-interaction in javascript is very hard
 *       to get right, and this is almost certainly too simplistic.
 */
var input = (function () {
    var textbox, // The HTML input element we'll use to interact with the user.
        handler, // The current input handler, which accepts values as instructed by the background page.
        timeout; // The timeout that we set when we think the user is bored.
    return {
        activate: function (name, modifier) {
            return function () {
                if (!textbox) {
                    textbox = document.createElement('input');
                    textbox.style.cssText = "position: fixed; top: 0px; right: 0px; width: 20px; height: 20px; border: 0px;";
                    textbox.onblur = function () {
                        textbox.parentElement.removeChild(textbox);
                    };
                }
                textbox.value = "";
                textbox.onkeyup = function () {
                    handler(textbox.value);
                };
                document.body.appendChild(textbox);
                textbox.focus();

                // Before the response list has loaded, we want to do nothing.
                handler = function () {
                    return false;
                };

                // Get the list of possible arguments for this mode into response.
                chrome.extension.sendRequest({name: name, action: 'load', modifier: modifier}, function (response) {
                    handler = function (value) {

                        // The user has typed something, so we need to reset our timer.
                        if (timeout) {
                            window.clearTimeout(timeout);
                        }

                        // The user has pressed backspace and deleted the modifier.
                        if (!value) {
                            textbox.blur();
                            return;

                        // Otherwise the modifier should still be in there.
                        } else if (value.indexOf(modifier) === 0) {
                            value = value.substr(1);
                        }

                        // Get the list of possible arguments filtered by prefix match
                        // with what the user has typed so far.
                        var results = response.filter(function (possible) {
                            return possible.indexOf(value) === 0;
                        });

                        // If the user has typed an unambiguous match, accept it.
                        if (results.length === 1 && results[0] === value) {
                            chrome.extension.sendRequest({name: name, action: 'done', value: value, modifier: modifier});
                            textbox.blur();

                        // Otherwise if they're on the way to a match, wait for them.
                        } else if (results.length) {
                            timeout = window.setTimeout(function () {
                                if (results.indexOf(value) > -1) {
                                    chrome.extension.sendRequest({name: name, action: 'done', value: value, modifier: modifier});
                                }
                                textbox.blur();
                            }, 1000);

                        // Though if they've typed nonsense, we'll get out of the way.
                        } else {
                            textbox.blur();
                        }
                    };

                    // If the user has typed a key before the response list was loaded,
                    // handle their input here.
                    handler(textbox.value);
                });
            };
        }
    };
}());

