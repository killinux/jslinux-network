<?php header('Content-type: text/html; charset=utf-8'); ?>
<!DOCTYPE html>
<!--

This is the home page of Z-XMPP available on:
http://ivan.vucica.net/zxmpp/
I doubt you want to use it for your installation of Z-XMPP :)

-->
<html>
<head>
<title>Z-XMPP</title>
</head>
<body>

<h1>Z-XMPP</h1>
<h2>XMPP client/library written in JavaScript</h2>
<hr>

<h3>Screenshot</h3>
<img src="screenshot.png" alt="(A screenshot of ZXMPP)">
<p>
While primarily an XMPP library that preserves connection between page 
switches, Z-XMPP also includes an ugly user interface component for
instant messaging. It appears as a bar on the bottom of the screen.
</p>

<h3>What does it do?</h3>

<p>
It's an <a href="http://xmpp.org/about-xmpp/technology-overview/">XMPP</a>
(also known as Jabber) client. 
It's written in JavaScript and it's able to serialize (most of) its 
state. This is done so that making use of the latest innovations in HTML5 such
as <code>sessionStorage</code> is not only possible, but is recommended. By 
serializing the state using <code>sessionStorage</code> and restoring it upon 
page load, Z-XMPP can persist the XMPP stream between page switches. This is 
similar to what Facebook Chat seems like to users of Facebook: clicking on a 
link does not restart the chat session, and to other people, the user does 
not appear to be logging in and out. At the same time, web developer is not
required to create the entire web site using AJAX; backing web site can be
written in any way desired, as long as Z-XMPP code is included. 
</p>

<p>
So the biggest specialty of this client compared to its older brethren is 
its ability to persist the connection between page switches.
</p>

<p>
Most of the client is the communications code, as well as maintaining relevant 
state. This is intentionally separated from the (currently extremely 
rudimentary and poorly written) UI. This means you can either use it as a
client, or as a library, or even both.
</p>

<h3>How to get it?</h3>
<p>
Client is currently hosted on 
<a href="http://bitbucket.org/ivucica/zxmpp/">http://bitbucket.org/ivucica/zxmpp/</a>. See instructions on BitBucket to see how to get the code using Mercurial,
or just download an archive of the current snapshot of the code from
BitBucket's web interface.
</p>

<ul>
<li><a href="downloads/zxmpp-1.0.tar.gz">Version 1.0</a> - released on Oct/22/2011, 13:35 CET</li>
</ul>

<h3>How to contribute?</h3>
<p>
<b>To contribute</b> to the development effort:
<ul>
<li>first send me an email to <code>zxmpp@vucica.net</code></li>
<li>then create a public clone on BitBucket and keep me posted when you want me to merge the changes</li>
</ul>
</p>

<p><b>Urgently wanted!</b> Someone needs to rewrite the bar interface ASAP.
JQuery ninjas are especially welcome to contribute (although anything decently
written will be accepted). You don't need to worry about networking; as long as
you provide me with a nice&amp;simple API to: 1. add users to roster, 2. remove
users to roster, 3. update users in roster, 4. update user's status in roster,
5. display a message from a user, 6. register a callback to send a message...
well, that's it! The UI should be bar-based, since that is most useful for
most people; otherwise, the field is yours!
</p>


<h3>How was it implemented?</h3>
<p>
This client is written in pure JavaScript. It communicates with the server 
using two <code>XMLHTTPRequest</code>-based connections, in accordance to the 
<a href="http://xmpp.org/about-xmpp/technology-overview/bosh/">BOSH</a> 
specifications: <a href="http://xmpp.org/extensions/xep-0124.html">XEP-0124</a> 
and <a href="http://xmpp.org/extensions/xep-0206.html">XEP-0206</a>. In short,
you need a BOSH connection manager (either specialized such as 
<a href="http://code.stanziq.com/punjab">Punjab</a> or built in, such as those
in <a href="http://prosody.im">Prosody</a> or 
<a href="http://ejabberd.im">ejabberd</a>), which exposes a HTTP-based
interface, to which BOSH-based clients such as Z-XMPP can communicate to.
</p>

<p>
User interface is separately implemented, and it needs to be explicitly linked
to Z-XMPP when Z-XMPP and Z-XMPP UI are instantiated. Same with serialization:
you need to explicitly serialize and deserialize Z-XMPP on page unload and
page load. This allows you to develop your own UI, to intercept 
<code>&lt;message&gt;</code> stanzas, et cetera. Currently, a low number of
callbacks is exposed, but if there is sufficient interest or if it proves
fun enough, there are plans to develop Prosody-like plugin API allowing you
to register callback to an arbitrary tree node.
</p>

