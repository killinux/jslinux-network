<!DOCTYPE html>
<!--
 * (c) 2010 Ivan Vucica
 * License is located in the LICENSE file
 * in Z-XMPP distribution/repository.
 * Use not complying to those terms is a
 * violation of various national and
 * international copyright laws.
-->

<!--
This example is NOT the perfect way to use Z-XMPP, and it in fact uses some
pretty nasty JS code. It is a hack that was created for development purposes.

It should give you the idea of what you can do and where to get started with
Z-XMPP.

I suggest you start looking at the onload handler, the function 'loadhandler()'.
-->

<html>
<head>
<title>Z-XMPP</title>

<link href="application.css" rel="stylesheet" type="text/css">
<script>
var module;

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL;


</script>
<!--<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.3/jquery.min.js"></script>-->

<?php
// while you could manually list all required scripts,
// to facilitate easier upgrade, you should prefer using
// scriptlist.php which returns list of scripts as a handy
// php array. 
//
// if you don't use php, then just add the script references
// manually.
//
// for default GUI, there's also a list of stylesheets that
// need to be included.
require_once 'scriptlist.php';
$zxp = "./"; // zxmpp path, including trailing slash
foreach(zxmppGetStylesheets() as $fn)
{
	echo '<link href="' . $zxp . $fn . '" rel="stylesheet" type="text/css">' . "\n";
}

foreach(zxmppGetAllScripts() as $fn)
{
	echo '<script type="text/javascript" src="' . $zxp . $fn . '"></script>' . "\n";
}

foreach(zxmppGetScriptsForExtensions() as $fn)
{
	echo '<script type="text/javascript" src="' . $zxp . $fn . '"></script>' . "\n";
}
?>
</head>
<body onunload="unloadhandler();" onload="loadhandler();">
<div id="zxmpp_root"></div>

<a href="?a=<?=isset($_GET["a"]) ? intval($_GET["a"])+1 : "0"?>">advance</a><br>

<input id="usr" value="<?=isset($_GET["usr"]) ? $_GET["usr"] : "perica"?>"><input type="password" id="pwd" value="<?=isset($_GET["pwd"]) ? $_GET["pwd"] : "123"?>">

