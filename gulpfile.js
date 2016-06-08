'use strict';

var gulp                = require('gulp'),
    autoPrefixer        = require('autoprefixer-stylus'),
    concat              = require('gulp-concat'),
    cssBeautify         = require('gulp-cssbeautify'),
    cssComb             = require('gulp-csscomb'),
    csso                = require('gulp-csso'),
    browserSync         = require('browser-sync').create(),
    buffer              = require('vinyl-buffer'),
    combineMQ           = require('gulp-combine-mq'),
    htmlPrettify        = require('gulp-html-prettify'),
    jade                = require('gulp-jade'),
    notify              = require('gulp-notify'),
    plumber             = require('gulp-plumber'),
    rename              = require('gulp-rename'),
    rev                 = require('gulp-rev-append'),
    rigger              = require('gulp-rigger'),
    rimraf              = require('rimraf'),
    runSequence         = require('run-sequence'),
    spriteSmith         = require('gulp.spritesmith'),
    stripCssComments    = require('gulp-strip-css-comments'),
    stylus              = require('gulp-stylus'),
    uglify              = require('gulp-uglify'),
    urlAdjuster         = require('gulp-css-url-adjuster'),
    watch               = require('gulp-watch');

// Plugins options
var options = {
    browserSync: {
        server: {
            baseDir: "dist/"
        },
        tunnel: false,
        host: 'localhost',
        port: 9000
    },
    plumber: {
        errorHandler: notify.onError("Error: <%= error.message %>")
    },
    stylus: {
        'include css': true,
        use: [
            autoPrefixer({
                cascade: false
            })
        ]
    },
    cssBeautify: {
        indent: '\t',
        autosemicolon: true
    },
    htmlPrettify: {
        indent_char: ' ',
        indent_size: 4
    },
    spriteSmith: {
        retinaSrcFilter: '**/*@2x.png',
        retinaImgName: 'sprite@2x.png',
        retinaImgPath: 'img/sprite@2x.png',
        imgName: 'sprite.png',
        imgPath: 'img/sprite.png',
        cssName: 'sprite.styl',
        algorithm: 'binary-tree',
        padding: 10,
        cssTemplate: 'src/styles/templates/sprite-template.mustache'
    },
};


gulp.task('browser-sync', function() {
    return browserSync.init(options.browserSync);
});

// CLEAN Folders

gulp.task('clean:dist', function (cb) {
    rimraf("./dist", cb);
});
gulp.task('clean:tmp', function (cb) {
    rimraf("./scr/tmp", cb);
});
gulp.task('clean', ['clean:dist', 'clean:tmp']);


// JADE, HTML PAGES

gulp.task('pages', function(){
    return gulp.src("src/pages/*.jade")
        .pipe(plumber(options.plumber))
        .pipe(jade({pretty: true}))
        .pipe(htmlPrettify(options.htmlPrettify))
        .pipe(gulp.dest("dist/"))
});

gulp.task('rev', function() {
  gulp.src("dist/*.html")
    .pipe(rev())
    .pipe(gulp.dest("dist"))
});

gulp.task('html', function (cb) {
    return runSequence('pages', 'rev', cb);
});


// STYLUS, CSS STYLES

gulp.task('style', function(){
    return gulp.src("src/styles/style.styl")
        .pipe(plumber(options.plumber))
        .pipe(stylus(options.stylus))
        .pipe(urlAdjuster({prepend: '../'}))
        .pipe(combineMQ({beautify: false}))
        .pipe(cssBeautify(options.cssBeautify))
        .pipe(cssComb())
        .pipe(gulp.dest("dist/assets/css/"))
        .pipe(stripCssComments({preserve:false}))
        .pipe(csso())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest("dist/assets/css/"))
});

// FIRST SCREEN Styles

gulp.task('style:fs', function(){
    return gulp.src("src/styles/first-screen.styl")
        .pipe(plumber(options.plumber))
        .pipe(stylus(options.stylus))
        .pipe(urlAdjuster({prepend: '../'}))
        .pipe(combineMQ({beautify: false}))
        .pipe(cssBeautify(options.cssBeautify))
        .pipe(cssComb())
        .pipe(gulp.dest("src/tmp/"))
        .pipe(stripCssComments({preserve:false}))
        .pipe(csso())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest("src/tmp/"))
});

gulp.task('fonts:fs', function(){
    return gulp.src("src/styles/inc/fonts.styl")
        .pipe(plumber(options.plumber))
        .pipe(stylus(options.stylus))
        .pipe(urlAdjuster({prepend: 'assets/'}))
        .pipe(combineMQ({beautify: false}))
        .pipe(cssBeautify(options.cssBeautify))
        .pipe(cssComb())
        .pipe(rename('fonts.css'))
        .pipe(gulp.dest("dist/assets/css/"))
        .pipe(stripCssComments({preserve:false}))
        .pipe(csso())
        .pipe(rename('fonts.min.css'))
        .pipe(gulp.dest("dist/assets/css/"))
});

