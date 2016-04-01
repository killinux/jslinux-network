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
 
// a class representing a single full-jid's presence
zxmppClass.prototype.presence = function (zxmpp)
{
	this.zxmpp = zxmpp;
	this.type = "presence";

	this.fullJid = false;
	this.bareJid = false;
	this.resource = false;
	
	this.show = "unavailable";
	// possible states:
	// * avail (wire: no <show/> defined)
	// * chat
	// * away
	// * xa
	// * dnd
	// * unavailable (wire: type="unavailable")
	
	this.status = "";
	
	this.priority = 0;
	
	this.caps = new this.zxmpp.caps(this.zxmpp);
	this.chatState = false; // XEP-0085 - last registered chat state (e.g. false, 'composing', 'active', ...)

	this.toJSON = function zxmppPresence_toJSON(key)
	{
		zxmppConsole.log("zxmppPresence_toJSON()");
		var oldzxmpp = this.zxmpp;
		var oldtojson = this.toJSON; // firefox4 beta7; when we return cloned, cleaned copy of this object, it attempts to stringify once again using this same function, causing this.zxmpp to be undefined. we need to remove the function too
		delete this.zxmpp;
		delete this.toJSON;

		var ret = oldzxmpp.util.cloneObject(this);
		
		this.zxmpp = oldzxmpp;
		this.toJSON = oldtojson;

		this.zxmpp.util.describeWhatCantYouStringify("zxmppPresence_toJSON()", ret)
		return ret;
	}
}