<button onclick="go();">go</button>
<button onclick="dumppresences();">dump presences</button>
<button onclick="dumpstreamfeatures();">dump stream features</button>
<button onclick="logoff();">logoff</button>
<button onclick="serialize();">serialize</button>
<button onclick="reserialize();">reserialize</button>
<button onclick="restore();">restore</button>
<button onclick="terminate();">unclean terminate</button>
<button onclick="enablevideo();">enable video</button>
<button onclick="enableaudio();">enable audio</button>
<button onclick="enablevideo(); enableaudio();">enable both</button>
<button onclick="enablenotifications();" style="display: none;" id="notificationsbtn">enable webkit notifications</button><br>
<input id="calldestination"><button onclick="call();">call</button><button onclick="if(jingleCall) jingleCall.close(); jingleCall = undefined;">hang up</button>
<br>
<textarea cols="80" rows="15" id="serialized_output"></textarea>
<video id="monitor"></video><audio id="player"></audio>
<video id="remotemonitor"></video><audio id="remoteplayer"></audio>
<script defer="defer">
var zxmpp;
var webrtc_videostream;
var webrtc_audiostream;
function createzxmpp()
{
	var zatecfg = {
		"bind-url": "punjab-bind/", //"z-http-bind/",
		"route": "xmpp:zatemas.zrs.hr:5222",
		"domain": "zatemas.zrs.hr",
		"boshwait": 15
	};
	var relativecfg = {
		"bind-url": "http-bind/",
		"route": "xmpp:" + window.location.hostname + ":5222",
		"domain": window.location.hostname,
		"boshwait": 15
	};
	var gtalkcfg = {
		"bind-url": "punjab-bind/",
		"route": "xmpp:talk.google.com:5222",
		"domain": "gmail.com",
		"boshwait": 15
	}
	var punjabcfg = {
		"bind-url": "punjab-bind/",
		"route": "xmpp:" + <?=isset($_GET["route"]) ? '"' . $_GET["route"] . '"' : "window.location.hostname"?> + ":5222",
		"domain": <?=isset($_GET["domain"]) ? '"' . $_GET["domain"] . '"' : "window.location.hostname"?>,
		"boshwait": 15
	}
	var fbcfg = {
		"bind-url": "punjab-bind/",
		"route": "xmpp:chat.facebook.com:5222",
		"domain": "chat.facebook.com",
		"boshwait": 15
	}
	var cfg = <?=isset($_GET["cfg"]) ? $_GET["cfg"] : "relativecfg"?>;

	zxmpp = new zxmppClass();
	zxmpp.onConnectionTerminate.push(handler_connectionterminate);
	zxmpp.onPresenceUpdate.push(handler_presenceupdate);
	zxmpp.onRosterUpdate.push(handler_rosterupdate);
	zxmpp.onMessage.push(handler_message);
	zxmpp.onPacket.push(handler_packet);
	zxmpp.addIqParser("jingle#urn:xmpp:jingle:1", handler_jingle); // we could also register just "jingle", but this is more specific!
	zxmpp.clientDebugMode = true; // currently only randomizes clientVersion to facilitate easier switching of caps

	// we could register additions extensions this way
	var fakeGingle=false;
	var fakeJingle=false;
	var fakeiChatAV=false;
	if(fakeGingle)
	{
		// must be "voice-v1", "video-v1" and "camera-v1".
		// allowed to mix these
		zxmpp.clientFeatureExtensions["voice-v1"]=["http://www.google.com/xmpp/protocol/voice/v1"];
		zxmpp.clientFeatureExtensions["video-v1"]=["http://www.google.com/xmpp/protocol/video/v1"];
		zxmpp.clientFeatureExtensions["camera-v1"]=["http://www.google.com/xmpp/protocol/camera/v1"];
	}
	if(fakeJingle)
	{
		// commonly under "core client features"
		zxmpp.clientFeatureExtensions["jingle"]=[
			"urn:xmpp:jingle:1", 
			"urn:xmpp:jingle:transports:ice-udp:1", 
			"urn:xmpp:jingle:apps:rtp:1", 
			"urn:xmpp:jingle:apps:rtp:audio", 
			"urn:xmpp:jingle:apps:rtp:video"
		];
	}
	if(fakeiChatAV)
	{
		// these are core iChat features, not extensions
		zxmpp.clientFeatureExtensions["AppleiChatAV"] = [
			"apple:profile:bundle-transfer",
			"apple:profile:efh-transfer",
			"apple:profile:transfer-extensions:rsrcfork",
			"http://www.apple.com/xmpp/message-attachments"];

		// these are iChat extensions
		zxmpp.clientFeatureExtensions["ice"] = ["apple:iq:vc:ice"];
		zxmpp.clientFeatureExtensions["recauth"] = ["apple:iq:vc:recauth"];
		zxmpp.clientFeatureExtensions["rdserver"] = ["apple:iq:rd:server"];
		zxmpp.clientFeatureExtensions["maudio"] = ["apple:iq:vc:multiaudio"];
		zxmpp.clientFeatureExtensions["audio"] = ["apple:iq:vc:audio"];
		zxmpp.clientFeatureExtensions["rdclient"] = ["apple:iq:rd:client"];
		zxmpp.clientFeatureExtensions["mvideo"] = ["apple:iq:vc:multivideo"];
		zxmpp.clientFeatureExtensions["auxvideo"] = ["apple:iq:vc:auxvideo"];
		zxmpp.clientFeatureExtensions["rdmuxing"] = ["apple:iq:rd:muxing"];
		zxmpp.clientFeatureExtensions["avcap"] = ["apple:iq:vc:capable"];
		zxmpp.clientFeatureExtensions["avavail"] = ["apple:iq:vc:available"];
		zxmpp.clientFeatureExtensions["video"] = ["apple:iq:vc:video"];
	}

	// setup Z-XMPP extensions
	zxmpp_xep0166_init(zxmpp);
	zxmpp_gingle_init(zxmpp);

	if(webrtc_audiostream)
	{
		zxmpp.enableClientFeatureExtension("jingle-audio");
		zxmpp.enableClientFeatureExtension("voice-v1");
	}
	if(webrtc_videostream)
	{
		zxmpp.enableClientFeatureExtension("jingle-video");
		zxmpp.enableClientFeatureExtension("video-v1");
		zxmpp.enableClientFeatureExtension("camera-v1");
	}

	window.zxmppui = new zxmpp.ui;
	window.zxmppui.backend = zxmpp;
	window.zxmppui.inject('body');
	
	return cfg;
}

