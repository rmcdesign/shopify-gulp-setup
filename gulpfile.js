// Array of script for concatenation in order
var scripts = [
        './js/main.js'
    ],
    scss_source = './lib/scss/*.{sass,scss}',
    css_dest = './Timber/assets/',
    minify_suffix = '.min';

var gulp = require( 'gulp' ),
    gulpShopify  = require('gulp-shopify-upload'),
    config       = require('./config.json'),
    watch = require( 'gulp-watch' ),
    rename = require( 'gulp-rename' ),
    notify = require( 'gulp-notify' ),
    sass = require( 'gulp-sass' ),
    gcmq = require('gulp-group-css-media-queries'),
    postcss      = require('gulp-postcss'),
    sourcemaps   = require('gulp-sourcemaps'),
    autoprefixer = require('autoprefixer-core'),
    cssnano = require('gulp-cssnano'),
    ///////
    browserify = require('browserify')
    watchify = require('watchify')
    source = require('vinyl-source-stream'),
    // Optimizes images
    imagemin   = require('gulp-imagemin')
    changed    = require('gulp-changed');

function handleErrors() {
  var args = Array.prototype.slice.call(arguments);

  // Send error to notification center with gulp-notify
  notify.onError({
    title: "Compile Error",
    message: "<%= error %>"
  }).apply(this, args);

  // Keep gulp from hanging on this task
  this.emit('end');
}

gulp.task('shopifywatch', function() {
  var options = {
    "basePath": "./Timber/"
  };

  return watch('./Timber/+(assets|layout|config|snippets|templates|locales)/**')
  .pipe(gulpShopify(config.shopify_api_key, config.shopify_api_password, config.shopify_url, null, options));
});

gulp.task('sass', function () {
  gulp.src(scss_source)
    .pipe( sass() )
    .on('error', handleErrors)
    .pipe( gcmq() )
    .pipe( postcss([ autoprefixer({ browsers: ['last 5 versions'] }) ]) )
    .pipe( gulp.dest( css_dest ) )
    .pipe( sourcemaps.init())
    .pipe( cssnano({
      safe: true,
      discardComments: {removeAll: true}
    }) )
    .pipe( rename( { suffix: minify_suffix } ) )
    .pipe( sourcemaps.write('.') )
    .pipe( gulp.dest( css_dest ) );
});

gulp.task('browserify', function() {
  return browserify('./lib/js/app.js')
      .bundle()
      .on('error', handleErrors)
      //Pass desired output filename to vinyl-source-stream
      .pipe(source('bundle.js'))
      // Start piping stream to tasks!
      .pipe(gulp.dest('./Timber/assets/'));
});

gulp.task('images', function() {
  return gulp.src('./lib/images/**')
    .pipe(changed('./Timber/assets/')) // Ignore unchanged files
    .pipe(imagemin()) // Optimize
    .pipe(gulp.dest('./Timber/assets/'))
});

gulp.task('watch', function () {
  gulp.watch('./lib/scss/**/*.scss', ['sass']);
  gulp.watch('./lib/js/**/*.js', ['browserify']);
  gulp.watch('lib/images/*.{jpg,jpeg,png,gif,svg}', ['images']);

  var watcher = watchify(browserify({
    // Specify the entry point of your app
    entries: ['./lib/js/app.js'],
    debug: true,
    cache: {}, packageCache: {}, fullPaths: true
  }));

  return watcher.on('update', function() {
    watcher.bundle()
      .pipe(source('bundle.js'))
      .pipe(gulp.dest('./Timber/assets/'))
  })
});

// Default gulp action when gulp is run
gulp.task('default', ['images', 'shopifywatch', 'watch']);
