# Z-XMPP #

For more info, visit <http://ivan.vucica.net/zxmpp/>.

## What is it? ##
This is an implementation of an XMPP client in JavaScript. It uses BOSH concept 
of HTTP binding as defined by XEP-0124 and XEP-0206. 

It is a semi-structured hack, assembled not so much as a planned effort by 
a JavaScript expert; it's more of a thing that's here just to serve its purpose,
and that purpose is luckily for its internals to be pretty. So hacker: beware!

## Goal ##

Goal is to have a backend library for doing XMPP, and a separate GUI that will
allow attaching an overlay over existing webpage, as well as almost transparent
reconnection upon unloading the page and reloading it.

Another goal is to support major standards-based browsers: Safari, Chrome,
Opera, Firefox.

## User interface ##

While primarily an XMPP library that preserves connection between page switches, Z-XMPP also includes an ugly user interface component for instant messaging. It appears as a bar on the bottom of the screen.

![Screenshot of Z-XMPP UI](http://ivan.vucica.net/zxmpp/screenshot.png)

## Compatibility ##

It is expected that the client will cover at least XEP-0242: XMPP Client
Compliance 2009 Core Client profile. Of course, almost anything goes that
doesn't require additional socket connections (since they're a bit... tricky
to do in JavaScript, you'll surely agree).

Z-XMPP has been tested with the following BOSH connection managers:

* [ejabberd](http://ejabberd.im/)'s connection manager
* [Prosody](http://prosody.im/)'s connection manager
* [Punjab](http://punjab.sourceforge.net/)

Z-XMPP has been tested with the following XMPP server software:

* [ejabberd](http://ejabberd.im/)
* [Prosody](http://prosody.im/)
* [Google Talk](http://talk.google.com/)
* [Facebook Chat](http://www.facebook.com/help/?page=1164)

### Version 1.0 ###

Following SASL authentication methods are partially or fully supported:

* PLAIN
* DIGEST-MD5

Following XEPs are partially or fully supported:

* XEP-0030: Service Discovery
* XEP-0054: vcard-temp
* XEP-0085: Chat State Notifications
* XEP-0092: Software Version
* XEP-0115: Entity Capabilities
* XEP-0124: Bidirectional-streams Over Synchronous HTTP (BOSH)
* XEP-0206: XMPP Over BOSH

There may be additional features supported, but not documented.

## License ##

Please read the [LICENSE](LICENSE) to see current use terms.

## Installation ##

Here's how to set up `demo.php` to work.

1. Start up a server such as ejabberd or Prosody. Enable BOSH in it by
referring to the server's manual. Alternatively, set up a connection
manager for BOSH (a BOSH service that acts as a proxy to the real XMPP
server). A good connection manager is Punjab.
2. Get your HTTP server to forward requests from a directory in the
same domain and port that your site (or `demo.php`) is hosted on.
If you use Apache, `.htaccess` shipping with Z-XMPP is a good starting 
point. This is required due to Javascript cross-domain scripting
access policies on modern browsers, which would prevent Z-XMPP
and any other Javascript XMPP library from accessing the actual BOSH 
server directly.
3. Edit `demo.php` to point to the directory that now redirects to
the proper path and port of your BOSH server.

These instructions can, of course, be improved, and the author will be
happy to answer your questions on how to get Z-XMPP to connect to your
XMPP server on your web site (to the extent of his ability, of course).

## Contributing ##

Patches and good natured criticism can be directed to <zxmpp@vucica.net>.

You can also contact me via [xmpp:ivucica@gmail.com](xmpp:ivucica@gmail.com)

- - -

Copyright 2010-2012 Ivan Vučica

