const gulp = require('gulp')
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');

function styles() {
    return gulp.src('src/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.stream())
}

function scripts() {
    return gulp.src('src/js/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(concat('main.min.js')) // объединить в один файл
        .pipe(uglify())              // минифицировать
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/js'))
        .pipe(browserSync.stream());
}

function serve() {
    browserSync.init({
        server: {
            baseDir: './'
        }
    })
    gulp.watch('src/scss/**/*.scss', styles)
    gulp.watch('src/js/**/*.js', scripts);
    gulp.watch('./*.html').on('change', browserSync.reload)
}

exports.styles = styles;
exports.scripts = scripts;
exports.serve = serve;

exports.default = gulp.series(gulp.parallel(styles, scripts), serve);