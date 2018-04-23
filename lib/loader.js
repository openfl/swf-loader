var execSync = require ("child_process").execSync;
var fs = require ("fs");
var loaderUtils = require ("loader-utils");
var path = require ("path");
var tmp = require ("tmp");
var schemaUtils = require ("schema-utils");
var schema = require ("./options.json");

/* eslint-disable
  multiline-ternary,
*/
module.exports = function(content) {
  if (!this.emitFile) throw new Error('SWF Loader\n\nemitFile is required from module system');
  
  var options = loaderUtils.getOptions(this) || {};
  
  schemaUtils(schema, options, 'SWF Loader');
  
  var context = options.context || this.rootContext || this.options && this.options.context;
  
  var url = loaderUtils.interpolateName(this, options.name, {
    context,
    content,
    regExp: options.regExp
  });

  var outputPath = url;

  if (options.outputPath) {
    if (typeof options.outputPath === 'function') {
      outputPath = options.outputPath(url);
    } else {
      outputPath = path.posix.join(options.outputPath, url);
    }
  }

  if (options.useRelativePath) {
    var filePath = this.resourcePath;

    var issuer = options.context ? context : this._module && this._module.issuer && this._module.issuer.context;

    var relativeUrl = issuer && path.relative(issuer, filePath).split(path.sep).join('/');

    var relativePath = relativeUrl && `${path.dirname(relativeUrl)}/`;
    // eslint-disable-next-line no-bitwise
    if (~relativePath.indexOf('../')) {
      outputPath = path.posix.join(outputPath, relativePath, url);
    } else {
      outputPath = path.posix.join(relativePath, url);
    }
  }
  
  var outputPathBundle = outputPath.replace(/\.swf$/, '') + '.bundle';
  var publicPath = `__webpack_public_path__ + ${JSON.stringify(outputPathBundle)}`;

  if (options.publicPath) {
    if (typeof options.publicPath === 'function') {
      publicPath = options.publicPath(url);
    } else if (options.publicPath.endsWith('/')) {
      publicPath = options.publicPath + url;
    } else {
      publicPath = `${options.publicPath}/${url}`;
    }

    publicPath = publicPath.replace(/\.swf$/, '') + '.bundle';
    publicPath = JSON.stringify(publicPath);
  }
  
  outputPath = outputPath.replace(/\.swf$/, '') + '.bundle';

  if (options.emitFile === undefined || options.emitFile) {
    
    tmp.setGracefulCleanup ();
    var tempDirectory = tmp.dirSync ({ postfix: ".bundle" });
    
    execSync ("openfljs process " + this.resourcePath + " " + tempDirectory.name);
    
    var walkSync = function (baseDir, dir = "", filelist = []) {
      
      fs.readdirSync (baseDir).forEach (function (file) {
        
        filelist = fs.statSync (path.join (baseDir, file)).isDirectory ()
          ? walkSync (path.join (baseDir, file), path.join (dir, file), filelist)
          : filelist.concat (path.join (dir, file));
        
      });
      
      return filelist;
      
    }
    
    walkSync (tempDirectory.name).forEach (function (file) {
      
      this.emitFile (path.join (outputPath, file), fs.readFileSync (path.join (tempDirectory.name, file)));
      
    }.bind (this));
      
  }

  // TODO revert to ES2015 Module export, when new CSS Pipeline is in place
  return `module.exports = ${publicPath};`;
  
}

module.exports.raw = true;