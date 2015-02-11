// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Config = null;
var Console = null;
var Downloader = null;
var Shell = require ("shelljs");
var Path = require ('path');
var SDK = require ('./DebSDK');

/**
 * Interface for project implementations.
 * @constructor
 * @protected
 */
function DebProject(application) {
    this._application = application;
    if (typeof(application) != 'undefined' && application != null) {
        Config = typeof(application.getConfig) != 'function'?null:application.getConfig();
        Console = typeof(application.getConsole) != 'function'?console:application.getConsole();
    } else {
        Console = console;
    }
}

/**
 * Generate project template.
 * @function generate
 * @param {String} packageId Package name in com.example.Foo format.
 * @param {Function} callback see {@link Project~projectOperationCb}.
 * @abstract
 * @memberOf Project
 */
DebProject.prototype.generate =
function(packageId, callback) {

    // TODO implement generation of project.
    Console.log("DebProject: Generating " + packageId);

    var template_dir = Path.join(__dirname, '..', 'data', 'deb_template');
    var parts = packageId.split('.');
    var project_name = parts[parts.length - 1];
    var project_dir = Path.join(Shell.pwd(), packageId);

    if (project_name == "" || project_name == null) {
        callback("Please provide the project name.");
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

    Shell.cp('-Rf', template_dir, Shell.pwd());
    Shell.mv('deb_template', project_dir);
    Shell.pushd(project_dir);
    Shell.ls (".").filter (function (file) {
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
function(abis, release, callback) {

    // TODO implement updating of project to new Crosswalk version.
    Console.log("DebProject: Building project");

    var Fs = require ('fs');

    var project_dir = Shell.pwd();
    var parts = Path.basename(project_dir).split('.');
    var project_name = parts[parts.length-1];

    if (project_name == "" || project_name == null) {
        console.log("Please provide the project name.");
        return;
    }

    Console.log('Start to update the web resources.');
    
    var Manifest = require(Path.join(project_dir, 'www', 'manifest.json'));
    var sdk = new SDK({'path':project_dir});
    sdk.prepare(Manifest);
    sdk.build(abis, release);
    // Null means success, error string means failure.
    callback(null);
};

module.exports = DebProject;
