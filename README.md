# meraki-auto-access

Tool to manage and dynamically configure endpoint connectivity policies for Meraki networks


## Business/Technical Challenge

A large portion of total network spend is on the operational challenges of installing, configuring, and managing the network.  Traditionally when rolling out a new network, each switch port needs to be configured for the end device that will be connected, before the device can be operational on the network.  This requires significant effort to inventory the needed devices and counts, configure the switch ports for those devices, and then coordinate with the installers (developing cut sheets) to make sure devices are plugged in to the correct ports.  This can also be error prone and a security risk if devices aren't plugged into the correct port.

This project aims to address this need by enabling for the switch to automatically configure the switchport for a needed device, based on policy determined by an administrator.  In this model, the network administrator simply defines the needed port configuration templates, and what device types should get that port configuration.  Now when a device is attached to the network, the policy will be consulted, and the correct port-template configuration will be applied.  Making the configuration and installation plug-n-play.

This also addresses additional use cases such as moves, adds, and changes.  Anytime a new device is added to the network, or a device is moved, no human intervention is needed to enable the device to work.  If a policy is not matched, we can apply a default port-template in order to quarentine the device or place it in a default VLAN.

## Proposed Solution


**TODO:** 1-3 paragraphs of the solution in written format


### Cisco Products Technologies/ Services

**TODO:** List out major technologies included in the solution (ACI, DNAC, third party, etc) e.g

Our solution will levegerage the following Cisco technologies

* [Application Centric Infrastructure (ACI)](http://cisco.com/go/aci)
* [DNA Center (DNA-C)](http://cisco.com/go/dna)

## Team Members


**TODO:** ASIC projects must consist of a minimum of 2 SE’s
representing a minimum of 2 segments. List names here

* team member1 <email> - Segment Name
* team member2 <email> - Segment Name


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
