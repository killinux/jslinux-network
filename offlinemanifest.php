<?php
include_once 'ifmodified.php'; 
ifmodified("offlinemanifest.php");
header("Content-type: text/cache-manifest");

?>CACHE MANIFEST
# Offline cache v1.0.0.1
# html files
index.html

# js files
cpux86-ta.js
cpux86.js
term.js
jslinux.js
utils.js

# bin files
linuxstart.bin
vmlinux-2.6.20.bin

# hda
<?php
for ($i = 0; $i < 912; $i++)
{
	printf("hda%09d.bin\n", $i);
}
?>

FALLBACK:
/ index.html
/index.php index.html

NETWORK:
zxmpp/punjab-bind/
<?php
include 'zxmpp.php';
include $zxp . '/scriptlist.php';
foreach(zxmppGetStylesheets() as $fn)
{
    echo $zxp . $fn . "\n";
}
    
foreach(zxmppGetAllScripts() as $fn)
{
    echo $zxp . $fn . "\n";
}
?>

