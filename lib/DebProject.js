// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Config = null;
var Console = null;
var Downloader = null;
var Shell = require ("shelljs");
var Path = require ('path');
var SDK = require ('./DebSDK');

function DebPlatform(PlatformBase, baseData) {
    /**
     * Interface for project implementations.
     * @constructor
     * @protected
     */
    function DebProject(PlatformBase, baseData) {
        PlatformBase.call(this, baseData);
        Console = console;
    }

    DebProject.prototype = PlatformBase.prototype;

    DebProject.prototype.CreateDirectory = function () {
        Shell.mkdir('-p', this.pkgPath);
    };

    DebProject.prototype.CheckCmdExists = function (cmd) {
        var path = Shell.which(cmd);
        return path && Shell.test('-f', path);
    }

    /**
     * Generate project template.
     * @function generate
     * @param {String} packageId Package name in com.example.Foo format.
     * @param {Function} callback see {@link Project~projectOperationCb}.
     * @abstract
     * @memberOf Project
     */
    DebProject.prototype.create =
        function(packageId, args, callback) {

            // TODO implement generation of project.
            Console.log("DebProject: Generating " + this.packageId);

            var template_dir = Path.join(__dirname, '..', 'data', 'deb_template');
            var parts = this.packageId.split('.');
            if (parts.length < 3) {
                callback("Name needs to consist of 3+ elements.");
                return;
            }

            var project_name = parts[parts.length - 1];
            var project_dir = this.platformPath;

            if (project_name == "" || project_name == null) {
                callback("Please provide the project name.");
                return;
            }

            if (project_name.length < 2) {
                callback("The project name (" + project_name + ") is too short (must at least 2 charactors)");
                return;
            }

            if (this.CheckCmdExists(project_name)) {
                callback("System already has a command named '" + project_name + "', please use another name.");
                return;
            }

            if (Shell.test('-d', project_dir)) {
                callback("The project has been already existed: " + project_dir);
                return;
            }

            if (!Shell.test('-d', template_dir)) {
                callback("Can not find project template files: " + template_dir);
                return;
            }
            this.CreateDirectory();
            Shell.cp('-Rf', template_dir, this.prjPath);
            Shell.mv(Path.join(this.prjPath, 'deb_template'), project_dir);
            Shell.pushd(project_dir);
            Shell.ls (".").filter (function (file) {
                if (file.match(/desktop/)) {
                    Shell.sed('-i', /template/gi, project_name, file);
                }
                var new_file = file.replace (/template/gi, project_name);
                if (file != new_file)
                    Shell.mv ('-f', file, new_file);
            });
            var debian_dir = 'debian';
            Shell.find (debian_dir).filter (function (file) {
                if (Shell.test ('-f', file)) {
                    Shell.sed ('-i', /template/gi, project_name, file);
                    Shell.mv('-f', file, file.replace (/template/gi, project_name));
                }
            });

            Shell.popd();

	    // Prepare app template files
            Shell.mv('-f', Path.join(project_dir, 'www', 'icon-48.png'), this.appPath);
            Shell.mv('-f', Path.join(project_dir, 'www', 'icon.png'), this.appPath);
            Shell.mv('-f', Path.join(project_dir, 'www', 'index.html'), this.appPath);

	    // Prepare app template manifest (icons)
	    var manifestPath = Path.join(this.appPath, "manifest.json");
	    var manifest = require(manifestPath);
	    manifest.icons = [{
		    "src": "icon.png",
		    "sizes": "144x144",
		    "type": "image/png",
		    "density": "1.0"
		},{
		    "src": "icon-48.png",
		    "sizes": "48x48",
		    "type": "image/png",
		    "density": "1.0"
	    }];
	    manifest.start_url = "./index.html";
	    var buffer = JSON.stringify(manifest);
	    buffer.to(manifestPath);

            // Null means success, error string means failure.
            callback(null);
        };

    DebProject.prototype.update =
        function(callback) {

            // TODO implement updating of project to new Crosswalk version.
            // This function is not supported yet.
            Console.log("DebProject: Updating project has not implemented.");

            // Null means success, error string means failure.
            callback(null);
        };

    DebProject.prototype.refresh =
        function(callback) {

            // TODO implement updating of project to new Crosswalk version.
            // Maybe this function will be not needed, and removed in the future.
            Console.log("DebProject: Refreshing project has not implemented.");

            // Null means success, error string means failure.
            callback(null);
        };

    /**
     * Build application package.
     * @function build
     * @param {String[]} abi Array of ABIs, supported i386, X86_64.
     * @param {Boolean} release Whether to build debug or release package.
     * @param {Function} callback see {@link Project~projectOperationCb}.
     * @abstract
     * @memberOf Project
     */
    DebProject.prototype.build =
        function(configId, args, callback) {

            // TODO implement updating of project to new Crosswalk version.
            Console.log("DebProject: Building project");

            var Fs = require ('fs');

            var project_dir = this.platformPath;
            var parts = this.packageId.split('.');
            var project_name = parts[parts.length-1];

            if (project_name == "" || project_name == null) {
                console.log("Please provide the project name.");
                return;
            }

            Console.log('Start to update the web resources.');
            if (Shell.test('-d', Path.join(project_dir, 'www'))) {
                Shell.rm('-rf', Path.join(project_dir, 'www'));
            }

            Shell.cp('-Rf', this.appPath, project_dir);
            Shell.mv('-f', Path.join(project_dir, 'app'), Path.join(project_dir, 'www'));
            
            var Manifest = require(Path.join(project_dir, 'www', 'manifest.json'));
            var options = {'path':project_dir, 'id': this.packageId};
            if( args != null)
				options.sign = typeof(args.sign) != 'undefined' ?args.sign:null;
            var sdk = new SDK(options);
            sdk.prepare(Manifest);

            // TODO: configId is a string name of the configuration to
            // build. Emulate old boolean "release" parameter here.
            // Check if correct.
            var release = configId === "release";

            // TODO there could be args added in getArgs() if not all
            // should be built.
            var abis = ["i386", "X86_64"];

            sdk.build(abis, release);
            this.exportPackage(Shell.ls(Path.join(project_dir, 'build', project_name + '*.deb'))[0]);
            // Null means success, error string means failure.
            callback(null);
        };

    return new DebProject(PlatformBase, baseData);
}

DebPlatform.getArgs = function() {
    return {
        build: {
            sign: "The sign GPG key"
        }
    };
}

module.exports = DebPlatform;
