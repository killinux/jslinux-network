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
 
zxmppClass.prototype.packet = function (zxmpp)
{
	this.zxmpp = zxmpp;
	this.type = "packet";

	// build a document with httpbind namespace, and root element body 
	this.xml = this.zxmpp.util.newXMLDocument("body","http://jabber.org/protocol/httpbind");


	// set default attributes for body, if needed
	// prefer setting them just before sending
	this.xml_body = this.xml.firstChild;
	this.xml_body.setAttribute('content','text/html; charset=utf-8');
	this.xml_body.setAttribute('xmlns:xmpp','urn:xmpp:xbosh');

	// parsed stanzas
	this.iqStanza = false; this.iqXML = false;
	this.messageStanza = false; this.messageXML = false;
	this.presenceStanza = false; this.presenceXML = false;
	
	// defined namespaces
	// used only when parsing
	this.namespaces = {};
	this.defaultNamespace = "http://jabber.org/protocol/httpbind";
	
	/* functions */
	
	this.finalized = function zxmppPacket_finalized()
	{
		var body = this.xml_body;
		
		// assign a sequential request id
		this.rid = this.zxmpp.stream.assignRID();
		body.setAttribute('rid', this.rid);
		
		// assign a sid, if it's known
		// (earliest packets don't have a sid)
		if(this.zxmpp.stream.sid)
		{
			body.setAttribute('sid',this.zxmpp.stream.sid);
		}
		
		// assign cryptographic key(s) from 
		// part 15 of XEP-0124
		var keys = this.zxmpp.stream.assignKey();
		if(this.zxmpp.stream._didWarnAboutCryptoBeingDisabled)
		{
			zxmppConsole.warn("CURRENTLY DISABLED: cryptographic key from part 15 of XEP-0124");
			zxmppConsole.warn("This seems to solve misbehavior with punjab, but is incorrect!");
			this.zxmpp.stream._didWarnAboutCryptoBeingDisabled = true;
		}
		/*
		if(keys.key)
			body.setAttribute('key', keys.key);
		if(keys.newKey)
			body.setAttribute('newkey', keys.newKey);
		*/
		zxmppConsole.log("(finalized: " + this.zxmpp.util.serializedXML(this.xml) + ")");	
		return this.zxmpp.util.serializedXML(this.xml);
		
	}
	
	this.send = function zxmppPacket_send(send_style)
	{
		var tthis = this;
		zxmppConsole.log("<< " + tthis.zxmpp.util.serializedXML(tthis.xml));
		// queue for wire
		// FIXME ignores send_style!
		if(send_style=="hold")
		{
			tthis.zxmpp.stream.transmitPacket(tthis, send_style);
		}
		else
		{
			//setTimeout(function(){
				tthis.zxmpp.stream.pollPacketQueue.push(tthis);
				tthis.zxmpp.stream.tryEmptyingPollQueue();
			//}, 400*(1+tthis.zxmpp.stream.sentUnrespondedRIDs.length));
		}
	}
	
	
	this.parseXML = function zxmppPacket_parseXML(xml)
	{
		if(!xml || !xml.firstChild)
		{
			return false;
		}
		
		
		this.xml = xml;
		
		// root element, xml.firstChild, is <body>
		this.xml_body = xml.firstChild;
		var attrs = this.zxmpp.util.easierAttrs(this.xml_body);

		// check if this is special-type id
		if(attrs["type"])
		{
			switch(attrs["type"])
			{
				case "terminate":
				this.zxmpp.stream.terminate();
				{
					// let's generate an error-identifying code + human readable error
					
					var code = "terminate";
					if(attrs["condition"])
						code+="/"+attrs["condition"];
						
					var humanreadable = "Terminate requested by server with unset or unknown condition.";
					switch(attrs["condition"])
					{
						case "bad-format":
						humanreadable = "Server did not understand something it received.";
						break;

						case "bad-namespace-prefix":
						humanreadable = "Server did not understand something it received. (XML: bad namespace prefix)."
						break;
						
						case "conflict":
						humanreadable = "Looks like you've logged in elsewhere, and that caused a conflict.";
						break;

						case "connection-timeout":
						humanreadable = "Connection has timed out.";
						break;

						case "host-gone":
						humanreadable = "Host you're trying to talk to is no longer served by this server.";
						break;

						case "host-unknown":
						humanreadable = "Server does not handle the hostname you tried to talk to.";
						break;

						case "improper-addressing":
						humanreadable = "A message was sent that was missing 'to' or 'from' attribute.";
						break;

						case "internal-server-error":
						humanreadable = "Server experienced an internal error. Ouch.";
						break;

						case "invalid-from":
						humanreadable = "A message was sent that had an invalid 'from' attribute.";
						break;

						case "invalid-id":
						humanreadable = "Stream ID or dialback ID is invalid or does not match an ID previously provided.";
						break;

						case "invalid-namespace":
						humanreadable = "Streams namespace is set to an invalid value.";
						break;

						case "invalid-xml":
						humanreadable = "Server did not understand something it received. (XML can't be validated)";
						break;

						case "not-authorized":
						humanreadable = "Some action was performed that was not (yet) authorized.";
						break;

						case "policy-violation":
						humanreadable = "Some action was performed that violated some server-specific policy.";
						break;

						case "remote-connection-failed":
						humanreadable = "Server could not create a connection to a required remote service.";
						break;

						case "resource-constraint":
						humanreadable = "Server lacks the system resources necessary to service the stream.";
						break;

						case "restricted-xml":
						humanreadable = "An attempt was made to transmit a feature of XML that is restricted.";
						break;

						case "see-other-host":
						humanreadable = "You are being redirected to another host. Note that this client ignores the redirect.";
						break;

						case "system-shutdown":
						humanreadable = "Chat service is shutting down or restarting. Try reconnecting in a minute.";
						break;

						case "undefined-condition":
						humanreadable = "Terminate requested by server with undefined condition.";
						break;

						case "unsupported-encoding":
						humanreadable = "Initiating entity has encoded the stream in an encoding that is not supported by the server";
						break;

						case "unsupported-stanza-type":
						humanreadable = "Initiating entity has sent a first-level child of the stream that is not supported by the server";
						break;

						case "unsupported-version":
						humanreadable = "Server does not understand the chat protocol we're using.";
						break;

						case "xml-not-well-formed":
						humanreadable = "Initiating entity has sent XML that is not well-formed as defined by XML specification";
						break;
					}
					this.zxmpp.notifyConnectionTerminate(code, humanreadable);
					
				}
				return false;
				break;
			}
		}

		// store the sid we received
		if(attrs["sid"])
			this.zxmpp.stream.sid = attrs["sid"];
		
		// we need to extract namespace specs from body
		// just extract those with colon, since by default we
		// presume xmlns to be http://jabber.org/protocol/httpbind
		for(var attr in attrs)
		{
			var colonsplit = attr.split(":");
			if(colonsplit[0]=="xmlns" && colonsplit[1])
			{
				this.namespaces[colonsplit[1]] = attrs[attr];
				//zxmppConsole.log("namespace '" + colonsplit[1] + "': " + attrs[attr]);
			}
		}
		
		
		// now find the stanzas in the body, and parse them
        // FIXME instead of this loop, use .localName and .nodeNamespace when parsing XML!
		for(var i in this.xml_body.childNodes)
		{
			var child = this.xml_body.childNodes[i];
			if(!child.nodeName) continue;
			
			var nsurl = false;
			var stanza = false;
			this.zxmpp.util.easierAttrs(child);
			if(child.nodeName.split(":").length>1)
			{
				var ns = child.nodeName.split(":")[0];
				stanza = child.nodeName.split(":")[1];
				
				if(child.attr["xmlns:" + ns])
				{
					nsurl = child.attr["xmlns:" + ns];
				}
				else if(this.namespaces[ns])
				{
					nsurl = this.namespaces[ns];
				}
			}
			else
			{
				stanza = child.nodeName;
				if(!child.attr["xmlns"])
					nsurl = this.defaultNamespace;
				else
					nsurl = child.attr["xmlns"];
			}
			
			if(!nsurl)
			{
				zxmppConsole.warn("zxmpp::packet::parseXML(): Stanza " + child.nodeName + " in unknown namespace. Stanza dropped");
				continue;
			}
			
			// now we have enough data about stanza to start parsing it
			// let's iterate through supported stanzas!
			zxmppConsole.log("zxmpp::packet::parseXML(): Stanza " + stanza + " in namespace " + nsurl);
			var stanzaInstance = false;
			switch(nsurl)
			{
				case "http://etherx.jabber.org/streams":
				switch(stanza)
				{
					case "features":
					stanzaInstance = new this.zxmpp.stanzaStreamFeatures(this.zxmpp);
					break;
				}
				break;
				
				case "urn:ietf:params:xml:ns:xmpp-sasl":
				// READ: http://web.archive.org/web/20050224191820/http://cataclysm.cx/wip/digest-md5-crash.html
				switch(stanza)
				{
					case "success":
					case "failure":
					case "challenge":
					case "abort":
					stanzaInstance = new this.zxmpp.stanzaSASL(this.zxmpp);
					break;
				}
				case "http://jabber.org/protocol/httpbind": // COMPAT: Workaround for Prosody 0.7.0
				case "jabber:client":
				switch(stanza)
				{
					case "iq":
					stanzaInstance = new this.zxmpp.stanzaIq(this.zxmpp);
					break;
					case "presence":
					stanzaInstance = new this.zxmpp.stanzaPresence(this.zxmpp);
					break;
					case "message":
					stanzaInstance = new this.zxmpp.stanzaMessage(this.zxmpp);
					break;
					
				}
			
			}
			
			if(!stanzaInstance)
			{
				zxmppConsole.warn("zxmpp::packet::parseXML(): Stanza \'" + stanza + "\' in namespace \'" + nsurl + "\' is unknown. Stanza dropped");
			}
			else
			{
				stanzaInstance.parseXML(child);
			}
			
			this.incomingStanza = stanzaInstance;
		}
		return true;
	}
	this.toJSON = function zxmppPacket_toJSON(key)
	{
		zxmppConsole.log("zxmppPacket_toJSON()");
		var oldzxmpp = this.zxmpp;
		var oldtojson = this.toJSON; // firefox4 beta7; when we return cloned, cleaned copy of this object, it attempts to stringify once again using this same function, causing this.zxmpp to be undefined. we need to remove the function too
		var oldiqstanza = this.iqStanza;
		var oldmessagestanza = this.messageStanza;
		var oldpresencestanza = this.presenceStanza;
		var oldxml = this.xml;
		var oldiqxml = this.iqXML;
		var oldmessagexml = this.messageXML;
		var oldpresencexml = this.presenceXML;
		var oldxmlbody = this.xml_body;
		delete this.zxmpp;
		delete this.toJSON;
		delete this.iqStanza;
		delete this.messageStanza;
		delete this.presenceStanza;
		delete this.iqXML;
		delete this.messageXML;
		delete this.presenceXML;
		delete this.xml_body;

		this.xml = oldzxmpp.util.serializedXML(this.xml);

		var ret = oldzxmpp.util.cloneObject(this);

		this.zxmpp = oldzxmpp;
		this.toJSON = oldtojson;
		this.iqStanza = oldiqstanza;
		this.messageStanza = oldmessagestanza;
		this.presenceStanza = oldpresencestanza;
		this.iqXML = oldiqxml;
		this.messageXML = oldmessagexml;
		this.presenceXML = oldpresencexml;
		this.xml = oldxml;
		this.xml_body = oldxmlbody;

		this.zxmpp.util.describeWhatCantYouStringify("zxmppPacket_toJSON()", ret)
		return ret;
	}

	this.wakeUp = function(zxmpp)
	{
		var doc = this.zxmpp.util.parsedXMLDocument(this.xml);
		this.parseXML(doc); // sets this.xml
	}
}
