"use strict";
var gulp = require('gulp') ,
    concat = require('gulp-concat') ,                       //- 多个文件合并为一个;
    cleanCss = require('gulp-clean-css') ,					//- 压缩CSS为一行;
    cssSprite = require('gulp-css-spritesmith') ,           //- css雪碧图
    rename = require('gulp-rename') ,                       //- 合并文件夹
    clean = require('gulp-clean') ,                         //- 删除文件
    replace = require('gulp-replace') ,                     //- 替换文件内容
    rev = require('gulp-rev') ,                             //- 对文件名加MD5后缀
    revCollector = require('gulp-rev-collector') ,          //- md5路径替换
    uglify = require('gulp-uglify') ,                       //- 压缩js
    minimist = require('minimist') ,                        //- 接收命令
    rjs = require('gulp-requirejs-optimize');               //- requirejs合并

/**
 * @param
 *        -projectName    项目名称
 *        -projectModule    项目模块数组
 * @type {string}
 */
var projectName = '{$projectName}';
//projectModule 此次目标产出pay.css\pay.js 故不配置其他模块产出

var cssDest = '../../web/img1.37wanimg.com/' + projectName ,
    jsDest = '../../web/ptres.37.com/js/' + projectName ,
    tplDest = '../../web/common.tpl.37.com/' + projectName;

//1、复制模板到common.tpl.37.com
/**
 * cleanTpl 删除文件夹
 */
gulp.task('cleanTpl' , function(){
    gulp.src(tplDest + '/*')
        .pipe(clean({force : true}));
});
/**
 * copyTpl 复制文件夹
 */
