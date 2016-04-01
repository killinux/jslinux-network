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
 
// handling of stanzas in namespace "urn:ietf:params:xml:ns:xmpp-sasl"
zxmppClass.prototype.stanzaSASL = function(zxmpp)
{
	this.zxmpp = zxmpp;
	
	this.parseXML = function (xml)
	{
		if(xml.nodeName == "success")
		{
			this.zxmpp.stream.auth.handleSuccess(xml);
		}
		else if(xml.nodeName == "failure")
		{
			this.zxmpp.stream.auth.handleFailure(xml);
			
			this.zxmpp.stream.terminate();
			
			{
				var code = "saslfailure";
				var humanreadable = "SASL authentication failure.";
				if(xml.firstChild)
				{
					code+="/"+xml.firstChild.nodeName;
					switch(xml.firstChild.nodeName)
					{
						case "not-authorized":
						humanreadable = "Provided authentication details do not give you access. (" + humanreadable + ")";
						break;

						case "account-disabled":
						humanreadable = "Your account has been disabled. (" + humanreadable + ")";
						break;
					}
				}

				for(var i in xml.childNodes)
				{
					var child = xml.childNodes[i];
					if(child && child.nodeName == "text")
					{
						if(child.firstChild && child.firstChild.nodeValue)
							humanreadable += "\n\nServer message: " + child.firstChild.nodeValue;
					}
				}

				this.zxmpp.notifyConnectionTerminate(code, humanreadable);
			}
			
		}
		else if(xml.nodeName == "abort")
		{
			this.zxmpp.stream.auth.handleAbort(xml);
			
			this.zxmpp.stream.terminate();
			
			{
				var code = "saslabort";
				if(xml.firstChild)
				{
					code+="/"+xml.firstChild.nodeName;
				}
				
				var humanreadable = "SASL authentication aborted.";
				this.zxmpp.notifyConnectionTerminate(code, humanreadable);
			}
			
		}
		else if (xml.nodeName == "challenge")
		{
			this.zxmpp.stream.auth.handleChallenge(xml);
		}
		else
		{
			console.warn("zxmpp::stanzaSASL::parseXML(): Unhandled nodename " + xml.nodeName);
		}
	}
	
	
	this.toJSON = function()
	{
		// TODO
		console.warn("skipping encoding of stanzaSASL");
		return "< not encoding stanzaSASL >";
	}	
}
