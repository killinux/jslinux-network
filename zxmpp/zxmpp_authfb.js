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


// Facebook authentication mechanism
// Specify appid as username and accesstoken as password.

zxmppClass.prototype.authFB = function (zxmpp)
{
	this.zxmpp = zxmpp;
	this.type = "authFB";


	this.hasSentAuth = false;
	this.authSuccess = undefined;
	
	this.startAuth = function zxmppAuthFB_startAuth()
	{	
		if(!this.hasSentAuth)
		{
			
			if(this.zxmpp.stream.features["urn:ietf:params:xml:ns:xmpp-sasl"] && 
			   this.zxmpp.stream.features["urn:ietf:params:xml:ns:xmpp-sasl"]["mechanisms"]["set"]["X-FACEBOOK-PLATFORM"])
			{
				this.sendFBAuth("poll");
			}
			else
			{
				zxmppConsole.error("zxmpp::authFB::doStep(): x-facebook-platform authentication mechanism unsupported. giving up");

				this.zxmpp.stream.terminate();
	
				var code = "terminate/no-supported-auth";
				var humanreadable = "No supported authentication mechanism provided by the server.";
				this.zxmpp.notifyConnectionTerminate(code, humanreadable);

			}
			
		}
	}
	this.decodeChallenge = function zxmppAuthFB_decodeChallenge(xml)
	{
		if(!xml || !xml.firstChild)
		{
			zxmppConsole.error("zxmpp::authFB::handleChallenge: no challenge content");
			this.zxmpp.stream.terminate();
			this.zxmpp.notifyConnectionTerminate("terminate/invalid-sasl-challenge", "Server has sent an invalid SASL challenge.");
			return;
		}

		var content = xml.firstChild;
		if(!content.nodeValue)
		{
			zxmppConsole.error("zxmpp::authFB::handleChallenge: no challenge content nodevalue");
			this.zxmpp.stream.terminate();
			this.zxmpp.notifyConnectionTerminate("terminate/invalid-sasl-challenge", "Server has sent an invalid SASL challenge.");
			return;
		}

		content = content.nodeValue;
		content = this.zxmpp.util.decode64(content);
		if(!content)
		{
			// TODO copypaste code from above for throwing error
			zxmppConsole.error("zxmpp::authFB::handleChallenge: could not base64decode challenge content");
			this.zxmpp.stream.terminate();
			this.zxmpp.notifyConnectionTerminate("terminate/invalid-sasl-challenge", "Server has sent an invalid SASL challenge.");
			return;
		}

		var challenge_array = {};
		parse_str(content, challenge_array);
		return challenge_array;

	}
	this.handleChallenge = function zxmppAuthFB_handleChallenge(xml)
	{
		var contentDict = this.decodeChallenge(xml);
		var response = {
			'method' : contentDict['method'],
			'nonce' : contentDict['nonce'],
			'api_key' : this.zxmpp.username,
			'access_token' : this.zxmpp.password,
			'call_id' : '0',
			'v' : '1.0'
		};
		response = http_build_query(response);
		this.sendResponseBody(response);
	}
	this.sendResponseBody = function zxmppAuthFB_sendResponseBody(responseBody)
	{
		// prepare auth send
		var packet = new this.zxmpp.packet(this.zxmpp);
		
		var authnode = packet.xml.createElementNS("urn:ietf:params:xml:ns:xmpp-sasl", "response");
		packet.xml_body.appendChild(authnode);

		// create child text node
		if(responseBody)
		{
			var authnode_text = packet.xml.createTextNode(
				this.zxmpp.util.encode64(
					responseBody
				));
			authnode.appendChild(authnode_text);
		}

		// send
		packet.send();
	}
	this.handleSuccess = function zxmppAuthFB_handleSuccess(xml)
	{
		this.authSuccess = true;
	}
	this.handleFailure = function zxmppAuthFB_handleFailure(xml)
	{
		this.authSuccess = false;
	}
	this.handleAbort = function zxmppAuthFB_handleAbort(xml)
	{
		this.authSuccess = false;
	}
	this.sendFBAuth = function zxmppAuthFB_sendFBAuth()
	{
		// send authorization
		var packet = new this.zxmpp.packet(this.zxmpp);
		
		var authnode = packet.xml.createElementNS("urn:ietf:params:xml:ns:xmpp-sasl", "auth");
		authnode.setAttribute("mechanism", "X-FACEBOOK-PLATFORM");
		packet.xml_body.appendChild(authnode);

		this.hasSentAuth=true;
		packet.send();
	}
	this.authSucceeded = function zxmppAuthFB_authSucceeded()
	{
		return this.authSuccess;
	}
	this.toJSON = function zxmppAuthFB_toJSON(key)
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

		this.zxmpp.util.describeWhatCantYouStringify("zxmppAuthFB_toJSON()", ret)
		return ret;
	}

	this.wakeUp = function zxmppAuthFB_wakeUp()
	{
	}
}
