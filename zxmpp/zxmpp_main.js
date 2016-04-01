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
 
function zxmppClass() 
{
	// Setup session-specific singletons
	
	// this.util, this.stream, etc, are classes.
	// We need instances of these classes that know
	// who their creator (this) is.
	// Let's replace classes with their instances.
	 
	this.util = new this.util(this);
	this.stream = new this.stream(this);
	
	// Event handlers
	// this is not stored nor restored by design!
	this.onConnectionTerminate = [];
	this.onPresenceUpdate = [];
	this.onRosterUpdate = [];
	this.onMessage = [];
	this.onPacket = [];
	
	// additional iq parsers
	// this is not stored nor restored by design!
	this.iqParsers = {}

	/****************
	 * client state *
	 ****************/
	// these must be stored and restored!
	this.presences = {}; // maps barejid => list of presences
	this.capsNodes = {}; // maps fulljid => features
	this.capsNodesExt = {}; // maps fulljid => extensions => features
	this.roster = {}; // maps barejid => group => rosteritem 
	this.vCards = []; // maps barejid => vcard

	// the following ones are not stored and restored by design!
	// registerable client feature extensions
	this.clientFeatureExtensions = {}
	this.clientFeatureExtensionsDisabled = {}

	// client info
	this.clientName = "Z-XMPP";
	this.clientVersion = "1.1";
	this.clientOS = navigator.userAgent;
	this.clientURL = "http://ivan.vucica.net/zxmpp/";
	this.clientDebugMode = false; // randomize version sent as part of caps

}

zxmppClass.prototype.init = function zxmppMain_init(configDict)
{
	/****************************
	 * store received variables *
	 ****************************/
	this.cfg = configDict; // configuration
}

zxmppClass.prototype.setUsername = function zxmppMain_setUsername(username)
{
	this.username = username;
	this.bareJid = username + "@" + this.cfg["domain"]; 
	this.presences[this.bareJid] = {};
}
zxmppClass.prototype.setPassword = function zxmppMain_setPassword(password)
{
	this.password = password;
}

zxmppClass.prototype.main = function zxmppMain_main(configDict, username, password)
{	
	this.init(configDict);
	
	this.setUsername(username);
	this.setPassword(password);
	
	this.stream.establish();	
}

zxmppClass.prototype.disableClientFeatureExtension = function zxmppMain_disableClientFeatureExtension(name)
{
	this.clientFeatureExtensionsDisabled[name] = true;
	this.transmitOwnPresence();
}
zxmppClass.prototype.enableClientFeatureExtension = function zxmppMain_enableClientFeatureExtension(name)
{
	delete this.clientFeatureExtensionsDisabled[name];
	this.transmitOwnPresence();
}

zxmppClass.prototype.addIqParser = function zxmppMain_addIqParser(key, parser)
{
	if(!this.iqParsers[key])
		this.iqParsers[key] = [];

	this.iqParsers[key].push(parser);
}

zxmppClass.prototype.getPresence = function zxmppMain_getPresence(fullJid)
{
	if(!fullJid)
		return undefined;
	var jid = fullJid.split("/");
	var bareJid = jid[0];
	var resource = jid[1];
	
	if(!resource)
		zxmppConsole.error("DANGER: A bare jid passed to zxmppMain_getPresence()");

	if(!this.presences[bareJid])
		this.presences[bareJid] = {};
	if(this.presences[bareJid][resource])
		return this.presences[bareJid][resource]; // already exists, do nothing
		
	var presence = new this.presence(this);
	presence.fullJid = fullJid;
	presence.bareJid = bareJid;
	presence.resource = resource;
	presence.caps.ownerJid = fullJid;
	
	this.presences[bareJid][resource] = presence;
	
	return presence;
}
zxmppClass.prototype.getPresencesForBareJid = function zxmppMain_getPresencesForBareJid(bareJid)
{
	return this.presences[bareJid];
}
zxmppClass.prototype.getTopPresenceForBareJid = function zxmppMain_getTopPresenceForBareJid(bareJid)
{
	var topPresence = false;
	var presences = this.presences[bareJid];
	
	if(!presences)
		return false;

	for(var resource in presences)
	{
		var presence = presences[resource];
		if(!topPresence)
		{
			topPresence = presence;
			continue;
		}
		
		if(presence.priority > topPresence.priority && presence.show != "unavailable")
		{
			topPresence = presence;
		}
	}

	return topPresence;
}


