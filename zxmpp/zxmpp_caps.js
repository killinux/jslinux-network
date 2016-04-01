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
 
// typically represents caps of a single entity on xmpp network,
// but can also be cached in a node
zxmppClass.prototype.caps = function(zxmpp)
{
	this.zxmpp = zxmpp;
	this.type = "caps";

	this.node = false;
	this.ver = false;
	this.ext = false;
	this.hash = false;
	
	this.features = [];
	this.featuresExt = {};
	this.ownerJid = false;
	this.ownerNode = false;
	
	this.nodeCategory = false;
	this.nodeType = false;
	this.nodeName = false;
	
	// FIXME hash="sha-1"; perhaps dont use it in database key?
	
	
	this.parseXML = function (xml) // parse "c"
	{
		
		// XEP-0115-3:
		//	<c xmlns='http://jabber.org/protocol/caps' node='http://psi-im.org/caps' ver='caps-b75d8d2b25' ext='ca cs ep-notify html'/>
		// latest XEP-0115-4 (as of oct 2010) also includes hash
		
		this.zxmpp.util.easierAttrs(xml);
		
		this.node = xml.attr["node"];
		this.ver = xml.attr["ver"];
		this.ext = xml.attr["ext"];
		this.hash = xml.attr["hash"];
		
		this.ownerNode = this.node + "#" + this.ver;
		
		
		
		// if we already know caps, skip
		if(this.hash)
		{
			// XEP-0115-4
			// we can use node database
			
			// let's first discover each ext we don't know about
			if(!this.zxmpp.capsNodesExt[this.ownerNode + "#" + this.hash])
				this.zxmpp.capsNodesExt[this.ownerNode + "#" + this.hash] = {};
			var extdest = this.zxmpp.capsNodesExt[this.ownerNode + "#" + this.hash];
			
			this.unpackExt(extdest);
			
			
			
			if(this.zxmpp.capsNodes[this.ownerNode + "#" + this.hash])
			{
				// replace this instance in its owner zxmpp::presence with
				// the cached zxmpp::caps based on the hash
				
				this.zxmpp.getPresence(this.ownerJid).caps = this.zxmpp.util.cloneObject(this.zxmpp.capsNodes[this.ownerNode + "#" + this.hash]);
				this.zxmpp.getPresence(this.ownerJid).caps.ownerJid = this.ownerJid;
					
				return;
			}
		}
		else
		{
			// XEP-0115-3 legacy format
			// using database is impossible,
			// since we cannot verify caps
			

			// let's first discover each ext we don't know about
			if(!this.zxmpp.capsNodesExt[this.ownerNode])
				this.zxmpp.capsNodesExt[this.ownerNode] = {};
			var extdest = this.zxmpp.capsNodesExt[this.ownerNode];
			
			this.unpackExt(extdest);
			

			
			// TODO decide if we will trust clients that dont serve us hash
			// for now we will trust 
			if(this.zxmpp.capsNodes[this.ownerNode])
			{
				// replace this instance in its owner zxmpp::presence with
				// the cached zxmpp::caps, based on just the node+ver
				
				this.zxmpp.getPresence(this.ownerJid).caps = this.zxmpp.util.cloneObject(this.zxmpp.capsNodes[this.ownerNode]);
				this.zxmpp.getPresence(this.ownerJid).caps.ownerJid = this.ownerJid;
				
				return;
			}

		}

		
		// discover caps by sending disco info
		if(!this.ownerJid)
		{
			console.error("zxmpp::caps::parseXML(): Cannot discover caps since ownerJid is not set");
			return; 
		}
		
		zxmppConsole.log("Asking " + this.ownerJid + " about caps");
		this.zxmpp.stream.sendIqQuery("http://jabber.org/protocol/disco#info", "get", this.ownerJid, false, {"node": this.node + "#" + this.ver});
		
		
	}

	this.finishProcessing = function zxmppCaps_finishProcessing()
	{
		
		// TODO must copy, not reference, and then replace ownerJid with 'false'!

		if(this.hash)
		{
			// TODO add hash spoofing verification!
			
			this.zxmpp.capsNodes[this.ownerNode + "#" + this.hash] = this.zxmpp.util.cloneObject(this);
		}
		else
		{
			// TODO decide if we should trust the client without a hash!
			// let's still cache based on ver, and trust
			
			this.zxmpp.capsNodes[this.ownerNode] = this.zxmpp.util.cloneObject(this);
		}
	}

	this.applyThisClientsCaps = function zxmpp_applyThisClientsCaps()
	{
		// FIXME currently we add constant values.
		// we should actually add values stored in this caps instance!
		// idea: function "this.useThisClientDefaults" which'll set defaults

		if(!this.ver)
		{
			this.ver = this.zxmpp.clientVersion;
			if(this.zxmpp.clientDebugMode)
				this.ver += "." + (new Date().getTime());
		}
		if(!this.node)
		{
			this.node = this.zxmpp.clientURL;
		}

		this.features = [
				'http://jabber.org/protocol/disco#info', 
				'jabber:iq:version', // XEP 0092
				'http://jabber.org/protocol/chatstates'
				];

		this.featuresExt = {};
		for(var ext in this.zxmpp.clientFeatureExtensions)
		{
			if(!this.zxmpp.clientFeatureExtensionsDisabled[ext])
			{
				this.featuresExt[ext] = this.zxmpp.clientFeatureExtensions[ext];
			}
		}
	}

	this.appendToXML = function zxmppCaps_appendToXML(packet, xml)
	{
	
		var extString = "";
		for(var ftr in this.featuresExt)
		{
			extString += ftr + " ";
		}
		extString = extString.substring(0, extString.length - 1);

		// now, actually write this stuff
		var cnode = packet.xml.createElementNS("http://jabber.org/protocol/caps", "c");
		cnode.setAttribute("node", this.node); 
		cnode.setAttribute("ver", this.ver); // TODO implement proper, hashed "ver"-ification string
		cnode.setAttribute("ext", extString); // TODO Avoid 'ext'
		// TODO calculate hash, use the hash under "ver", and set "hash" to "sha-1"
		xml.appendChild(cnode);
	}

	this.supports = function zxmppCaps_supports(namespace)
	{
		if(this.features.indexOf(namespace) >= 0)
			return true;

		for(var ext in this.featuresExt)
			if(this.featuresExt[ext].indexOf(namespace) >= 0)
				return true;
		
		return false;
	}

	this.appendFeaturesToXML = function zxmppCaps_(packet, xml, ext)
	{

		if(!ext)
			ext = "";

		var ftrs;
		if(ext == "" || ext == this.ver)
			ftrs = this.features;
		else
			ftrs = this.featuresExt[ext];

		if(typeof ext != "string")
			return false;
		if(ftrs)
		{

			// always add identity
			//<identity category='client' type='web' name='Z-XMPP'/>
			
			var idnode = packet.xml.createElement("identity");
			idnode.setAttribute("category", "client");
			idnode.setAttribute("type", "web");
			idnode.setAttribute("name", "Z-XMPP");
			xml.appendChild(idnode);

			// then add features
			var ftrnode;
			for(var f in ftrs)
			{	
				if(typeof ftrs[f] != "string")
					continue;
				ftrnode = packet.xml.createElement("feature");
				ftrnode.setAttribute("var", ftrs[f]);
				xml.appendChild(ftrnode);
			}
			

			zxmppConsole.log("SENDING for EXT: " + ext);
			return true;
		}
		else
		{
			// notify the parent that something went wrong
			// we should not add anything into "xml" in case we report failure
			return false;
		}

		return false;
	}


	this.unpackExt = function zxmppCaps_unpackExt(extdest)
	{
		if(!this.ext) return;
                if(!this.ext.length) return;
		var exts = this.ext.split(" ");
		
		var packet = new this.zxmpp.packet(this.zxmpp);
		var needsSending = false;
		for(var extId in exts)
		{
			var ext = exts[extId];
			if(typeof ext != "string" || typeof extId != "string")
				continue;
			if(extdest[ext])
			{
				var feature = extdest[ext];
				this.featuresExt[ext] = feature;
				continue; // no need to request, we fetched from cache
			}
			
			var iq = new this.zxmpp.stanzaIq(this.zxmpp);
			iq.appendIqToPacket(packet, "query", "get", this.ownerJid);
			iq.appendQueryToPacket(packet, "http://jabber.org/protocol/disco#info");

			iq.query.setAttribute("node", this.node + "#" + ext);
			iq.inquiringExt = ext;
			iq.extDest = extdest;
				
			needsSending = true;
		}
		
		if(needsSending)
			packet.send("poll");
                delete packet;
	}

	this.toJSON = function zxmppCaps_toJSON(key)
	{
		zxmppConsole.log("zxmppCaps_toJSON()");
		var oldzxmpp = this.zxmpp;
		var oldtojson = this.toJSON; // firefox4 beta7; when we return cloned, cleaned copy of this object, it attempts to stringify once again using this same function, causing this.zxmpp to be undefined. we need to remove the function too
		delete this.zxmpp;
		delete this.toJSON;
		
		var ret = oldzxmpp.util.cloneObject(this);
		
		this.zxmpp = oldzxmpp;
		this.toJSON = oldtojson;

		this.zxmpp.util.describeWhatCantYouStringify("zxmppCaps_toJSON()", ret)
		return ret;
	}

};

