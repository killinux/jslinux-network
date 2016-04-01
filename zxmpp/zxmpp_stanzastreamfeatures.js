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
 
// handling of "features" in namespace "http://etherx.jabber.org/streams"
zxmppClass.prototype.stanzaStreamFeatures = function(zxmpp)
{
	this.zxmpp = zxmpp;
	
	this.caps = false;
	
	this.parseXML = function (xml)
	{
		for(var i in xml.childNodes)
		{
			var child = xml.childNodes[i];
			if(child && child.nodeName)
			{
				this.zxmpp.util.easierAttrs(child);
				
				var feature = false;
				if(child.nodeName == "mechanisms" && child.attr["xmlns"]=="urn:ietf:params:xml:ns:xmpp-sasl")
				{
					feature = this.parseMechanisms(child);
					feature.xmlNS = child.attr["xmlns"];
				}
				else if(child.nodeName == "bind" && child.attr["xmlns"]=="urn:ietf:params:xml:ns:xmpp-bind")
				{
					feature = new Object();
					feature.xmlNS = child.attr["xmlns"];
				}
				else if(child.nodeName == "session" && child.attr["xmlns"]=="urn:ietf:params:xml:ns:xmpp-session")
				{
					feature = new Object();
					feature.xmlNS = child.attr["xmlns"];
				}
				else if(child.nodeName == "c" && child.attr["xmlns"]=="http://jabber.org/protocol/caps")
				{
					/*	var presence = this.zxmpp.getPresence(this.zxmpp.cfg["domain"]);
						this.caps = presence.caps = new this.zxmpp.caps(this.zxmpp);
						this.caps.ownerJid = this.zxmpp.cfg["domain"];
						this.caps.parseXML(child);*/
					// FIXME must not ask for these details until connection has been established
				}
				else
				{
					zxmppConsole.warn("zxmpp::stanzaStreamFeatures::parseXML(): Unparsed " + child.nodeName + " in namespace " + child.attr["xmlns"]  + ": " + this.zxmpp.util.serializedXML(child));
				}
				
				
				if(feature)
				{
					feature.nodeName = child.nodeName;
					if(!this.zxmpp.stream.features[child.attr["xmlns"]])
						this.zxmpp.stream.features[child.attr["xmlns"]] = new Array();
					this.zxmpp.stream.features[child.attr["xmlns"]][child.nodeName] = feature;
				}
			}
		}
	}
	
	
	this.parseMechanisms = function(xml)
	{
		var saslMechanismsList = [];
		var saslMechanismsSet = {};
		for(var i in xml.childNodes)
		{
			var child = xml.childNodes[i];
			if(child.nodeName=="mechanism")
			{
				var mechanism = child.firstChild.nodeValue.toUpperCase();

				saslMechanismsList.push(mechanism);
				saslMechanismsSet[mechanism] = true;
			}
		}

		return {'list' : saslMechanismsList, 'set' : saslMechanismsSet};
	}

	this.toJSON = function()
	{
		// TODO
		zxmppConsole.warn("skipping encoding of stanzaStreamFeatures");
		return "< not encoding stanzaStreamFeatures >";
	}
	
}
