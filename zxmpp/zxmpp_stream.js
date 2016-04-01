/* 
 * Z-XMPP
 * A Javascript XMPP client.
 *
 * (c) 2010 Ivan Vucica
 * License is located in the LICENSE file
 * in Z-XMPP distribution/repository.
 * Use not complying to those terms is a
 * violation of various national and
 * international copyright laws.
 */

zxmppClass.prototype.stream = function (zxmpp)
{
	this.zxmpp = zxmpp;
	this.type = "stream";

	/* initialize request id */
	var maxRequestId=9007199254740991; // magic number from xep-0124, max number that some languages can accurately represent
	this.requestId = Math.floor(Math.random()*maxRequestId/2); // div2 so that we dont realistically reach max request id
	
	/* connections and packet queue */
	this.connectionsHold = new Array(); // these are "holding" connections, those that wait for response idly
	this.connectionsPoll = new Array(); // these are "polling" connections, those that are used to send stuff to server


	/* pre-baked request objects */
	this.connectionsHold.push(new XMLHttpRequest());
	this.connectionsPoll.push(new XMLHttpRequest(), new XMLHttpRequest());

	/* set of unique ids so far */
	this.uniqueIds = {};
	
	/* keys prepared for use, as per 15.x of XEP-0124 */
	this.keys = [];
	
	/* in case all poll connections are currently talkin',
	   add the packet to queue */
	this.pollPacketQueue = [];
	
	/* supported stream:features */
	this.features = {};
	
	/* rememeber outgoing set and get iqs for which we
	   did not receive a result or error reply */
	this.iqsAwaitingReply = {};
	
	/* state tracking variables */
	this.hasFullConnection = false;

	this.auth = false;
	this.authSuccess = undefined;
	this.hasSentRestart = false;
	this.hasSentBind = false;
	this.hasSentSessionRequest = false;
	this.hasSentRosterRequest = false;
	this.hasSentInitialPresence = false;
	this.sentUnrespondedRIDs = [];
	this.sentUnrespondedKeys = [];
	this.reuseRIDs = [];
	this.reuseKeys = [];

	/* state funcs */
	this.uniqueId = function zxmppStream_uniqueId(idType)
	{
		// return a unique id with type "idType"
		
		var id = 1;
		while(this.uniqueIds["zxmpp" + idType + '_' + id]) // as long as array element is not undefined
		{
			id++;
		}
		this.uniqueIds["zxmpp" + idType + "_" + id]=true;
		return "zxmpp" + idType + "_" + id;
	}
	
	
	/* connection/stream functions */
	this.establish = function zxmppStream_establish()
	{
		var packet = new this.zxmpp.packet(this.zxmpp);
		var body = packet.xml_body;
		
		body.setAttribute('ver','1.6');
		body.setAttribute('wait',this.zxmpp.cfg['boshwait'] ? this.zxmpp.cfg['boshwait'] : 120);
		body.setAttribute('xmpp:version','1.0');
		body.setAttribute('hold','1');
		body.setAttribute('secure','true');
		body.setAttribute('to',this.zxmpp.cfg['domain']);
		body.setAttribute('route',this.zxmpp.cfg['route']);

		packet.send();
	}
	
	this.assignRID = function zxmppStream_assignRID(just_polling_nextrid)
	{
		if(!this.reuseRIDs.length)
		{

			if(!just_polling_nextrid)
				return (++this.requestId)-1;
			else
				return this.requestId;

		}
		else
		{
			if(!just_polling_nextrid)
			{
				var r = this.reuseRIDs.shift();
				if(this.requestId == r)
					this.requestId ++;
				return r;
			}
			else
			{
				var r = this.reuseRIDs.shift();
				this.reuseRIDs.unshift(r);
				return r;
			}
		}
	}

	this.assignKey = function zxmppStream_assignKey(just_peek)
	{
		// assign a key, as described in 15.x in XEP-0124
		// if we're out of keys, then also generate a new base key
		
		// add a key, if available
		var ret = new Object();
		if(this.reuseKeys.length>0) // in case of stream restore/connection interrupt, reuse a key
		{
			ret.key = this.reuseKeys.shift();
			if(just_peek)
				this.reuseKeys.unshift(ret.key);
		}
		else if(this.keys.length>0)
		{
			ret.key = this.keys.pop();
			if(just_peek)
				this.keys.push(ret.key);
		}
	
		// if we don't have more keys left...
		if(this.reuseKeys.length==0 && this.keys.length<=1)
		{
			if(!just_peek)
			{
				this.genKeys();
				ret.newKey = this.keys.pop();
			} else {
				zxmppConsole.log("would generate newkey but just peeking");
			}
		}
		return ret;
	}
	this.freeConnections = function zxmppStream_freeConnection(send_style)
	{

		var availableConns = 0;

		var connection_pool;
		switch(send_style)
		{
			default:
			case "poll":
			connection_pool = this.connectionsPoll;
			break;
			
			case "hold":
			connection_pool = this.connectionsHold;
			break;
		}
		for(var i in connection_pool)
		{
			var conn = connection_pool[i];
			if(conn.readyState == 0)
			{
				availableConns ++;
			}
		}
		return availableConns;
	}	
	this.findFreeConnection = function zxmppStream_findFreeConnection(send_style)
	{
		var availableConn = false;

		var connection_pool;
		switch(send_style)
		{
			default:
			case "poll":
			connection_pool = this.connectionsPoll;
			break;
			
			case "hold":
			connection_pool = this.connectionsHold;
			break;
		}
		
		for(var i in connection_pool)
		{
			var conn = connection_pool[i];
			if(conn.readyState == 0)
			{
				//zxmppConsole.log("free slot found at: " + i);
				availableConn = conn;
				availableConn.connindex = i;
				availableConn.conntype = send_style;
				availableConn.connzxmpp = this.zxmpp;
				return availableConn;
				break;
			}
			//zxmppConsole.log("searching passed: " + i);
		}
		//zxmppConsole.log("...but did not find empty slot");
		return false;
		
	}
	
	this.transmitPacket = function zxmppStream_transmitPacket(packet,send_style,sending_from_queue)
	{
		// send "packet" (zxmpp.packet) using "send_style"-type
		// connection (either "hold" or "poll", default hold)
		
		// in case of poll message and no available connection,
		// queues the message
		
		
		
		if(!send_style) send_style = "poll";
		
		
		/*
		zxmppConsole.log("============ TRANSMIT (" + send_style + ") ============");
		zxmppConsole.log("(not finalized packet)");
		zxmppConsole.log(this.zxmpp.util.serializedXML(packet.xml));
		zxmppConsole.log("=======================================");		
		*/
		
		if(!packet)
		{
			if(packet == "")
			
				zxmppConsole.error("A packet passed into transmitPacket is an empty string!");
			else
				zxmppConsole.error("A packet passed into transmitPacket is null, false or zero!");
			if(printStackTrace)
			{
				var st = printStackTrace();
				for(var frame in st)
				{
					zxmppConsole.error(st[frame]);
				}
			}
			return;
		}

		var conn = this.findFreeConnection(send_style);
		
		if(conn) zxmppConsole.log("Sending " + send_style + " with pollqueue " + this.pollPacketQueue.length + ": " + this.zxmpp.util.serializedXML(packet.xml));

		var assignedRid = this.assignRID(true);
		var ridTooFarApart = this.sentUnrespondedRIDs.length && assignedRid-this.sentUnrespondedRIDs[0]>1;
		if(ridTooFarApart)
		{
			zxmppConsole.log("Would send for RID " + assignedRid + "; but last unresponded is too far apart: " + (this.sentUnrespondedRIDs[0] ? this.sentUnrespondedRIDs[0] : "nil") + " - diff " + (assignedRid-this.sentUnrespondedRIDs[0]));
			return false;
		}
		if(conn && !ridTooFarApart && (send_style=="hold" || (send_style == "poll" && (this.pollPacketQueue.length == 0 ||sending_from_queue) )))
		{
			// there is an available hold or poll connection slot
			// and, our rid is not too different from the last one we received

			zxmppConsole.log("Sending for RID " + assignedRid + "; last unresponded is " + this.sentUnrespondedRIDs[0] + " -- toofarapart: " + ridTooFarApart + " for " + (assignedRid-this.sentUnrespondedRIDs[0]));

			conn.open("POST", this.zxmpp.cfg["bind-url"]);
 			conn.setRequestHeader("Content-type","text/xml; charset=utf-8");
			conn.setRequestHeader("X-ZXMPPType",send_style);
			conn.setRequestHeader("X-ZXMPPOldestRid", this.sentUnrespondedRIDs[0]);
			conn.setRequestHeader("X-ZXMPPMyRid", assignedRid);
			conn.setRequestHeader("X-ZXMPPReuseRids", JSON.stringify(this.reuseRIDs));
			conn.setRequestHeader("Accept", "text/xml,application/xml");
			conn.onreadystatechange = this.zxmpp.stream.handleConnectionStateChange;
			conn.connrid = assignedRid;
			conn.connkey = this.assignKey(true); if(conn.connkey) conn.connkey = conn.connkey.key;
			if(!conn.connoutgoing)
				conn.connoutgoing = packet.finalized();
			this.sentUnrespondedRIDs.push(conn.connrid);
			this.sentUnrespondedKeys.push(conn.connkey);
			conn.send(conn.connoutgoing);


			if(this.hasSentInitialPresence && this.freeConnections()>1)
				this.fillPollConnection();
			
			return true;
		}
		
		
		

	}

	this.tryEmptyingPollQueue = function zxmppStream_tryEmptyingPollQueue()
	{
		while(this.pollPacketQueue.length && this.findFreeConnection("poll"))
		{
			// grab a packet that waits longest
			var packet = this.pollPacketQueue.shift();
			if(!packet)
			{
				zxmppConsole.warn("zxmppStream tryEmptyingPollQueue(): Invalid packet found in poll queue has been skipped and is not sent: " + packet);
				continue;
			}
			
			if(!this.transmitPacket(packet, "poll", true))
			{
				this.pollPacketQueue.unshift(packet);
				return;
			}
		}

	}
	
	this.genKeys = function zxmppStream_genKeys()
	{
		// implementation of 15.x in XEP-0124
		// generate 1000-1500 sha-1 keys, sufficient for 1000-1500
		// messages
		var n = Math.floor(Math.random()*500)+1000;
		var base_key = this.zxmpp.util.SHA1(Math.floor(Math.random()*1234567).toString());
		this.keys.push(base_key);
		for(var i = 0; i < n; i++)
		{
			this.keys.push(this.zxmpp.util.SHA1(this.keys[i]));
		}

	}


	this.retryConn = function zxmppStream_retryConn(conn)
	{
		// retry sending after timeout
		// also, only if poll queue is completely free.
		// otherwise, delay more
		zxmppConsole.log("this.retryConn");	
		/*if(conn.connzxmpp.stream.pollPacketQueue.length)
		{
			zxmppConsole.log("zxmpp retryConn delaying more");
			conn.connzxmpp.stream.tryEmptyingPollQueue();
			setTimeout(conn.connzxmpp.stream.retryConn, 1000, conn);
			return;
		}
		zxmppConsole.log("Yay");
*/
		conn2 = new XMLHttpRequest();
		conn2.open("POST", conn.connzxmpp.cfg["bind-url"]);
		conn2.setRequestHeader("Content-type","text/xml; charset=utf-8");
		conn2.setRequestHeader("X-ZXMPPType",conn.conntype);
		conn2.onreadystatechange = conn.connzxmpp.stream.handleConnectionStateChange;
		conn2.connoutgoing = conn.connoutgoing;
		conn2.connindex = conn.connindex;
		conn2.connzxmpp = conn.connzxmpp;
		conn2.conntype = conn.conntype;
		conn2.connrid = conn.connrid;
		conn2.send(conn2.connoutgoing);
		
		if(conn2.conntype=="hold")
			conn.connzxmpp.stream.connectionsHold[conn2.connindex] = conn2;
		else
			conn.connzxmpp.stream.connectionsPoll[conn2.connindex] = conn2;
	}

	this.retriesUpon404 = 5; // how many times can we retry sending packet?

	this.handleConnectionStateChange = function zxmppStream_handleConnectionStateChange()
	{
		
		if(typeof this.readyState == "undefined")
		{
			zxmppConsole.error("zxmppClass::Stream::handleConnectionStateChange(): 'this' is not XMLHttpRequest: " + typeof(this));
			return;
		}
		
		
		// for readability, introduce "conn" so the 
		// reader does not mix it up with stream's 'this'
		var conn = this;
		
		// if not done, don't continue
		if(conn.readyState != 4) 
		{
			return;
		}
		
	
		if(conn.status == 200)
		{
			// we need to dig deeper to see if this is a terminate packet
			var responseXML = conn.connzxmpp.util.xmlHttpRequestResponseXML(conn);
			if(!responseXML)
			{
				console.error("Response is not valid XML");
				console.log(conn.responseText);
				
				conn.connzxmpp.stream.terminate();

				var code = "terminate/invalid-xml";
				var humanreadable = "Did not receive valid XML as the response. Breaking connection.";
				conn.connzxmpp.notifyConnectionTerminate(code, humanreadable);
				return;
			}
			var bodyNode = responseXML.firstChild;
			conn.connzxmpp.util.easierAttrs(bodyNode);
				
			if(bodyNode.attr["type"] == "terminate" && bodyNode.attr["condition"] == "item-not-found")
			{
				// treat as if it was a 404!
				conn.status = 499;
				zxmppConsole.warn("A terminate/item-not-found event");
			}
		}

		// the connection failed?
		if(conn.status != 200)
		{
			switch(conn.status)
			{
				case 0:	
				// although this is probably due to page closing,
				// it could be also due to different disconnect
				// (such as computer going to standby, or unreliable
				// connection)
				case 502:
				// probably proxy timeout!
				zxmppConsole.log("Disconnect (HTTP status " + conn.status + ") - retrying");
				case 499:
				// our internal status to denote a terminate+item-not-found

				// retry as with 404!
				
				case 404:
				// TODO check if BOSH really specifies 404 upon out of order packet, or is this ejabberd specific behavior?		
				if(conn.connzxmpp.stream.retriesUpon404<0)
				{
					zxmppConsole.error("zxmppClass::Stream::handleConnectionStateChange(): Too many " + conn.status + " failures, giving up and terminating");
					conn.connzxmpp.stream.terminate();
	
					var code = "terminate/http-" + conn.status;
					var humanreadable = "Attempts to handle " + conn.status + " by reposting failed. The service does not exist or there were too many out of order packets";
					conn.connzxmpp.notifyConnectionTerminate(code, humanreadable);
					return;
				}
				
				conn.connzxmpp.stream.retriesUpon404--;
				zxmppConsole.warn("zxmppClass::Stream::handeConnectionStateChange(): http " + conn.status + " - out of order request? http abort? retrying");
				
//				conn.send(conn.connoutgoing);

				setTimeout(conn.connzxmpp.stream.retryConn, 600+Math.random()*100, conn);
				return;
				
				case 503:
				zxmppConsole.error("zxmppClass::Stream::handleConnectionStateChange(): service not running or overloaded: http " + conn.status + ", terminating connection");
				conn.connzxmpp.stream.terminate();

				var code = "terminate/http-" + conn.status;
				var humanreadable = "Service not running or overloaded.";
				conn.connzxmpp.notifyConnectionTerminate(code, humanreadable);
				return;
			
				case 500:
				window.open("data:text/html," + conn.responseText, "Name");
				default:
				zxmppConsole.error("zxmppClass::Stream::handleConnectionStateChange(): invalid http status " + conn.status + ", terminating connection");
				conn.connzxmpp.stream.terminate();

				var code = "terminate/http-" + conn.status;
				var humanreadable = "Unexpected HTTP status '" + conn.status + "'.";
				conn.connzxmpp.notifyConnectionTerminate(code, humanreadable);
				return;
				
			}
		}
		

		// success? reset 404 count
		conn.connzxmpp.stream.retriesUpon404 = 5;

		// clean connection slot, handle connection, try pushing stuff
		if(conn.conntype == "hold")
		{
			conn.connzxmpp.stream.connectionsHold[conn.connindex] = new XMLHttpRequest();
			conn.connzxmpp.stream.handleConnection(conn);	
		}
		else
		{
			conn.connzxmpp.stream.connectionsPoll[conn.connindex] = new XMLHttpRequest();
			conn.connzxmpp.stream.handleConnection(conn);
			conn.connzxmpp.stream.tryEmptyingPollQueue();
		}
		zxmppConsole.log("That was received rid " + conn.connrid);
		var idx = conn.connzxmpp.stream.sentUnrespondedRIDs.indexOf(conn.connrid);
		if(idx!=-1)
		{
			conn.connzxmpp.stream.sentUnrespondedRIDs.splice(idx,1);
			conn.connzxmpp.stream.sentUnrespondedKeys.splice(idx,1);
		}
		//if(conn.connrid > conn.connzxmpp.stream.lastReceivedRID)
		//	conn.connzxmpp.stream.lastReceivedRID = conn.connrid;

		conn.connzxmpp.stream.tryEmptyingPollQueue();
	}
	
	this.handleConnection = function zxmppStream_handleConnection(conn)
	{
		var packet = new this.zxmpp.packet(this.zxmpp);
		try
		{
			var responseXML = this.zxmpp.util.xmlHttpRequestResponseXML(conn);
			if(!packet.parseXML(responseXML)) // packet not intended for further processing
			{
				return;
			}
			zxmppConsole.log(">> " + this.zxmpp.util.serializedXML(responseXML));

			this.zxmpp.notifyPacket(packet);

		}
		catch(e)
		{
			zxmppConsole.error(e);
			zxmppConsole.error(e.message);
			zxmppConsole.error(e.stack);
		}
		
		if(!this.auth)
		{

			var knownMechanisms = {
				'ANONYMOUS' : this.zxmpp.authAnonymous,
				'PLAIN' : this.zxmpp.authPlain,
				'DIGEST-MD5' : this.zxmpp.authDigestMD5,
				'X-FACEBOOK-PLATFORM': this.zxmpp.authFB
			};

			// Weighted, ordered list of supported mechanisms.
			// 0 is the favorite mechanism,
			// 1 is the less favored mechanism,
			// etc.
			var supportedMechanisms = new Array();
			if(this.zxmpp.stream.features["urn:ietf:params:xml:ns:xmpp-sasl"])
			{
				// server decides order of preference.
				var mechanisms = this.zxmpp.stream.features["urn:ietf:params:xml:ns:xmpp-sasl"]["mechanisms"]["list"];
				for (var mechanismId in mechanisms)
				{
					var mechanism = mechanisms[mechanismId];
					zxmppConsole.log("Was offered " + mechanism);
					if(knownMechanisms[mechanism])
					{
						supportedMechanisms.push([mechanism, knownMechanisms[mechanism]]);
						zxmppConsole.log("Matched SASL mechanism: " + mechanism);
					}
				}
			}
			else
			{
				// a default in case of some breakage.
				// should never happen.
				supportedMechanisms.push(["PLAIN", this.zxmpp.authPlain]);
			}


			// TODO: simplify.
			// We already only permit server-supported mechanisms. We should easily
			// be able to simply use the top mechanism.
			var pickedMechanism = false;
			for(var mechanismId = 0; mechanismId < supportedMechanisms.length; mechanismId++)
			{
				var mechanism = supportedMechanisms[mechanismId];
				var mechanismName = mechanism[0];
				var mechanismClass = mechanism[1];

				if(this.zxmpp.stream.features["urn:ietf:params:xml:ns:xmpp-sasl"] &&
				   this.zxmpp.stream.features["urn:ietf:params:xml:ns:xmpp-sasl"]["mechanisms"]["set"][mechanismName])
				{
					pickedMechanism = mechanism;
					break;
				}
			}

			if(pickedMechanism)
			{
				var pickedMechanismName = pickedMechanism[0];
				var pickedMechanismClass = pickedMechanism[1];

				zxmppConsole.log("Picked authentication mechanism " + pickedMechanismName);
				this.auth = new pickedMechanismClass(this.zxmpp);
				this.auth.startAuth();
			}
			else
			{
				zxmppConsole.error("zxmpp::stream::handleConnection(): no authentication mechanism supported. giving up");

				this.zxmpp.stream.terminate();
	
				var code = "terminate/no-supported-auth";
				var humanreadable = "No supported authentication mechanism provided by the server.";
				this.zxmpp.notifyConnectionTerminate(code, humanreadable);
			}
		}
		else if(this.auth.authSucceeded() && !this.hasSentRestart) // success is not false and not undefined
		{
			this.sendXmppRestart();
		}
		else if(this.hasSentRestart && !this.hasSentBind)
		{
			this.sendBindRequest();
		}
		else if(this.hasSentBind && !this.hasSentSessionRequest)
		{
			this.sendSessionRequest();
		}
		else if(this.hasSentSessionRequest && this.zxmpp.fullJid && !this.hasSentRosterRequest)
		{
			// also request roster
			// TODO check if server supports roster!
			// we need to add caps parsing for that first, though
			this.sendIqQuery("jabber:iq:roster", "get");//, this.zxmpp.bareJid);
			this.hasSentRosterRequest = true;
			zxmppConsole.log("ROSTER REQUEST SENT");
		} else if (this.hasSentRosterRequest && !this.hasSentInitialPresence)
		{
			// set up initial presence
			var ownPresence = this.zxmpp.getPresence(this.zxmpp.fullJid);
			if(ownPresence.show == "unavailable")
			{
				// if set to unavail, let's presume
				// the presence was not set up until now

				var initialPresence = this.zxmpp.cfg["initialPresence"];

				ownPresence.show = (initialPresence && initialPresence["show"]) ? initialPresence["show"] : "avail";
				ownPresence.status = (initialPresence && typeof initialPresence["status"] != 'undefined') ? initialPresence["status"] : "Using Z-XMPP";
				ownPresence.priority = (initialPresence && typeof initialPresence["priority"] != 'undefined') ? initialPresence["priority"] : 1;
			}

			// send initial presence
			this.sendCurrentPresence();
			
			this.hasSentInitialPresence = true;
			this.hasFullConnection = true; 
		}
		else if(this.hasSentInitialPresence && this.findFreeConnection("poll")/* && !this.pollPacketQueue.length*/) // if we haven't held yet, and we have a free holding slot, and nothing is waiting to poll...
		{


			this.fillPollConnection();
			//this.sendIdle("hold");
		}
		else
		{
			zxmppConsole.error("Something broke down");
			zxmppConsole.log("Fulljid: " + this.zxmpp.fullJid);
		}
	}
	this.fillPollConnection = function zxmppStream_findPollConnection()
	{
		if(this.pollPacketQueue.length == 0 && this.freeConnections() > 1)
			this.sendIdle("poll");
		else if(this.pollPacketQueue.length)
			this.tryEmptyingPollQueue();
	}
	this.sendIdle = function zxmppStream_sendIdle(send_style)
	{
		// sends empty packet
		// for example, on "hold" connections
		var packet = new this.zxmpp.packet(this.zxmpp);
		packet.send(send_style);
	}
	
	this.sendXmppRestart = function zxmppStream_sendXmppRestart(send_style)
	{
		// FIXME move packet fillout to zxmpp_packet.js
		
		// send xmpp:restart request
		var packet = new this.zxmpp.packet(this.zxmpp);
		packet.xml_body.setAttribute("xmpp:restart", "true"); 

		this.hasSentRestart=true;
		packet.send(send_style);
	}
	
	this.sendBindRequest = function zxmppStream_sendBindRequest(send_style)
	{
		// FIXME move packet fillout to zxmpp_packet.js
		
		// send binding request
		// form: <iq type="set"><bind><resource>name</resource></bind></iq>
		if(!(this.zxmpp.stream.features["urn:ietf:params:xml:ns:xmpp-bind"]))
		{
			zxmppConsole.error("zxmpp::stream::sendBindRequest(): Server does not support binding. Aborting");
			return;
		}
		var packet = new this.zxmpp.packet(this.zxmpp);
		var iq = new this.zxmpp.stanzaIq(this.zxmpp);
		
		iq.appendIqToPacket(packet, "bind", "set", false); // "to" is not set, since Prosody is strict. Not setting "to" makes iq relate to the account, setting "to" to the hostname makes iq relate to server.
		iq.appendBindToPacket(packet, "Z-XMPP" + Math.floor(Math.random() * 1000));
		
		this.hasSentBind=true;
		packet.send(send_style);
		
	}
	
	this.sendSessionRequest = function zxmppStream_sendSessionRequest(send_style)
	{
		// FIXME move packet fillout to zxmpp_packet.js
		
		// send session request
		// form: <iq type="set"><session/></iq>
		if(!(this.zxmpp.stream.features["urn:ietf:params:xml:ns:xmpp-session"]))
		{
			zxmppConsole.error("zxmpp::stream::sendSessionRequest(): Server does not support session. Aborting");
			return;
		}

		var packet = new this.zxmpp.packet(this.zxmpp);
		var iq = new this.zxmpp.stanzaIq(this.zxmpp);
		iq.appendIqToPacket(packet, "session", "set", this.zxmpp.cfg["domain"].split(":")[0]);
		iq.appendSessionToPacket(packet);
		
		this.hasSentSessionRequest=true;
		packet.send(send_style);

	}
	
	this.sendCurrentPresence = function zxmppStream_sendCurrentPresence(send_style)
	{
		// FIXME move packet fillout to zxmpp_packet.js
		
		// TODO server must support presence capability!
		// check if it does.
		// but, we dont have caps parsing yet
		// (for server)
	
		var ownPresence = this.zxmpp.getPresence(this.zxmpp.fullJid);
		

		var packet = new this.zxmpp.packet(this.zxmpp);
		var presencestanza = new this.zxmpp.stanzaPresence(this.zxmpp);
		presencestanza.appendToPacket(packet, this.zxmpp.fullJid, false, ownPresence.show, ownPresence.status, ownPresence.priority);
		
		this.hasSentInitialPresence = true;
		packet.send(send_style);
		
	}
	
	
	this.sendIqQuery = function zxmppStream_sendIqQuery(namespace, type, destination, send_style, extra_query_attribs)
	{
		// FIXME move packet fillout to zxmpp_packet.js
		
		var packet = new this.zxmpp.packet(this.zxmpp);
		var iq = new this.zxmpp.stanzaIq(this.zxmpp);
		iq.appendIqToPacket(packet, "query", type, destination);

		iq.appendQueryToPacket(packet, namespace);
		
		if(extra_query_attribs)
		{
			for(var attrib in extra_query_attribs)
			{
				var val = extra_query_attribs[attrib];
				
				iq.query.setAttribute(attrib, val);
			}
		}
		packet.send(send_style);
		
		// in case caller wants to add something
		// more to the "remembered" reference to 
		// this zxmpp::stanzaIq, return it.
		return iq; 
	}
	
	this.sendIqVCardRequest = function zxmppStream_sendIqVCardRequest(destination)
	{
		var packet = new this.zxmpp.packet(this.zxmpp);
		var iq = new this.zxmpp.stanzaIq(this.zxmpp);
		iq.appendIqToPacket(packet, "query", "get", destination);
		
		iq.appendEmptyVCardToPacket(packet);

		packet.send();
	}

	// 'body' can be false/null, to prevent appending <body>
	this.sendMessage = function zxmppStream_sendMessage(send_style, from, to, type, body)
	{
		// FIXME move packet fillout to zxmpp_packet.js
		
		var packet = new this.zxmpp.packet(this.zxmpp);
		var message = new this.zxmpp.stanzaMessage(this.zxmpp);
		message.appendToPacket(packet, from, to, type, body);
		var activeNode = packet.xml.createElementNS("http://jabber.org/protocol/chatstates", "active");
		packet.messageXML.appendChild(activeNode);
		
		packet.send(send_style);
	}
	
	this.logoff = function zxmppStream_logoff()
	{
		// first send logoff "presence"
		
		var packet = new this.zxmpp.packet(this.zxmpp);
		var presence = new this.zxmpp.stanzaPresence(this.zxmpp);
		presence.appendToPacket(packet, this.zxmpp.fullJid, false, "unavailable", "Logging off Z-XMPP", 1);
		
		packet.xml_body.setAttribute("type","terminate");
		packet.send("poll");
		
		// then ...
		// TODO do nicer cleanup
		zxmppClass._STREAM=this;
		setTimeout("zxmppClass._STREAM.terminate();", 1);
	}
	
	this.terminate = function zxmppStream_terminate(dont_reset_state)
	{
		zxmppConsole.log("Finishing stream termination");
		for(var conn in this.connectionsHold)
		{
			conn.onreadystatechange = false;
			if(conn.abort)
				conn.abort();
		}
		for(var conn in this.connectionsPoll)
		{
			conn.onreadystatechange = false;
			if(conn.abort)
				conn.abort();
		}
		
		if(!dont_reset_state)
		{
			// reset pools
			this.connectionsHold = [new XMLHttpRequest()];
			this.connectionsPoll = [new XMLHttpRequest(), new XMLHttpRequest];
		
			// clean queue
			this.pollPacketQueue = [];
		}
	}

	this.toJSON = function zxmppStream_toJSON(key)
	{
		// FIXME
		// this.sentUnrespondedRIDs shoudl also contain a full copy of all
		// the packets we should resend because we never received a response
		// for them!

		oldconnhold = this.connectionsHold;
		oldconnpoll = this.connectionsPoll;
		oldzxmpp = this.zxmpp;
		oldiqsawaitingreply = this.iqsAwaitingReply;

		delete this.connectionsHold;
		delete this.connectionsPoll;
		delete this.zxmpp;
		delete this.iqsAwaitingReply;

		
		var oldfuncs = {};
		for(var i in this)
		{
			if(typeof this[i] == "function")
			{
				oldfuncs[i] = this[i];
				delete this[i];
			}
		}
		var ret = oldzxmpp.util.cloneObject(this);

		this.connectionsHold = oldconnhold;
		this.connectionsPoll = oldconnpoll;
		this.zxmpp = oldzxmpp;
		this.iqsAwaitingReply = oldiqsawaitingreply;
		
		for(var i in oldfuncs)
		{
			this[i] = oldfuncs[i];
		}

		this.zxmpp.util.describeWhatCantYouStringify("zxmppStream_toJSON()", ret)
		return ret;
	}

	this.wakeUp = function zxmppStream_wakeUp()
	{
		this.reuseRIDs = this.sentUnrespondedRIDs;
		if(1) 
		{
			// use this with punjab and prosody
			this.reuseKeys = []; 
		} 
		else
		{
			// use this with ejabberd and prosody
			this.reuseKeys = this.sentUnrespondedKeys; // <== Key reusing must be done with ejabberd, but not with punjab.
			// perhaps punjab insists that the packets are completely the same, not just the key+rid, like it seems to be with ejabberd?
		}
		this.sentUnrespondedRIDs = [];
		this.sentUnrespondedKeys = [];
		try
		{
			for(var i in this.pollPacketQueue)
			{
				if(typeof this.pollPacketQueue[i] == "function")
					continue;
				zxmppConsole.log("Unpacking " + i);
				this.pollPacketQueue[i].wakeUp(this.zxmpp);
			}
		}
		catch(e)
		{
			zxmppConsole.error(e);
			zxmppConsole.log(this.zxmpp.util.prettyJson(window.sessionStorage.zxmpp));
			this.pollPacketQueue = [];
		}
		this.fillPollConnection();
	}
}
