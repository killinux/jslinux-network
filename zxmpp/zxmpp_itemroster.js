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
 
// a class representing a single item on roster
zxmppClass.prototype.itemRoster = function (zxmpp)
{
	this.zxmpp = zxmpp;
	this.type = "itemRoster";

	this.bareJid = false;
	this.name = false;
	this.subscription = false;
	this.ask = false;
	this.groups = [];

	this.parseXML = function zxmppItemRoster_parseXML(xml){
		this.zxmpp.util.easierAttrs(xml);

		this.bareJid = xml.attr["jid"]; // required. user's bare jid
		this.name = xml.attr["name"]; // roster nickname, optional!
		this.ask = xml.attr["ask"]; // if ask="subscribe", we sent the request... but it's optional.
		this.subscription = xml.attr["subscription"]; // state of subscription.

/*
subscription (from rfc3921 7.1):
"none" -- the user does not have a subscription to the contact's presence information, and the contact does not have a subscription to the user's presence information
"to" -- the user has a subscription to the contact's presence information, but the contact does not have a subscription to the user's presence information
"from" -- the contact has a subscription to the user's presence information, but the user does not have a subscription to the contact's presence information
"both" -- both the user and the contact have subscriptions to each other's presence information

also:
subscription "remove" is sent and received when we're supposed to REMOVE a contact from our roster
*/

		zxmppConsole.log("Roster: " + this.bareJid);
		zxmppConsole.log(" " + this.zxmpp.util.serializedXML(xml));
		
		for(var i in xml.childNodes)
		{
			var child = xml.childNodes[i];
			if(!child || !child.nodeName) continue;

			switch(child.nodeName)
			{
				case "group":
				if(!child.firstChild)
				{
					// TODO what should we do?
				}
				else
				{
					this.groups.push(child.firstChild.nodeValue);
					zxmppConsole.log(" group: " + child.firstChild.nodeValue);
				}
				break;

				default:
				zxmppConsole.warn("zxmpp::itemRoster::parseXML(): unknown child " + child.nodeName);
				break;
			}
		}
	}
	this.toJSON = function zxmppItemRoster_toJSON(key)
	{
		zxmppConsole.log("zxmppItemRoster_toJSON()");
		var oldzxmpp = this.zxmpp;
		var oldtojson = this.toJSON; // firefox4 beta7; when we return cloned, cleaned copy of this object, it attempts to stringify once again using this same function, causing this.zxmpp to be undefined. we need to remove the function too
		delete this.zxmpp;
		delete this.toJSON;

		var ret = oldzxmpp.util.cloneObject(this);

		this.zxmpp = oldzxmpp;
		this.toJSON = oldtojson;

		this.zxmpp.util.describeWhatCantYouStringify("zxmppItemRoster_toJSON()", ret)
		return ret;
	}
}
