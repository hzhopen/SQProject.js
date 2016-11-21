var fs = require( 'fs' );
var path = require( 'path' );
var exec = require( 'child_process' ).exec;
var spawn = require( 'child_process' ).spawn;

exports.path = function() {
  return __dirname;
}
exports.build = function( project_name ) {
  console.log( "创建工程目录 " + project_name );

  mkdir( project_name + '/static/common' );
  mkdir( project_name + '/static/home' );
  mkdir( project_name + '/static/modules' );
  mkdir( project_name + '/template/common' );
  mkdir( project_name + '/template/home' );
  mkdir( project_name + '/template/modules' );

  console.log( "创建工程目录 " + project_name + " 完成！！" );
}
exports.copyDef = function( project_name ) {
  var path = __dirname;
  copyFile( path + "/file/gulpfile.js", project_name + "/gulpfile.js", function( data ) {
    return data.replace( "{$projectName}", project_name );
  } );
  copy( path + "/file/package.json", project_name + "/package.json" );

}
exports.exec = function( project_name ) {
  exec( "npm install --save-dev gulp", {
    cwd: project_name
  } );
  console.log( "编译完成" );
}
exports.spawn = function( project_name ) {
  free = spawn( 'cd ', [ project_name ] );

  // 捕获标准输出并将其打印到控制台 
  free.stdout.on( 'data', function( data ) {
    console.log( 'standard output:\n' + data );
  } );

  // 捕获标准错误输出并将其打印到控制台 
  free.stderr.on( 'data', function( data ) {
    console.log( 'standard error output:\n' + data );
  } );

  // 注册子进程关闭事件 
  free.on( 'exit', function( code, signal ) {
    console.log( 'child process eixt ,exit:' + code );
  } );
}
exports.setConf = function( project_name ) {
  var conf = require( project_name + "/package.json" );

}

//创建文件夹（使用时第二个参数可以忽略）
function mkdir( dirpath, dirname ) {
  //判断是否是第一次调用
  if ( typeof dirname === "undefined" ) {
    if ( fs.existsSync( dirpath ) ) {
      return;
    } else {
      mkdir( dirpath, path.dirname( dirpath ) );
    }
  } else {
    //判断第二个参数是否正常，避免调用时传入错误参数
    if ( dirname !== path.dirname( dirpath ) ) {
      mkdir( dirpath );
      return;
    }
    if ( fs.existsSync( dirname ) ) {
      fs.mkdirSync( dirpath )
    } else {
      mkdir( dirname, path.dirname( dirname ) );
      fs.mkdirSync( dirpath );
    }
  }
}

function copyFile( file, outFile, cb ) {
  console.log( '--------开始读取文件--------' );
  fs.readFile( file, 'utf-8', function( err, data ) {
    if ( err ) {
      console.log( "读取失败" );
    } else {
      if ( cb ) {
        data = cb( data );
      }
      writeFile( outFile, data )
      return data;
    }
  } );
  console.log( '--------读取结束--------' );
}

function writeFile( file, data ) {
  fs.writeFile( file, data, 'utf8', function( error ) {
    if ( error ) {
      throw error;
    } else {
      console.log( "文件已保存" );
    }
  } );
}

function copy( file, outFile, cb ) {
  var readStream = fs.createReadStream( file );
  var writeStream = fs.createWriteStream( outFile );
  readStream.pipe( writeStream );

  readStream.on( 'end', function() {
    console.log( 'copy ' + file + ' end' );
  } );
  readStream.on( 'error', function() {
    console.log( 'copy error' );
  } );
}

/*var mFs = require('fs');
 */
