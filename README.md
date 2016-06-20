# jslinux-network

copy from https://bitbucket.org/ivucica/


#install:
yum install python-virtualenv 

virtualenv mysite 

source mysite/bin/activate/

pip install mod_pywebsocket

cd jslinux-network/websocketstuntap

python -m mod_pywebsocket.standalone -d . --log-level=info -p 3000

chrome:

http://killinux.com/jslinux-network

cat /dev/clipboard |sh

go to http://haoningabc.iteye.com/blog/2302051

#install apache rewrite ,php
ws的ubuntu 64位，试用一年的免费版

#安装apache：
(http://www.apache.org/dist/apr/)
* httpd使用2.2.31,似乎2.4.20在写.htaccess的时候有问题
* 下载apr和aprutil
   * 安装的时候报错 rm 不了 libtoolT什么什么的
   * 修改apr的configure文件
   * 把$RM "$cfgfile" 这个地方，用#注释掉
* apr
* ./configure --prefix=/usr/local/apr
* make
* make install
* apr-util:
* ./configure --prefix=/usr/local/apr-util --with-apr=/usr/local/apr
* make 
* make install

下载pcre
(http://ftp.exim.llorien.org/pcre/)
安装


*  ./configure --prefix=/usr/local/httpd -with-apr=/usr/local/apr --with-apr-util=/usr/local/apr-util --with-pcre=/usr/local/pcre/bin/pcre-config
* make
* make install


#rewrite-模块
* *cd /opt/httpd/httpd-2.2.31/modules/mappers
* /usr/local/httpd/bin/apxs -i -a -c ./mod_rewrite.c 
* 之后多了:
* /usr/local/httpd/modules/mod_rewrite.so
* 配置文件多了:
* LoadModule rewrite_module modules/mod_rewrite.so




#安装php

* wget http://museum.php.net/php5/php-5.4.16.tar.bz2
* apt-get install libxml2-dev
* 装php的时候需要指定httpd的路径/usr/local/httpd 


* ./configure --prefix=/usr/local/php5 --with-apxs2=/usr/local/httpd/bin/apxs 
* make
* make install

#httpd.conf

* ServerName killinux.com


修改所有
```shell
AllowOverride None为
AllowOverride All
<Directory />
    AllowOverride All 
    Require all denied
</Directory>

DocumentRoot "/var/www/html"

<IfModule dir_module>
    DirectoryIndex index.html index.php
</IfModule>
```




#php:
```shell
AddType application/x-httpd-php .php
AddType application/x-httpd-php-source .php5

LoadModule php5_module        modules/libphp5.so
```

#测试
```shell
cat .htaccess 
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteRule "index.html" "http://%{SERVER_NAME}/%{REQUEST_URI}/../index.php"  [P,L]
</IfModule>
```






