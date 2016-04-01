# BUGS #

## Callbacks are not wrapped in try/catch ##

If the programmer that maintains the html/javascript that makes use of ZXMPP is 
not extra careful, entire ZXMPP can be brought down by a poorly written 
callback.

Result: make a mistake in main php/html/js file, entire zxmpp connection breaks down

## Namespaced XML elements improperly handled ##

DOM provides localName, prefix and namespaceURI which need to be used in place
of nodeName and attr["xmlns"]. This needs to be fixed primarily because of
Google Talk servers, which seem to make extensive use of namespacing, including
with, but not limited to, jingle (prefix jin:), gingle (prefix ses:), etc.

Result: some otherwise handleable traffic is not understood by the client

## BOSH cryptographic key is disabled to placate Punjab ##

Punjab tolerates rids coming out of order, but not keys coming out of order.
This is why the key is temporarily disabled. Disabling it should be
exposed via an API.

Also, a report needs to be filed with author of Punjab.

Result: MITM is possible.

