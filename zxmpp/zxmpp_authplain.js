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

zxmppClass.prototype.authPlain = function (zxmpp)
{
	this.zxmpp = zxmpp;
	this.type = "authPlain";


	this.hasSentAuth = false;
	this.authSuccess = undefined;
	
	this.startAuth = function zxmppAuthPlain_startAuth()
	{	
		if(!this.hasSentAuth)
		{
			
			if(this.zxmpp.stream.features["urn:ietf:params:xml:ns:xmpp-sasl"] && 
			   this.zxmpp.stream.features["urn:ietf:params:xml:ns:xmpp-sasl"]["mechanisms"]["set"]["PLAIN"])
			{
				this.sendPlainAuth("poll");
			}
			else
			{
				zxmppConsole.error("zxmpp::authPlain::doStep(): plain authentication mechanism unsupported. giving up");

				this.zxmpp.stream.terminate();
	
				var code = "terminate/no-supported-auth";
				var humanreadable = "No supported authentication mechanism provided by the server.";
				this.zxmpp.notifyConnectionTerminate(code, humanreadable);

			}
			
		}
	}
	this.handleChallenge = function zxmppAuthPlain_handleChallenge(xml)
	{
		// PLAIN should never have to handle a challenge.
		// For now, we just won't respond to the challenge.
		zxmppConsole.log("zxmpp::authPlain::handleChallenge: ignoring challenge!");
	}
	this.handleSuccess = function zxmppAuthPlain_handleSuccess(xml)
	{
		this.authSuccess = true;
	}
	this.handleFailure = function zxmppAuthPlain_handleFailure(xml)
	{
		this.authSuccess = false;
	}
	this.handleAbort = function zxmppAuthPlain_handleAbort(xml)
	{
		this.authSuccess = false;
	}
	this.sendPlainAuth = function zxmppAuthPlain_sendPlainAuth()
	{
		// send authorization
		var packet = new this.zxmpp.packet(this.zxmpp);
		
		var authnode = packet.xml.createElementNS("urn:ietf:params:xml:ns:xmpp-sasl", "auth");
		authnode.setAttribute("mechanism", "PLAIN");
		packet.xml_body.appendChild(authnode);

		// create child text node
		var authnode_text = packet.xml.createTextNode(
			this.zxmpp.util.encode64(
				this.zxmpp.bareJid + "\0" + 
				this.zxmpp.username + "\0" + 
				this.zxmpp.password
			));
		authnode.appendChild(authnode_text);

		this.hasSentAuth=true;
		packet.send();
	}
	this.authSucceeded = function zxmppAuthPlain_authSucceeded()
	{
		return this.authSuccess;
	}
	this.toJSON = function zxmppAuthPlain_toJSON(key)
	{

		oldzxmpp = this.zxmpp;
		//oldcontent = this.oldcontent;

		delete this.zxmpp;
		//delete this.oldcontent;
		
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

		this.zxmpp = oldzxmpp;
		//this.content = oldcontent;
		
		for(var i in oldfuncs)
		{
			this[i] = oldfuncs[i];
		}

		this.zxmpp.util.describeWhatCantYouStringify("zxmppAuthPlain_toJSON()", ret)
		return ret;
	}

	this.wakeUp = function zxmppAuthPlain_wakeUp()
	{
	}
}
