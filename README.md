Crosswalk-app-tools-deb
===================

The deb support backend for command line tools to create and package Crosswalk applications. The license for this project is Apache License
Version 2.0, please refer to the LICENSE-APACHE-V2 included with the package.

Crosswalk-app-tools is in very early stages of development, and not suitable for use in a production environment. "Releases" and announcements are made available as a technology preview only. No packages are being published at this time, but git tags serve as reference points for release milestones.

### Preparation

Ubuntu 14.04 and Debian testing are the only tested platform. Node.js, the debuild tool, the Crosswalk runtime, and git must be functional.

1. Download Crosswalk app tools: `git clone https://github.com/crosswalk-project/crosswalk-app-tools.git`
2. Initialize the Crosswalk app tools: `cd crosswalk-app-tools`, then `npm install`
3. Checkout the deb backend: `cd node_modules`, then `git clone https://github.com/crosswalk-project/crosswalk-app-tools-deb.git crosswalk-app-tools-backend-deb`
2. Install dependencies: `cd crosswalk-app-tools-backend-deb`, then `npm install`, and `cd ../..`
3. The main script is `crosswalk-app-tools/src/crosswalk-app`. Set environment PATH or invoke with directory.

### Usage

`crosswalk-app create com.example.foo`: set up a skeleton project in directory com.example.foo/. It will import Crosswalk template, and put a sample "hello world" web app under com.example.foo/app/.

Then, you can put your web application resources in com.example.foo/app.

`cd com.example.foo`: move to the project root.

`crosswalk-app build`: build the web app, The package Foo-version.deb will end up under pkg/.

That's all for now.

### Notice

This is a very simple package tool prototype for Linux Crosswalk, and is planning to merge into [Crosswalk App tools](https://github.com/crosswalk-project/crosswalk-app-tools.git).
