var zxmpp;
function tuntapLogin(server, username, password)
{
    var user = username.split('@')[0];
    var domain = username.split('@')[1];
    
    var cfg = {
        "bind-url": "zxmpp/punjab-bind/",
        "route": "xmpp:" + server,
        "domain": domain,
        "boshwait": 5
    };
    
    zxmpp = new zxmppClass();
    zxmpp.onConnectionTerminate.push(tuntapZXMPP_onConnectionTerminate);
    zxmpp.onPresenceUpdate.push(tuntapZXMPP_onPresenceUpdate);
    zxmpp.onRosterUpdate.push(tuntapZXMPP_onRosterUpdate);
    zxmpp.onMessage.push(tuntapZXMPP_onMessage);
    zxmpp.onPacket.push(tuntapZXMPP_onPacket);

    zxmpp.main(cfg, user, password);
    zxmpp.setOwnPresence("avail", "Working on XMPP TUN/TAP", 1);
    zxmpp.clientFeatureExtensions["xmpptuntap"]=["http://xmpptuntap.vucica.net/protocol/"];
    
    document.getElementById("roster").style.display = 'inherit';
    document.getElementById("roster").innerHTML = "<div style='text-align: center;'><img src='spinner.gif'><br>Logging in...</div>";
    document.getElementById("loginbox").style.display = 'none';
}

///////////////////////////////

var tuntapZXMPP_rosterContent = {};

function tuntapZXMPP_rosterAdded(jid, show, display, status)
{  
    tuntapZXMPP_rosterContent[jid] = { 'jid':jid, 'show':show, 'display':display, 'status':status };
    
    tuntapZXMPP_rosterRefresh();
}
function tuntapZXMPP_rosterRemoved(jid)
{
    delete tuntapZXMPP_rosterContent[jid];
    tuntapZXMPP_rosterRefresh();
}
function tuntapZXMPP_rosterRefresh()
{
    var roster = "<div style='text-align: center;'><div style='height: 24px;'></div></div>";
    var atLeastOneUserOnline = false;
    for(var jid in tuntapZXMPP_rosterContent)
    {
        var entry = tuntapZXMPP_rosterContent[jid];
        var supportsTunTap = tuntapZXMPP_rosterContactSupportsTunTap(jid);

        roster += "<div class='contact " + entry['show'];
        if(supportsTunTap)
            roster += " supportsTunTap ";
        roster += "' ";
        if(supportsTunTap)
            roster += " onclick=\"tuntapZXMPP_invite('" + jid + "')\" ";
        roster +=">";
        
        roster += entry["display"];
        if(supportsTunTap)
        {
            roster += " *** ";
        }
        roster += "</div>";
        if(entry['show'] != 'unavailable')
            atLeastOneUserOnline = true;
    }
    if(!atLeastOneUserOnline)
    {
        roster += "<div style='text-align: center;'>noone online</div>";
    }
    document.getElementById('roster').innerHTML = roster;

}

function tuntapZXMPP_rosterContactSupportsTunTap(jid)
{
    var presences = zxmpp.getPresencesForBareJid(jid);
    var supportsTunTap = false;

    for (var resource in presences)
    {
        var presence = presences[resource];
        if(presence.caps && presence.caps.supports("http://xmpptuntap.vucica.net/protocol/"))
            supportsTunTap = true;
    }
    return supportsTunTap;
}

function tuntapZXMPP_rosterContactResourcesSupportingTunTap(jid)
{
    var presences = zxmpp.getPresencesForBareJid(jid.split("/")[0]);
    var supportsTunTap = [];
    
    for (var resource in presences)
    {
        if(presences[resource].caps && presences[resource].caps.supports("http://xmpptuntap.vucica.net/protocol/"))
        {
            supportsTunTap.push(resource);
        }
    }
    return supportsTunTap;
}


////////////////////////////////
var tuntapZXMPP_talkTo = false;
function tuntapZXMPP_invite(jid)
{
    var resources = tuntapZXMPP_rosterContactResourcesSupportingTunTap(jid);
    
    for(var resourceId in resources)
    {
        var resource = resources[resourceId];
        var packet = new zxmpp.packet(zxmpp);
        var message = new zxmpp.stanzaMessage(zxmpp);
        message.appendToPacket(packet, zxmpp.fullJid, jid + "/" + resource, "chat", false); // pass no body
        var invitationNode = packet.xml.createElementNS("http://xmpptuntap.vucica.net/protocol/", "invitation");
        packet.messageXML.appendChild(invitationNode);
        packet.send("poll");
    }
}
function tuntapZXMPP_sendData(jid, data)
{
    //var resources = tuntapZXMPP_rosterContactResourcesSupportingTunTap(jid);
    
    console.log('tuntapZXMPP_sendData()');
    //for(var resourceId in resources)
    {
        //var resource = resources[resourceId];
        var packet = new zxmpp.packet(zxmpp);
        var message = new zxmpp.stanzaMessage(zxmpp);
        message.appendToPacket(packet, zxmpp.fullJid, jid, "chat");// pass no body
        var dataNode = packet.xml.createElementNS("http://xmpptuntap.vucica.net/protocol/", "data");

        var dataText = packet.xml.createTextNode(zxmpp.util.encode64(data));
        dataNode.appendChild(dataText);

        packet.messageXML.appendChild(dataNode);
        packet.send("poll");
    }
}

