import {applyDirectoryVisitor} from "./applyVisitor";

gulp.task('metadata-create', function(cb){
    var ProtoBuf = require("protobufjs");
    var builder = ProtoBuf.loadProtoFile(path.join(__dirname, "../tools/fonts_public.proto"));
    var Fonts = builder.build("google.fonts");
    var spawn = require('child_process').spawn;

    applyDirectoryVisitor(dir => {
        var pbFile = fs.readFileSync(path.join(dir, 'METADATA.pb'));
        var args = [
            "--encode=google.fonts.FamilyProto",
            "tools/fonts_public.proto"];
        var protoc = spawn(path.join(__dirname, '../tools/protoc.exe'), args, {cwd: path.join(__dirname, '..')});

        protoc.stdout.on('data', (data) => {
            var family = Fonts.FamilyProto.decode(data);
            var jsonFile = path.join(dir, "metadata.json");
            console.log("Writing ", jsonFile);
            fs.writeFileSync(jsonFile, JSON.stringify(family, null, '\t'), 'utf-8');
        });

        protoc.stderr.on('data', (data) => {
            cb(data);
        });

        protoc.on('exit', (code) => {
            if (code){
                console.log(`Child exited with code ${code}`);
            }
        });

        protoc.stdin.write(pbFile);
        protoc.stdin.end();
    }).then(() => cb());
});

gulp.task('metadata-updateStyle', function(cb){        
    applyDirectoryVisitor(dir => {
        var jsonFile = fs.readFileSync(path.join(dir, 'metadata.json'));        
        var metadata = JSON.parse(jsonFile);

        for (var i = 0; i < metadata.fonts.length; ++i){
            var font = metadata.fonts[i];
            if (font.style === "normal"){
                font.style = 1;
            }
            else if (font.style === "italic"){
                font.style = 2;
            }
            else{
                console.log('Unexpected style', font.style, 'in dir', dir);
            }
        }

        fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify(metadata, null, '\t'), 'utf-8');
    }).then(() => cb());
});