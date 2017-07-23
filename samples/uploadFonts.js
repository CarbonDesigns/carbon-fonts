var argv = require("yargs").argv;
var path = require("path");
var glob = require("glob");
var folder = path.resolve(argv.folder);

var files = glob.sync(path.join(folder, "**/*@(.ttf|.png)"), {nodir: true})
    .map(function(x){
        return {base: folder, path: x};
    });                              

require("./deployAzureCdn")(
    {
        serviceOptions: [argv.account, argv.key],
        containerName: "fonts",
        folder: path.relative(path.dirname(folder), folder),
        zip: true
    },
    files,
    console.log,
    function(e){
        if (e) throw e;
    });