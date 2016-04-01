/* 
 * Z-XMPP
 * A Javascript XMPP client.
 *
 * (c) 2013 Ivan Vucica
 * License is located in the LICENSE file
 * in Z-XMPP distribution/repository.
 * Use not complying to those terms is a
 * violation of various national and
 * international copyright laws.
 */

zxmppClass.prototype.authAnonymous = function (zxmpp)
{
	this.zxmpp = zxmpp;
	this.type = "authAnonymous";


	this.hasSentAuth = false;
	this.authSuccess = undefined;
	
	this.startAuth = function zxmppAuthAnonymous_startAuth()
	{
		if(!this.hasSentAuth)
		{
			
			if(this.zxmpp.stream.features["urn:ietf:params:xml:ns:xmpp-sasl"] && 
			   this.zxmpp.stream.features["urn:ietf:params:xml:ns:xmpp-sasl"]["mechanisms"]["set"]["ANONYMOUS"])
			{
				this.sendAnonymousAuth("poll");
			}
			else
			{
				zxmppConsole.error("zxmpp::authAnonymous::doStep(): anonymous authentication mechanism unsupported. giving up");

				this.zxmpp.stream.terminate();
	
				var code = "terminate/no-supported-auth";
				var humanreadable = "No supported authentication mechanism provided by the server.";
				this.zxmpp.notifyConnectionTerminate(code, humanreadable);

			}
			
		}
	}
	this.handleChallenge = function zxmppAuthAnonymous_handleChallenge(xml)
	{
		// ANONYMOUS should never have to handle a challenge.
		// For now, we just won't respond to the challenge.
		zxmppConsole.log("zxmpp::authAnonymous::handleChallenge: ignoring challenge!");
	}
	this.handleSuccess = function zxmppAuthAnonymous_handleSuccess(xml)
	{
		this.authSuccess = true;
	}
	this.handleFailure = function zxmppAuthAnonymous_handleFailure(xml)
	{
		this.authSuccess = false;
	}
	this.handleAbort = function zxmppAuthAnonymous_handleAbort(xml)
	{
		this.authSuccess = false;
	}
	this.sendAnonymousAuth = function zxmppAuthAnonymous_sendAnonymousAuth()
	{
		// send authorization
		var packet = new this.zxmpp.packet(this.zxmpp);
		
		var authnode = packet.xml.createElementNS("urn:ietf:params:xml:ns:xmpp-sasl", "auth");
		authnode.setAttribute("mechanism", "ANONYMOUS");
		packet.xml_body.appendChild(authnode);

		this.hasSentAuth=true;
		packet.send();
	}
	this.authSucceeded = function zxmppAuthAnonymous_authSucceeded()
	{
		return this.authSuccess;
	}
	this.toJSON = function zxmppAuthAnonymous_toJSON(key)
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

		this.zxmpp.util.describeWhatCantYouStringify("zxmppAuthAnonymous_toJSON()", ret)
		return ret;
	}

	this.wakeUp = function zxmppAuthAnonymous_wakeUp()
	{
	}
}
