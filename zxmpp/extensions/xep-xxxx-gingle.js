/* 
 * Z-XMPP
 * A Javascript XMPP client.
 *
 * XEP-0166: Jingle extension
 *
 * (c) 2012 Ivan Vucica
 * License is located in the LICENSE file
 * in Z-XMPP distribution/repository.
 * Use not complying to those terms is a
 * violation of various national and
 * international copyright laws.
 */

var zxmpp_gingle_PeerConnection = false;
function zxmpp_gingle_init(zxmpp)
{
	/*
	try
	{
		new PeerConnection("", function(){});
		zxmpp_gingle_PeerConnection = PeerConnection;
	}
	catch (e)
	{
		zxmpp_gingle_PeerConnection = webkitPeerConnection00;
	}

	try
	{
		new zxmpp_gingle_PeerConnection("", function(){});
	}
	catch (e)
	{
		zmpp_gingle_PeerConnection = false;
	}
	*/


	zxmpp.clientFeatureExtensions["voice-v1"]=["http://www.google.com/xmpp/protocol/voice/v1"];
	zxmpp.clientFeatureExtensions["video-v1"]=["http://www.google.com/xmpp/protocol/video/v1"];
	zxmpp.clientFeatureExtensions["camera-v1"]=["http://www.google.com/xmpp/protocol/camera/v1"];
	zxmpp.disableClientFeatureExtension("voice-v1");
	zxmpp.disableClientFeatureExtension("video-v1");
	zxmpp.disableClientFeatureExtension("camera-v1");

	zxmpp.addIqParser("session#http://www.google.com/session", zxmpp_gingle_iqhandler); // we could also register just "jingle", but this is more specific!
}

function zxmpp_gingle_iqhandler(zxmpp, iqstanza, xml)
{
	console.log(xml);
	return true;
}

function zxmpp_gingle_sessioninitiate(zxmpp, destination, sessionId, contentXMLGenerator)
{
	/*
	if(destination.indexOf("/") >= 0)
		destination = destination.substr(0,destination.indexOf("/"));
	var topPresence = zxmpp.getTopPresenceForBareJid(destination);
	if(topPresence && topPresence.fullJid)
		destination = topPresence.fullJid;
	console.log(topPresence);
	console.log(destination);
	var packet = new this.zxmpp.packet(this.zxmpp);
	var iq = new this.zxmpp.stanzaIq(this.zxmpp);
	iq.appendIqToPacket(packet, "jingle", "set", destination);

	var jingleNode = packet.xml.createElementNS("urn:xmpp:jingle:1", "jingle");
	packet.iqXML.appendChild(jingleNode);
	jingleNode.setAttribute("action", "session-initiate");
	jingleNode.setAttribute("sid", sessionId);


	var contentXML = contentXMLGenerator(zxmpp, destination, sessionId, packet);
	jingleNode.appendChild(contentXML);

	packet.send("poll");
	*/
}

