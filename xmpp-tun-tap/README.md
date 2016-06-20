XMPPTunTap
==========

Copyright (c) 2012, Ivan Vucica, http://ivan.vucica.net/

All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

 * Redistributions of source code must retain the above copyright
   notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above
   copyright notice, this list of conditions and the following
   disclaimer in the documentation and/or other materials
   provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
THE POSSIBILITY OF SUCH DAMAGE.

About
-----

This is a small XMPP bot that makes use of TUN/TAP virtual network capability
of the operating system to add a virtual network card, and then sends all
network traffic over XMPP to the target party via message stanzas.

This was primarily a proof-of-concept hack to allow communication with a
certain emulator running in a browser. (Network traffic is sent from the
emulator into browser-based XMPP client, and the client then sends it to
the XMPP server which can forward the traffic onwards). If it were to be
done properly, at the very least it'd have to use the InBand Bytestreams
as defined in XEP-0047.

If it were to be done even better, it'd use Jingle to negotiate the channel
with some of the candidates being in-band, and some actually determined
via ICE and the data being transmitted peer-to-peer.

However, that was not the goal; the goal was to allow exchange of traffic
with the sandboxed emulator, and to do so in the easiest way possible.

Requirements
------------
This uses xmpppy library.

More specifically, xmpppy-0.5.0rc1 was used. Unpack `xmpppy-0.5.0rc1.tar.gz`
and place the `xmpp/` subfolder directly into xmpptuntap's folder.

Using
-----
1. Copy `config.py.example` to `config.py`.
2. Specify a Jabber ID and password for connecting to the XMPP server.
3. Take a look at `example-launcher.sh` for an example on how to launch the
   program.

Details:

    sudo ./xmpptuntap.py [device] [ipaddress] [jid]

- `device`: hardcoded default is `tap2`, a somewhat safe default for OS X.
  Under Linux you'll want to use `net/tun`, which autogenerates a new
  TAP device of form `xmpptuntap%d`.
- `ipaddress`: defaults to 10.0.2.1
- `jid`: defaults to whatever you specified in `config.py`; as long as the
  password doesn't change, this is a nice way to start multiple programs

To connect to a JID, either receive an invitation or send it by typing the
other person's JID and pressing enter.

Linux
-----
To work with Linux, specify `net/tun` as the device on command line.

Linux IPv4 forwarding
---------------
I'm primarily documenting this for my own use; run as root:

    echo "1" > /proc/sys/net/ipv4/ip_forward
    iptables -A FORWARD -i eth0 -o xmpptuntap0 -m state --state ESTABLISHED,RELATED -j ACCEPT
    iptables -A FORWARD -i xmpptuntap0 -o eth0 -j ACCEPT
    iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE

Save and restore iptables:

    iptables-save > iptables.conf
    iptables-restore < iptables.conf

Show rules and flush them:

    iptables -L
    iptables -F


Todo
----

* Switch to Jingle negotiation. Even if true p2p support is not added,
it'd still be nice to make things compatible with someone's theoretical
future client. (XEP-0166)

* Switch to in-band bytestreams. This would tolerate incoming data
coming out of order. (XEP-0047, XEP-0261)



