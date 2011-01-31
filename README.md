This extension makes Chrome a bit of a goer, [know what I mean](http://www.youtube.com/watch?v=jT3_UCm1A5I)? Instead of browsing around and clicking links, you can jump to exactly the right page with a minimum of fuss.

Usage
-----

Goer installs keyboard shortcuts on all pages, so in order to use it, you have to type a key. It currently has four keys:

* `'x` : Open bookmark `x` in the current tab.
* <code>\`x</code> : Open bookmark `x` in a new tab.
* `\x` : Search on search-engine `x`.
* `i` : Interact with the page, i.e. disable these shortcuts until you press Escape.

None of the keys will get in the way if you're already focussed on something editable, though you can type Escape to unfocus.

### Bookmarks (simple) ###

To define new bookmarks, navigate to the options page (type `'o`), and add a line like:

    mark k http://klout.com/

This allows you to jump to Klout by typing `'k`, or to open Klout in a new tab by typing <code>\`k</code>. The name can be any string, however long you like, but I recommend you keep them short.

When you type the <code>'</code> or the <code>\`</code>, a small text box will appear in the top-right hand corner, into which you type the name. If you type the name wrong, or don't press a key for over a second, the box will disappear.

### Searching ###

To define new search engines, navigate to the options page (type `'o`), and add a line like:

    search k http://klout.com/$1

This allows you to find someone on Klout by typing `\k` and then providing their username. There are three ways to do this:

1. Type into the box that appears in the top-right, and then hit enter.
2. Click on their username, if it appears in the current document.
3. Highlighting their username with the mouse (if it appears printed in a URL, for example).

Just like normal chrome, if you hold down Ctrl while typing enter, clicking or highlighting, then the search will open in a new background tab. If you hold down Ctrl and Shift, then the search will open in a new tab, and the new tab will be activated. If you don't press Ctrl or Shift then the search opens in the current tab.

When trying to detect what is a word, Goer removes leading and trailing puncuation, but keeps internal punctuation. i.e. Clicking on <code>"It's"!</code> will give you <code>It's</code>.

### Bookmarks (contextual) ###

This is perhaps the most advanced feature of Goer at the moment. To define a new contextual bookmark, visit the options page, and (at the top) add a line like:

    mark k http://twitter.com/(.*) http://klout.com/$2

Now, typing `'k` on someone's old Twitter page will open up their Klout page, but typing `'k` anywhere else will take you to the homepage of Klout (providing you set up the bookmark in the simple section above). NOTE: It is important that the rules appear with the contextual marks first, as the first rule that matches the current URL is used, and a mark with no context matches all URLs.

### Loading remote configuration ###

The final directive in the configuration file looks like:

    load http://primarypad.com/ep/pad/export/jiR9LVWhzZ/rev.97?format=txt

This allows you to load configuration from anywhere on the internet, which makes it easy to share configuration across various browsers.

Known bugs
----------

* Event-handler interaction with javascript heavy sites (new twitter, google docs) is broken.

Future work
-----------

* Caching remote configuration.
* Omnibox search handlers.
* Override new tab page.
* Prevent opening multiple copies of identical tabs.
* Customise the shortcuts.
* Way to add marks without opening the options page.
* Mechanisms for interacting with the current page efficiently.

Contributing
------------

Bugfixes and features (from the list above, or your imagination) are always welcome.
