<?php
$zxp = "zxmpp/"; // zxp == zxmpp path

// header:
function zxmpp_headers()
{
    global $zxp;

    include $zxp . '/scriptlist.php';
    $x = "";
    foreach(zxmppGetStylesheets() as $fn)
    {
        $x .= '<link href="' . $zxp . $fn . '" rel="stylesheet" type="text/css" />' . "\n";
    }
    
    foreach(zxmppGetAllScripts() as $fn)
    {
        $x .= '<script type="text/javascript" src="' . $zxp . $fn . '"></script>' . "\n";
    }
    
    
    if(false) //!usrIsAdmin($account))
    {
        $x .= '<style>';
        $x .= '/* zxmpp gui hider */';
        if(!$config['zxmpp']['show_bar'])
            $x .= '.zxmpp_bar { display: none; }';
        if(!$config['zxmpp']['show_roster'])
            $x .= '#zxmpp_window__roster { display: none; }';
        $x .= '</style>';
    }
    
    echo $x;
}


?>
