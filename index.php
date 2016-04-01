<!DOCTYPE html>
<html manifest="offlinemanifest.appcache">
<head>
<title>Javascript PC Emulator</title>
<style>
.term {
    font-family: courier,fixed,swiss,monospace,sans-serif;
    font-size: 14px;
    color: #f0f0f0;
    background: #000000;
}

.termReverse {
    color: #000000;
    background: #00ff00;
}
#note {
    font-size: 12px;
}
#copyright {
    font-size: 10px;
}
#clipboard {
    font-size: 12px;
}
</style>
</head>
<body oonload="start()">
<table border="0">
<tr valign="top"><td>
<script type="text/javascript" src="utils.js"></script>
<script type="text/javascript" src="term.js"></script>
<script type="text/javascript" src="cpux86.js"></script>
<script type="text/javascript" src="jslinux.js"></script>
<div id="copyright">&copy; 2011 Fabrice Bellard - <a href="news.html">News</a> - <a href="faq.html">FAQ</a> - <a href="tech.html">Technical notes</a> - modifications by ivucica</div>
<td>
	<input type="button" value="Clear clipboard" onclick="clear_clipboard();"><br>
	<textarea rows="4" cols="40" id="text_clipboard"><?php echo @file_get_contents("the_package.sh");?></textarea><br>
	<h1 id="test_serial2">network status</h1>
	<h2 id="hdd_debug">hdd</h1>
	
	<!-- other commands -->
	<div class="othercommands">
	<a href="the_package.sh">package</a>
	<button onclick="start();">boot</button>
	<button onclick="start('vmlinux-2.6.20.bin.original');">boot ne2000 kernel</button>
	<button onclick="tuntapWS_connect();">connect or reconnect websockets</button>
	</div>

	<!-- processing ttyS1 data -->
	<script>
	tuntap_bufferSize = 100;
	tuntap_bufferTimeout = 100;
	function tuntap_sendData(data)
	{
        	if(tuntapZXMPP_talkTo && tuntapZXMPP_talkTo.length)
		{
			tuntapZXMPP_sendData(tuntapZXMPP_talkTo, data);
		}
		tuntapWS_sendData(data);
	}
	</script>

	<!-- websockets net -->
	<script type="text/javascript" src="network-websockets.js"></script>

	<!-- zxmpp net -->
	<script type="text/javascript" src="network-zxmpp.js"></script>
	<?php
		include 'zxmpp.php';
		if(file_exists("defaults.php")) include_once 'defaults.php';
		zxmpp_headers();
	?>

	<script type="text/javascript">
	// a hack to disable zxmpp console output

	zxmppConsole = function(){};
	zxmppConsole.log = function(msg){}
	zxmppConsole.warn = function(msg){}
	zxmppConsole.error = function(msg){}
	
	</script>

	<link rel="stylesheet" href="style.css">
	<div class="loginbox" id="loginbox">
		<label>Server: <input id="tuntapServer" class="server" value="<?=$tuntap_server?>"></label>
		<label>Username: <input id="tuntapUsername" class="username" placeholder="marcus@gmail.com" value="<?=$tuntap_user?>"></label>
		<label>Password: <input id="tuntapPassword" class="password" type="password" value="<?=$tuntap_pass?>"></label>
		<input type="button" value="Log in" class="button" onclick="tuntapLogin(document.getElementById('tuntapServer').value, document.getElementById('tuntapUsername').value, document.getElementById('tuntapPassword').value);">
	</div>

	<div class="roster" id="roster">
    		
	</div>

	<script>
	if (window.applicationCache) {
	    applicationCache.addEventListener('updateready', function() {
		if (confirm('An update is available. Reload now?')) {
		    window.location.reload();
		}
	    });
	}
	</script>

<!-- end net -->
</td>
</tr>
</table>
</body>
</html>
