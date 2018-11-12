# meraki-auto-access

Tool to manage and dynamically configure endpoint connectivity policies for Meraki networks


## Business/Technical Challenge

A large portion of total network spend is on the operational challenges of installing, configuring, and managing the network.  Traditionally when rolling out a new network, each switch port needs to be configured for the end device that will be connected, before the device can be operational on the network.  This requires significant effort to inventory the needed devices and counts, configure the switch ports for those devices, and then coordinate with the installers (developing cut sheets) to make sure devices are plugged in to the correct ports.  This can also be error prone and a security risk if devices aren't plugged into the correct port.

This project aims to address this need by enabling for the switch to automatically configure the switchport for a needed device, based on policy determined by an administrator.  In this model, the network administrator simply defines the needed port configuration templates, and what device types should get that port configuration.  Now when a device is attached to the network, the policy will be consulted, and the correct port-template configuration will be applied.  Making the configuration and installation plug-n-play.

This also addresses additional use cases such as moves, adds, and changes.  Anytime a new device is added to the network, or a device is moved, no human intervention is needed to enable the device to work.  If a policy is not matched, we can apply a default port-template in order to quarentine the device or place it in a default VLAN.

## Proposed Solution

Meraki Auto-Access (MAA) will use the webhooks feature which has recently been added to the Meraki cloud platform.  MAA will receive incoming webhooks form the Meraki cloud to auto configure switchports.  The service will consist primarily of a nodejs server for the API and webhook reception, as well as python to configure the ports with exisiting Meraki libraries.  Future iterations could also extend this functionality to automatically configure access points as they come online.

The solution will have two fundamental building blocks:
+ **Port profiles** will be a descriptive name for a port configuration including (vlans, poe, spanning tree, trunk/access etc).  
+ **MAA rules** will map CDP/LLDP/MAC attributes to a port profile.  

Any time a new device comes online, MAA will consult the rules the user has defined and automatically configure the switchport.  Integration with Webex teams will allow for alerting to a team-monitored space for exceptions and notifications.

![alt text](https://github.com/mattchilders/meraki-auto-access/blob/master/web/gui/maa-overview.png "Meraki Auto-Access Overview")


### Cisco Products Technologies/ Services
Our solution will levegerage the following Cisco technologies

+ Meraki Dashboard API
+ Webex Teams


## Team Members

+ Matt Childers <machilde@cisco.com> - Global Enterprise Segment
+ Tim Wilhoit <tiwilhoi@cisco.com> - Global Enterprise Segment


## Solution Components


<!-- This does not need to be completed during the initial submission phase  

Provide a brief overview of the components involved with this project. e.g Python /  -->


## Usage

<!-- This does not need to be completed during the initial submission phase  

Provide a brief overview of how to use the solution  -->



## Installation

How to install or setup the project for use.


## Documentation

Pointer to reference documentation for this project.


## License

Provided under Cisco Sample Code License, for details see [LICENSE](./LICENSE.md)

## Code of Conduct

Our code of conduct is available [here](./CODE_OF_CONDUCT.md)

## Contributing

See our contributing guidelines [here](./CONTRIBUTING.md)
