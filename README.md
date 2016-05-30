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
