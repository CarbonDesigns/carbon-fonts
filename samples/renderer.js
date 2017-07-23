var fs = require('fs');
var system = require('system');
var page = require('webpage').create();

var url = system.args[1];
var dir = system.args[2];
var pngFile = system.args[3];
var errFile = system.args[4];

page.onConsoleMessage = function(msg) {
    console.log(msg);
};
page.onError = function (msg, trace) {
    console.error(msg);
    // trace.forEach(function(item) {
    //     console.log('  ', item.file, ':', item.line);
    // });
    var errPath = dir + fs.separator + errFile;
    fs.write(errPath, msg, 'w');
    phantom.exit();
};
page.onCallback = function(e){
    savePng(e);
    phantom.exit();
};
page.open(url, function(status){
    //console.log("Opened page: " + status);
});

page.viewportSize = {
    width: 1000,
    height: 200
};

function savePng(e){
    var pngPath = dir + fs.separator + pngFile;
    console.log('Writing ' + pngPath);
    page.clipRect = { top: e.top, left: e.left, width: e.width, height: e.height };
    page.render(pngPath);
    phantom.exit();
}
