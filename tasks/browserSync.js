var gulp        = require('gulp')
var browserSync = require('browser-sync').create();
var Config      = require('../config.json');

// 服务器启动
gulp.task('browserSync', function() {
    browserSync.init({
        // https: true,
        port: Config.port,
        ui: {
		    port: 3000,
		    weinre: {
		        port: 3001
		    }
		},
		// reloadOnRestart: false,
		notify: true,
		browser: "google chrome",
        open: "external",
        // open: false,
	    ghostMode: {
	        clicks: true,
	        location: true,
	        forms: true,
	        scroll: true
	    },
	    server: {
		    baseDir: Config.app,
		    open: false,
		    routes: {
		        "/bower_components": "bower_components",
		    }
		},
        reloadDebounce: 2000
    });

    gulp.watch(Config.app + '/*.html', browserSync.reload);
});

module.exports = browserSync;