function go()
{
	var cfg = createzxmpp();
	zxmpp.main(cfg, document.getElementById("usr").value, document.getElementById("pwd").value);
	//var pack = new zxmpp.packet(zxmpp);



}
function restore()
{
	createzxmpp();
	zxmpp.deserialize(document.getElementById("serialized_output").value);
}

function unloadhandler()
{
	if(window.sessionStorage)
	{
		if(zxmpp && zxmpp.stream && zxmpp.stream.hasFullConnection) 
		{
			window.sessionStorage["zxmpp"] = zxmpp.serialized();
		}
		else {
			window.sessionStorage["zxmpp"] = undefined;
			delete window.sessionStorage["zxmpp"];
		}
	}
}
function loadhandler()
{
	// by delaying load slightly, we are preventing continuous
	// "loading" display on some browsers such as safari
	setTimeout(function(){loadhandler_delayed();}, 1);
}
function loadhandler_delayed()
{
	if(window.sessionStorage)
	{
		if(window.sessionStorage["zxmpp"] && window.sessionStorage["zxmpp"]!="undefined")
		{
			createzxmpp();
			zxmpp.deserialize(window.sessionStorage["zxmpp"]);

			// because features may have changed between loads,
			// you may want to consider retransmitting presence
			// even if no other property changed.

			

			return;
		}
		//go();
	}
	else
	{
		console.log("No session storage");
	}
}


