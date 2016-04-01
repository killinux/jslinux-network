<?php

function zxmppGetZXMPPScripts()
{
	return array(
		'zxmpp_main.js',
		'zxmpp_util.js',
		'zxmpp_ui.js',
		'zxmpp_stream.js',
		'zxmpp_packet.js',
		'zxmpp_presence.js',
		'zxmpp_caps.js',
		'zxmpp_itemroster.js',
		'zxmpp_vcard.js',

		'zxmpp_stanzaiq.js',
		'zxmpp_stanzapresence.js',
		'zxmpp_stanzastreamfeatures.js',
		'zxmpp_stanzasasl.js',
		'zxmpp_stanzamessage.js',

		'zxmpp_authplain.js',
		'zxmpp_authdigestmd5.js',
		'zxmpp_authanonymous.js',
		'zxmpp_authfb.js'
		);
}

function zxmppGetAllScripts()
{
	$scripts = zxmppGetZXMPPScripts();

	$scripts[] = 'jquery.min.js';
	$scripts[] = 'deepCopy.js';
	$scripts[] = 'stacktrace.js';
	$scripts[] = 'md5_2.js';
	$scripts[] = 'sdptojingle.js';

	// phpjs functions, for authfb:
	$scripts[] = 'parse_str.js';
	$scripts[] = 'http_build_query.js';
	$scripts[] = 'urlencode.js'; // http_build_query depends on this

	return $scripts;
}

function zxmppGetScriptsForExtensions()
{
	return array(
		'extensions/xep-0166-jingle.js',
		'extensions/xep-xxxx-gingle.js'
	);
}

function zxmppGetStylesheets()
{
	return array("application.css");
}
?>
