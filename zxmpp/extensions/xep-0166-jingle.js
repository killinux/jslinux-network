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

var zxmpp_xep0166_webrtcPeerConnections = {};
function zxmpp_xep0166_init(zxmpp)
{
	zxmpp.clientFeatureExtensions["jingle"]=[
		"urn:xmpp:jingle:1", 
	];
	if(navigator.webkitUserMedia)
	{
		zxmpp.clientFeatureExtensions["jingle-ice"] = ["urn:xmpp:jingle:transports:ice-udp:1"];
		zxmpp.clientFeatureExtensions["jingle-rtp"] = ["urn:xmpp:jingle:apps:rtp:1"];
	}
	
	zxmpp.clientFeatureExtensions["jingle-audio"]=["urn:xmpp:jingle:apps:rtp:audio"];
	zxmpp.clientFeatureExtensions["jingle-video"]=["urn:xmpp:jingle:apps:rtp:video"];
	zxmpp.disableClientFeatureExtension("jingle-audio");
	zxmpp.disableClientFeatureExtension("jingle-video");

	zxmpp.addIqParser("jingle#urn:xmpp:jingle:1", zxmpp_xep0166_iqhandler); // we could also register just "jingle", but this is more specific!
}

function zxmpp_xep0166_iqhandler(zxmpp, iqstanza, xml)
{
	if(iqstanza.xep0166_abort_processing)
		return false;

	console.log(xml);
	var sessionId = xml.attr["sid"];
	console.log(zxmpp_xep0166_webrtcPeerConnections);
	var peerConnection = zxmpp_xep0166_webrtcPeerConnections[sessionId];
	console.log("Action " + xml.attr["action"] + ", pc: " + peerConnection + " sid " + sessionId);
	if(	peerConnection && (
		xml.attr["action"] == "session-initiate" || // this block handles only if connection already exists
		xml.attr["action"] == "session-accept" || 
		xml.attr["action"] == "transport-info"
		)
	  )
	{
		var packet = new zxmpp.packet(zxmpp);
		var iq = new zxmpp.stanzaIq(zxmpp);
		iq.appendIqToPacket(packet, false, "result", iqstanza.from, iqstanza.id);
		packet.send();

		
		var sdp = SDPToJingle.parseJingleStanza(zxmpp.util.serializedXML(xml));
		console.log("SDP: " + sdp);
		//peerConnection.processSignalingMessage(sdp);
		var type;
		if(xml.attr["action"] == "session-accept")
			type = "answer";
		peerConnection.setRemoteDescription(new RTCSessionDescription({sdp:sdp, type:type}));
		return true;
	}
	
	console.error("XEP-0166: DID NOT PARSE " + xml.attr["action"]);
	console.log(xml);
	return false;
}

function zxmpp_xep0166_sessioninitiate(zxmpp, destination, sessionId, contentXMLGenerator, webrtcPeerConnection)
{
	if(destination.indexOf("/") >= 0)
		destination = destination.substr(0,destination.indexOf("/"));
	var topPresence = zxmpp.getTopPresenceForBareJid(destination);
	if(topPresence && topPresence.fullJid)
		destination = topPresence.fullJid;
	console.log(topPresence);
	console.log(destination);
	var packet = new zxmpp.packet(zxmpp);
	var iq = new zxmpp.stanzaIq(zxmpp);
	iq.appendIqToPacket(packet, "jingle", "set", destination);
	iq.onReply.push(function(zxmpp, original, response)
	{
		if(response.type == "error")
		{
			console.error("Error in making a call");
			console.log(iq);
			iq.xep0166_abort_processing = true;
			webrtcPeerConnection.close();
			return true;
		}
		else
		{
			console.log("REMEMBERING " + sessionId);
			zxmpp_xep0166_webrtcPeerConnections[sessionId.toString()] = webrtcPeerConnection;
			webrtcPeerConnection.onaddstream = zxmpp_xep0166_addstream;
		}
	}
	);

	var jingleNode = packet.xml.createElementNS("urn:xmpp:jingle:1", "jingle");
	packet.iqXML.appendChild(jingleNode);
	jingleNode.setAttribute("action", "session-initiate");
	jingleNode.setAttribute("initiator", zxmpp.getOwnPresence().fullJid);
	jingleNode.setAttribute("sid", sessionId);


	var contentXML = contentXMLGenerator(zxmpp, destination, sessionId, packet);
	jingleNode.appendChild(contentXML);

	packet.send("poll");
}

function zxmpp_xep0166_addstream(stream)
{
	console.error("STREAM ADDED");
	console.log(stream);
}
