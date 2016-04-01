Websockets TUN/TAP
==================

This pywebsocket request handler allows Javascript software to establish
ethernet connectivity to the server through a service exposing the TAP
device via Websockets.

Useful for 'certain emulators'.

Note: this is not of production quality, and is almost certainly a
security risk. Think hard before running this without authentication or
thinking multiple times whether you want the server you run this on to be
VPNed to. While intended for Javascript, remember that anyone could connect
to this service even without Javascript.

(c) 2013 Ivan Vucica
