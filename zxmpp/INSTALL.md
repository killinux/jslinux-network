# INSTALL #

## Quickly getting 'demo' to work ##

### Web server ###

Your apache installation needs to have `mod_rewrite` and `mod_proxy` enabled,
at least for the directory where you put Z-XMPP. We're shipping an example
.htaccess which redirects to a local XMPP server, with BOSH service being
run on port 5280 in subdirectory `http-bind/` (as on ejabberd).

So, you probably need to just enable `mod_rewrite` and `mod_proxy` and put
Z-XMPP into, for example, `/var/www/htdocs/` under most UNIX-related operating
systems.

### XMPP server ###

For `ejabberd`, enable `ejabber_http` service in `ejabberd.cfg`, and in it,
enable the `http_bind` module.

    {5280, ejabberd_http, [
                           %%{request_handlers,
                           %% [
                           %%  {["pub", "archive"], mod_http_fileserver}
                           %% ]},
                           %%captcha,
                           http_bind,
                           http_poll,
                           web_admin
                          ]}

Also, do not forget to configure a hostname for the server. Z-XMPP and
any other client that uses BOSH (also known as `http_bind`) will require
correct hostname.


## Integrating in your site ##

Z-XMPP is designed to maintain your session. Apart from the main code in
the .js files, `demo.php` has a minimum web site with a bunch of Javascript
that supports the .js files and interacts with them.

You are recommended to study `demo.php` and contact the author
via  <zxmpp@vucica.net> with questions, as well as suggestions for improvement
of documentation.


