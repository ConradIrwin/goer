/* This file is heavily based on the Vimium source code, which bears
 * the following notice:
 *
 * Copyright (c) 2010 Phil Crosby, Ilya Sukhar.
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/*global navigator*/

// Get a vim key escape based on a keydown event.
// NOTE: This has many (many) limitations and should be used sparingly.
var keyDownToVim = (function () {
    var keyCodes = { ESC: 27, backspace: 8, tab: 9, deleteKey: 46, enter: 13, space: 32, shiftKey: 16, f1: 112, f12: 123},
        // More vimmy names for some keys (TODO: expand)
        keyNames = { 27: "esc", 37: "left", 38: "up", 39: "right", 40: "down" },

        // WebKit key-down events have the wrong charCode except on Mac. 
        // https://bugs.webkit.org/show_bug.cgi?id=19906 for more details.
        correctors = /Mac/.test(navigator.userAgent) ? {} : {
            "U+00C0": ["U+0060", "U+007E"], // `~
            "U+00BD": ["U+002D", "U+005F"], // -_
            "U+00BB": ["U+003D", "U+002B"], // =+
            "U+00DB": ["U+005B", "U+007B"], // [{
            "U+00DD": ["U+005D", "U+007D"], // ]}
            "U+00DC": ["U+005C", "U+007C"], // \|
            "U+00BA": ["U+003B", "U+003A"], // ;:
            "U+00DE": ["U+0027", "U+0022"], // '"
            "U+00BC": ["U+002C", "U+003C"], // ,<
            "U+00BE": ["U+002E", "U+003E"], // .>
            "U+00BF": ["U+002F", "U+003F"] // /?
        };

    function getKeyChar(e) {
        if (!/^U\+/.test(e.keyIdentifier)) {
            if (keyNames[e.keyCode]) {
                return keyNames[e.keyCode];
            } else if (e.keyCode >= keyCodes.f1 && e.keyCode <= keyCodes.f12) {
                return "f" + (1 + e.keyCode - keyCodes.f1);
            } else {
                return e.keyIdentifier.toLowerCase();
            }
        } else if (keyNames[e.keyCode]) {
            return keyNames[e.keyCode];
        }

        var keyIdentifier = (correctors[e.keyIdentifier] ? correctors[e.keyIdentifier][e.shiftKey ? 1 : 0] : e.keyIdentifier),
            keyChar       = String.fromCharCode(parseInt(keyIdentifier.replace(/^U+/, ''), 16));

        if (e.shiftKey) {
            return keyChar.toUpperCase();
        } else {
            return keyChar.toLowerCase();
        }
    }

    return function (e) {
        var modifiers = [],
            keyChar = getKeyChar(e);

        if (e.metaKey) {
            modifiers.push("m");
        }
        if (e.ctrlKey) {
            modifiers.push("c");
        }
        if (e.altKey) {
            modifiers.push("a");
        }

        if (modifiers.length) {
            modifiers.push(keyChar);
            return "<" + modifiers.join("-") + ">";
        } else if (keyChar.length > 1) {
            return "<" + keyChar + ">";
        } else {
            return getKeyChar(e);
        }
    };
}());
