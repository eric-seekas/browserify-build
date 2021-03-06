'use strict';
var config       = require(global.configPath).browserify;
var gulp         = require('gulp');
var gulpif       = require('gulp-if');
var gutil        = require('gulp-util');
var source       = require('vinyl-source-stream');
var sourcemaps   = require('gulp-sourcemaps');
var buffer       = require('vinyl-buffer');
var streamify    = require('gulp-streamify');
var watchify     = require('watchify');
var browserify   = require('browserify');
var babelify     = require('babelify');
var uglify       = require('gulp-uglify');
var handleErrors = require('./util/handlerError');
var browserSync  = require('./browserSync');
var stringify    = require('stringify');
var sassify      = require('sassify');
var ngAnnotate   = require('browserify-ngannotate');
var path         = require('path');


function buildScript(fileConfig) {

  var bundler = browserify({
    entries: fileConfig.entries,
    debug: true,
    cache: {},
    packageCache: {},
    fullPaths: !global.isProd
  });

  if (!global.isProd) {

    bundler = watchify(bundler);
    bundler.on('update', function() {
      rebundle();
    });
     bundler.on('log', gutil.log);
  }

  var transforms = [
    babelify.configure({
        ignore: /(bower_components)|(node_modules)/,
        stage: 0,
        optional: ["runtime"]
    }),
    sassify,
    stringify,
    ngAnnotate,
    'brfs',
    'bulkify',
    ["reactify", {"es6": true}]
  ];

  transforms.forEach(function(transform) {
    bundler.transform(transform);
  });

  function rebundle() {
    var stream          = bundler.bundle();
    var createSourcemap = global.isProd && config.prodSourcemap;

    return stream.on('error', handleErrors)
      .pipe(source(fileConfig.outputName))
      .pipe(gulpif(createSourcemap, buffer()))
      .pipe(gulpif(createSourcemap, sourcemaps.init({loadMaps: true})))
      .pipe(gulpif(global.isProd, streamify(uglify({
          compress: { drop_console: config.dropConsole }
      }))))
      .pipe(gulpif(createSourcemap, sourcemaps.write('./')))
      .pipe(gulp.dest(global.isProd ? fileConfig.build : fileConfig.dest))
      .pipe(browserSync.stream({ once: true }));
  }

  return rebundle();

}

gulp.task('browserify', function() {

    config.bundleConfigs.map(function (item) {
        item.entries = path.join(global.PWD, item.entries);
        item.dest    = path.join(global.PWD, item.dest);
        item.build   = path.join(global.PWD, item.build);
        return item;
    }).forEach(buildScript);

});