function enablevideo()
{
	if(!navigator.getUserMedia)
	{
		alert("No WebRTC support");
		return;
	}
	navigator.getUserMedia({video: true}, videoGotStream, videoNoStream);
}
function enableaudio()
{
	if(!navigator.getUserMedia)
	{
		alert("No WebRTC support");
		return;
	}
	navigator.getUserMedia({audio: true}, audioGotStream, audioNoStream);
}
function videoGotStream(stream)
{
	webrtc_videostream = stream;

	var monitor = document.getElementById("monitor");
	monitor.src = webkitURL.createObjectURL(stream);
	monitor.onerror = function()
	{
		webrtc_videostream = null;
		monitor.stop();
		alert("Video error");
		if(zxmpp)
		{
			zxmpp.disableClientFeatureExtension("jingle-video");
			zxmpp.disableClientFeatureExtension("video-v1");
			zxmpp.disableClientFeatureExtension("camera-v1");
		}
	}

	monitor.play();
	if(zxmpp)
	{
		zxmpp.enableClientFeatureExtension("jingle-video");
		zxmpp.enableClientFeatureExtension("video-v1");
		zxmpp.enableClientFeatureExtension("camera-v1");
	}
}
function videoNoStream()
{
	alert("No video support");
	if(zxmpp)
	{
		zxmpp.disableClientFeatureExtension("jingle-video");
		zxmpp.disableClientFeatureExtension("video-v1");
		zxmpp.disableClientFeatureExtension("camera-v1");
	}
}
function audioGotStream(stream)
{
	webrtc_audiostream = stream;

	if(zxmpp)
	{
		zxmpp.enableClientFeatureExtension("jingle-audio");
		zxmpp.enableClientFeatureExtension("voice-v1");
	}
}
function audioNoStream()
{
	alert("No audio support");
	if(zxmpp)
	{
		zxmpp.disableClientFeatureExtension("jingle-audio");
		zxmpp.disableClientFeatureExtension("voice-v1");
	}
}
function sdpCleanDuplicateLines(sdp)
{
	var lines = sdp.split("\r\n");
	var lines2 = [];
	var wasAdded = {};
	for(var lineId in lines)
	{
		var line = lines[lineId];
		if(line.substr(0,2)!="a=" || !wasAdded[line])
		{
			lines2.push(line);
			wasAdded[line] = true;
		}
	}
	if(lines.length != lines2.length)
	{
		console.log("Note: cleaned up " + (lines.length - lines2.length) + " duplicate candidate lines");
	}	
	return lines2.join("\r\n");
}
function sdpRemoveCandidateLines(sdp)
{
	var lines = sdp.split("\r\n");
	var lines2 = [];
	for(var lineId in lines)
	{
		var line = lines[lineId];
		if(line.substr(0,"a=candidate:".length) != "a=candidate:")
		{
			lines2.push(line);
		}
	}
	return lines2.join("\r\n");
}
function jingleKeepTransportOnly(xmldoc)
{
	var contentNode = xmldoc.firstChild;
	for(var i = 0; i < contentNode.childNodes.length;)
	{
		var child = contentNode.childNodes[i];
		if(child.localName == "transport")
		{
			i++;
			continue;
		}
		contentNode.removeChild(child);
	}
}
function jingleGotIceCandidate(iceEvent)
{
	console.log("jingleGotIceCandidate");
	var jingleCall = iceEvent.target;
	if (iceEvent.candidate) {
		var candidate = iceEvent.candidate;
		//console.log("candidate with label " + candidate.sdpMLineIndex + ", id " + event.candidate.sdpMid);

		iceEvent.target.zxmppSdp += candidate.candidate; // add the a=candidate: line
		iceEvent.target.zxmppSdp = sdpCleanDuplicateLines(iceEvent.target.zxmppSdp);

		var sdp = sdpRemoveCandidateLines(iceEvent.target.zxmppSdp);
		sdp += candidate.candidate; // add the a=candidate: line

		var translation = SDPToJingle.createJingleStanza(sdp);
		var audioDoc = zxmpp.util.parsedXMLDocument(translation.audio);
		var videoDoc = zxmpp.util.parsedXMLDocument(translation.video);
		jingleKeepTransportOnly(audioDoc);
		jingleKeepTransportOnly(videoDoc);
		//console.log(translation);
		//console.log(audioDoc);
		//console.log(videoDoc);

		//sendMessage({type: 'candidate', 
		//		label: candidate.label, candidate: candidate.toSdp()});
	}
	else
	{
		console.log("End of candidates.");
		//jingleCall.stopIce();	
	}

}
function jingleSendSignaling(sdp)
{
	// old webkitDeprecatedPeerConnection()-based code
	if(!zxmpp) zxmpp = new zxmppClass();
	console.log("SHOULD SEND SIGNALING");
	console.log(sdp);
	translation = SDPToJingle.createJingleStanza(sdp);
	var audioDoc = zxmpp.util.parsedXMLDocument(translation.audio);
	var audioContent = audioDoc.firstChild;
	audioDoc.removeChild(audioContent);
	
	var contentGenerator = function demo_call_contentGen(zxmpp, destination, sessionId, packet)
	{
		/*
		for(var i in audioContent.childNodes)
		{
			if(audioContent.childNodes[i].localName == "transport")
				audioContent.removeChild(audioContent.childNodes[i]);
		}

		var transportNode = packet.xml.createElementNS("http://www.google.com/transport/p2p", "transport");

		audioContent.appendChild(transportNode);
		*/
		//audioContent.setAttribute("senders", "both");
		return audioContent;
	}


	console.log("this: " + this);
	zxmpp_xep0166_sessioninitiate(
			zxmpp, 
			document.getElementById("calldestination").value,
			/* session id */ "a" + Math.round(Math.random()*10000),
			contentGenerator,
			jingleCall);
}
var jingleCall;
function call()
{
	// creating a peer connection:
	var connection_config = {
		'iceServers': [
		{'url': 'stun:stun.l.google.com:19302'}
		//{'url': 'turn:server.here:1337', 'credential': 'apassword'}
		]
	}
	var pcConstraints = {
		'optional': [
			// Firefox interop stuff from AppRtc sample
			{'DtlsSrtpKeyAgreement': 'true'},
			{'MozDontOfferDataChannel': 'true'}
				// NOTE: unused
		]
	};
	jingleCall = new /*zmpp_xep0166_PeerConnection*/ webkitRTCPeerConnection(connection_config, pcConstraints);
	jingleCall.onicecandidate = jingleGotIceCandidate;
	jingleCall.onconnecting = function(event) { console.log("onSessionConnecting"); };
	jingleCall.onopen = function(event) { console.log("onSessionOpened"); };
	jingleCall.onaddstream = function(event)
	{
		console.log("Added remote stream");
		var url = webkitURL.createObjectURL(event.stream);
		var remoteMonitor = document.getElementById("remotemonitor");
		remoteMonitor.src = url;
		waitForRemoteVideo();  

	};
	jingleCall.onremovestream = function(event) { console.log("onRemoteStreamRemoved"); };


	// add stream
	if(webrtc_videostream) jingleCall.addStream(webrtc_videostream);
	if(webrtc_audiostream) jingleCall.addStream(webrtc_audiostream);

	// create offer -- done only when sending.
	//var offer = jingleCall.createOffer({ video: webrtc_videostream ? true : false, audio: webrtc_audiostream ? true : false });
	var setLocalAndSendMessage = function slasm(sessionDescription)
	{
		var sdp = sessionDescription.sdp;
		jingleCall.setLocalDescription(sessionDescription);
	
		console.log("making jingle call with offer");
		console.log(sessionDescription);
		jingleCall.zxmppSdp = sdp;
		jingleCall.zxmpp = zxmpp;
		jingleCall.zxmppSessionIdentifier = "a" + Math.round(Math.random()*10000)
		var translation = SDPToJingle.createJingleStanza(sdp);
		var audioDoc = zxmpp.util.parsedXMLDocument(translation.audio);
		var videoDoc = zxmpp.util.parsedXMLDocument(translation.video);
		console.log(translation);
		console.log(audioDoc);
		console.log(videoDoc);




		// now, we should send what we have in offer.
		// something like "sendMessage(offer)"
		/////////////////
		var audioDoc = zxmpp.util.parsedXMLDocument(translation.audio);
		var audioContent = audioDoc.firstChild;
		audioDoc.removeChild(audioContent);
	
		var contentGenerator = function demo_call_contentGen(zxmpp, destination, sessionId, packet)
		{
			return audioContent;
		}


		zxmpp_xep0166_sessioninitiate(
				zxmpp, 
				document.getElementById("calldestination").value,
				jingleCall.zxmppSessionIdentifier,
				contentGenerator,
				jingleCall);

	};
	var mediaConstraints = {
		'mandatory': {
			//'minWidth': 1280,
			//'minHeight': 720,
			// OR:
			//'minAspectRatio': 1.777,
			//'maxAspectRatio': 1.778,
			'OfferToReceiveVideo': true,
			'OfferToReceiveAudio': true,
		},
		//'optional': [
		//]
	};
	var offer = jingleCall.createOffer(setLocalAndSendMessage, null, mediaConstraints);
	

	console.log("Starting call...");
	
	return;
	var contentGenerator = function demo_call_contentGen(zxmpp, destination, sessionId, packet)
	{
		console.log("content gen");
		var contentNode = packet.xml.createElementNS("urn:xmpp:jingle:1", "content");
		contentNode.setAttribute("name", "call");
		contentNode.setAttribute("creator", "initiator");
		contentNode.setAttribute("senders", "both");
		
		var descriptionNode = packet.xml.createElementNS("urn:xmpp:jingle:apps:rtp:1", "description");
		contentNode.appendChild(descriptionNode);
		descriptionNode.setAttribute("media", "audio");
		var payloadNode = packet.xml.createElementNS("urn:xmpp:jingle:apps:rtp:1", "payload-type");
		descriptionNode.appendChild(payloadNode);
		payloadNode.setAttribute("id", "110");
		payloadNode.setAttribute("name", "SPEEX");
		payloadNode.setAttribute("clockrate", "16000");

		var transportNode = packet.xml.createElementNS("urn:xmpp:jingle:transports:ice-udp:1", "transport");
		contentNode.appendChild(transportNode);
		transportNode.setAttribute("pwd", "iLJD6bqjXfrAq1N6ILEDxW"); // FIX THIS
		transportNode.setAttribute("ufrag", "Zzk8"); // FIX THIS
		var candidateNode = packet.xml.createElementNS("urn:xmpp:jingle:transports:ice-udp:1", "transport");
		transportNode.appendChild(candidateNode);
		candidateNode.setAttribute("component", "1");
		candidateNode.setAttribute("foundation", "1");
		candidateNode.setAttribute("generation", "0");
		candidateNode.setAttribute("id", "daofaf"); // FIX THIS
		candidateNode.setAttribute("ip", "127.0.0.1"); // FIX THIS
		candidateNode.setAttribute("network", "1");
		candidateNode.setAttribute("port", "4552");
		candidateNode.setAttribute("priority", "4589572");
		candidateNode.setAttribute("protocol", "udp");
		candidateNode.setAttribute("type", "host");

			
		return contentNode;
	}

	zxmpp_xep0166_sessioninitiate(
			zxmpp, 
			document.getElementById("calldestination").value,
			/* session id */ Math.round(Math.random()*10000),
			contentGenerator);
}


