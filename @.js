module.exports = function stub(mod, fn, files) {
    mod.exports = fn;
    files = files || [];
    var fs = require("fs"),
        path = require("path"),
        dirname = path.dirname(mod.filename),
        pkg = path.basename(dirname),
        dist = path.join(dirname, 'dist');
    if (process.argv.indexOf('--build') > 0 || process.argv.indexOf('--demo') > 0) {
        fs.mkdir(dist, function() {
            var src = mod.exports.toString();
            src = src.substring(src.indexOf('{') + 1, src.length - 1);
            fs.writeFile(path.join(dist, pkg + '.js'), src, function() {

                function copyFiles(cb) {
                    var file = files.shift();
                    if (file) {
                        fs.copyFile(
                        path.join(dirname, file),
                        path.join(dist, file),

                        function(err) {
                            if (err) return cb(err);
                            copyFiles(cb);
                        });
                    } else {
                        cb();
                    }
                }

                fs.readFile(path.join(dirname, 'index.html'), 'utf8',

                function(err, html) {
                    fs.writeFile(
                    path.join(dist, 'index.html'),

                    html.split('${package}').join(pkg)
                        .split('${injected}').join(src),

                    function() {

                        copyFiles(function() {
                            if (process.argv.indexOf('--demo') > 0) {
                                var
                                express,
                                start_browser,
                                favicon;

                                try {
                                    start_browser = require("get-localhost-hostname/start-browser.js");
                                    favicon = require('serve-favicon');
                                    express = require('express');

                                } catch (e) {
                                    if (e.message.indexOf("Cannot find module") < 0) throw e;

                                    console.log("installing demo mode packages via npm...");
                                    require("child_process").spawnSync('npm', [
                                        "install",
                                        "express",
                                        "github:jonathan-annett/get-localhost-hostname#4a1d263e52e06709c40e52a5f4281f451ad6f1b4",
                                        "github:jonathan-annett/serve-favicon#612c1a1b6301dc4ab0512bd467a8239e81a2af04"]);
                                    start_browser = require("get-localhost-hostname/start-browser.js");
                                    favicon = require('serve-favicon');
                                    express = require('express');
                                }

                                var app = express();
                                app.use('/', express.static(dist));
                                app.use(favicon());
                                start_browser(app, undefined, "/");

                            } else {
                                console.log("built to", pkg + '.js', 'in', dist);
                            }
                        });

                    });
                });
            });
        });
    } else {
        fn(mod.exports);
    }
};