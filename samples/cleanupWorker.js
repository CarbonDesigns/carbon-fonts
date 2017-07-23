var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels")

module.exports = function(dir, pngPath, options, callback){
    getPixels(pngPath, function(err, pixels) {
        if(err) {
            return callback(err);
        }

        var hasData = false;
        for (var i = 0; i < pixels.data.length; i++){
            var p = pixels.data[i];
            if (p !== 0){
                hasData = true;
                break;
            }
        }

        if (!hasData){
            fs.writeFileSync(path.join(dir, 'err'), 'PhantomJs produces empty screenshot', 'utf-8');
            fs.unlinkSync(pngPath);
            callback(null, 'File with no data ' + pngPath);
        }
        else{
            callback(null, null);
        }

    });



    // var formData = {
    //     metadata: metadataString,
    //     //my_file: fs.createReadStream(__dirname + '/unicycle.jpg'),
    //     attachments: []
    // };
    //
    // for (var i = 0; i < metadata.fonts.length; i++){
    //     var font = metadata.fonts[i];
    //     formData.attachments.push(fs.createReadStream(path.join(dir, font.filename)));
    // }
    //
    // request.post({url:'http://localhost:50150/api/fonts/uploadSystemFont', formData: formData}, function optionalCallback(err, httpResponse, body) {
    //     callback(err, metadata.name);
    // });
};