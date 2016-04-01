#!/bin/bash

# Obtain and install mod_pywebsocket from:
#  https://code.google.com/p/pywebsocket/

#sudo python -m mod_pywebsocket.standalone -d . --log-level=info -p 3000
python -m mod_pywebsocket.standalone -d . --log-level=info -p 3000
