/*global document, window, keyDownToVim, input*/

/* The modes object is a singleton that handles the keyboard modes.
 * 
 * Each mode can have two "minor-modes", one when focussed on an element,
 * and the other when not interacting with the current page.
 *
 * These are specified as a mapping of keys to functions, where the
 * keyDownToVim helper is used to convert between keydown events and
 * the keys.
 */
function mode(normal, focussed) {
    function press(charcode, spec, e) {
        if (spec[charcode]) {
            if (typeof spec[charcode] === 'string') {
                press(spec[charcode], spec, e);
            } else {
                spec[charcode](e);
            }
        }
    }
    return {
        handle: function (e, normal_mode) {
            press(keyDownToVim(e), (normal_mode ? normal : focussed), e);
        }
    };
}

(function () {
    var active, normal, interact;

    normal = mode({
            "i":  function () {
                active = interact;
            },
            "'":  input.activate("mark", "'"),
            "`":  input.activate("mark", "`"),
            ";": input.activate("search", ";")
        }, {
            "<esc>": function () {
                document.activeElement.blur();
            }
        });
    interact = mode({
            "<esc>": function () {
                active = normal;
            }
        }, {});

    active = normal;
    document.addEventListener('keydown', function (e) {
        active.handle(e, (document.activeElement === document.body));
    }, true);
}());
