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
function modes(normal, focussed) {
    function press(charcode, spec, e) {
        if (spec[charcode]) {
            spec[charcode](e);
        }
    }
    return {
        handle: function (e, normal_mode) {
            press(keyDownToVim(e), (normal_mode ? normal : focussed), e);
        }
    };
}
document.addEventListener('keydown', function (e) {
    (modes.active || modes.normal).handle(e, (document.activeElement === document.body));
}, true);
modes.activate = function (name) {
    return function (e) {
        modes.active = modes[name];
    };
};

// Interact mode defines as few keyboard mappings as possible,
// only an escape when not focussed to get out of this mode.
modes.interact = modes({
    "<esc>": modes.activate("normal")
}, {});

// Normal mode is where we spend the vast majority of time.
modes.normal = modes({
    "i":  modes.activate("interact"),
    "'":  input.activate("mark", "'"),
    "`":  input.activate("mark", "`"),
    "\\": input.activate("search", "\\")
}, {
    "<esc>": function () {
        document.activeElement.blur();
    }
});
