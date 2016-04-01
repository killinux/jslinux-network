sudo ./twinpipe.sh ./tapper-macosx "nc -l -p 1234" &
sleep 1
sudo ./twinpipe.sh "nc localhost 1234" ./tapper-macosx
