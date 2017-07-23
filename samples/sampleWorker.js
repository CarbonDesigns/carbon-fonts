var path = require("path");
var fs = require("fs");
var spawn = require('child_process').spawn;

var imagemin = require('imagemin');
var imageminOptipng = require('imagemin-optipng');

module.exports = function(port, dir, options, callback){
    var metadataString = fs.readFileSync(path.join(dir, 'metadata.json'), 'utf-8');
    var metadata = JSON.parse(metadataString);

    var font = metadata.fonts.filter(x => x.style === "normal" && x.weight === 400)[0];
    if (!font && metadata.fonts.length){
        font = metadata.fonts[0]
    }
    if (!font){
        console.error("Font ", metadata.name, " does not have normal 400 fontface");
        return;
    }

    var relativeFontPath = path.join(path.relative(".", dir), font.filename);
    relativeFontPath = relativeFontPath.replace(/\\/g, "/");
    var url = "http://localhost:" + port + "/samples/index.html?"
        + "url=" + encodeURIComponent("/" + relativeFontPath)
        + "&family=" + encodeURIComponent(font.name)
        + "&style=" + encodeURIComponent("normal")
        + "&weight=" + encodeURIComponent("400");

    var executable = "node_modules/phantomjs-prebuilt/lib/phantom/bin/phantomjs";
    var args = ["samples/renderer.js", url, dir, "sample.png", "err"];
    var cmd = spawn(executable, args, {stdio: 'inherit'});
    if (options.verbose){
        console.log(executable, args.join(' '));
    }
    cmd.on("close", function(){
        callback();
    });
};