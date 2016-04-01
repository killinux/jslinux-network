/* 
 * Z-XMPP
 * A Javascript XMPP client.
 *
 * (c) 2010 Matija Folnovic
 * (c) 2010 Ivan Vucica
 * License is located in the LICENSE file
 * in Z-XMPP distribution/repository.
 * Use not complying to those terms is a
 * violation of various national and
 * international copyright laws.
 */

zxmppClass.prototype.ui = function() {
	this.bar = undefined,
	this.roster = undefined,
	this.backend = undefined;

	this.inject = function(where) {
		this.bar = $('<div class="zxmpp_bar"></div>').appendTo(where);
		this.bar.delegate('.zxmpp_title', 'click', this.changeWindowStatus);
		this.roster = this.openWindow('Z-XMPP', '_roster');
		/*
		this.openWindow('bok');
		this.rosterAdded('matija');
		this.rosterAdded('ivucica');
		this.rosterAdded('perica');
		this.rosterAdded('jeej');
		*/
		this.adjustWindows();

		this.bar.hide().fadeIn();

	}

	this.openWindow = function(title, id) {
		returnValue = $('<div class="zxmpp_window" id="zxmpp_window_' + id + '"><div id="zxmpp_window_' + id + '_heading" class="zxmpp_window_heading"></div><div class="zxmpp_content"></div><div class="zxmpp_title"><div>' + title + '</div></div></div>').appendTo(this.bar);

		returnValue.hide().fadeIn();

		return returnValue;
	}

	this.setRosterHeading = function(title) {
		this.roster.children(".zxmpp_window_heading").html(title);
		this.roster.children(".zxmpp_window_heading").each(function(i,obj){obj.style.display = 'inherit';});
	}

	this.changeWindowStatus = function() {
		$('.zxmpp_content', $(this).parent()).slideToggle();
	}

	this.adjustWindows = function() {
		var width = 0;

		this.bar.children('div').each(function(i,window) {
			var window = $(window);
			window.css('right', width + 'px').children('*').width(window.width());
			width += window.width();
		});
	}

	this.rosterUpdated = function(jid,icon,display,status)
	{
		var safejid = jid.replace(/[^a-zA-Z 0-9]+/g,'');
		$('#zxmpp_roster_'+safejid).each(function(i,item){
			item.display = display;
			item.innerHTML = display + '<div class="zxmpp_statustext">' + status + '</div>';
		});
	}
	this.rosterAdded = function(jid, icon, display, status) {
		var safejid = jid.replace(/[^a-zA-Z 0-9]+/g,'');
		if(!status) 
			status = "";
		if($('#zxmpp_roster_'+safejid).length)
		{
			this.rosterUpdated(jid,icon,display,status);
			return;
		}

		this.roster.children('.zxmpp_content').append('<div id="zxmpp_roster_' + safejid + '" class="user' + safejid + ' zxmpp_user zxmpp_status' + icon + '">' + display + '<div class="zxmpp_statustext">' + status + '</div></div>');

		$("#zxmpp_roster_" + safejid)[0].jid = jid; // fixme dont use id; use class='user'+safejid
		$("#zxmpp_roster_" + safejid)[0].display = display; // fixme dont use id; use class='user'+safejid
		this.roster.delegate('.user' + safejid, 'click', this.userClick);


	}

	this.rosterRemoved = function(jid) {
		var safejid = jid.replace(/[^a-zA-Z 0-9]+/g,'');
		//this.roster.find('.zxmpp_content > .user' + safejid).remove();
		$('#zxmpp_roster_' + safejid).remove();
	}

	this.presenceUpdate = function(jid, icon, display, status)
	{
		var safejid = jid.replace(/[^a-zA-Z 0-9]+/g,'');
		var entries = this.roster.find('.zxmpp_content > .user' + safejid);
		if(!status)
			status = "";
		
		entries.each(function(i,entry) {
			var display_ = display;
			if(!display_)
				display_ = entry.display;
			if(!display_)
				display_ = jid;
			entry.className="zxmpp_user zxmpp_status" + icon + " user" + safejid;
			entry.innerHTML=display_ + '<div class="zxmpp_statustext">' + status + '</div>';
		});

	}

	this.showMessage = function(jid, txt) {

		var barejid = jid.split("/")[0];
		var safejid = barejid.replace(/[^a-zA-Z 0-9]+/g,'');
		
		this.messageWindow(barejid); // FIXME get roster item from backend, and get display name
		var message = $('<div class="zxmpp_message_in">' + txt + '</div>');
		var destination = $('#zxmpp_window_msg_' + safejid + " .zxmpp_content .zxmpp_content_msg");
		message.appendTo(destination).hide().fadeIn();

		$('#zxmpp_window_msg_' + safejid).find(".zxmpp_content").scrollTop($('#zxmpp_window_msg_' + safejid + ' .zxmpp_content')[0].scrollHeight - 16);
	}

	this.escapedHTML = function(txt) {
		// FIXME add better html escaping
		return txt.replace(/&/g, "&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
	}
	this.messageStanzaReceived = function(stanza) {

		jid = stanza.from;
		if(!jid)
			return;
		var barejid = jid.split("/")[0];
		var safejid = barejid.replace(/[^a-zA-Z 0-9]+/g,'');

		console.log("GETTING WINDOW FOR " + barejid);

		var msgwindow = $("#zxmpp_window_msg_" + safejid)[0];
		if(!msgwindow && stanza.body) // no window? open it, but only if we are receiving a message
		{
			this.messageWindow(barejid);
			msgwindow = $("#zxmpp_window_msg_" + safejid)[0];
		}

		if(msgwindow)
		{
			if(stanza.type != "error" && stanza.chatState)
			{
				$(msgwindow).removeClass("zxmpp_window_msg_composing");
				$(msgwindow).removeClass("zxmpp_window_msg_active");
				$(msgwindow).removeClass("zxmpp_window_msg_paused");
				$(msgwindow).removeClass("zxmpp_window_msg_gone");
				$(msgwindow).removeClass("zxmpp_window_msg_inactive");
				$(msgwindow).addClass("zxmpp_window_msg_" + stanza.chatState);
			
				// refresh height	
				$('#zxmpp_window_msg_' + safejid).find(".zxmpp_content").scrollTop($('#zxmpp_window_msg_' + safejid + ' .zxmpp_content')[0].scrollHeight - 16);
			}
		}
		if(stanza.body && stanza.type != "error")
		{
			if($('#zxmpp_roster_'+safejid)[0])
			{
				display = $('#zxmpp_roster_'+safejid)[0].display;
			}
			else
			{
				display = barejid;
			}
			this.showMessage(stanza.from, '<b>' + display + '</b>: ' + stanza.body);
		}
		
		if(stanza.body && stanza.type == "error")
		{
			this.showMessage(stanza.from, "<b>ERROR SENDING</b>: " + stanza.body);
		}
		
	}	
	this.messageReceived = function(from, body) {
		// DEPRECATED
		this.showMessage(from, '<b>other:</b> ' + this.escapedHTML(body));
	}

	this.userClick = function(event) {
		
		var jid = this.jid;
		var display = this.display;
		
		zxmppui.messageWindow(jid, display, true);//FIXME dont use zxmppui
	}
	this.messageWindow = function(jid, display, allow_focus) {

		// FIXME we reference zxmppui because "this" might not be an instance of zxmppui

		var safejid = jid.replace(/[^a-zA-Z 0-9]+/g,'');

		if(!display)
			display = jid;		
		console.log("GETTING WINDOW FOR " + jid);

		var msgwindow = $("#zxmpp_window_msg_" + safejid)[0];
		if(msgwindow)
		{
		//	return msgwindow;
			return;
		}
		console.log("Opening that window: " + jid + " (" + safejid + ")");
		var msgwindowjq = zxmppui.openWindow(display, "msg_" + safejid); 

		msgwindowjq.children('.zxmpp_content').append('<div class="zxmpp_content_msg"/>');
		msgwindowjq.children('.zxmpp_content').append('<input onkeydown="zxmppui_handlekeydown(event);" id="zxmpp_input_msg_' + safejid + '"/>');
		
		document.getElementById("zxmpp_input_msg_" + safejid).jid = jid;
		if(allow_focus)
			document.getElementById("zxmpp_input_msg_" + safejid).focus();

		zxmppui.adjustWindows();

//		return document.getElementById("zxmpp_window_msg_" + safejid);
	}
	


};

function zxmppui_handlekeydown(event)
{
	if(event.which == 13)
	{
		// FIXME dont use zxmppui
		zxmppui.backend.sendMessage(event.target.jid, event.target.value);
		zxmppui.showMessage(event.target.jid, '<b>you:</b> ' + zxmppui.escapedHTML(event.target.value)); 
		event.target.value = "";
		return;
	}

	// TODO why is "this.zxmpp" valid here?!


	// XEP-0085: chat state notifications
	// This is slightly incorrect.
	// TODO
	// 1. Inactive and Paused should be related primarily to timing
	// 2. Composing should be sent only on one character.
	// 4. Don't send if remote does not have caps

	// FIXME we currently know event.target.jid is a bare jid
	// fix for full jid!

	var presence = this.zxmpp.getTopPresenceForBareJid(event.target.jid);
	var weMaySend = (presence.chatState == "active" || presence.chatState == "composing" || presence.chatState == "paused");

	if(!weMaySend)
		return;

	if(event.target.value.length == 1 && event.keyCode == 8)
	{	
		var packet = new zxmppui.backend.packet(this.zxmpp);
		var message = new this.zxmpp.stanzaMessage(this.zxmpp);
		message.appendToPacket(packet, zxmppui.backend.fullJid, event.target.jid, "chat", false); // pass no body
		var pausedNode = packet.xml.createElementNS("http://jabber.org/protocol/chatstates", "paused");
		packet.messageXML.appendChild(pausedNode);
		packet.send("poll");
	}
	else
	if(event.target.value != "")
	{	
		var packet = new zxmppui.backend.packet(this.zxmpp);
		var message = new this.zxmpp.stanzaMessage(this.zxmpp);
		message.appendToPacket(packet, zxmppui.backend.jid, event.target.jid, "chat", false); // pass no body
		var composingNode = packet.xml.createElementNS("http://jabber.org/protocol/chatstates", "composing");
		packet.messageXML.appendChild(composingNode);
		packet.send("poll");

		// TODO: cancel previous instance of that timer,
		//       and instantiate a new timer that would send
		//       'paused' state
	}
}
