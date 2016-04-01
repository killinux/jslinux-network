#!/bin/bash

# Packaging tapper for an embedded system that
# wants to network over ttyS1

if [ $# == 0 ]; then
	ARGS="--tapper-headers --ip-address 10.0.2.0 --netmask 255.255.255.0 --randomize-ip"
else
	ARGS="$@"
fi

rm the_package.sh

echo "# source code for tapper" >> the_package.sh
echo "echo 'deploying tapper.c'" >> the_package.sh
echo "cat << __EOF > tapper.c" >> the_package.sh
sed 's/\$/\\$/g' tapper.c >> the_package.sh
echo "__EOF" >> the_package.sh

echo "# twinpipe.sh" >> the_package.sh
echo "echo 'deploying twinpipe.sh'" >> the_package.sh
echo "cat << __EOF > twinpipe.sh" >> the_package.sh
sed 's/\$/\\$/g' twinpipe.sh >> the_package.sh
echo "__EOF" >> the_package.sh

echo "# makefile for tapper" >> the_package.sh
echo "echo 'deploying Makefile'" >> the_package.sh
echo "cat << __EOF > Makefile" >> the_package.sh
sed 's/\$/\\$/g' Makefile >> the_package.sh
echo "__EOF" >> the_package.sh

echo "# quick launch script" >> the_package.sh
echo "echo 'deploying go.sh'" >> the_package.sh
echo "cat << __EOF > go.sh" >> the_package.sh
cat >> the_package.sh << _PACKEOF
CC=tcc make

echo 'configuring ttyS1'
stty -F /dev/ttyS1 -ignbrk -brkint -parmrk -istrip -inlcr -igncr -icrnl -ixon -opost -echo -echonl -icanon -isig -iexten -parenb cs8

echo 'launching tapper'
./tapper $ARGS /dev/ttyS1 /dev/ttyS1 &

echo 'sleeping 1sec'
sleep 1

echo 'adding dns nameserver'
rm -rf /var/root/etc
umount /etc
cp -R /etc/ /var/root/etc
mount -o bind /var/root/etc /etc/
echo nameserver 8.8.8.8 > /var/root/etc/resolv.conf

echo 'enabling passwordless root login'
sed -i 's/^root:x:/root::/' /var/root/etc/passwd

echo 'routing through 10.0.2.2'
route add default gw 10.0.2.2

echo 'symlinking telnetd and httpd'
ln -s /bin/busybox telnetd
ln -s /bin/busybox httpd

echo 'making httpd home'
mkdir /var/www
echo 'This is an embedded system!' > /var/www/index.html

echo 'launching telnetd and httpd'
./telnetd
./httpd -h /var/www

echo ''
echo 'this is your tap0 configuration:'
echo ''
ifconfig tap0

_PACKEOF
echo "__EOF" >> the_package.sh

echo "echo 'applying permissions'" >> the_package.sh
echo "chmod +x go.sh" >> the_package.sh
echo "chmod +x twinpipe.sh" >> the_package.sh


echo "# source code for sniffer" >> the_package.sh
echo "echo 'deploying sniffer.c'" >> the_package.sh
echo "cat << __EOF > sniffer.c" >> the_package.sh
sed 's/\$/\\$/g' contrib/sniffer.c >> the_package.sh
echo "__EOF" >> the_package.sh

echo "# updating makefile for sniffer" >> the_package.sh
echo "echo 'updating Makefile for sniffer'" >> the_package.sh
echo "cat << __EOF >> Makefile" >> the_package.sh
echo "sniffer:" >> the_package.sh
echo "	tcc sniffer.c -o sniffer" >> the_package.sh
echo "__EOF" >> the_package.sh


echo "echo 'launching quickstart script go.sh'" >> the_package.sh
echo "./go.sh" >> the_package.sh

