// Copyright © 2015 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var Fs = require('fs');
var Path = require('path');
var Shell = require('shelljs');

/**
 * DebSDK
 * @param {Dictionary} config the config to the project
 * @return 
 */
function DebSDK(config) {
    var project_path = Shell.pwd();
    var projectId = Path.basename(project_path);
    this._sign = null;
    if (typeof(config) != 'undefined' && config != null) {
        project_path = typeof(config.path) != 'undefined'?config.path:project_path;
        projectId = typeof(config.id) != 'undefined'?config.id:Path.basename(project_path);
        this._sign = typeof(config.sign) != 'undefined'?config.sign:null;
    }
    this._project_path = project_path;
    this._project_id = projectId;
    var parts = projectId.split('.');
    this._project_name = parts[parts.length-1];
    this._project_path = Fs.realpathSync(project_path);
    this._build_path = Path.join(this._project_path, 'build');
    if (Shell.test('-d', this._build_path)) {
        Shell.rm('-rf', this._build_path);
    }
    Shell.mkdir('-p', this._build_path);
}

DebSDK.prototype.UpgradeDeb = function (target_dir, version, manifest) {
    Shell.pushd(target_dir);
    // Upgrade version
    var c_version = Shell.exec(['dpkg-parsechangelog', '--show-field Version'].join(' '), {silent:true}).output;
    if (c_version != version) {
        Shell.exec(['dch -v', version, 'Upgrade'].join(' '));
    }
    
    // Upgrade icons setting
    var icons = manifest.icons || [];
    for (var i = 0; i < icons.length; i++) {
        var icon = icons[i];
        var add_link = [Path.join('/usr/share/xwalk', this._project_name, icon.src),
                        Path.join('/usr/share/icons/hicolor', icon.sizes, 'apps',
                                  'xwalk_' + this._project_name + Path.extname(icon.src))].join(' ') + '\n';
        add_link.toEnd(Path.join(target_dir, 'debian', this._project_name + '.links'));
    }

    // Upgrade desktop file
    var desktop_file = Path.join(target_dir, this._project_name + '.desktop');
    if (Shell.test('-f', desktop_file)) {
        Shell.sed('-i', /NAME/g, manifest.name, desktop_file);
        ([Path.join('/usr/share/xwalk', this._project_name, this._project_name + '.desktop'),
          '/usr/share/applications'].join(' ') + '\n')
            .toEnd(Path.join(target_dir, 'debian', this._project_name + '.links'));
    }
    
    Shell.popd();
};

/**
 * prepare
 * @param {Dictionary} manifest The manifest information.
 * @return 
 */
DebSDK.prototype.prepare = function(manifest) {
    var version = manifest.xwalk_version || manifest.version || '0.0.1';
    var target_name = this._project_name + '_' + version + '-1';
    var tar_name = this._project_name + '_' + version + '.orig.tar.gz';
    var target_path = Path.join(this._build_path, target_name);
    this._target_path = target_path;
    Shell.mkdir('-p', target_path);
    Shell.cp('-Rf', Path.join(this._project_path, 'www'), target_path);
    Shell.cp(Path.join(this._project_path, this._project_name), target_path);
    Shell.cp('-Rf', Path.join(this._project_path, 'debian'), target_path);
    Shell.cp(Path.join(this._project_path, this._project_name + '.desktop'), target_path);
    this.UpgradeDeb(target_path, version + '-1', manifest);
    Shell.pushd(this._build_path);
    Shell.exec(['tar zcf', tar_name, target_name].join(' '));
    Shell.popd();
};

/**
 * getBuildCmd
 * @param {Array} archs the array of target archs to build, like ['i386', 'x86_64'].
 * @param {Boolean} release The build configuration, if it's 'true', means 'Release', 'Debug' for otherwise.
 * @return the build command string
 */
DebSDK.prototype.getBuildCmd = function(archs, release) {
    if (typeof(this._target_path) == 'undefined') {
        console.log('Please run prepare first!');
        return '';
    }
    var cmd = 'cd ' + this._target_path + '; debuild ';
    if (this._sign != null) {
        cmd += '-k'+this._sign;
    } else {
        cmd += '-us -uc';
    }
    return cmd;
};

/**
 * build
 * @param {Array} archs ARCHS to build for.
 * @param {Boolean} release The release version.
 * @return {Boolean} If the command get success.
 */
DebSDK.prototype.build = function(archs, release) {
    return Shell.exec(this.getBuildCmd(archs, release));
};

/**
 * cmd
 * @param {Array} archs ARCHS to build for.
 * @param {Boolean} release The release version.
 */
DebSDK.prototype.cmd = function(archs, release) {
    console.log(this.getBuildCmd(archs, release));
};

module.exports = DebSDK;
