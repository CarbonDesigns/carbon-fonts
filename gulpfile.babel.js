var gulp = require('gulp');
var argv = require('yargs').argv;
var Promise = require("bluebird");
var options = {};

Object.assign(options, argv);

global.gulp = gulp;
global.plugins = require('gulp-load-plugins')();
global.path = require('path');
global.fs = require('fs');
global.options = options;
global.Promise = Promise;

Promise.promisifyAll(global.fs);
Promise.promisifyAll(global.path);

var requireDir = require('require-dir');
requireDir('./tasks');