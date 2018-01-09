var execSync = require ("child_process").execSync;
var fs = require ("fs");
var loaderUtils = require ("loader-utils");
var path = require ("path");
var tmp = require ("tmp");
var validateOptions = require ("schema-utils");
var schema = require ("./options.json");


module.exports = function (content, map) {
	
	if (!this.emitFile) {
		
		throw new Error ("SWF Loader\n\nemitFile is required from module system");
		
	}
	
	this.cacheable && this.cacheable ();
	this.value = content;
	
	var options = loaderUtils.getOptions (this) || {};
	
	validateOptions (schema, options, "SWF Loader");
	
	var context = options.context || this.rootContext || this.options && this.options.context
	var url = loaderUtils.interpolateName (this, options.name, { context, content, regExp: options.regExp });
	var outputPath = "";
	
	if (options.outputPath) {
		
		outputPath = (typeof options.outputPath === "function" ? options.outputPath (url) : options.outputPath);
		
	}
	
	var filePath = this.resourcePath;
	
	if (options.useRelativePath) {
		
		var issuerContext = (this._module && this._module.issuer && this._module.issuer.context) || context;
		
		var relativeUrl = issuerContext && path.relative (issuerContext, filePath).split (path.sep).join ('/');
		var relativePath = relativeUrl && `${path.dirname(relativeUrl)}/`;
		
		// eslint-disable-next-line no-bitwise
		if (~relativePath.indexOf ("../")) {
			
			outputPath = path.posix.join (outputPath, relativePath, url);
			
		} else {
			
			outputPath = relativePath + url;
			
		}
		
		url = relativePath + url;
		
	} else if (options.outputPath) {
		
		outputPath = typeof options.outputPath === "function" ? options.outputPath (url) : options.outputPath + url;
		url = outputPath;
		
	} else {
		
		outputPath = url;
		
	}
	
	outputPath = path.basename (outputPath, ".swf") + ".bundle";
	url = path.basename (url, ".swf") + ".bundle";
	
	var publicPath = `__webpack_public_path__ + ${JSON.stringify (url)}`;
	
	if (options.publicPath !== undefined) {
		
		publicPath = JSON.stringify (typeof options.publicPath === "function" ? options.publicPath (url) : options.publicPath + url);
		
	}
	
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
	
	return `module.exports = ${publicPath};`;
	
}

module.exports.raw = true;