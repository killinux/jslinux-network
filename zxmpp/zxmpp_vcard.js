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
 
// a class representing a vcard-temp associated with a presence
zxmppClass.prototype.vCard = function (zxmpp)
{
	this.zxmpp = zxmpp;
	this.type = "vCard";

	this.fn = false;

	this.vcardXML = false;

	this.parseXML = function(xml){
		this.zxmpp.util.easierAttrs(xml);

		this.vcardXML = xml;

		for (var i in xml.childNodes)
		{
			var childNode = xml.childNodes[i];
			if(!childNode.nodeName) continue;
			
			switch(childNode.nodeName)
			{
				case "FN":
					if(childNode.firstChild && childNode.firstChild.nodeValue)
						this.fn = childNode.firstChild.nodeValue;
					break;
			}
		}
	}
	this.toJSON = function(key)
	{
		var oldvcardxml = this.vcardXML;

		this.vcardXML = this.zxmpp.util.serializedXML(this.vcardXML);

		var oldzxmpp = this.zxmpp;
		var oldtojson = this.toJSON; // firefox4 beta7; when we return cloned, cleaned copy of this object, it attempts to stringify once again using this same function, causing this.zxmpp to be undefined. we need to remove the function too
		delete this.zxmpp;
		delete this.toJSON;

		var ret = oldzxmpp.util.cloneObject(this);

		this.zxmpp = oldzxmpp;
		this.toJSON = oldtojson;
		this.vcardXML = oldvcardxml;

		console.warn("SERIALIZED vCard. Big TODO: we implemented vCard wakeUp(), but it is not called, and it is required for functioning!");
		return ret;
	}

	this.wakeUp = function()
	{
		var doc = this.zxmpp.util.parsedXMLDocument(this.xml);
		this.parseXML(doc); // sets this.xml
	}
}
