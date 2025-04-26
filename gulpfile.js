const gulp = require('gulp')
const del = require('del')
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const htmlmin = require('gulp-htmlmin');
const ttf2woff2 = require('gulp-ttf2woff2');
const fs = require('fs').promises;
const path = require('path');
const notify = require('gulp-notify');

// Очищаем папку dist
function clean() {
    return del('dist');
}

// Компиляция SCSS
function styles() {
    return gulp.src('src/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', notify.onError({
            title:'SASS Error',
            message:'<%= error.message %>'
        })))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.stream())
}

// Сборка шрифтов
function fonts() {
    return gulp.src('src/scss/fonts/**/*.{ttf,otf}')
        .pipe(ttf2woff2())  
        .pipe(gulp.dest('dist/css/fonts'));
}

// Генерация SCSS с @font-face
async  function fontsStyle(done) {
    const fontsDir = 'dist/css/fonts';
    const fontsScss = 'src/scss/_fonts.scss';
    try {
        const files = await fs.readdir(fontsDir);
    
        let fontScssContent = '';
    
        files.forEach(file => {
          const extname = path.extname(file);
          const fontNameFull = path.basename(file, extname)
          if (extname === '.woff2') {
            // Определяем имя шрифта и стиль
            let [name, weightStyle] = fontNameFull.split('-');
            weightStyle = weightStyle ? weightStyle.toLowerCase() : 'regular';
    
            // Определяем font-weight
            let fontWeight = 400;
            if (weightStyle.includes('thin')) fontWeight = 100;
            else if (weightStyle.includes('extralight')) fontWeight = 200;
            else if (weightStyle.includes('light')) fontWeight = 300;
            else if (weightStyle.includes('regular')) fontWeight = 400;
            else if (weightStyle.includes('medium')) fontWeight = 500;
            else if (weightStyle.includes('semibold')) fontWeight = 600;
            else if (weightStyle.includes('bold')) fontWeight = 700;
            else if (weightStyle.includes('extrabold') || weightStyle.includes('heavy')) fontWeight = 800;
            else if (weightStyle.includes('black')) fontWeight = 900;
    
            // Определяем font-style
            let fontStyle = 'normal';
            if (weightStyle.includes('italic')) {
              fontStyle = 'italic';
            }
    
            fontScssContent += `@font-face {
      font-family: '${name}';
      src: url('./fonts/${file}') format('woff2');
      font-weight: ${fontWeight};
      font-style: ${fontStyle};
      font-display: swap;
    }\n\n`;
          }
        });
    
        await fs.writeFile(fontsScss, fontScssContent);
        console.log('✅ SCSS со шрифтами сгенерирован!');
      } catch (error) {
        console.error('❌ Ошибка при генерации шрифтов:', error);
      }
}

function copyFonts() {
    return gulp.src('src/scss/fonts/**/*.{ttf,otf}')
      .pipe(gulp.dest('dist/css/fonts'));
  }

// Обработка JavaScript
function scripts() {
    return gulp.src('src/js/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(concat('main.min.js')) // объединить в один файл
        .pipe(uglify().on('error',notify.onError({
            title:'JavaScript  Error',
            message:'<%= error.message %>'
        })))              // минифицировать
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/js'))
        .pipe(browserSync.stream());
}

// Оптимизация изображений
function images() {
    return gulp.src('src/images/**/*')
        .pipe(imagemin().on('error', notify.onError({
            title:'Image Minification Error',
            message:'<%= error.message %>'
        })))
        .pipe(gulp.dest('dist/images'))
}

// Конвертация в WebP
function webpImages() {
    return gulp.src('src/images/**/*.{jpg,png}')
        .pipe(webp().on('error', notify.onError({
            title: 'WebP Conversion Error',
            message: '<%= error.message %>'
        })))
        .pipe(gulp.dest('dist/images'));
}

// Минификация HTML
function html() {
    return gulp.src('src/**/*.html')
        .pipe(htmlmin({ collapseWhitespace: true }).on('error', notify.onError({
            title: 'HTML Minification Error',
            message: '<%= error.message %>'
        })))
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.stream());
}


function serve() {
    browserSync.init({
        server: {
            baseDir: './dist'
        }
    })
    gulp.watch('src/scss/**/*.scss', styles)
    gulp.watch('src/scss/fonts/**/*.{ttf,otf}', gulp.series(copyFonts, fonts, fontsStyle))
    gulp.watch('src/js/**/*.js', scripts);
    gulp.watch('src/images/**/*', gulp.series(images, webpImages));
    gulp.watch('src/**/*.html', html);
}

exports.clean = clean;
exports.styles = styles;
exports.fonts = fonts;
exports.fontsStyle = fontsStyle;
exports.copyFonts = copyFonts;
exports.scripts = scripts;
exports.images = images;
exports.webpImages = webpImages;
exports.html = html;
exports.serve = serve;


exports.buildFonts  = gulp.series(copyFonts, fonts, fontsStyle);

exports.default = gulp.series(
    clean,
    gulp.parallel(styles, fonts, copyFonts,scripts, images, webpImages, html),
    fontsStyle,
    serve
);