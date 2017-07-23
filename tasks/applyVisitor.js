var once = false;
var called = false;

export function applyDirectoryVisitor(visitor){
    var queue = [path.resolve(".")];
    if (options.dir){
        analyzeDir(options.dir, visitor);
        return Promise.resolve();
    }
    return process(queue, dir => {
        return getDirectories(dir)
            .then(dirs => {
                if (once && called){
                    return;
                }
                for (var i = 0; i < dirs.length; i++){
                    let d = path.join(dir, dirs[i]);
                    if (!analyzeDir(d, visitor)){
                        break;
                    }
                    queue.push(d);
                }
            });
    });
}

function analyzeDir(d, visitor){
    let metadata = path.join(d, "METADATA.pb");
    if (fs.existsSync(metadata)){
        visitor(d);
        called = true;
        if (once){
            return false;
        }
    }
    return true;
}

function process(queue, func, dfd){
    var deferred = dfd || Promise.pending();
    if (queue.length){
        func(queue.pop()).then(() => process(queue, func, deferred));
    }
    else{
        dfd.resolve();
    }
    return deferred.promise;
}

function getDirectories(dir) {
    return fs.readdirAsync(dir).then(dirs => dirs.filter(x => fs.statSync(path.join(dir, x)).isDirectory()));
}