zxmppClass.prototype.removePresence = function zxmppMain_removePresence(fullJid)
{
	var jid = fullJid.split("/");
	var bareJid = jid[0];
	var resource = jid[1];
	if(resource)
		delete this.presences[bareJid][resource];
	if(this.presences[bareJid] && this.presences[bareJid].length==0) // FIXME this doesnt seem to work
		delete this.presences[bareJid];
}

zxmppClass.prototype._debugDumpPresences = function zxmppMain__debugDumpPresences()
{
	zxmppConsole.log(" ");
	zxmppConsole.log("======= PRESENCES ======== ");
	for(var bareJid in this.presences)
	{
		zxmppConsole.log(bareJid);
		var resources = this.presences[bareJid];
		for(var resource in resources)
		{
			var presence = resources[resource];
			var info = "";
			info += presence.caps.nodeType + " " + presence.caps.nodeCategory + " " + presence.caps.nodeName;
			info += " (";
			for(var feature in presence.caps.features)
			{
				info += feature + ", ";
			}
			info += "that's it)"
			
			
			
			zxmppConsole.log(" " + resource + " - " + info);
		}
	} 
	zxmppConsole.log(" ");
}

zxmppClass.prototype._debugDumpStreamFeatures = function zxmppMain__debugDumpStreamFeatures()
{
	zxmppConsole.log(" ");
	zxmppConsole.log("======= STREAM:FEATURES ======== ");
	for(var xmlns in this.stream.features)
	{
		zxmppConsole.log(xmlns);
		var nodes = this.stream.features[xmlns];
		for(var node in nodes)
		{
			zxmppConsole.log(" " + node);
		}
	} 
	zxmppConsole.log(" ");
}

zxmppClass.prototype.notifyConnectionTerminate = function zxmppMain_notifyConnectionTerminate(code,humanreadable)
{
	for(var terminateHandlerId in this.onConnectionTerminate)
	{
		var terminateHandler = this.onConnectionTerminate[terminateHandlerId];
		if(terminateHandler.func)
			terminateHandler.func(terminateHandler.context, this, code, humanreadable);
		else
			terminateHandler(this,code,humanreadable);
	}
}

zxmppClass.prototype.notifyPresenceUpdate = function zxmppMain_notifyPresenceUpdate(presence, stanza)
{
	for(var presenceHandlerId in this.onPresenceUpdate)
	{
		var presenceHandler = this.onPresenceUpdate[presenceHandlerId];
		if(presenceHandler.func)
			presenceHandler.func(presenceHandler.context, this, presence, stanza);
		else
			presenceHandler(this, presence, stanza);
	}
}
zxmppClass.prototype.notifyRosterUpdate = function zxmppMain_notifyRosterUpdate(rosteritem)
{
	
	for(var rosterUpdateHandlerId in this.onRosterUpdate)
	{
		var rosterUpdateHandler = this.onRosterUpdate[rosterUpdateHandlerId];
		if(rosterUpdateHandler.func)
			rosterUpdateHandler.func(rosterUpdateHandler.context, this, rosteritem);
		else
			rosterUpdateHandler(this, rosteritem);
	}
}