function terminate()
{
	zxmpp.stream.terminate();
}
function dumppresences()
{
	zxmpp._debugDumpPresences();
}
function dumpstreamfeatures()
{
	zxmpp._debugDumpStreamFeatures();
}

function enablenotifications()
{
	if(!window.webkitNotifications)
		return;

	// this enables html5 notifications as per 
        //  http://www.html5rocks.com/tutorials/notifications/quick/
	// this function is called from a button handler; above url
	// doesn't want implementations to provide notification
	// api enabled from anything but user input handlers.
	// (chrome does allow you to enable this if you create
	//  a "chrome app" an request permission in manifest file)

	if (window.webkitNotifications.checkPermission() == 0) { // 0 is PERMISSION_ALLOWED
		// all is well, nothing to do except hide btn
		document.getElementById('notificationsbtn').style.display = 'none';
	} else {
		window.webkitNotifications.requestPermission();
	}
}

function shownotification(icon, title, msg)
{
	if(!window.webkitNotifications)
		return;
	if (window.webkitNotifications.checkPermission() == 0) // 0 is PERMISSION_ALLOWED
	{
		// all is well
	}
	else
	{
		// user must enable notifications by clicking a button
		// (otherwise notification permission request won't work)
		// it might be a good idea to display htem a dialog; here we won't :)
		document.getElementById('notificationsbtn').style.display = 'inherit';
		return;
	}

	if(!icon)
		icon = zxmpplogo;

        var popup = window.webkitNotifications.createNotification(icon, title, msg);
        popup.show();
	setTimeout(function(popup)
		{
			popup.cancel(); 
		}, 2000, popup);

}

