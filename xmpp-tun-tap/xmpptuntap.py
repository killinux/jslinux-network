#!/usr/bin/env python
from config import *
import xmpp, xmpp.protocol
import os, select
import sys
import os.path

import base64

targetForNetTraffic = None

discoInfo = {
                           'ids': [{
                                   'category': 'application',
                                   'type': 'bot',
                                   'name': 'XMPP TUN/TAP Bot'
                                   }],
                           'features': [xmpp.protocol.NS_DISCO_INFO, "http://xmpptuntap.vucica.net/protocol/"],
            }


def onIqDisco(conn, request):
        rep=request.buildReply('result')
#if node: rep.setQuerynode(node)
        q=rep.getTag('query')
        if request.getQueryNS()==xmpp.protocol.NS_DISCO_INFO:
            #if type(handler)==dict: dt=handler['info']
            #else: dt=handler(conn,request,'info')
            #if dt==None:
            #    conn.send(Error(request,ERR_ITEM_NOT_FOUND))
            #    raise NodeProcessed

            dt = discoInfo

            # handler must return dictionary:
            # {'ids':[{},{},{},{}], 'features':[fe,at,ur,es], 'xdata':DataForm}
            for id in dt['ids']: q.addChild('identity',id)
            for feature in dt['features']: q.addChild('feature',{'var':feature})
            if dt.has_key('xdata'): q.addChild(node=dt['xdata'])

            conn.send(rep)
            raise xmpp.protocol.NodeProcessed

netBuffer = ""
netBufferExpected = 0
import struct
def onMessage(client, message_in):

	global netBuffer, netBufferExpected
	global targetForNetTraffic
	text = message_in.getBody()
	user = message_in.getFrom()

	for aNode in message_in.getPayload():
		if aNode.getNamespace() == "http://xmpptuntap.vucica.net/protocol/":
			if aNode.getName() == "invitation" and user != targetForNetTraffic:
				targetForNetTraffic = user
				invitation = xmpp.Node("invitation")
				invitation.setNamespace("http://xmpptuntap.vucica.net/protocol/")
				
				message = xmpp.Message(user, payload = [invitation])
				message.setType("headline")
				client.send(message)
				return
			if aNode.getName() == "data":

				incomingData = base64.decodestring(aNode.getCDATA())
				
				netBuffer += incomingData
				print " GOT " + str(len(incomingData)) + " DATA - new buffer size is " + str(len(netBuffer)) + ", expecting " + str(netBufferExpected)
				if len(incomingData) >= 2:
					print " (just arrived first 2 bytes: " + str(struct.unpack('!H', incomingData[0:2])[0]) + ")"

				while len(netBuffer) >= netBufferExpected:
					if len(netBuffer) > 0 and netBufferExpected > 0:
						print " GOT ALL DATA!"
						try:
							dataToWrite = netBuffer[:netBufferExpected]
							print "  (writing " + str(len(dataToWrite)) + " bytes)"
							os.write(tuntapFD, dataToWrite)
							netBuffer = netBuffer[netBufferExpected:]
							netBufferExpected = 0
							print "  (data remaining in buffer: " + str(len(netBuffer)) + ")"
						except Exception, e:
							print "problem"
							print e

					if len(netBuffer) > 2:
						netBufferExpected = struct.unpack('!H', netBuffer[0:2])[0]
						#netBufferExpected = socket.ntohs(netBufferExpected)
						netBuffer = netBuffer[2:]
						print " NOW EXPECTING " + str(netBufferExpected)
						if netBufferExpected > 1500 * 2: # more than 2x MTU? something is wrong
							print "  (which is more than 2x MTU, so giving up)"
							netBuffer = ""
							netBufferExpected = 0

					if len(netBuffer) == 0 and netBufferExpected == 0:
						break
				return	

def onUp():
	if os.path.isfile("on-up.sh"):
		os.system("bash ./on-up.sh")


def onDown():
	if os.path.isfile("on-down.sh"):
		os.system("bash ./on-down.sh")

def setupTUNTAP():
	tuntapDevice = "tap2"
	if len(sys.argv) >= 2:
		tuntapDevice = sys.argv[1]
	ipAddress = "10.0.2.1"
	if len(sys.argv) >= 3:
		ipAddress = sys.argv[2]
	tuntapFD = os.open("/dev/" + tuntapDevice, os.O_RDWR)
	if tuntapDevice == "net/tun":
		# Linux specific code
		TUNSETIFF = 0x400454ca
		IFF_TUN   = 0x0001
		IFF_TAP   = 0x0002
		IFF_NO_PI = 0x1000

		TUNMODE = IFF_TAP
		TUNMODE |= IFF_NO_PI # do not prepend protocol information

		from fcntl import ioctl

		ifs = ioctl(tuntapFD, TUNSETIFF, struct.pack("16sH", "xmpptuntap%d", TUNMODE))
		tuntapDevice = ifs[:16].strip("\x00")
		sys.stderr.write("tuntapdevice: " + tuntapDevice + "\n")

	os.system("ifconfig " + tuntapDevice + " inet " + ipAddress);

	onUp()

	return (tuntapFD, tuntapDevice, ipAddress)

