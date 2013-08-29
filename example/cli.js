var roundRobot = require('../');

var request = require('request')

var keypress = require('keypress');


var alarmhost = process.argv[2] || 'http://10.0.2.5'
request(alarmhost+'/safe',function(err){
  if(err) console.log(err);
})

var boxsize = parseInt(process.argv[3] || 50)


var sphero = new roundRobot.Sphero();


var last = true


// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);



console.log('connecting...')
sphero.connect();
sphero.on("connected", function(ball){
  ball.configureLocator(true,0,0,0,function(err){
    if( err ) console.log(err);
  })

  console.log("Connected! Box Size: "+boxsize);
  console.log("  c - change color");
  console.log("  b/n - backled on/off");
  console.log("  up - move forward");
  console.log("  back - stop");
  console.log("  left - change heading 15 deg left");
  console.log("  right - change heading 15 deg right\n\n");

  var backledon = 1
  var speed = 0.3
  var rgb = color();

  sphero.setRGBLED(rgb[0], rgb[1], rgb[2], false);
  sphero.setBackLED(backledon);

  ball.on('notification',function(out){
    if( 0x03 == out.ID_CODE && out.DATA ) {
      var x = out.DATA.readInt16BE(0)
      var y = out.DATA.readInt16BE(2)
      var inside = Math.abs(x) < boxsize && Math.abs(y) < boxsize

      console.log('\033[F'+(!inside?'\033[31m':'')+
                  '                                                     '+
                  '\033[0GLocation: '+x+', '+y+'\033[0m  Move: '+Math.round(10*speed))

      if( last != inside ) {
        request(alarmhost+'/'+(inside?'safe':'unsafe'),function(err){
          if(err) console.log(err);
        })
        last = inside
      }
    }
  })

  ball.setDataStreaming( 
    [ ball.sensors.locator_x, ball.sensors.locator_y, ],
    10,
    1,0,
    function(err,out){
      if( err ) console.log(err);
    }
  )


  // listen for the "keypress" event
  process.stdin.on('keypress', function (ch, key) {

    if (key && key.ctrl && key.name == 'c') {
      process.stdin.pause(); process.exit();
    }
    if(key && key.name == 'c'){
      var rgb = color();
      sphero.setRGBLED(rgb[0], rgb[1], rgb[2], false);
      ball.configureLocator(true,0,0,0,function(err){
        if( err ) console.log(err);
      })
    }
    if(key && key.name == 'b') { backledon = (1+backledon)%2; sphero.setBackLED(backledon);  }
    if(key && key.name == 'right') sphero.setHeading(30);
    if(key && key.name == 'left') sphero.setHeading(330);
    if(key && key.name == 'up') sphero.roll(0, speed);
    if(key && key.name == 'down') sphero.roll(0, 0);
    if(key && key.name == 'x') sphero.setHeading(45).setHeading(315).setBackLED(1);
    
    if(ch == ',') { speed -= 0.1; speed = speed < 0.1 ? 0.1 : speed; } 
    if(ch == '.') { speed += 0.1; speed = speed > 1.0 ? 1.0 : speed; } 
  });
  process.stdin.setRawMode(true);
  process.stdin.resume();

});

var color = function(){
  var r = Math.random()*255;
  var g = Math.random()*255;
  var b = Math.random()*255;
  return [r,g,b];
}

