import { applyDirectoryVisitor } from "./applyVisitor";
import buffer from "vinyl-buffer";

gulp.task("samples-generate", function (cb) {
    var express = require('express');
    var app = express();
    var staticDirs = ["apache", "ofl", "ufl", "samples", "node_modules", "other"];

    for (var i = 0; i < staticDirs.length; i++) {
        var dir = staticDirs[i];
        app.use('/' + dir, express.static(dir));
    }

    var port = 8095;
    app.listen(port, function () {
        console.log('Listening...');
        makeSamples(port, cb);
    });
});

function makeSamples(port, cb) {
    var workerFarm = require('worker-farm');
    var workers = workerFarm({
        maxConcurrentWorkers: options.workers || 3,
        maxConcurrentCallsPerWorker: 1,
        //maxCallTime: 10 * 1000
    },
        require.resolve('../samples/sampleWorker'));

    applyDirectoryVisitor(dir => {
        var pngPath = path.join(dir, "sample.png");
        var errPath = path.join(dir, "err");
        var good = fs.existsSync(pngPath);
        var bad = fs.existsSync(errPath);
        var seen = good || bad;
        var process;
        if (options.force) {
            process = !bad;
        }
        else if (options.failedOnly) {
            process = bad;
        }        
        else {
            process = !seen;
        }

        if (process) {
            if (good) {
                fs.unlinkSync(pngPath);
            }
            if (bad) {
                fs.unlinkSync(errPath);
            }
            workers(port, dir, options, function (err, outp) {
                if (err) {
                    console.error("Worker error in", dir);
                    fs.writeFileSync(errPath, JSON.stringify(err), 'utf-8');
                }
            })
        }
    }).then(() => {
        workerFarm.end(workers);
        cb();
    });
}

gulp.task('samples-combine', function () {
    var spriteMap = {};
    var width = 0;
    var height = 0;
    var spritesmith = require('gulp.spritesmith');
    var spriteData = gulp.src(['./apache/**/sample.png', './ofl/**/sample.png', './other/**/sample.png'])
        .pipe(spritesmith({
            imgName: 'webFonts.png',
            cssName: 'webfonts.css',
            cssVarMap: function (sprite) {
                var dir =path.dirname(sprite.source_image);
                var metadata = JSON.parse(fs.readFileSync(path.join(dir, "metadata.json")));
                spriteMap[metadata.name] = [sprite.x, sprite.y, sprite.width, sprite.height];
                width = Math.max(width, sprite.x + sprite.width);
                height = Math.max(height, sprite.y + sprite.height);
            }
        }));
    return spriteData.img
        .pipe(buffer())
        .pipe(plugins.imagemin())
        .pipe(gulp.dest('./dist/'))
        .on("end", function () {
            generateResultFile(spriteMap, width, height);
        });
});

function generateResultFile(spriteMap, width, height) {
    var popular = require("./popularFonts");
    var webFonts = { collection: [], popular: popular, spriteFile: "webFonts.png", spriteSize: [width, height], spriteMap: spriteMap };

    applyDirectoryVisitor(dir => {
        var pngPath = path.join(dir, "sample.png");
        var processed = fs.existsSync(pngPath);
        if (processed) {
            webFonts.collection.push(generateFontMetadata(dir));            
        }
    }).then(() => {
        webFonts.collection.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
        fs.writeFileSync("./dist/webFonts.json", JSON.stringify(webFonts), 'utf-8');    
        console.log("Use https://tinypng.com/ to compress even more")
    });    
}

function generateFontMetadata(dir) {
    var metadataString = fs.readFileSync(path.join(dir, 'metadata.json'), 'utf-8');
    var metadata = JSON.parse(metadataString);

    strip(metadata, ["name", "fonts", "subsets"]);
    for (var j = 0; j < metadata.fonts.length; j++) {
        var font = metadata.fonts[j];
        strip(font, ["filename", "style", "weight"]);
    }

    metadata.path = path.relative(".", dir).replace("\\", "/");
    return metadata;
}

function strip(obj, except) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (except.indexOf(key) === -1) {
            delete obj[key];
        }
    }
}

gulp.task('samples-cleanup', function (cb) {
    var workerFarm = require('worker-farm');
    var workers = workerFarm({
        maxConcurrentWorkers: 1,
        maxConcurrentCallsPerWorker: 1
    },
        require.resolve('../samples/cleanupWorker'));

    return applyDirectoryVisitor(dir => {
        var pngPath = path.join(dir, "sample.png");
        var processed = fs.existsSync(pngPath);
        if (processed) {
            workers(dir, pngPath, options, function (err, outp) {
                if (err) {
                    console.error("Worker error in", dir);
                }
                else if (outp) {
                    console.log(outp);
                }
            })
        }
    }).then(() => {
        workerFarm.end(workers);
    });
});