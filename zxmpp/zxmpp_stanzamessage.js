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
 
// handling of "message"
zxmppClass.prototype.stanzaMessage = function(zxmpp)
{
	this.zxmpp = zxmpp;
	
	this.from = false;
	this.to = false;
	this.type = false;

	this.body = false;
	this.chatState = false;

	this.parseXML = function (xml)
	{
		
		this.zxmpp.util.easierAttrs(xml);
		
		this.messageNode = xml;

		this.from = xml.attr["from"];
		this.to = xml.attr["to"];
		this.type = xml.attr["type"];

		var presence = this.zxmpp.getPresence(this.from);

		for(var i in xml.childNodes)
		{
			var child = xml.childNodes[i];
			if(!child.nodeName) continue;
			
			this.zxmpp.util.easierAttrs(child);
			if(!child.attr)
				child.attr = {"xmlns":"UNSET"}; // dummy so we throw error
			switch(child.extendedNodeName)
			{
				case "jabber:client+body":
				if(child.firstChild)
					this.body = child.firstChild.nodeValue;
				else
					this.body = "";
				break;

				// XEP-0085
				case "http://jabber.org/protocol/chatstates+active":
				case "http://jabber.org/protocol/chatstates+inactive":
				case "http://jabber.org/protocol/chatstates+composing":
				case "http://jabber.org/protocol/chatstates+paused":
				case "http://jabber.org/protocol/chatstates+gone":
				this.chatState = child.simpleNodeName;
				presence.chatState = this.chatState;
				break;

				default:
				// ignore some:
				if(child.nodeName == "#text")
					continue;
				zxmppConsole.log("zxmpp::stanzaMessage::parseXML(): Unhandled child node " + child.nodeName + " (" + child.extendedNodeName + ")");	
			}
			
		}
		this.zxmpp.notifyMessage(this);

	}
		
	// 'body' can be false/null, to prevent appending <body>
	this.appendToPacket = function(packet, from, to, type, body)
	{
		this.from = from;
		this.to = to;
		this.body = body;
		this.type = type;
		
		var messageNode = this.messageNode = packet.xml.createElementNS("jabber:client", "message");
		if(this.from) messageNode.setAttribute("from", this.from);
		if(this.to) messageNode.setAttribute("to", this.to);
		if(this.type)
		{
			messageNode.setAttribute("type", this.type);
		}
		packet.xml_body.appendChild(messageNode);
	
		if(this.body)
		{
			var bodyNode = packet.xml.createElementNS("jabber:client", "body");
			var bodyText = packet.xml.createTextNode(this.body);
			bodyNode.appendChild(bodyText);
			messageNode.appendChild(bodyNode);
		}
		
		packet.messageXML = messageNode;
		packet.messageStanza = this;
	}
	
	this.toJSON = function()
	{
		// TODO
		zxmppConsole.warn("skipping encoding of stanzaMessage");
		return "< not encoding stanzaMessage >";
	}
	
}
