// === HỆ THỐNG ÂM THANH ===
var audioCtx=null,muted=false,bgmGain=null,sfxGain=null,bgmStarted=false;
function initAudio(){
  if(audioCtx)return;
  try{
    audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    bgmGain=audioCtx.createGain();bgmGain.gain.value=0.22;bgmGain.connect(audioCtx.destination);
    sfxGain=audioCtx.createGain();sfxGain.gain.value=0.45;sfxGain.connect(audioCtx.destination);
  }catch(e){audioCtx=null;}
}
var bgmInterval=null,bgmIndex=0;
var bgmMelody=[523.25,587.33,659.25,698.46,783.99,698.46,659.25,587.33,523.25,493.88,440.00,493.88,523.25,587.33,659.25,783.99,698.46,659.25,587.33,523.25,493.88,523.25,587.33,659.25,783.99,880.00,783.99,698.46,659.25,587.33,523.25,493.88,440.00,493.88,523.25,587.33,659.25,783.99,880.00,783.99,698.46,783.99,880.00,1046.50,880.00,783.99,698.46,659.25];
var bgmBass=[261.63,261.63,329.63,329.63,349.23,349.23,293.66,293.66,261.63,261.63,220.00,220.00,261.63,261.63,329.63,329.63,349.23,349.23,293.66,293.66,246.94,246.94,261.63,261.63,392.00,392.00,349.23,349.23,329.63,329.63,261.63,261.63,220.00,220.00,261.63,261.63,329.63,329.63,392.00,392.00,349.23,349.23,440.00,440.00,392.00,392.00,349.23,349.23];
var bgmBeat=0;
function playBgmNote(){
  if(!audioCtx||muted)return;
  var now=audioCtx.currentTime,idx=bgmIndex%bgmMelody.length;
  var osc=audioCtx.createOscillator(),env=audioCtx.createGain();
  osc.type='square';osc.frequency.value=bgmMelody[idx];
  env.gain.setValueAtTime(0.09,now);env.gain.exponentialRampToValueAtTime(0.001,now+0.14);
  osc.connect(env);env.connect(bgmGain);osc.start(now);osc.stop(now+0.15);
  var bass=audioCtx.createOscillator(),bassEnv=audioCtx.createGain();
  bass.type='triangle';bass.frequency.value=bgmBass[idx];
  bassEnv.gain.setValueAtTime(0.07,now);bassEnv.gain.exponentialRampToValueAtTime(0.001,now+0.12);
  bass.connect(bassEnv);bassEnv.connect(bgmGain);bass.start(now);bass.stop(now+0.13);
  bgmBeat++;
  if(bgmBeat%2===0){var hh=audioCtx.createBufferSource(),hhBuf=audioCtx.createBuffer(1,audioCtx.sampleRate*0.03,audioCtx.sampleRate),hhData=hhBuf.getChannelData(0);for(var i=0;i<hhData.length;i++)hhData[i]=(Math.random()*2-1)*Math.pow(1-i/hhData.length,3);hh.buffer=hhBuf;var hhGain=audioCtx.createGain();hhGain.gain.value=0.04;hh.connect(hhGain);hhGain.connect(bgmGain);hh.start(now);}
  if(bgmBeat%4===0){var kick=audioCtx.createOscillator(),kickEnv=audioCtx.createGain();kick.type='sine';kick.frequency.setValueAtTime(120,now);kick.frequency.exponentialRampToValueAtTime(40,now+0.08);kickEnv.gain.setValueAtTime(0.1,now);kickEnv.gain.exponentialRampToValueAtTime(0.001,now+0.1);kick.connect(kickEnv);kickEnv.connect(bgmGain);kick.start(now);kick.stop(now+0.11);}
  bgmIndex++;
}
function startBgm(){if(bgmStarted||muted)return;bgmStarted=true;bgmIndex=0;bgmBeat=0;bgmInterval=setInterval(playBgmNote,150);}
function stopBgm(){if(bgmInterval){clearInterval(bgmInterval);bgmInterval=null;}bgmStarted=false;}
function playJumpSound(){
  if(!audioCtx||muted)return;var now=audioCtx.currentTime;
  var osc=audioCtx.createOscillator(),env=audioCtx.createGain();osc.type='sine';
  osc.frequency.setValueAtTime(280,now);osc.frequency.exponentialRampToValueAtTime(880,now+0.12);
  env.gain.setValueAtTime(0.3,now);env.gain.exponentialRampToValueAtTime(0.001,now+0.2);
  osc.connect(env);env.connect(sfxGain);osc.start(now);osc.stop(now+0.22);
  var osc2=audioCtx.createOscillator(),env2=audioCtx.createGain();osc2.type='triangle';
  osc2.frequency.setValueAtTime(450,now);osc2.frequency.exponentialRampToValueAtTime(1100,now+0.09);
  env2.gain.setValueAtTime(0.12,now);env2.gain.exponentialRampToValueAtTime(0.001,now+0.14);
  osc2.connect(env2);env2.connect(sfxGain);osc2.start(now);osc2.stop(now+0.16);
}
// Âm thanh jetpack khi bay lơ lửng trong vũ trụ
function playFlySound(){
  if(!audioCtx||muted)return;
  var now=audioCtx.currentTime;
  var osc=audioCtx.createOscillator(),env=audioCtx.createGain();
  osc.type='triangle';
  osc.frequency.setValueAtTime(170,now);
  osc.frequency.exponentialRampToValueAtTime(540,now+0.2);
  env.gain.setValueAtTime(0.16,now);
  env.gain.exponentialRampToValueAtTime(0.001,now+0.3);
  osc.connect(env);env.connect(sfxGain);osc.start(now);osc.stop(now+0.32);

  var noise=audioCtx.createBufferSource(),buf=audioCtx.createBuffer(1,Math.floor(audioCtx.sampleRate*0.22),audioCtx.sampleRate),data=buf.getChannelData(0);
  for(var i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);
  noise.buffer=buf;
  var filter=audioCtx.createBiquadFilter(),ng=audioCtx.createGain();
  filter.type='bandpass';filter.Q.value=1.1;
  filter.frequency.setValueAtTime(700,now);
  filter.frequency.exponentialRampToValueAtTime(1500,now+0.18);
  ng.gain.setValueAtTime(0.1,now);
  ng.gain.exponentialRampToValueAtTime(0.001,now+0.22);
  noise.connect(filter);filter.connect(ng);ng.connect(sfxGain);noise.start(now);
}
function playGameOverSound(){
  if(!audioCtx||muted)return;stopBgm();var now=audioCtx.currentTime;
  var noise=audioCtx.createBufferSource(),buf=audioCtx.createBuffer(1,audioCtx.sampleRate*0.35,audioCtx.sampleRate),data=buf.getChannelData(0);
  for(var i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);
  noise.buffer=buf;var nGain=audioCtx.createGain();nGain.gain.setValueAtTime(0.28,now);nGain.gain.exponentialRampToValueAtTime(0.001,now+0.35);
  noise.connect(nGain);nGain.connect(sfxGain);noise.start(now);
  var kick=audioCtx.createOscillator(),kickEnv=audioCtx.createGain();kick.type='sine';
  kick.frequency.setValueAtTime(160,now);kick.frequency.exponentialRampToValueAtTime(25,now+0.25);
  kickEnv.gain.setValueAtTime(0.4,now);kickEnv.gain.exponentialRampToValueAtTime(0.001,now+0.28);
  kick.connect(kickEnv);kickEnv.connect(sfxGain);kick.start(now);kick.stop(now+0.3);
  [523.25,493.88,440,392,349.23,329.63,293.66,261.63,220,196].forEach(function(freq,i){
    var tt=now+0.35+i*0.1,o=audioCtx.createOscillator(),e=audioCtx.createGain();o.type='square';o.frequency.value=freq;
    e.gain.setValueAtTime(0.12,tt);e.gain.exponentialRampToValueAtTime(0.001,tt+0.09);o.connect(e);e.connect(sfxGain);o.start(tt);o.stop(tt+0.1);
  });
}
function playScoreSound(){
  if(!audioCtx||muted)return;var now=audioCtx.currentTime;
  var o1=audioCtx.createOscillator(),e1=audioCtx.createGain();o1.type='sine';
  o1.frequency.setValueAtTime(880,now);o1.frequency.setValueAtTime(1108.73,now+0.06);
  e1.gain.setValueAtTime(0.2,now);e1.gain.exponentialRampToValueAtTime(0.001,now+0.15);
  o1.connect(e1);e1.connect(sfxGain);o1.start(now);o1.stop(now+0.17);
  var o2=audioCtx.createOscillator(),e2=audioCtx.createGain();o2.type='sine';o2.frequency.value=1318.51;
  e2.gain.setValueAtTime(0,now);e2.gain.setValueAtTime(0.15,now+0.08);e2.gain.exponentialRampToValueAtTime(0.001,now+0.2);
  o2.connect(e2);e2.connect(sfxGain);o2.start(now);o2.stop(now+0.22);
}
// Âm thanh bước nhảy siêu không gian (Hyperspace Warp Jump)
function playWarpSound(){
  if(!audioCtx||muted)return;
  var now=audioCtx.currentTime;
  var sub=audioCtx.createOscillator(),subGain=audioCtx.createGain();
  sub.type='sine';sub.frequency.setValueAtTime(340,now);sub.frequency.exponentialRampToValueAtTime(45,now+1.2);
  subGain.gain.setValueAtTime(0.5,now);subGain.gain.exponentialRampToValueAtTime(0.001,now+1.4);
  sub.connect(subGain);subGain.connect(sfxGain);sub.start(now);sub.stop(now+1.4);

  var sweep=audioCtx.createOscillator(),sweepGain=audioCtx.createGain();
  sweep.type='sawtooth';sweep.frequency.setValueAtTime(220,now);sweep.frequency.exponentialRampToValueAtTime(1800,now+0.9);
  sweepGain.gain.setValueAtTime(0.18,now);sweepGain.gain.exponentialRampToValueAtTime(0.001,now+1.0);
  sweep.connect(sweepGain);sweepGain.connect(sfxGain);sweep.start(now);sweep.stop(now+1.0);

  [659.25,880,1174.66,1567.98].forEach(function(freq,i){
    var o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type='sine';o.frequency.value=freq;
    var t=now+0.6+i*0.1;
    g.gain.setValueAtTime(0.2,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.8);
    o.connect(g);g.connect(sfxGain);o.start(t);o.stop(t+0.8);
  });
}
function toggleSound(){
  initAudio();muted=!muted;var btn=document.getElementById('soundBtn');
  if(muted){btn.classList.add('muted');btn.title='Bật âm thanh';stopBgm();if(bgmGain)bgmGain.gain.value=0;if(sfxGain)sfxGain.gain.value=0;}
  else{btn.classList.remove('muted');btn.title='Tắt âm thanh';if(bgmGain)bgmGain.gain.value=0.22;if(sfxGain)sfxGain.gain.value=0.45;}
}

// Gắn sự kiện cho nút loa (thay cho thuộc tính onclick trong HTML)
document.getElementById('soundBtn').addEventListener('click', function (e) {
  e.stopPropagation();
  toggleSound();
});
