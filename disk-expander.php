<?php
include_once 'ifmodified.php';
ifmodified("root.bin");

header("Content-Type: application/octet-stream");
header("Content-Length: " . (64 * 1024));
$index = @$_GET["index"];
if(!is_numeric($index))
	$index = 0;

$file = "root.bin";
if(isset($_GET["hdb"]))
	$file = "hdb.bin";
//$f = fopen("hdb.bin", "r");
$f = fopen($file, "r");
fseek($f, $index * 64 * 1024);
echo fread($f, 64 * 1024);
fclose($f);