<p>
Take a look at <code>demo.php</code> in the repository in order to see how to:
<ul>
<li>import Z-XMPP and connect to the server</li>
<li>persist connection between page switches (serialization/deserialization)</li>
<li>use Z-XMPP UI to display a bar with roster and chat windows, and link it to Z-XMPP using some callbacks</li>
</ul>
</p>

<p>
To get Facebook Chat-like functionality (that is, automatically log user in
when he visits your web site)
you should use a bit of your own ingenuity. For my current setup, keywords
are: ejabberd, external authentication, one-shot authentication key (to
avoid echo-ing plaintext password in HTML sent to the user).
</p>

<h3>Security Issues</h3>
<p>
Before you implement Z-XMPP on your latest cool web project, <b>stop</b>.
Please note that Z-XMPP is by no means designed to be super-secure. Here is a
short list of the current major issues if you're not super careful.
</p>

<ul>
<li><b>plaintext authentication only.</b> Z-XMPP is unable to authenticate user
if the server doesn't accept plaintext auth. This also means that unless
security is provided using HTTPS, your user's password will be transmitted
in clear.</li>
<li><b>inherent insecurity of HTTP.</b> Your user's traffic is not
encrypted if Z-XMPP is used over HTTP. Use only HTTPS wherever you implement
Z-XMPP, or make sure your users are aware that they are using an insecure
communications channel.</li>
<li><b>locally stored data.</b> This isn't so important, but you might want to
be aware of it. Data stored using <code>sessionStorage</code> 
(or if you choose to implement serialization using cookies) might be accessible
to third party sites on your domain. There might be too much data stored in
browser's memory as well.</li>
<li><b>be careful where you <code>echo</code> user's password.</b> When
implementing autologin into Z-XMPP based on user's credentials for your web
site, resist the temptation to just <code>echo</code> user's permanent
credentials onto the web site. This means someone could dig the cache and
take a look at what password the user uses. Instead, upon page access, 
dynamically create a one shot authentication key which will be accessible only
by the external authentication library of the XMPP server.
</ul>

<h3>Basic setup</h3>
<p>
Instead of writing a detailed setup guide, I'll give you just a few tips:
</p>

<ul>
<li>install a server such as Prosody or ejabberd.</li>
<li>refer to server's documentation on how to turn on BOSH (or, use a 
connection manager such as Punjab)</li>
<li>most servers run BOSH on port 5280; accessing this with XMLHTTPRequest
would violate single-origin security policy in modern browsers, so you need
to configure your primary HTTP to redirect requests from some subdirectory
into something like http://your.servers.fqdn:5280/http-bind
<ul><li>note: example <code>.htaccess</code> for apache is included! It 
requires enabled <code>mod_rewrite</code> (which conflicts with
<code>~something</code> folders)</li></ul></li>
<li>unpack Z-XMPP to a subfolder of your web site, and make sure 
<code>.htaccess</code> mentioned above is in there</li>
<li>look at <code>demo.php</code> to see how to integrate Z-XMPP with your 
web site
<ul><li>note that a convenience PHP file is included for easier inclusion
of Z-XMPP, and easier upgrades in the future</li></ul></li>
<li>finally, <b>tell me you're using Z-XMPP</b> via a nice email dispatched to <code>zxmpp@vucica.net</code>. This'll stimulate further development and
make my heart all warm and fuzzy. 
<ul><li>Also consider contributing code :-)</li></ul></li>
</ul>

<h3>Browser compatibility</h3>
<ul>
<li>Firefox: 3.6+ (3.5, if you don't care about serialization; window.sessionStorage doesn't seem to work in onUnload); 4.0beta7 tested</li>
<li>MSIE: n/a (only standards-based XHR is used, plus I don't like MSIE nor use Windows most of the time)</li>
<li>Opera: not tested</li>
<li>Chrome: 8.0 tested, may work in earlier versions</li>
<li>Safari: 5.0 tested, may work in earlier versions</li>
</ul>

<h3>To do</h3>
My personal want-to-do minilist, in order of necessity:
<ul>
<li>serialize UI state, not just stream state</li>
<li>create a Prosody-like plugin API, and rewrite existing code to use it</li>
<li>add <code>ANONYMOUS</code> authentication</li>
<li>rewrite UI (or accept a contribution of a rewritten UI)</li>
<li>fix bugs in <code>BUGS</code> file :-)</li>
</ul>

<h3>Licensing</h3>
<p>Currently LGPLv2. See LICENSE for details, and in case something changed.</p>

<h3>Author &amp; contact</h3>
<p>Ivan Vučica<br>
zxmpp@vucica.net<br>
http://ivan.vucica.net/<br>
http://blog.vucica.net/<br>
http://twitter.com/ivucica</p>

<h6>&copy; 2010-2012 Ivan Vučica</h6>
</body>
</html>