gulp.task('tpl' ,['cleanTpl'], function(){
    gulp.src('./template/**/*')
        .pipe(replace(/\/debug\//g , '/'))
        .pipe(replace(/\?\{\{\$smarty\.now\}\}/g , ''))
        .pipe(gulp.dest(tplDest));
});

//3、处理雪碧图、合并图片至img1.37wanimg.com/pay2016/debug/{css,images}
// 雪碧图处理1 复制合并css
gulp.task('spriteCss' , function(){
    //- 创建一个名为 concat 的 task
    return gulp.src(['./static/**/*.css'])
    //- 合并后的文件名
        .pipe(concat('pay.css'))
        .pipe(replace(/\(images\//g , '(../spriteImg/'))
        //- 输出文件本地
        .pipe(gulp.dest('spriteCss'));
});

// 雪碧图处理2 复制images
gulp.task('spriteImg' , ['spriteCss'] , function(){
    return gulp.src(['./static/**/images/*.png','./static/**/images/*.jpg'])
        .pipe(rename({dirname : ''}))
        .pipe(gulp.dest('spriteImg'));
});

// 雪碧图处理3 生成雪碧图(使用根目录文件夹)
gulp.task('spriteDest' , ['spriteImg'] , function(){
    return gulp.src('spriteCss/pay.css')
        .pipe(cssSprite({
            // sprite背景图源文件夹，只有匹配此路径才会处理，默认 ./static/pay/images/
            imagepath : 'spriteImg/' ,
            // 映射CSS中背景路径，支持函数和数组，默认为 null
            imagepath_map : null ,
            // 雪碧图输出目录，注意，会覆盖之前文件！默认 images/
            spritedest : 'spriteImg/' ,
            // 替换后的背景路径，默认 ../images/
            spritepath : '../images/pay/' ,
            // 各图片间间距，如果设置为奇数，会强制+1以保证生成的2x图片为偶数宽高，默认 0
            padding : 4 ,
            // 是否使用 image-set 作为2x图片实现，默认不使用
            useimageset : false ,
            // 是否以时间戳为文件名生成新的雪碧图文件，如果启用请注意清理之前生成的文件，默认不生成新文件
            newsprite : true ,
            // 给雪碧图追加时间戳，默认不追加
            spritestamp : false ,
            // 在CSS文件末尾追加时间戳，默认不追加
            cssstamp : false
        }))
        .pipe(gulp.dest('spriteDest/'));
});

//合并css
gulp.task('sCopyCss' , ['spriteDest'] , function(){
    gulp.src('spriteDest/spriteCss/pay.css')
        .pipe(replace(/images_\//g , '../images/pay/'))
        .pipe(gulp.dest(cssDest + '/debug/css/'));
});

//复制img
gulp.task('sCopyImg' , ['spriteDest'] , function(){
    gulp.src(['./spriteDest/spriteImg/*.png' ,
        './static/**/images_/*.png' ,
        './static/**/images_/*.jpg'
    ])
        .pipe(rename({dirname : ''}))
        .pipe(gulp.dest(cssDest + '/debug/images/pay/'));
});

gulp.task('cleanSprite' , ['sCopyCss' , 'sCopyImg'] , function(){
    gulp.src(['./spriteCss' , './spriteImg' , './spriteDest'])
        .pipe(clean({force : true}));
});

gulp.task('sprite1' , ['spriteCss' , 'spriteImg']);
gulp.task('sprite2' , ['spriteDest']);
gulp.task('sprite3' , ['sCopyCss' , 'sCopyImg' , 'cleanSprite']);
//完成debug CSS\Images的输出
gulp.task('css' , ['spriteCss' , 'spriteImg' , 'spriteDest' , 'sCopyCss' , 'sCopyImg' , 'cleanSprite'] , function(){
    console.log("雪碧图输出完成！")
});

gulp.task('createCJs',function(){
    return gulp.src('./static/common/order.js')
        .pipe(concat('common.js'))
        .pipe(gulp.dest('./static/'));

});

//4、合并rjs至ptres.37.com/js/pay2016/debug/(modules)
gulp.task('rjs' ,['createCJs'], function(){
    return gulp.src('./static/home/pay/pay.js')
        .pipe(rjs(function(file){
            return {
                name : 'home/pay/pay' ,
                optimize : 'none' ,
                useStrict : true ,
                baseUrl : 'static/' ,
                include : null ,
                exclude : ['common']
            };
        }))
        .pipe(gulp.dest(jsDest + '/debug'));
});

//5、压缩css并添加MD5戳至img1.37wanimg.com/pay2016/{css,images}\替换html
//- 创建一个名为 concat 的 task
gulp.task('cleanCss' , ['css'] , function(){
    //- 需要处理的css文件，放到一个字符串数组里
    gulp.src([cssDest + '/debug/css/pay.css'])
    //- 压缩处理成一行
        .pipe(cleanCss())
        //- 文件名加MD5后缀
        .pipe(rev())
        //- 输出文件本地
        .pipe(gulp.dest(cssDest + '/css/'))
        //- 生成一个rev-manifest.json
        .pipe(rev.manifest())
        //- 将 rev-manifest.json 保存到 rev 目录内
        .pipe(gulp.dest('rev/css'));

});

gulp.task('img' , ['cleanCss'] , function(){
    gulp.src([cssDest + '/debug/images/pay/*.png' ,
        cssDest + '/debug/images/pay/*.jpg'
    ])
        .pipe(rename({dirname : ''}))
        .pipe(gulp.dest(cssDest + '/images/pay/'));
});

//6、压缩js并添加MD5戳至ptres.37.com/js/pay2016/(modules)\替换html
gulp.task('uglify' ,['rjs'], function(){
    //- 需要处理的js文件，放到一个字符串数组里
    gulp.src([jsDest + '/debug/pay.js'])
    //- 压缩处理成一行
        .pipe(uglify())
        //- 文件名加MD5后缀
        .pipe(rev())
        //- 输出文件本地
        .pipe(gulp.dest(jsDest))
        //- 生成一个rev-manifest.json
        .pipe(rev.manifest())
        //- 将 rev-manifest.json 保存到 rev 目录内
        .pipe(gulp.dest('rev/js'));

});

//时间戳替换
gulp.task('pay' , ['tpl','uglify' , 'img' , 'cleanCss'] , function(){
    gulp.src(['rev/**/*.json' , tplDest+'/home/pay/layout.htm'])//- 读取 rev-manifest.json 文件以及需要进行css名替换的文件
        .pipe(revCollector({
            replaceReved : true
        }))
        .pipe(gulp.dest(tplDest + '/home/pay'));     				//- 替换后的文件输出的目录
});

//删除多余文件
gulp.task('cleanDebug',function(){
    return gulp.src(['./static/common.js','./rev', cssDest+'/debug', jsDest+'/debug'])
        .pipe(clean({force : true}));
});
//1、删除产出目录的模板
//2、复制模板到common.tpl.37.com
//3、处理雪碧图、合并图片至img1.37wanimg.com/pay2016/debug/{css,images}
//4、合并rjs至ptres.37.com/js/pay2016/debug/(modules)
//5、压缩css并添加MD5戳至img1.37wanimg.com/pay2016/{css,images}\替换html
//6、压缩js并添加MD5戳至ptres.37.com/js/pay2016/(modules)\替换html
//7、删除debug文件