zxmppClass.prototype.notifyMessage = function zxmppMain_notifyMessage(messageStanza)
{
	
	for(var messageHandlerId in this.onMessage)
	{
		var messageHandler = this.onMessage[messageHandlerId];
		if(messageHandler.func)
			messageHandler.func(messageHandler.context, this, messageStanza);
		else
			messageHandler(this, messageStanza);
	}
}
zxmppClass.prototype.notifyPacket = function zxmppMain_notifyPacket(thePacket)
{
	
	for(var packetHandlerId in this.onPacket)
	{
		var packetHandler = this.onPacket[packetHandlerId];
		if(packetHandler.func)
			packetHandler.func(packetHandler.context, this, thePacket);
		else
			packetHandler(this, thePacket);
	}
}



zxmppClass.prototype.sendMessage = function zxmppMain_sendMessage(to, body)
{
	this.stream.sendMessage("poll", this.fullJid, to, "chat", body);
}
zxmppClass.prototype.getOwnPresence = function zxmppMain_getOwnPresence()
{
	return this.getPresence(this.fullJid);
}
zxmppClass.prototype.setOwnPresence = function zxmppMain_setOwnPresence(show, status, priority)
{
	var presence = this.getPresence(this.fullJid);
	if(!presence)
	{
		this.cfg["initialPresence"] = {
			'show': show,
			'status': status,
			'priority': priority
		};
		return;
	}
	presence.show = show;
	presence.status = status;
	presence.priority = priority;

	this.transmitOwnPresence();
}
zxmppClass.prototype.transmitOwnPresence = function zxmppMain_transmitOwnPresence()
{
	if(this.stream && this.stream.hasSentInitialPresence)
		this.stream.sendCurrentPresence();
	else
		zxmppConsole.log("Not sending presence since there is either no stream or initial presence wasn't already sent");
}

zxmppClass.prototype.serialized = function zxmppMain_serialized()
{
    var out = new Object();
    
    out.presences = this.presences;
    out.capsNodes = this.capsNodes;
    out.capsNodesExt = this.capsNodesExt;
    out.vCards = this.vCards; // TODO check if vcards are correctly serialized
    out.roster = this.roster;
    out.username = this.username;
    out.bareJid = this.bareJid;
    out.fullJid = this.fullJid;
    out.cfg = this.cfg;

    out.stream = this.stream;
    var jsonified = JSON.stringify(out);
    
    
    
    

    return jsonified;
}

zxmppClass.prototype.deserializeInternal = function zxmppMain_deserializeInternal(json)
{
    var zxmppcontext = this;
    var input = JSON.parse(json, function zxmppMain_reviverFunction(key, value)
    {
        // "reviver" function
        
        var type;
	//zxmppConsole.log("restoring " + key + " (a " + (typeof value) + ", classtype " + (value.type) + "): " + value);
        if(value && typeof value === "object")
        {
            type = value.type;
            if(typeof type === "string" && typeof zxmppClass.prototype[type] === "function")
            {
                var ret = new zxmppClass.prototype[type](zxmppcontext);
		for(var i in value)
		{
		    ret[i] = value[i];
		}
                return ret;
            }
        }
	return value;
    });
    
    return input;
}

zxmppClass.prototype.deserialize = function zxmppMain_deserialize(json)
{
    var input = this.deserializeInternal(json);

    this.presences = input.presences;
    this.capsNodes = input.capsNodes;
    this.capsNodesExt = input.capsNodesExt;
    this.vCards = input.vCards; // TODO check if vcards are correctly serialized
    this.roster = input.roster;
    this.username = input.username;
    this.bareJid = input.bareJid;
    this.fullJid = input.fullJid;
    this.cfg = input.cfg;

    this.stream = input.stream;

    this.stream.wakeUp();

    // finally, restore UI
    for(var i in this.presences)
    {
        for(var j in this.presences[i])
        {
            this.notifyPresenceUpdate(this.presences[i][j]);
        }
    }
    for(var i in this.roster)
    {
        this.notifyRosterUpdate(this.roster[i]);
    }
    // TODO restore messages?
}

