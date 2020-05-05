const fs = require('fs');
const del = require('del');
const zip = require('gulp-zip');
const webpack = require('webpack');
const uglify = require('gulp-uglify');
const vinylNamed = require('vinyl-named');
const webpackStream = require('webpack-stream');
const headerLicense = require('gulp-header-license');
const { dest, parallel, series, src, watch } = require('gulp');

const webpackConfig = require('./webpack.config');

const SRC_DIR = './src';
const BUILD_DIR = './build';
const RELEASE_DIR = './release';

// Delete ./build dir
function clean() {
    return Promise.resolve(del(BUILD_DIR));
}

// Copy config to build dir
function copyConfig() {
    return src(`${SRC_DIR}/manifest.json`)
        .pipe(dest(BUILD_DIR));
}

// Copy icons to build dir
function copyIcons() {
    return src(`${SRC_DIR}/icons/**/*.png`)
        .pipe(dest(`${BUILD_DIR}/icons`));
}

// bundle scripts
function bundleScripts() {
    return src(`${SRC_DIR}/js/*.js`)
        .pipe(vinylNamed())
        .pipe(webpackStream(webpackConfig, webpack))
        .pipe(dest(`${BUILD_DIR}/js`))
}

// uglify and add license to scripts
function uglifyScripts() {
    return src(`${BUILD_DIR}/js/**/*.js`)
        .pipe(uglify())
        .pipe(headerLicense('/* ' + fs.readFileSync('./LICENSE') + '*/'))
        .pipe(dest(`${BUILD_DIR}/js`));
}

function zipExtension() {
    const manifest = require(`${BUILD_DIR}/manifest.json`);
    return src(`${BUILD_DIR}/**/*`)
        .pipe(zip(`json-formatter-${manifest.version}.zip`))
        .pipe(dest(RELEASE_DIR));
}


const bundleAndUglifyScripts = series(bundleScripts, uglifyScripts);

const build = parallel(copyConfig, copyIcons, bundleScripts);
const buildDist = series(clean, parallel(copyConfig, copyIcons, bundleAndUglifyScripts));
const release = series(buildDist, zipExtension);

function watchFiles() {
    return watch(`${SRC_DIR}/**/*`, build);
}

module.exports = {
    build,
    clean,
    release,
    'build:dist': buildDist,
    'watch': watchFiles
};
