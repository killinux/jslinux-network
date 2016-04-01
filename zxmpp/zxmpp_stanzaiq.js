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

zxmppClass.prototype.stanzaIq = function(zxmpp)
{
	this.zxmpp = zxmpp;
	
	this.iqXML = false;
	
	this.query = false;
	this.bind = false;
	this.session = false;

	this.to = false;
	this.from = false;
	this.type = false,
	this.id = false;

	this.onReply = [];

	this.parseXML = function(xml)
	{
		this.zxmpp.util.easierAttrs(xml);
		
		this.from = xml.attr["from"];
		this.to = xml.attr["to"];
		this.type = xml.attr["type"];
		this.id = xml.attr["id"];
		
		this.iqXML = xml;
		
		//var from_barejid = this.from.split("/")[0];
		
		var presence;
		if(this.from && this.from.indexOf("@"))
		{
			// from a user
			if(this.from.indexOf("/") >= 0)
			{
				// a full jid
				presence = this.zxmpp.getPresence(this.from);
			}
			else
			{
				// a bare jid
				presence = this.zxmpp.getTopPresenceForBareJid(this.from);
				zxmppConsole.warn("Iq from barejid");
				zxmppConsole.log(xml);
			}
		}
		
		if(this.id && this.zxmpp.stream.iqsAwaitingReply[this.id])
		{
			var originalStanza = this.zxmpp.stream.iqsAwaitingReply[this.id];
			if(originalStanza.onReply && originalStanza.onReply.length)
			{
				for(var i in originalStanza.onReply)
				{
					var callback = originalStanza.onReply[i];
					callback(this.zxmpp, originalStanza, this);
				}
			}

		}
		for(var i in xml.childNodes)
		{
			var child = xml.childNodes[i];
			if(!child.nodeName) continue;
			
			if(child.nodeName != "#text")
				this.zxmpp.util.easierAttrs(child);
				
			switch(child.nodeName)
			{
				case "#text":
				// ignore
				break;
				
				case "bind":
				this.parseBindXML(child);
				break;
				
				case "query":
				this.parseQueryXML(child);
				break;

				case "item": // Psi can send us <item xmlns="jabber:iq:browse"/>
				// TODO check
				this.iqResultEmpty();
				break;
				
				case "error":
				zxmppConsole.error("zxmpp::stanzaIq::parseXML(): error node received: " + this.zxmpp.util.serializedXML(child));
				if(this.zxmpp.stream.iqsAwaitingReply[this.id])
				{
					var orig = this.zxmpp.stream.iqsAwaitingReply[this.id];
					zxmppConsole.error("zxmpp::stanzaIq::parseXML(): original stanza: " + this.zxmpp.util.serializedXML(orig.iqXML));					
				}
				else
				{
					zxmppConsole.error("zxmpp::stanzaIq::parseXML(): original stanza with id " + this.id + " not found");
				}
				
				break;
				
				
				case "session":
				// should trigger session start, but bind does that already
				// plus, it's mentioned in various sources that this can be
				// safely ignored and treated as a noop.
				
				// so let's just include it here so we don't send iqFail to
				// server and so that we don't log this as a warning.
				break;

				case "vCard":
				// TODO implement
				//zxmppConsole.error("***** VCARD PARSING NOT IMPLEMENTED");
				//this.iqFail();
				
							// TODO handle error vCard responses
							// in case a person has no vcard, we must not
							// continuously request a vcard from the server.
					// (currently prevented by setting "false" immediately after request,
					// also solving problem of repeated requests just because
					// a reply was not received)

								
				var vcard = new this.zxmpp.vCard(this.zxmpp);
				vcard.parseXML(child);
				if(!this.from)
					presence = this.zxmpp.getOwnPresence();
				zxmppConsole.warn("Now receiving vcard for " + presence.bareJid);
				zxmppConsole.warn(vcard);
				this.zxmpp.vCards[presence.bareJid] = vcard;
				var rosteritem = this.zxmpp.roster[presence.bareJid];
				if(rosteritem)
				{
					this.zxmpp.notifyRosterUpdate(rosteritem);
				}
				break;

				default:

				var __parseWithParserId = function zxmpp_stanzaiq_parseWithParserId(ownerStanza, parserId)
				{
					var parsedOk = false;
					try
					{
						if(ownerStanza.zxmpp.iqParsers && ownerStanza.zxmpp.iqParsers[parserId] && ownerStanza.zxmpp.iqParsers[parserId].length)
						{
							var parsers = ownerStanza.zxmpp.iqParsers[parserId];
							for(var i in parsers)
							{
								var parser = parsers[i];
								if(parser.func)
									parsedOk = parser.func(parser.context, ownerStanza.zxmpp, ownerStanza, child) || parsedOk;
								else
									parsedOk = parser(ownerStanza.zxmpp, ownerStanza, child) || parsedOk;
                                
								if(parsedOk)
									break;
							}
						}
					}
					catch(e)
					{
						zxmppConsole.error(e);
						zxmppConsole.error(e.message);
						zxmppConsole.error(e.stack);
					}
					return parsedOk;
				}

				// TODO
				// Here, we replaced child.nodeName with child.localName,
				// and child.attr["xmlns"] with child.namespaceURI.
				// However, that's not all! We also need to do this
				// all over the code.

				var parserId = child.localName + "#" + child.namespaceURI;
				var parsedOk = false;
				parsedOk = __parseWithParserId(this, parserId);
				if(!parsedOk)
				{
					parserId = child.localName;
					parsedOk = __parseWithParserId(this, parserId);
				}

				
				if(!parsedOk)
				{
					zxmppConsole.warn("zxmpp::stanzaIq::parseXML(): Unhandled child " + child.nodeName + " (" + child.nodeName + " in " + child.prefix + " / " + child.namespaceURI + " - parserId " + parserId + ")");
					this.iqFail();
				}
			}
		}
	
		if(this.id && this.zxmpp.stream.iqsAwaitingReply[this.id] && (this.type == "result" || this.type == "error"))
		{
			delete this.zxmpp.stream.iqsAwaitingReply[this.id];
		}
	}
	
	this.parseBindXML = function(xml)
	{
		if(xml.attr["xmlns"] && xml.attr["xmlns"] != "urn:ietf:params:xml:ns:xmpp-bind")
	        {
			this.iqFail();
			return;
		}
		
		switch(this.type)
		{
			case "result":
			// grab jid
			for(var i in xml.childNodes)
			{
				var child = xml.childNodes[i];
				if(!child) continue;
				
				switch(child.nodeName)
				{
					case "jid":
					if(child.firstChild)
					{
						this.zxmpp.fullJid = child.firstChild.nodeValue;
						this.zxmpp.bareJid = child.firstChild.nodeValue.split("/")[0];
						this.zxmpp.getPresence(this.zxmpp.fullJid);
					}
					break;
				}
			}
			
			break;
			
			default:
			zxmppConsole.warn("zxmpp::stanzaIq::parseBindXML(): cannot handle iq's of type " + this.type);
			this.iqFail();
		}
	}
	
	this.parseQueryXML = function(xml)
	{
		this.zxmpp.util.easierAttrs(xml);

		switch(this.type)
		{
			case "result":
			
			if(!xml.attr)
				xml.attr = {"xmlns":"UNSET"}; // dummy so we throw error
			switch(xml.attr["xmlns"])
			{
				case "jabber:iq:roster":
				this.parseQueryRosterXML(xml);
				break;

				case "http://jabber.org/protocol/disco#info":
				this.parseQueryDiscoInfoXML(xml);
				break;
				
				default:
				zxmppConsole.warn("zxmpp::stanzaIq::parseQueryXML(): Unknown namespace " + xml.attr["xmlns"] + " (iqtype=result)");
				this.iqFail();
			}
			
			
			break;
			
			case "set":
			if(!xml.attr)
				xml.attr = {"xmlns":"UNSET"}; // dummy so we throw error

			switch(xml.attr["xmlns"])
			{
				// behavior is the same as if we requested roster contents.
				case "jabber:iq:roster":
				this.parseQueryRosterXML(xml);
				break;

				default:
				zxmppConsole.warn("zxmpp::stanzaIq::parseQueryXML(): Unknown namespace " + xml.attr["xmlns"] + " (iqtype=set)");
				this.iqFail();

			}
			
			break;
			
			case "get":
			if(!xml.attr)
				xml.attr = {"xmlns":"UNSET"}; // dummy so we throw error

			switch(xml.attr["xmlns"])
			{
				case "http://jabber.org/protocol/disco#info":
				this.parseQueryDiscoInfoXML(xml);
				break;

				//case "jabber:iq:browse":
				case "jabber:iq:agents":
				// TODO should we expose something to browse when doing service discovery?
				this.iqResultEmpty();
				break;

				case "http://jabber.org/protocol/disco#items":
				this.iqResultEmpty();
				break;

				case "jabber:iq:version": // XEP 0092
				// FIXME this doesnt sync with info send in caps
				var packet = new this.zxmpp.packet(this.zxmpp);
				var iq = new this.zxmpp.stanzaIq(this.zxmpp);
				var iqnode = iq.appendIqToPacket(packet, false, "result", this.from, this.id);
				var querynode = iq.appendQueryToPacket(packet, "jabber:iq:version");
				var namenode = packet.xml.createElementNS("jabber:iq:version", "name");
				querynode.appendChild(namenode);
				namenode.appendChild(packet.xml.createTextNode(this.zxmpp.clientName));
				var versionnode = packet.xml.createElementNS("jabber:iq:version", "version");
				querynode.appendChild(versionnode);
				versionnode.appendChild(packet.xml.createTextNode(this.zxmpp.clientVersion));
				
				var osnode = packet.xml.createElementNS("jabber:iq:version", "os");
				querynode.appendChild(osnode);
				osnode.appendChild(packet.xml.createTextNode(this.zxmpp.clientOS));
				packet.send("poll");
			
				break;
				default:
				zxmppConsole.warn("zxmpp::stanzaIq::parseQueryXML(): Unknown namespace " + xml.attr["xmlns"] + " (iqtype=get)");
				this.iqFail();
			}	
			break;

			default:
			zxmppConsole.warn("zxmpp::stanzaIq::parseQueryXML(): unhandled iq type " + this.type);
			this.iqFail();
		}
	}
	
	this.parseQueryRosterXML = function(xml)
	{
		for(var i in xml.childNodes)
		{
			var child = xml.childNodes[i];
			if(!child.nodeName) continue;
			
			this.zxmpp.util.easierAttrs(child);
			
			switch(child.nodeName)
			{
				case "item":
				var rosteritem = new this.zxmpp.itemRoster(this.zxmpp);
				rosteritem.parseXML(child);
				this.zxmpp.roster[rosteritem.bareJid] = rosteritem;
				this.zxmpp.notifyRosterUpdate(rosteritem);

				break;

				default:
				zxmppConsole.warn("zxmpp::stanzaIq::parseQueryRosterXML(): Unknown namespace " + xml.attr["xmlns"]);
				this.iqFail();
			}
		}
		// if this was a server-initiated update of roster,
		// we need to tell the server we were successful
		// and just return it an empty iq result
		if(this.type == "set")
			this.iqResultEmpty();
	}
	
	this.parseQueryDiscoInfoXML = function(xml)
	{
		//zxmppConsole.log("disco info: " + this.zxmpp.util.serializedXML(xml));
		
		
		var node = xml.attr["node"];
		
		
		switch(this.type)
		{
			case "result":
			
			var presence = this.zxmpp.getPresence(this.from);
			var caps = presence.caps;
			
			var askingIq = (this.zxmpp.stream.iqsAwaitingReply[this.id]);
			if(!askingIq)
			{
				zxmppConsole.error("No asking iq for id " + this.id);
				zxmppConsole.log(xml);
				zxmppConsole.log(this.zxmpp.stream.iqsAwaitingReply);
				this.iqFail();
				return; // FIXME make sure that, after failing, we give up on processing <iq> completely
			}
			
			
			for(var i in xml.childNodes)
			{
				var child = xml.childNodes[i];
				if(!child.nodeName) continue;
				
				this.zxmpp.util.easierAttrs(child);
				switch(child.nodeName)
				{
					case "identity":
					var ccategory = child.attr["category"]; // client
					var ctype = child.attr["type"]; // pc
					var cname = child.attr["name"]; // e.g. Psi
					
					caps.nodeCategory = ccategory;
					caps.nodeName = cname;
					caps.nodeType = ctype;
					
					break;
					
					case "feature":
					// FIXME we could extract inquiringExt from the <query node="..."> attribute
					if(!askingIq.inquiringExt)
					{
						// generic feature list asking
						caps.features.push(child.attr["var"]);
					} 
					else
					{
						// we're asking for description of an ext
						// remember in db, and add to "extended" feature list
						
						if(!caps.featuresExt[askingIq.inquiringExt])
							caps.featuresExt[askingIq.inquiringExt] = [];

						caps.featuresExt[askingIq.inquiringExt].push(child.attr["var"]);
						
						if(!askingIq.extDest)
						{
							zxmppConsole.warn("zxmpp::stanzaIq::parseQueryDiscoInfoXML(): unspecified extDest, cannot store ext info");
							continue;
						}
						// remember in db:
						askingIq.extDest[askingIq.inquiringExt] = child.attr["var"];
						
						// FIXME: DONT ASK ABOUT VCARD HERE
						if(this.zxmpp.vCards[presence.bareJid] == undefined)
						{
							zxmppConsole.warn("Now requesting vcard for " + presence.bareJid);
							this.zxmpp.stream.sendIqVCardRequest(presence.bareJid);
							this.zxmpp.vCards[presence.bareJid] = false; // record that a request was made. don't ask again
						}
					}
					
					
					break;
				}
			}
			
			caps.finishProcessing(); // add to cache db or whatever
			
			break;
			
			case "get":


			var ownpresence = this.zxmpp.getPresence(this.zxmpp.fullJid);
			if(!ownpresence)
			{
				zxmppConsole.warn("zxmpp::stanzaIq::parseQueryDiscoInfoXML(): cant get own presence");
				this.iqFail();
				return;
			}

			var owncaps = ownpresence.caps;
			if(!owncaps)
			{
				zxmppConsole.warn("zxmpp::stanzaIq::parseQueryDiscoInfoXML(): own presence does not have caps");
				this.iqFail();
				return;
			}

			var packet = new this.zxmpp.packet(this.zxmpp);
			var iq = new this.zxmpp.stanzaIq(this.zxmpp);
			var iqnode = iq.appendIqToPacket(packet, false, "result", this.from, this.id);
			var querynode = iq.appendQueryToPacket(packet, "http://jabber.org/protocol/disco#info");
			
			// which extension are we being asked about?
			// node == undefined: our always-supported features
			// node == url#ext:   ext
			if(node)
				querynode.setAttribute("node", node);

			var ext;
		       if(node)
		       		ext = node.split("#");
			if(ext && ext.length>1)
				ext = ext[ext.length-1];
			else
				ext = undefined;

			if(owncaps.appendFeaturesToXML(packet, querynode, ext)) // FIXME add "ext" too, extracted from "node"
			{
				packet.send("poll");
			}
			else
			{
				this.iqFail();
			}
			break;

			default:
			zxmppConsole.warn("zxmpp::stanzaIq::parseQueryDiscoInfoXML(): unimplemented response to iq's of type " + this.type);
			this.iqFail();
		}
	}
	
	this.iqResultEmpty = function()
	{
		var packet = new this.zxmpp.packet(this.zxmpp);
		var iq = new this.zxmpp.stanzaIq(this.zxmpp);
		iq.appendIqToPacket(packet, false, "result", this.from, this.id);
		packet.send("poll");
	}
	
	
	this.iqFail = function()
	{
		zxmppConsole.warn("zxmpp::stanzaIq::iqFail(): a failure parsing IQ stanza has occured: " + this.zxmpp.util.serializedXML(this.iqXML));
			
		switch(this.type)
		{
			case "result":
			// failure to parse requires no transmission
			// towards server
			break;
			
			default:
			case "get":
			case "set":
			zxmppConsole.warn("zxmpp::stanzaIq::iqFail(): responding to " + this.type + "-type iq failure ");
			
			// FIXME perhaps we MUST include failure reason?
			// because currently we don't do that.

			var packet = new this.zxmpp.packet(this.zxmpp);
			var iq = new this.zxmpp.stanzaIq(this.zxmpp);
			iq.appendIqToPacket(packet, false, "error", this.from, this.id);
			iq.appendErrorToPacket(packet, "cancel", {"not-allowed":"urn:ietf:params:xml:ns:xmpp-stanzas"});
			
			packet.send("poll");

			break;
		}	
	}
	
	this.appendIqToPacket = function(packet, idtype, type, to, forced_id)
	{
		// generate an iq in this packet
		
		var iq = packet.xml.createElementNS("jabber:client", "iq");
		if(!forced_id)
			iq.setAttribute("id", this.id=this.zxmpp.stream.uniqueId(idtype));
		else
			iq.setAttribute("id", this.id=forced_id);
			
		iq.setAttribute("type", this.type=type);
		if(to) 
			iq.setAttribute("to", this.to=to);
			
		packet.xml_body.appendChild(iq);
		
		packet.iqXML = iq;
		this.iqXML = iq;
		packet.iqStanza = this;
			
		// remember we wait for a result or error <iq> stanza
		if(this.type == "set" || this.type == "get")
		{
			//zxmppConsole.log("remembering " + this.id);
			this.zxmpp.stream.iqsAwaitingReply[this.id] = this;
		}
	}

	this.appendQueryToPacket = function(packet, namespace)
	{
		// For a given packet initialized with an <iq>,
		// append a <query>, initializing this.query
		
		// Also, attach that <iq> to this class, 
		// initializing this.iqXML
		var iq = this.iqXML = packet.iqXML;
		var query = this.query = packet.xml.createElementNS(namespace, "query");
		iq.appendChild(query);
		
		packet.iqStanza = this;	

		return query;
	}
	
	this.appendErrorToPacket = function(packet, type, details)
	{
		// For a given packet initialized with an <iq>,
		// append a <error>, initializing this.error
		
		// Also, attach that <iq> to this class, 
		// initializing this.iqXML
		var iq = this.iqXML = packet.iqXML;
		var error = this.error = packet.xml.createElement("error");
		iq.appendChild(error);
		error.setAttribute("type", type);
		
		if(details)
		{
			for(var nodename in details)
			{
				var ns = details[nodename];
				packet.xml.createElementNS(ns, nodename);
			}
		}
			
		packet.iqStanza = this;	
	}
	this.appendBindToPacket = function(packet, resource)
	{
		// For a given packet initialized with an <iq>,
		// append a <bind><resource>txt</resource></bind>, 
		// initializing this.bind
		
		// Also, attach that <iq> to this class, 
		// initializing this.iqXML
		var iq = this.iqXML = packet.iqXML;
		var bind = this.bind = packet.xml.createElementNS("urn:ietf:params:xml:ns:xmpp-bind", "bind");
		iq.appendChild(bind);
		
		var resource_node = packet.xml.createElement("resource");
		bind.appendChild(resource_node);
		
		var resource_value = packet.xml.createTextNode(resource);
		resource_node.appendChild(resource_value);
		
		packet.iqStanza = this;
	}

	this.appendSessionToPacket = function(packet, resource)
	{
		// For a given packet initialized with an <iq>,
		// append a <session/>, 
		// initializing this.session
		
		// Also, attach that <iq> to this class, 
		// initializing this.iqXML
		var iq = this.iqXML = packet.iqXML;
		var session = this.session = packet.xml.createElementNS("urn:ietf:params:xml:ns:xmpp-session", "session");
		iq.appendChild(session);
	}

	this.appendEmptyVCardToPacket = function(packet)
	{
		// For a given packet initialized with an <iq>,
		// append a <vcard>, initializing this.vcardNode
		
		// Also, attach that <iq> to this class, 
		// initializing this.iqXML
		
		// Full VCards will be appended using:
		//  someInstanceOfZXMPP_Vcard.appendToXml(packet, iqnode)
		var iq = this.iqXML = packet.iqXML;
		var vcardNode = this.vcardNode = packet.xml.createElementNS("vcard-temp", "vCard");
		iq.appendChild(vcardNode);
		
		packet.iqStanza = this;	

	}


	this.setType = function(aType)
	{
		// sets the type: get, set, result
		// requires this.iqXML to be valid
		
		if(!this.iqXML)
		{
			zxmppConsole.error("zxmpp::stanzaIq::setType(): iq not set");
			return;
		}
		switch(aType)
		{
			case "set":
			case "get":
			case "result":
			break;
			
			default:
			zxmppConsole.error("zxmpp::stanzaIq::setType(): invalid type " + aType);
			return;
		}
		
		this.type = aType;
		this.iqXML.setAttribute("type", aType);
	}
	
	this.setFrom = function(from)
	{
		// sets the "from" jid
		
		if(!this.iqXML)
		{
			zxmppConsole.error("zxmpp::stanzaIq::setFrom(): iq not set");
			return;
		}
		
		if(from && from != zxmpp.fullJid)
		{
			zxmppConsole.warn("zxmpp::stanzaIq::setFrom(): setting from to non-own jid");
			this.iqXML.setAttribute("from", from);
			this.from = from;
			return;
		}
		this.from = zxmpp.fullJid;
		
		this.iqXML.setAttribute("from", zxmpp.fullJid);
	}
	
	
	this.setTo = function(to)
	{
		// sets the "to" jid
		
		if(!this.iqXML)
		{
			zxmppConsole.error("zxmpp::stanzaIq::setTo(): iq not set");
			return;
		}
		this.to = to;
		
		this.iqXML.setAttribute("to", zxmpp.fullJid);
	}

	this.toJSON = function()
	{
		// TODO
		zxmppConsole.warn("skipping encoding of stanzaIq");
		return "< not encoding stanzaIq >";
	}
}