gulp.task('html:fs', function (cb) {
    return runSequence(['style:fs', "fonts:fs"], 'pages', 'rev', cb);
});


// JAVASCRIPT

gulp.task('js:app', function () {
    return gulp.src(['src/js/common.js','src/blocks/**/*.js'])
        .pipe(plumber(options.plumber))
        .pipe(concat('app.js'))
        .pipe(gulp.dest("dist/assets/js/"))
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest("dist/assets/js/"))
});

gulp.task('js:plugins', function () {
    return gulp.src("src/js/plugins.js")
        .pipe(plumber(options.plumber))
        .pipe(rigger())
        .pipe(rename('plugins.js'))
        .pipe(gulp.dest("dist/assets/js/"))
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest("dist/assets/js/"))
});

gulp.task('js:jquery', function() {
    return gulp.src("src/libs/jquery/jquery*.min.js")
        .pipe(plumber(options.plumber))
        .pipe(gulp.dest("dist/assets/js/"))
});

gulp.task('js', ['js:jquery','js:plugins','js:app']);

// IMAGES, PNG SPRITE, Favicons

gulp.task('img', function () {
    return gulp.src("src/img/**/{*,!_*}.{jpg,gif,svg,png}")
        .pipe(plumber(options.plumber))
        .pipe(gulp.dest("dist/assets/img/"))
});

gulp.task('favicons', function() {
    return gulp.src("src/favicons/{*,!_*}.*")
        .pipe(plumber(options.plumber))
        .pipe(gulp.dest("dist/assets/img/favicons/"))
});

gulp.task('sprite', function (cb) {
    var spriteData = gulp.src("src/sprite/**/*.png")
        .pipe(spriteSmith(options.spriteSmith));

    spriteData.img
        .pipe(buffer())
        .pipe(rename({prefix: '_'}))
        .pipe(gulp.dest("src/img/"));

    spriteData.css
        .pipe(buffer())
        .pipe(gulp.dest("src/styles/inc/"));

    return spriteData.img
        .pipe(buffer())
});


// OTHER TASKS

gulp.task('fonts', function() {
    return gulp.src("src/fonts/**/*.*")
        .pipe(plumber(options.plumber))
        .pipe(gulp.dest("dist/assets/fonts/"))
});

gulp.task('php', function() {
    return gulp.src("src/php/*.php")
        .pipe(plumber(options.plumber))
        .pipe(gulp.dest("dist/assets/"))
});


// WATCH for live reload

gulp.task('watch', function (cb) {
    global.isWatching = true;

    watch(["src/pages/**/*.{jade,html}", "src/blocks/**/*.jade"], function(event, cb) {
        runSequence('html', browserSync.reload);
        notify("HTML").write('');
    });

    watch(["src/styles/style.styl", "src/styles/inc/*.styl", "src/blocks/**/*.styl"], function(event, cb) {
        runSequence('style', browserSync.reload)
        notify("Main Styles").write('');
    });

    watch(["src/js/common.js", "src/js/inc/*.js", "src/blocks/**/*.js"], function(event, cb) {
        runSequence('js:app', browserSync.reload);
        notify("JS Application").write('');
    });

    watch(["src/js/plugins.js"], function(event, cb) {
        runSequence('js:plugins', browserSync.reload);
        notify("JS Plugins").write('');
    });

    watch("src/img/*.*", function(event, cb) {
        runSequence('img', browserSync.reload);
        notify("Images").write('');
    });

    // watch("src/favicons/*.*", function(event, cb) {
    //     runSequence('favicons', browserSync.reload);
    //     notify("Favicons").write('');
    // });

    // watch("src/sprite/*.png", function(event, cb) {
    //     runSequence('sprite', browserSync.reload);
    //     notify("PNG-sprite").write('');
    // });

    watch("src/fonts/**/*.*", function(event, cb) {
        runSequence('fonts', browserSync.reload);
        notify("Fonts").write('');
    });

    watch("src/php/*.php", function(event, cb) {
        runSequence('php', browserSync.reload);
        notify("PHP").write('');
    });

    // First Screen styles
    watch("src/styles/first-screen.styl", function(event, cb) {
        runSequence('html:fs', browserSync.reload);
        notify("First Screen Styles and HTML").write('');
    });

    watch("src/styles/inc/fonts.styl", function(event, cb) {
        runSequence('fonts:fs', browserSync.reload);
        notify("First Screen Fonts").write('');
    });

});

// Build and Development mode

gulp.task('build', function (cb) {
    return runSequence(
        'clean',
        ['sprite', 'img', 'favicons', 'fonts', 'php', 'js'],
        ['style'],
        'html:fs', cb);
});

gulp.task('default', function (cb) {
    return runSequence('build', ['browser-sync', 'watch'], cb);
});