def setupXMPP():
	jid = xmpp.protocol.JID(config['jid'])
	if len(sys.argv) >= 4:
		jid = xmpp.protocol.JID(sys.argv[3])
	client = xmpp.Client(jid.getDomain()) #, debug=[])
	client.connect()
	client.auth(jid.getNode(), config['password'], "xmpptuntap")

	"""
	disco = xmpp.browser.Browser()
	disco.PlugIn(client)
	disco.setDiscoHandler({
				   'info': {
				   'ids': [{
					   'category': 'applicationt',
					   'type': 'bot',
					   'name': 'XMPP TUN/TAP Bot'
					   }],
				   'features': [xmpp.protocol.NS_DISCO_INFO, "http://xmpptuntap.vucica.net/protocol/"],
				   },
				   'items':[]
				   })

	commands = xmpp.commands.Commands(disco)
	commands.PlugIn(client)

	command_test = TestCommand()
	command_test.plugin(commands)
	command_ls = LsCommand()
	command_ls.plugin(commands)
	"""

	#Replacing the preceding with two steps: requesting roster and sending 
	#custom presence
	# client.sendInitPresence()
	xmpp.roster.Roster().PlugIn(client) # request roster
	caps = xmpp.Node("c", attrs={"node": "http://xmpptuntap.vucica.net/desktop/caps", "ver": "1.0", "ext": ""}, payload = [ ]); # payload can contain more nodes
	caps.setNamespace(xmpp.NS_CAPS)
	presencePayload	= [caps]
	client.send(xmpp.Presence(payload=presencePayload));
		
	client.RegisterHandler('message', onMessage);
	client.RegisterHandler("iq", onIqDisco, typ="get", ns=xmpp.protocol.NS_DISCO_INFO);


	return (jid, client)


def mainLoopStep(socketlist):
	global targetForNetTraffic
	# client.Process(1)

	inputSockets = socketlist.keys()
	outputSockets = []
	errorSockets = []
	(inputReady, outputReady, errorOccurred) = select.select(inputSockets, outputSockets, errorSockets, 1)
	for each in inputReady:
		if socketlist[each] == 'xmpp':
			client.Process(1)
		elif socketlist[each] == 'stdio':
			msg = sys.stdin.readline().rstrip('\r\n')
			tokens = msg.split(' ')
			if len(tokens) == 0 or tokens[0] == '':
				continue
			if tokens[0] == 'help':
				print ' * help - shows this help'
				print ' * invite <jid> - invites the jid'
			elif tokens[0] == 'invite':
				if len(tokens) != 2:
					print "syntax: invite <jid>"
					continue
				print "Inviting " + tokens[1]
				
				targetForNetTraffic = tokens[1]
				invitation = xmpp.Node("invitation")
				invitation.setNamespace("http://xmpptuntap.vucica.net/protocol/")
				
				message = xmpp.Message(targetForNetTraffic, payload = [invitation])
				message.setType("headline")
				client.send(message)
			else:
				print "Unknown command " + tokens[0]
			# bot.stdio_message(msg)

		elif socketlist[each] == 'tuntap':
			dataNode = xmpp.Node("data")
			dataNode.setNamespace("http://xmpptuntap.vucica.net/protocol/")
			
			# TODO explore if we can get exact number of bytes to read using something like:
			#fcntl.ioctl(each, fcntl.FIONREAD...)
			try:
				output = os.read(tuntapFD, 8192)

				if targetForNetTraffic != None and targetForNetTraffic != "":
					output = struct.pack('!H', len(output)) + output # network byte order short is "tapper"'s header
					dataNode.setData(base64.encodestring(output))
					message = xmpp.Message(targetForNetTraffic, payload = [dataNode])
					message.setType("headline")
					client.send(message)
				else:
					print "Dropping " + str(len(output)) + " bytes of network device traffic; no JID set as target"
			except (OSError, IOError), ioe:
				if ioe.args[0] in (errno.EAGAIN, errno.EINTR):
					continue
				else:
					print "tun/tap device went down"
					onDown()
					
					raise Exception("tun/tap device went down")

		else:
			onDown()
			raise Exception("Unknown socket type: %s" % repr(socketlist[each]))


def main():
	global tuntapFD, tuntapDevice, ipAddress, jid, client

	# set up tuntap
	(tuntapFD, tuntapDevice, ipAddress) = setupTUNTAP()

	# connect to xmpp
	(jid, client) = setupXMPP()

	socketlist = {
		client.Connection._sock:'xmpp',
		sys.stdin:'stdio',
		tuntapFD: 'tuntap'
	}

	while True:
		try: mainLoopStep(socketlist)
		except KeyboardInterrupt:
			# finish whatever needed
			onDown()
			break


main()
