<?php
function ifmodified($filename)
{
	$timestamp = filemtime($filename);
	$language = "";

	$tsstring = gmdate('D, d M Y H:i:s ', $timestamp) . 'GMT';
	$etag = '"' . $language . $timestamp . '"';

	$if_modified_since = isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) ? $_SERVER['HTTP_IF_MODIFIED_SINCE'] : false;
	$if_none_match = isset($_SERVER['HTTP_IF_NONE_MATCH']) ? $_SERVER['HTTP_IF_NONE_MATCH'] : false;
	if ((($if_none_match && $if_none_match == $etag) || !$if_none_match) &&
	    ($if_modified_since && $if_modified_since == $tsstring))
	{
	    header('HTTP/1.1 304 Not Modified');
	    exit();
	}
	else
	{
	    header("Last-Modified: $tsstring");
	    header("ETag: {$etag}");
	    header("X-Got-If-None-Match: " . ($if_none_match ? $if_none_match : false) . " - expected " . $etag);
	    header("X-Got-If-Modified-Since: '" . ($if_modified_since ? $if_modified_since : false) . "' - expected '" . $tsstring . "'");
	}
}