function logoff()
{
	try {
		zxmpp.stream.logoff();
	} catch(e) { }
	zxmpp = undefined;
}

function serialize()
{
	if(zxmpp)
		document.getElementById("serialized_output").value = zxmpp.util.prettyJson(zxmpp.serialized());
}
function reserialize()
{
	document.getElementById("serialized_output").value = zxmpp.util.prettyJson(JSON.stringify(zxmpp.deserializeInternal(document.getElementById("serialized_output").value)));
}

function handler_connectionterminate(sender, code, humanreadable)
{
	codesplit=code.split("/");
	switch(codesplit[0])
	{
		case "terminate":
		switch(codesplit[1])
		{
			default:
			shownotification(undefined, "Connection terminated", "Server has disconnected you with code \'" + code + "\'\n\n" + humanreadable);
			alert("Server has disconnected you with code \'" + code + "\'\n\n" + humanreadable);
			break;
		}
		break;
		
		case "saslfailure":
		switch(codesplit[1])
		{
			case "not-authorized":
			shownotification(undefined, "Connection terminated", "Wrong username or password!\n\n" + humanreadable);
			alert("Wrong username or password!\n\n" + humanreadable);
			break;
			
			case "account-disabled":
			shownotification(undefined, "Connection terminated", "Your account has been disabled!\n\n" + humanreadable);
			alert("Your account has been disabled!\n\n" + humanreadable);
			break;

			default:
			shownotification(undefined, "Connection terminated", "Login error with code \'" + code + "\'\n\n" + humanreadable);
			alert("Login error with code \'" + code + "\'\n\n" + humanreadable);
		}
		break;
		
		default:
		shownotification(undefined, "Connection terminated", "Termination with code \'" + code + "\'\n\n" + humanreadable);
		alert("Termination with code \'" + code + "\'\n\n" + humanreadable);
		break;
	}
	window.sessionStorage["zxmpp"] = undefined;
	delete window.sessionStorage["zxmpp"];
}
function handler_presenceupdate(sender, presence)
{
/*	console.log("INDEX.PHP: Presence update: ");
	console.log(" -> " + presence.fullJid);
	console.log("   Icon: " + presence.show);
	console.log("   Status: " + presence.status);
*/

	var toppresence = sender.getTopPresenceForBareJid(presence.bareJid);
	if(toppresence)
	{
		//console.log("Updating " + toppresence.bareJid);
		zxmppui.presenceUpdate(toppresence.bareJid, toppresence.show, false, toppresence.status);
	}
	
	if(presence.show == "avail")
		shownotification(undefined, presence.fullJid + " is now online", presence.status);

	/////////////////////
	// development hack:

	// to facilitate easier testing of call functionality,
	// last presence to send presence update will be filled into
	// the call destination inputbox.
	document.getElementById("calldestination").value = presence.fullJid;
}
function handler_rosterupdate(sender, item)
{
/*	console.log("INDEX.PHP: Roster update: ");
	console.log(" -> " + item.bareJid);
	console.log("   Subscription: " + item.subscription); 
	console.log("   Groups:");

	for(var i in item.groups)
	{
		console.log("     " + item.groups[i]);
	}
	*/
	var presence = sender.getTopPresenceForBareJid(item.bareJid);
/*	if(presence)
	{
		console.log("Presence icon: " + presence.show);
	}
*/
	if(item.subscription != "removed" && item.subscription != "none")
	{
		var presenceShow = presence ? presence.show : "unavailable";
		var display = item.name ? item.name : item.bareJid.split('@')[0];
		var presenceStatus = presence ? presence.status : "";

		var vcard = sender.vCards[item.bareJid];
		if(vcard && vcard.fn)
			display = vcard.fn;

		zxmppui.rosterAdded(item.bareJid, presenceShow, display, presenceStatus);
		
	}
	else
	{
		zxmppui.rosterRemoved(item.bareJid);
	}
}
function handler_message(sender, messagestanza)
{
	console.log("> " + messagestanza.from + ": " + messagestanza.body);
	if(messagestanza.body)
	{
		var text = messagestanza.body;
		if(messagestanza.type == "error")
			text = "ERROR with message: " + text;
		shownotification(undefined, messagestanza.from, text);
	}

	zxmppui.messageStanzaReceived(messagestanza);
}
function handler_packet(sender, packet)
{	
	if(packet && packet.incomingStanza && packet.incomingStanza.iqXML)
	{
		for(var childId in packet.incomingStanza.iqXML.childNodes)
		{
			var child = packet.incomingStanza.iqXML.childNodes[childId];

			if(child.nodeName == "jingle")
			{
				// do whatever you want ;-)

				// note that the iq may or may not be handled, and 
				// the error may or may not be dispatched already.
				// act accordingly. this mechanism is not really a
				// good way to implement jingle, considering zxmpp
				// has already dispatched an iq error message.

			}
		}
	}

}
function handler_jingle(sender, iqStanza, xml)
{	
	// this might be a good place to implement jingle.
	// however, instead, it's better to implement it as
	// a plugin instead of in your own code.
	return false;
}

// for use in notifications:
var zxmpplogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAAXNSR0IArs4c6QAAAARnQU1BAACx'+
'jwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAQdJREFU'+
'SEvdlUkShSAMRPk39+bKXAnpII3F5lusNPbLzO++73D0iYCjTziqntLzL4AQK7122IhTihaluxnF'+
'2AGEi6hcNeWC2ACkRF0BHFsYRv29TcfIshN0DbwfvqvPIgBVQb4Xs0lM+BtUt8mRZgOjgwFgUX0Y'+
'IAnQChq9rm4ntCu5AEodrgD0UkQA22belwsT2gAb6nU8J1syzo2TOHe52o50gyirgQXYrseANvOq'+
'TRcSmiMTEzf5pbiuASmityPW0asxWBV4p+pF21wzrmD/qN3otVzOWz1jDniAN48O4ztAVqW2pswe'+
'D1D7wFxBKlFyDlhQTwj8sXydXTgsz7PnLtgN6nHAA0wtfhnz+3TSAAAAAElFTkSuQmCC';

//go();
</script>
</body>
</html>
