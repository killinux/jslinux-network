<?
	if($_SERVER["SERVER_NAME"] != "ivan.vucica.net")
	{
		header("Location: http://ivan.vucica.net/zxmpp/");
	}
	else
	{
		//header("Location: http://bitbucket.org/ivucica/zxmpp/"); 
		include 'home.php';
	}
?>