///////////////////////////////

function tuntapZXMPP_onConnectionTerminate(sender, code, humanreadable)
{
    alert("Disconnected.\n\Reason: " + humanreadable + "\n\nCode: " + code);
}

function tuntapZXMPP_onPresenceUpdate(sender, presence)
{
    var topPresence = presence ? sender.getTopPresenceForBareJid(presence.bareJid) : false;
    if(topPresence)
    {
        console.log(" - Updating " + topPresence.bareJid + " with " + topPresence.show + " and " + topPresence.status);
        //				zxmppui.presenceUpdate(topPresence.bareJid, topPresence.show, false, topPresence.status);
        
        if(!tuntapZXMPP_rosterContent[topPresence.bareJid])
        {
            //console.warn("!!!!! NO ROSTER ENTRY FOR " + topPresence.bareJid);
            // Happens when getting report for ourselves.
        }
        else
        {
            tuntapZXMPP_rosterContent[topPresence.bareJid].show = topPresence.show;
            tuntapZXMPP_rosterContent[topPresence.bareJid].status = topPresence.status;
            tuntapZXMPP_rosterRefresh();

            
        }

    }
    else
    {
        console.warn("no top presence for " + presence);
    }

}
function tuntapZXMPP_onRosterUpdate(sender, item)
{
    var presence = sender.getTopPresenceForBareJid(item.bareJid);
    
    if(item.subscription != "removed" && item.subscription != "none")
    {
        
        var allowed = true;
        if(allowed)
        {
            var presenceShow = presence ? presence.show : "unavailable";
            var display = item.name ? item.name : item.bareJid.split('@')[0];
            var presenceStatus = presence ? presence.status : "";
            
            var vcard = sender.vCards[item.bareJid];
            if(vcard && vcard.fn)
                display = vcard.fn;
            
            tuntapZXMPP_rosterAdded(item.bareJid, presenceShow, display, presenceStatus);
        }
        
        
    }
    else
    {
        tuntapZXMPP_rosterRemoved(item.bareJid);
    }
}


function tuntapZXMPP_onMessage(sender, messageStanza)
{
    if(messageStanza.body)
    {
        var text = messageStanza.body;
        
        if(messageStanza.type == "error")
        {
            text = "ERROR with message: " + text;
        }
        /*
        zxmppZ_showNotification(undefined, messageStanza.from, text);
         */
    }
    /*
    <? if ($useZXMPPUI) { ?>
        zxmppui.messageStanzaReceived(messageStanza);
		<? } ?>
    */
    var xml = messageStanza.messageNode;
    
    if(xml && xml.childNodes) 
    {
        for(var i in xml.childNodes)
        {
            var child = xml.childNodes[i];
            if(!child.nodeName) continue;
            
            this.zxmpp.util.easierAttrs(child);
            switch(child.extendedNodeName)
            {
                    // handling of nonstandard messages
                    
                case "http://xmpptuntap.vucica.net/protocol/+invitation":
                    /*
                    var subdata = {};
                    for(var j in child.childNodes)
                    {
                        var subChild = child.childNodes[j];
                        if(!subChild.nodeName) continue;
                        if(subChild.firstChild && subChild.firstChild.nodeValue)
                            subdata[subChild.nodeName] = subChild.firstChild.nodeValue;
                    }
                    
                    var fakeMessage = new Object();
                    fakeMessage.from = "Evaluator"; //messageStanza.from.split("@")[0]";
                    fakeMessage.body = "<br>Evaluacija zadatka " + subdata["problemname"] + " dovršena! Imate " + subdata["points"] + " bodova. <a target=\"_blank\" href=\"printablerun.php?app=evaluator&evlshw=log&user=<?=$account?>&file=" + subdata["problemname"] + "\">Log</a>";
                    */
                    /*
                    zxmppZ_onMessage(sender, fakeMessage);
                     */
                    alert("Invitation from " + messageStanza.from);
		    tuntapZXMPP_talkTo = messageStanza.from;
                    break;
                case "http://xmpptuntap.vucica.net/protocol/+data":
		    net_handler(zxmpp.util.decode64(child.firstChild.nodeValue));
		    break;
            }
        }
    }
}

function tuntapZXMPP_onPacket(sender, packet)
{
    if(packet && packet.incomingStanza && packet.incomingStanza.iqXML)
    {
        for(var childId in packet.incomingStanza.iqXML.childNodes)
        {
            var child = packet.incomingStanza.iqXML.childNodes[childId];
            
            // handling of nonstandard non-message packets
            
            if(child.nodeName == "jingle")
            {
                // do whatever you want ;-)
                
                // note that the iq may or may not be handled, and 
                // the error may or may not be dispatched already.
                // act accordingly. this mechanism is not really a
                // good way to implement jingle, considering zxmpp
                // has already dispatched an iq error message.
                
            }
        }
        
        // we may have received caps update.
        // refresh roster!
        tuntapZXMPP_rosterRefresh();
    }
    

}

