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

zxmppClass.prototype.authDigestMD5 = function (zxmpp)
{
	this.zxmpp = zxmpp;
	this.type = "authDigestMD5";


	this.hasSentAuth = false;
	this.authSuccess = undefined;
	
	this.startAuth = function zxmppAuthDigestMD5_startAuth()
	{	
		if(!this.hasSentAuth)
		{
			
			if(this.zxmpp.stream.features["urn:ietf:params:xml:ns:xmpp-sasl"] && 
			   this.zxmpp.stream.features["urn:ietf:params:xml:ns:xmpp-sasl"]["mechanisms"]["DIGEST-MD5"])
			{
				this.sendDigestMD5Auth();
			}
			else
			{
				zxmppConsole.error("zxmpp::authDigestMD5::doStep(): digestmd5 authentication mechanism unsupported. giving up");

				this.zxmpp.stream.terminate();
	
				var code = "terminate/no-supported-auth";
				var humanreadable = "No supported authentication mechanism provided by the server.";
				this.zxmpp.notifyConnectionTerminate(code, humanreadable);

			}
			
		}
	}

	this.decodeChallenge = function zxmppAuthDigestMD5_decodeChallenge(xml)
	{
		if(!xml || !xml.firstChild)
		{
			zxmppConsole.error("zxmpp::authDigestMD5::handleChallenge: no challenge content");
			this.zxmpp.stream.terminate();
			this.zxmpp.notifyConnectionTerminate("terminate/invalid-sasl-challenge", "Server has sent an invalid SASL challenge.");
			return;
		}

		var content = xml.firstChild;
		if(!content.nodeValue)
		{
			zxmppConsole.error("zxmpp::authDigestMD5::handleChallenge: no challenge content nodevalue");
			this.zxmpp.stream.terminate();
			this.zxmpp.notifyConnectionTerminate("terminate/invalid-sasl-challenge", "Server has sent an invalid SASL challenge.");
			return;
		}

		content = content.nodeValue;
		content = this.zxmpp.util.decode64(content);
		if(!content)
		{
			// TODO copypaste code from above for throwing error
			zxmppConsole.error("zxmpp::authDigestMD5::handleChallenge: could not base64decode challenge content");
			this.zxmpp.stream.terminate();
			this.zxmpp.notifyConnectionTerminate("terminate/invalid-sasl-challenge", "Server has sent an invalid SASL challenge.");
			return;
		}


		// FIXME FIXME FIXME BUG! BUG! BUG!
		// !!!!This splitter CANNOT handle commas that appear inside quotes!!!!
		content = content.split(",");
		contentDict = new Object();
		for(var entryKey in content)
		{
			var entry = content[entryKey].split('=');
			if(entry.length != 2)
			{
				zxmppConsole.error("zxmpp::authDigestMD5::handleChallenge: cannot split challenge content entry; count " + entry.length + " in " + entryStr);
				this.zxmpp.stream.terminate();
				this.zxmpp.notifyConnectionTerminate("terminate/invalid-sasl-challenge", "Server has sent an invalid SASL challenge.");
				return;
			}
			var key = entry[0];
			var value = entry[1];

			if(value[0] == '"' && value[value.length-1] == '"')
			{
				value = value.substr(1, value.length-2); // strip quotes
			}

			if(!contentDict[key])
				contentDict[key] = new Array();
			zxmppConsole.log("Setting " + key + " to " + value);
			contentDict[key].push(value);
		}
		return contentDict;
	}

	this.handleChallenge = function zxmppAuthDigestMD5_handleChallenge(xml)
	{
		var contentDict = this.decodeChallenge(xml);
		// TODO make the process an actual state machine by adding a "this.stepCounter" variable
		if(!contentDict["rspauth"])
		{
			// step 1

			this.handleChallengeStep1(contentDict);
		}
		else
		{
			// step 2

			// just send an empty response
			this.sendResponseBody();
		}
	}
	this.handleChallengeStep1 = function zxmppAuthDigestMD5_handleChallengeStep1(contentDict)
	{

		// sanity check
		if(!contentDict["realm"] || contentDict["realm"].length > 1)
			// note: there may be no realm, but we don't have a nice way
			// to provide a gui for entering a custom realm.
			// note: there may be more than one realm, but we don't have a
			// nice way to provide a GUI for picking a new realm.
		{
			zxmppConsole.error("zxmpp::authDigestMD5::handleChallenge: no realm or multiple realms");
			for(var i in contentDict["realm"])
			{
				zxmppConsole.log(contentDict["realm"][i]);
			}
			this.zxmpp.stream.terminate();
			this.zxmpp.notifyConnectionTerminate("terminate/invalid-sasl-challenge", "Server has sent an invalid SASL challenge.");
			return;
		}
		if(!contentDict["nonce"] || contentDict["nonce"].length > 1)
			// none must, by definition, appear once and once only
		{
			zxmppConsole.error("zxmpp::authDigestMD5::handleChallenge: no nonce or multiple nonces");
			this.zxmpp.stream.terminate();
			this.zxmpp.notifyConnectionTerminate("terminate/invalid-sasl-challenge", "Server has sent an invalid SASL challenge.");
			return;
		}
		// todo: if 'qop' is defined, it MUST contain value 'auth'.
		// if 'qop' is not defined, proceed nonetheless.
		// todo: use 'charset'
		// wontfix: 'algorithm' can be safely ignored

		// get values
		var username = this.zxmpp.bareJid.split("@")[0];
		var password = this.zxmpp.password;
		var host = this.zxmpp.cfg['route'].split(":")[1]; // route: xmpp:server.domain:5222; we're ripping out 'server.domain'
		var nonce = contentDict["nonce"][0];
		var cnonce = "v4KqIGOf9kHuJetK2ZyMSzWBBh2m7RfncW3IGdabbwM="; //contentDict["nonce"][0]; // TODO client nonce. should be random generated and checked in the future, instead of just replaying server'S nonce
		var realm = contentDict["realm"][0]; 
		var authzid = this.zxmpp.bareJid;
		var digesturi = 'xmpp/' + host;
		var nc = '00000001';
		var qop = 'auth';

		// generate response body
		var responseBody = "";
		responseBody += 'username="' + username + '",';
		responseBody += 'realm="' + realm + '",';
		responseBody += 'nonce="' + nonce + '",';
		responseBody += 'cnonce="' + cnonce + '",'; 
		responseBody += 'nc=' + nc + ','; // should actually increment for each response we send with the nonce value in this request
//		responseBody += 'serv-type="xmpp",';
//		responseBody += 'host="' + host + '",';
		responseBody += 'digest-uri="' + digesturi + '",';
		responseBody += 'charset=utf-8,';
//		responseBody += 'authzid="' + authzid + '",'; // removed for RFC 3920 (6.1 pt 7)
		responseBody += 'qop=' + qop + ',';

		// calculate response value
		var response = '';
		{
			var x = username + ':' + realm + ':' + password;
			zxmppConsole.log(x);
			var y = this.zxmpp.util.md5(x, true);
			zxmppConsole.log(y);
			var a1 = y + ":" + nonce + ":" + cnonce; // + ":" + authzid; // removed for RFC 3920 (6.1 pt 7)
			zxmppConsole.log(a1 + " . " + a1.length + " . " + nonce.length + " . " + cnonce.length + " . " + y.length);
			var a2 = "AUTHENTICATE:" + digesturi;
			zxmppConsole.log(a2);
			var ha1 = this.zxmpp.util.md5(a1);
			zxmppConsole.log(ha1);
			var ha2 = this.zxmpp.util.md5(a2);
			zxmppConsole.log(ha2);
			var kd = ha1 + ":" + nonce + ":" + nc + ":" + cnonce + ":" + qop + ":" + ha2;
			zxmppConsole.log(kd);
			var z = this.zxmpp.util.md5(kd);
			zxmppConsole.log(z);

			response = z;
		}

		responseBody += 'response=' + response;

		this.sendResponseBody(responseBody);
	}
	this.sendResponseBody = function zxmppAuthDigestMD5_sendResponseBody(responseBody)
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
	this.handleSuccess = function zxmppAuthDigestMD5_handleSuccess(xml)
	{
		this.authSuccess = true;
	}
	this.handleFailure = function zxmppAuthDigestMD5_handleFailure(xml)
	{
		this.authSuccess = false;
	}
	this.handleAbort = function zxmppAuthDigestMD5_handleAbort(xml)
	{
		this.authSuccess = false;
	}
	this.sendDigestMD5Auth = function zxmppAuthDigestMD5_sendDigestMD5Auth()
	{
		// send initialization packet
		// what follows is server's challenge
		var packet = new this.zxmpp.packet(this.zxmpp);
		
		var authnode = packet.xml.createElementNS("urn:ietf:params:xml:ns:xmpp-sasl", "auth");
		authnode.setAttribute("mechanism", "DIGEST-MD5");
		packet.xml_body.appendChild(authnode);
		
		this.hasSentAuth=true;
		packet.send();
	}
	this.authSucceeded = function zxmppAuthPLain_authSucceeded()
	{
		return this.authSuccess;
	}
	this.toJSON = function zxmppAuthDigestMD5_toJSON(key)
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

		this.zxmpp.util.describeWhatCantYouStringify("zxmppAuthDigestMD5_toJSON()", ret)
		return ret;
	}

	this.wakeUp = function zxmppAuthDigestMD5_wakeUp()
	{
	}
}
