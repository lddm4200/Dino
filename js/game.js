(function(){
const $=id=>document.getElementById(id);
if(typeof THREE==='undefined'){$('t').textContent='Không tải được thư viện 3D';return;}
const pad=n=>String(n).padStart(5,'0');

// === NHẬN DIỆN THIẾT BỊ VÀ TỐI ƯU HÓA CHO ĐIỆN THOẠI YẾU ===
const isMobile=/Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)||(window.innerWidth<800);
const renderer=new THREE.WebGLRenderer({
  canvas:$('c'),
  antialias:!isMobile,
  powerPreference:'high-performance',
  precision:isMobile?'mediump':'highp',
  stencil:false
});
const maxDpr=isMobile?1.0:1.5;
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,maxDpr));

// MỐC 10.000 ĐIỂM TIẾN VÀO KHÔNG GIAN
const SPACE_THRESHOLD=10000;
let inSpace=false;
let spaceT=0; // 0 (Trái Đất) -> 1 (Thiên Hà Vũ Trụ)

// === CHU KỲ NGÀY ĐÊM (chậm rãi, tự nhiên) ===
const DAY_CYCLE=2000;
const timePhases={
  day:    {sky:0x7ec0ee, fog:0xc2e2f5, ground:0x8FBC6B, lane:0xB8A87A, sunI:0.9,  hemiI:1.0,  sunC:0xFFF4E0, mountainC:0x6B9E68},
  sunset: {sky:0xFF7A45, fog:0xFFA278, ground:0xB89058, lane:0x9E7E56, sunI:0.8,  hemiI:0.85, sunC:0xFFA658, mountainC:0x9E6845},
  night:  {sky:0x1A2844, fog:0x253654, ground:0x34524E, lane:0x4E6278, sunI:0.55, hemiI:0.72, sunC:0xB2D0FF, mountainC:0x2C405E},
  dawn:   {sky:0xE898B0, fog:0xF0BCC8, ground:0x85AB6C, lane:0xA89270, sunI:0.75, hemiI:0.85, sunC:0xFFCC99, mountainC:0x7A8065}
};

const todResult={phase:'day',blend:0,next:'day'};
function getTimeOfDay(score){
  const pos=(score%DAY_CYCLE)/DAY_CYCLE;
  if(pos<0.4){todResult.phase='day';todResult.blend=0;todResult.next='day';}
  else if(pos<0.45){todResult.phase='day';todResult.blend=(pos-0.4)/0.05;todResult.next='sunset';}
  else if(pos<0.55){todResult.phase='sunset';todResult.blend=0;todResult.next='sunset';}
  else if(pos<0.6){todResult.phase='sunset';todResult.blend=(pos-0.55)/0.05;todResult.next='night';}
  else if(pos<0.8){todResult.phase='night';todResult.blend=0;todResult.next='night';}
  else if(pos<0.85){todResult.phase='night';todResult.blend=(pos-0.8)/0.05;todResult.next='dawn';}
  else if(pos<0.95){todResult.phase='dawn';todResult.blend=0;todResult.next='dawn';}
  else{todResult.phase='dawn';todResult.blend=(pos-0.95)/0.05;todResult.next='day';}
  return todResult;
}

function lerpColor(c1,c2,t){
  const r1=(c1>>16)&0xFF,g1=(c1>>8)&0xFF,b1=c1&0xFF;
  const r2=(c2>>16)&0xFF,g2=(c2>>8)&0xFF,b2=c2&0xFF;
  return((r1+Math.round((r2-r1)*t))<<16)|((g1+Math.round((g2-g1)*t))<<8)|(b1+Math.round((b2-b1)*t));
}
function lerpVal(a,b,t){return a+(b-a)*t;}
function smooth01(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x7ec0ee);
scene.fog=new THREE.Fog(0xc2e2f5,30,130);
const cam=new THREE.PerspectiveCamera(58,1,0.8,300);

const hemiLight=new THREE.HemisphereLight(0xffffff,0x8FBC6B,1.0);
scene.add(hemiLight);
const sun=new THREE.DirectionalLight(0xfff4e0,0.9);sun.position.set(6,12,5);scene.add(sun);
const moonLight=new THREE.DirectionalLight(0x98C0FF,0);moonLight.position.set(-5,10,-3);scene.add(moonLight);

const mats={},geos={};
const M=c=>mats[c]||(mats[c]=new THREE.MeshLambertMaterial({color:c,flatShading:true}));
const G=(w,h,d)=>geos[w+','+h+','+d]||(geos[w+','+h+','+d]=new THREE.BoxGeometry(w,h,d));
const bx=(w,h,d,c,x,y,z,p)=>{const m=new THREE.Mesh(G(w,h,d),M(c));m.position.set(x,y,z);p.add(m);return m;};
const rockGeo=new THREE.DodecahedronGeometry(1,0);

// === BỘ GEOMETRIES TÁI SỬ DỤNG TRÁNH LEAK RAM TRÊN MOBILE YẾU ===
const eggGeo=new THREE.SphereGeometry(0.3,6,4);
const bushGeo1=new THREE.DodecahedronGeometry(0.8,0);
const bushGeo2=new THREE.DodecahedronGeometry(0.6,0);
const bushSmallGeo=new THREE.DodecahedronGeometry(0.35,0);
const flowerGeo=new THREE.SphereGeometry(0.12,5,4);

// Geometries vật cản không gian
const meteorGeo1=new THREE.DodecahedronGeometry(1.4,0);
const crystalGeo=new THREE.CylinderGeometry(0.2,0.6,2.5,5);

// === MẶT ĐẤT CẢI TIẾN ===
const groundMat=new THREE.MeshLambertMaterial({color:0x8FBC6B,flatShading:true});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(400,400),groundMat);
ground.rotation.x=-Math.PI/2;ground.position.z=-120;scene.add(ground);

// Đường chạy với viền (sẽ biến thành đường cao tốc Neon không gian)
const laneMat=new THREE.MeshLambertMaterial({color:0xB8A87A,flatShading:true});
const lane=new THREE.Mesh(new THREE.PlaneGeometry(8,400),laneMat);
lane.rotation.x=-Math.PI/2;lane.position.set(0,0.02,-120);scene.add(lane);

// Viền đường (Neon Cyan trong không gian)
const edgeMat=new THREE.MeshLambertMaterial({color:0xE8DCC0,flatShading:true});
const edgeL=new THREE.Mesh(new THREE.PlaneGeometry(0.3,400),edgeMat);
edgeL.rotation.x=-Math.PI/2;edgeL.position.set(-4.15,0.04,-120);scene.add(edgeL);
const edgeR=new THREE.Mesh(new THREE.PlaneGeometry(0.3,400),edgeMat);
edgeR.rotation.x=-Math.PI/2;edgeR.position.set(4.15,0.04,-120);scene.add(edgeR);

// Vạch giữa đường (Neon Magenta trong không gian)
const dashMat=new THREE.MeshLambertMaterial({color:0xD0C098,flatShading:true});
const dashes=[];
const dashCount=isMobile?10:18;
const dashSpacing=12;
for(let i=0;i<dashCount;i++){
  const d=new THREE.Mesh(new THREE.PlaneGeometry(0.25,3.5),dashMat);
  d.rotation.x=-Math.PI/2;d.position.set(0,0.05,-i*dashSpacing);scene.add(d);dashes.push(d);
}

// Núi xa (chìm xuống khi vào không gian)
const mountainMat=new THREE.MeshLambertMaterial({color:0x6B9E68,flatShading:true});
const mountains=[];
[[-70,-115,55,16],[-20,-120,40,22],[30,-118,50,12],[80,-112,45,20],[-50,-125,60,18],[60,-122,35,14]].forEach(([x,z,w,h])=>{
  const mt=new THREE.Mesh(G(w,h,12),mountainMat);
  mt.position.set(x,h/2,z);
  mt.userData.baseH=h/2;
  scene.add(mt);
  mountains.push(mt);
});
// Đỉnh núi tuyết
const snowCaps=[];
[[-20,-120,15,4,20],[80,-112,12,3,18],[-50,-125,18,3.5,16.5]].forEach(([x,z,w,h,baseH])=>{
  const sc=bx(w,h,8,0xE8E8E0,x,baseH+h/2,z,scene);
  sc.userData.baseH=baseH+h/2;
  snowCaps.push(sc);
});

// === MÂY TRÔI (nhẹ, biến mất khi vào không gian) ===
const clouds=[];
const cloudGeo=new THREE.DodecahedronGeometry(1.5,0);
const cloudMat=new THREE.MeshLambertMaterial({color:0xFFFFFF,transparent:true,opacity:0.85});
const cloudCount=isMobile?5:8;
for(let i=0;i<cloudCount;i++){
  const g=new THREE.Group();
  const n=isMobile?2:3;
  for(let j=0;j<n;j++){
    const s=1.3+Math.random()*1.5;
    const cg=new THREE.Mesh(cloudGeo,cloudMat);
    cg.position.set((j-(n-1)/2)*2.2+(Math.random()-0.5)*0.8,(Math.random()-0.5)*0.5,(Math.random()-0.5)*1.2);
    cg.scale.set(s,s*0.45,s*0.8);
    g.add(cg);
  }
  g.position.set(-80+Math.random()*160,25+Math.random()*18,-60-Math.random()*70);
  g.userData.speed=0.25+Math.random()*0.35;
  scene.add(g);clouds.push(g);
}

// === SAO ĐÊM & VŨ TRỤ (NẰM Ở TẬN HẬU CẢNH THIÊN THỂ TRÁNH NHẤP NHÁY VỚI VẬT THỂ) ===
const starsGeo=new THREE.BufferGeometry();
const starPositions=[];
const starCount=isMobile?120:250;
for(let i=0;i<starCount;i++){
  starPositions.push((Math.random()-0.5)*360,10+Math.random()*85,-175-Math.random()*20);
}
starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
const starsMat=new THREE.PointsMaterial({color:0xFFFFFF,size:isMobile?0.7:0.55,transparent:true,opacity:0,depthWrite:false,fog:false});
const stars=new THREE.Points(starsGeo,starsMat);
scene.add(stars);

// === MẶT TRỜI / MẶT TRĂNG 3D ===
const sunSphere=new THREE.Mesh(
  new THREE.SphereGeometry(7,10,8),
  new THREE.MeshBasicMaterial({color:0xFFEE55,fog:false})
);
const sunGlow=new THREE.Mesh(
  new THREE.SphereGeometry(12,10,8),
  new THREE.MeshBasicMaterial({color:0xFFAA22,transparent:true,opacity:0.22,fog:false,depthWrite:false})
);
sunSphere.add(sunGlow);
sunSphere.position.set(0,80,-190);
scene.add(sunSphere);

const moonSphere=new THREE.Mesh(
  new THREE.SphereGeometry(5.5,10,8),
  new THREE.MeshBasicMaterial({color:0xEEF3FF,fog:false})
);
const moonGlow=new THREE.Mesh(
  new THREE.SphereGeometry(9.5,10,8),
  new THREE.MeshBasicMaterial({color:0x99BBFF,transparent:true,opacity:0.2,fog:false,depthWrite:false})
);
moonSphere.add(moonGlow);
moonSphere.position.set(0,-50,-190);
moonSphere.visible=false;
scene.add(moonSphere);

// === VŨ TRỤ MỚI: KHÔNG GIAN MỞ, KHÔNG CÓ ĐƯỜNG CHẠY ===
const spaceGroup=new THREE.Group();
scene.add(spaceGroup);
spaceGroup.visible=false;

// 1. Hành tinh khí khổng lồ có vành đai
const planetSphere=new THREE.Mesh(
  new THREE.SphereGeometry(16,14,12),
  new THREE.MeshLambertMaterial({color:0x9B59B6,emissive:0x2A0F3A,flatShading:true})
);
planetSphere.position.set(58,34,-160);
spaceGroup.add(planetSphere);

const planetRing=new THREE.Mesh(
  new THREE.RingGeometry(20,32,28),
  new THREE.MeshBasicMaterial({color:0xD8B4F8,side:THREE.DoubleSide,transparent:true,opacity:0,fog:false,depthWrite:false})
);
planetRing.rotation.x=1.15;
planetRing.rotation.y=0.35;
planetRing.position.copy(planetSphere.position);
spaceGroup.add(planetRing);

// 2. Trái Đất từ xa + Mặt Trăng nhỏ
const earthSphere=new THREE.Mesh(
  new THREE.SphereGeometry(6,10,8),
  new THREE.MeshLambertMaterial({color:0x1E90FF,emissive:0x062A55,flatShading:true})
);
earthSphere.position.set(-48,28,-145);
spaceGroup.add(earthSphere);

const moonSmall=new THREE.Mesh(
  new THREE.SphereGeometry(1.5,6,5),
  new THREE.MeshLambertMaterial({color:0xE0E0E0,flatShading:true})
);
moonSmall.position.set(-38,32,-142);
spaceGroup.add(moonSmall);

// 3. Các hành tinh xa tạo chiều sâu
const planetFar1=new THREE.Mesh(
  new THREE.SphereGeometry(4.5,8,6),
  new THREE.MeshLambertMaterial({color:0xFF8A5B,emissive:0x3A1206,flatShading:true})
);
planetFar1.position.set(20,58,-185);
spaceGroup.add(planetFar1);

const planetFar2=new THREE.Mesh(
  new THREE.SphereGeometry(3.2,8,6),
  new THREE.MeshLambertMaterial({color:0x36D6C8,emissive:0x073A36,flatShading:true})
);
planetFar2.position.set(-80,52,-175);
spaceGroup.add(planetFar2);

// 4. Tinh vân vũ trụ rực rỡ (depthWrite=false tránh nhấp nháy đa giác)
const nebGeo=new THREE.DodecahedronGeometry(26,0);
const neb1=new THREE.Mesh(nebGeo,new THREE.MeshBasicMaterial({color:0x8A2BE2,transparent:true,opacity:0,fog:false,depthWrite:false}));
neb1.position.set(30,50,-195);neb1.scale.set(1.6,0.8,1);spaceGroup.add(neb1);
const neb2=new THREE.Mesh(nebGeo,new THREE.MeshBasicMaterial({color:0x00CED1,transparent:true,opacity:0,fog:false,depthWrite:false}));
neb2.position.set(-45,28,-190);neb2.scale.set(1.4,0.7,1);spaceGroup.add(neb2);
const neb3=new THREE.Mesh(nebGeo,new THREE.MeshBasicMaterial({color:0xFF4FA3,transparent:true,opacity:0,fog:false,depthWrite:false}));
neb3.position.set(5,15,-200);neb3.scale.set(1.1,0.55,1);spaceGroup.add(neb3);

// 5. Bụi sao nhiều màu (lớp gần hơn tạo chiều sâu)
const dustGeo=new THREE.BufferGeometry();
const dustPositions=[],dustColors=[];
const dustPalette=[0xFFFFFF,0x9FE8FF,0xC084FC,0xFF8AB8];
const dustCount=isMobile?90:180;
for(let i=0;i<dustCount;i++){
  dustPositions.push((Math.random()-0.5)*260,-10+Math.random()*100,-150-Math.random()*70);
  const dc=new THREE.Color(dustPalette[Math.floor(Math.random()*dustPalette.length)]);
  dustColors.push(dc.r,dc.g,dc.b);
}
dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(dustPositions,3));
dustGeo.setAttribute('color',new THREE.Float32BufferAttribute(dustColors,3));
const dustMat=new THREE.PointsMaterial({size:isMobile?1.1:0.9,vertexColors:true,transparent:true,opacity:0,fog:false,depthWrite:false});
const dust=new THREE.Points(dustGeo,dustMat);
spaceGroup.add(dust);

// 6. Thiên thạch trôi trang trí (không va chạm)
const driftRocks=[];
const driftCount=isMobile?7:14;
for(let i=0;i<driftCount;i++){
  const m=new THREE.Mesh(rockGeo,M(0x8A7A9A));
  const s=0.35+Math.random()*1.1;
  m.scale.set(s*(0.8+Math.random()*0.5),s*(0.7+Math.random()*0.5),s);
  m.position.set((Math.random()-0.5)*70,-6+Math.random()*38,-165+Math.random()*70);
  m.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);
  m.userData.spinX=(Math.random()-0.5)*0.9;
  m.userData.spinY=(Math.random()-0.5)*0.9;
  m.userData.speed=3+Math.random()*7;
  spaceGroup.add(m);driftRocks.push(m);
}

// 7. Vệt tốc độ (cảm giác khủng long lao đi trong vũ trụ)
const speedLines=[];
const speedLineMat=new THREE.MeshBasicMaterial({color:0xBFEFFF,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
const speedLineCount=isMobile?22:46;
for(let i=0;i<speedLineCount;i++){
  const m=new THREE.Mesh(G(0.035,0.035,1),speedLineMat);
  m.scale.z=2+Math.random()*7;
  m.position.set((Math.random()-0.5)*90,-10+Math.random()*50,-170+Math.random()*185);
  m.userData.speed=60+Math.random()*80;
  spaceGroup.add(m);speedLines.push(m);
}

// Xương rồng (cactus)
function cactus(h,arms){
  const g=new THREE.Group(),c=0x5f8f4e;
  bx(.8,h,.8,c,0,h/2,0,g);
  if(arms){
    bx(.9,.5,.5,c,-.7,h*.55,0,g);bx(.5,h*.3,.5,c,-1,h*.55+h*.15,0,g);
    bx(.9,.5,.5,c,.7,h*.4,0,g);bx(.5,h*.3,.5,c,1,h*.4+h*.15,0,g);
  }
  return g;
}

// 1. Xương khủng long
function fossil(){
  const g=new THREE.Group(),bc=0xE8D8C0,dc=0xD0BFA0;
  bx(3,.4,.4,bc,0,.5,0,g);
  for(let i=-1;i<=1;i++){
    bx(.15,1.2,.15,bc,i*.8,1.1,0,g);
    bx(.15,.15,.6,dc,i*.8,1.7,.2,g);
  }
  bx(.8,.7,.7,bc,-1.8,.7,0,g);
  bx(.4,.3,.5,dc,-2.2,.6,0,g);
  bx(.15,.15,.15,0x333333,-2.3,.8,.2,g);
  return g;
}

// 2. Khúc gỗ
function log(){
  const g=new THREE.Group(),lc=0x8B6914,dc=0x6B4E0A;
  bx(3,.8,.8,lc,0,.4,0,g);
  bx(3.1,.3,.3,dc,0,.55,0,g);
  bx(.4,.5,.4,dc,-.8,.7,.3,g);
  bx(.3,.4,.3,dc,.6,.7,-.3,g);
  bx(.15,.7,.7,0x9A7B2D,-1.5,.4,0,g);
  bx(.15,.7,.7,0x9A7B2D,1.5,.4,0,g);
  return g;
}

// 3. Tổ trứng khủng long
function eggNest(){
  const g=new THREE.Group();
  const nestC=0x8B7355;
  bx(2.2,.3,2.2,nestC,0,.15,0,g);
  bx(2.4,.5,.4,0x6B5535,0,.25,1,g);
  bx(2.4,.5,.4,0x6B5535,0,.25,-1,g);
  bx(.4,.5,2.4,0x6B5535,1,.25,0,g);
  bx(.4,.5,2.4,0x6B5535,-1,.25,0,g);
  const eggC=0xF5F0E0;
  for(let i=0;i<3;i++){
    const angle=i*Math.PI*2/3;
    const ex=Math.cos(angle)*0.5,ez=Math.sin(angle)*0.5;
    const egg=new THREE.Mesh(eggGeo,M(eggC));
    egg.scale.y=1.3;
    egg.position.set(ex,.55,ez);
    g.add(egg);
    bx(.08,.08,.08,0xBB9966,ex,.7,ez,g);
  }
  return g;
}

// 4. Tảng đá xếp chồng
function rockStack(){
  const g=new THREE.Group();
  const r1=new THREE.Mesh(rockGeo,M(0x8a7a66));
  r1.scale.set(1.4,.7,1.1);r1.position.y=.5;r1.rotation.y=Math.random()*3;g.add(r1);
  const r2=new THREE.Mesh(rockGeo,M(0x9a8a76));
  r2.scale.set(.9,.6,.8);r2.position.y=1.3;r2.rotation.y=Math.random()*3;g.add(r2);
  const r3=new THREE.Mesh(rockGeo,M(0x7a6a56));
  r3.scale.set(.5,.4,.5);r3.position.y=2;r3.rotation.y=Math.random()*3;g.add(r3);
  return g;
}

// 5. Thằn lằn bay (Pterodactyl)
function pterodactyl(){
  const g=new THREE.Group(),pc=0x8B6E5A,wc=0xA08870;
  bx(.4,.4,1.2,pc,0,0,0,g);
  bx(.3,.3,.4,pc,0,.1,-.7,g);
  bx(.15,.1,.6,0xCC9955,0,0,-1.1,g);
  bx(.08,.08,.08,0xFF3333,.18,.15,-.65,g);
  bx(.08,.08,.08,0xFF3333,-.18,.15,-.65,g);
  const wingL=new THREE.Group();wingL.position.set(.3,0,-.1);g.add(wingL);
  bx(1.8,.06,.8,wc,.9,0,0,wingL);
  bx(.8,.04,.5,wc,2,.02,.15,wingL);
  const wingR=new THREE.Group();wingR.position.set(-.3,0,-.1);g.add(wingR);
  bx(1.8,.06,.8,wc,-.9,0,0,wingR);
  bx(.8,.04,.5,wc,-2,.02,.15,wingR);
  g.userData.wingL=wingL;
  g.userData.wingR=wingR;
  return g;
}

// 6. Bụi gai
function thornBush(){
  const g=new THREE.Group(),tc=0x3D6B35,dc=0x2D5525;
  const bush=new THREE.Mesh(bushGeo1,M(tc));
  bush.position.y=.7;bush.scale.y=.8;g.add(bush);
  const bush2=new THREE.Mesh(bushGeo2,M(dc));
  bush2.position.set(.4,.5,.3);bush2.scale.y=.75;g.add(bush2);
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2;
    bx(.08,.45,.08,0x5A4A20,Math.cos(a)*.7,1.15,Math.sin(a)*.7,g);
  }
  return g;
}

// 7. Trụ đá cổ đại
function stonePillar(){
  const g=new THREE.Group(),sc=0x9A8A7A;
  bx(.9,3,.9,sc,0,1.5,0,g);
  bx(1.1,.4,1.1,0x8A7A6A,0,0.2,0,g);
  bx(1.1,.3,1.1,0x8A7A6A,0,2.85,0,g);
  bx(.08,1.5,.3,0x6A5A4A,.35,1.8,0,g);
  bx(.12,1.8,.12,0x4A7A3A,.45,1.5,.3,g);
  return g;
}

// === CÁC VẬT CẢN KHÔNG GIAN (SPAWN TRONG THIÊN HÀ) ===
function makeSpaceObs(){
  const r=Math.random();
  let g,w,h;
  if(r<0.38){
    // 1. Thiên thạch rực lửa (Burning Meteorite) - Sáng rực rỡ với nham thạch và đuôi lửa
    g=new THREE.Group();
    const rock=new THREE.Mesh(meteorGeo1,M(0x6D432E)); // Lớp vỏ đá núi lửa ấm, không bị tối đen
    rock.scale.set(1.2,1.1,1.1);
    rock.rotation.set(Math.random()*2,Math.random()*2,0);
    g.add(rock);
    bx(1.0,0.5,1.0,0xFF2200,0,0.2,-0.4,g); // Dung nham đỏ rực
    bx(0.7,0.4,0.7,0xFF8800,0.3,0.1,0.2,g); // Vệt cam nóng
    bx(0.4,0.4,0.4,0xFFEE00,-0.2,0.3,0.1,g); // Điểm sáng vàng rực
    // Đuôi lửa plasma sáng rực
    const fire=bx(0.9,0.9,2.5,0xFF3300,0,0,1.6,g);
    fire.scale.set(1,0.7,1);
    bx(0.6,0.6,2.0,0xFFAA00,0,0,1.8,g);
    bx(0.35,0.35,1.3,0xFFFF66,0,0,2.0,g); // Lõi lửa trắng vàng rực rỡ
    h=2.4;w=2.4;
  }else if(r<0.64){
    // 2. Cụm tinh thể pha lê vũ trụ (Cosmic Crystal Spire) - Phát sáng Neon Cyan & Magenta
    g=new THREE.Group();
    const cr1=new THREE.Mesh(crystalGeo,M(0x00FFFF)); // Neon Cyan
    cr1.position.set(-0.4,1.2,0);cr1.rotation.z=-0.15;g.add(cr1);
    const cr2=new THREE.Mesh(crystalGeo,M(0xFF00C8)); // Neon Magenta
    cr2.position.set(0.4,1.4,0.2);cr2.rotation.z=0.2;cr2.scale.set(1.2,1.2,1.2);g.add(cr2);
    const cr3=new THREE.Mesh(crystalGeo,M(0xFFFFFF)); // Lõi pha lê trắng tinh tú rực rỡ
    cr3.position.set(0,1.6,-0.1);cr3.scale.set(0.6,1.1,0.6);g.add(cr3);
    const crBase=new THREE.Mesh(bushGeo1,M(0x48326D)); // Đá thạch anh tím
    crBase.position.y=0.4;g.add(crBase);
    bx(0.4,0.2,0.4,0x00FFFF,0.5,0.3,0.3,g);
    bx(0.4,0.2,0.4,0xFF00AA,-0.5,0.3,-0.3,g);
    h=2.8;w=2.4;
  }else if(r<0.82){
    // 3. Tàu UFO Người ngoài hành tinh (Alien Flying Saucer) - Bạc sáng bóng kèm đèn Neon và chùm tia bắt cóc
    g=new THREE.Group();
    bx(2.6,0.35,2.6,0xA8C4E8,0,0,0,g); // Đĩa bay hợp kim titan bạc sáng bóng
    bx(2.9,0.12,2.9,0x39FF14,0,0,0,g); // Vành đèn Neon xanh lá huỳnh quang cực sáng
    bx(1.1,0.6,1.1,0x00FFFF,0,0.4,0,g); // Buồng lái phát sáng Cyan
    bx(0.5,0.4,0.5,0xFFFFFF,0,0.5,0,g); // Điểm sáng trắng trung tâm
    const beam=bx(1.6,1.8,1.6,0x00FFAA,0,-1.0,0,g); // Chùm tia năng lượng bắt cóc
    beam.material=new THREE.MeshBasicMaterial({color:0x00FFAA,transparent:true,opacity:0.45,depthWrite:false});
    g.userData.flying=true;
    h=2.8;w=3.2;
  }else{
    // 4. Mảnh vỡ vệ tinh trạm không gian (Space Satellite) - Vỏ trắng phản quang & tấm pin xanh rực
    g=new THREE.Group();
    bx(1.1,1.2,1.1,0xFFFFFF,0,0.7,0,g); // Thân trạm bọc giáp trắng sáng
    bx(0.9,0.5,0.9,0xFFD700,0,0.7,0.15,g); // Lớp cách nhiệt mạ vàng
    bx(1.9,0.08,0.8,0x00A6FF,-1.5,0.7,0,g); // Tấm pin năng lượng mặt trời xanh rực
    bx(1.9,0.08,0.8,0x00A6FF,1.5,0.7,0,g);
    bx(0.3,0.3,0.3,0xFF0033,0,1.45,0,g); // Đèn cảnh báo nhấp nháy đỏ rực
    bx(0.6,0.1,0.6,0xFFD700,0,1.55,-0.3,g); // Ăng-ten chảo vàng
    h=2.2;w=4.0;
  }
  // Vật cản bay lơ lửng ở nhiều độ cao khác nhau
  const baseY=Math.random()*1.15+(r<0.38?0:r<0.64?0.15:r<0.82?0.45:0.1);
  g.position.y=baseY;
  g.userData.baseY=baseY;
  return {g,w,h,d:1.4,space:true};
}

// === TẠO VẬT CẢN TỔNG QUÁT ===
const obs=[];
function makeObs(){
  if(inSpace&&spaceT>0.4){
    return makeSpaceObs();
  }
  const r=Math.random();let g,w,h;
  if(r<.2){h=2.4;g=cactus(h,true);w=2.2;}
  else if(r<.3){h=3.2;g=cactus(h,true);w=2.4;}
  else if(r<.4){g=new THREE.Group();const a=cactus(2.2,false),b=cactus(2.8,false);a.position.x=-.8;b.position.x=.8;g.add(a,b);h=2.8;w=2.6;}
  else if(r<.48){g=fossil();h=1.8;w=3.2;}
  else if(r<.56){g=log();h=1.0;w=3.0;}
  else if(r<.64){g=eggNest();h=1.2;w=2.2;}
  else if(r<.72){g=rockStack();h=2.4;w=2.0;}
  else if(r<.80){g=pterodactyl();h=1.2;w=4.0;g.userData.flying=true;g.position.y=1.5+Math.random()*1.5;}
  else if(r<.88){g=thornBush();h=1.5;w=1.8;}
  else{g=stonePillar();h=3.0;w=1.4;}
  return{g,w,h,d:1.2};
}
function spawn(){
  const o=makeObs();
  o.g.position.set((Math.random()-.5)*.6,o.g.position.y||0,-100);
  o.g.userData.baseY=o.g.position.y;
  if(o.space){
    o.spinX=(Math.random()-.5)*1.6;
    o.spinY=(Math.random()-.5)*1.6;
    o.spinZ=(Math.random()-.5)*1.2;
  }
  scene.add(o.g);obs.push(o);
}

// === KHỦNG LONG ===
const dino=new THREE.Group();scene.add(dino);
const bodyG=new THREE.Group();dino.add(bodyG);
const GR=0x4f7a5a,DK=0x3b5f46,BL=0x7fa88a;
bx(1.4,1.5,2.2,GR,0,2,0,bodyG);
bx(1.1,.5,1.8,BL,0,1.45,-.1,bodyG);
const headG=new THREE.Group();headG.position.set(0,2.8,-.7);bodyG.add(headG);
bx(.9,1.2,.9,GR,0,.3,-.2,headG);
bx(1.1,.9,1.6,GR,0,.95,-.6,headG);
bx(.9,.3,1.1,DK,0,.5,-1.05,headG);
[-1,1].forEach(s=>{
  bx(.22,.26,.22,0xffffff,s*.58,1.15,-1,headG);
  bx(.12,.16,.12,0x111111,s*.66,1.15,-1.08,headG);
});
function arm(x){const p=new THREE.Group();p.position.set(x,2.2,-.9);bodyG.add(p);bx(.25,.25,.6,DK,0,-.1,-.2,p);return p;}
const armL=arm(-.8),armR=arm(.8);
const tail=new THREE.Group();tail.position.set(0,1.9,1.1);bodyG.add(tail);
bx(.9,.9,1.6,GR,0,0,.8,tail);
bx(.6,.6,1.5,DK,0,-.1,2.2,tail);
bx(.35,.35,1.2,DK,0,-.2,3.3,tail);
for(let i=0;i<3;i++)bx(.3,.4,.3,DK,0,2.9-i*.35,.5+i*.7,bodyG);
function leg(x){const p=new THREE.Group();p.position.set(x,1.3,.1);dino.add(p);bx(.55,1.3,.7,GR,0,-.65,0,p);bx(.6,.25,1,DK,0,-1.2,-.2,p);return p;}
const legL=leg(-.45),legR=leg(.45);
const shadow=new THREE.Mesh(new THREE.CircleGeometry(1,20),new THREE.MeshBasicMaterial({color:0x6b5a40,transparent:true,opacity:.32,fog:false,depthWrite:false}));
shadow.rotation.x=-Math.PI/2;shadow.position.y=.07;scene.add(shadow);

// === MŨ PHI HÀNH GIA & BÌNH DƯỠNG KHÍ CỦA KHỦNG LONG KHI VÀO VŨ TRỤ ===
const astroHelmet=new THREE.Group();
const helmetGlass=new THREE.Mesh(
  new THREE.SphereGeometry(1.25,10,8),
  new THREE.MeshLambertMaterial({color:0x70E0FF,transparent:true,opacity:0.45,depthWrite:false})
);
helmetGlass.position.set(0,0.85,-0.6);
astroHelmet.add(helmetGlass);
bx(1.7,0.22,1.9,0xD4AF37,0,0.2,-0.6,astroHelmet); // Vành vàng
headG.add(astroHelmet);
astroHelmet.visible=false;

const oxyTank1=bx(0.35,1.1,0.35,0xE0E0E0,-0.4,2.2,0.95,bodyG);
const oxyTank2=bx(0.35,1.1,0.35,0xE0E0E0,0.4,2.2,0.95,bodyG);
bx(0.18,0.15,0.18,0x00E5FF,-0.4,2.8,0.95,bodyG);
bx(0.18,0.15,0.18,0x00E5FF,0.4,2.8,0.95,bodyG);
const oxyGroup=[oxyTank1,oxyTank2,bodyG.children[bodyG.children.length-1],bodyG.children[bodyG.children.length-2]];
oxyGroup.forEach(m=>{m.visible=false;});

// === JETPACK PHẢN LỰC CHO CHẾ ĐỘ BAY ===
const jetMat=new THREE.MeshBasicMaterial({color:0x66E5FF,transparent:true,opacity:0.85,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
const jetCoreMat=new THREE.MeshBasicMaterial({color:0xFFFFFF,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
const jetGroup=new THREE.Group();
const jetL=new THREE.Mesh(new THREE.ConeGeometry(0.28,1.9,6),jetMat);
const jetR=new THREE.Mesh(new THREE.ConeGeometry(0.28,1.9,6),jetMat);
const jetL2=new THREE.Mesh(new THREE.ConeGeometry(0.12,1.1,5),jetCoreMat);
const jetR2=new THREE.Mesh(new THREE.ConeGeometry(0.12,1.1,5),jetCoreMat);
[jetL,jetR,jetL2,jetR2].forEach(m=>{m.rotation.x=Math.PI/2+0.6;jetGroup.add(m);});
jetL.position.set(-0.72,2.3,1.15);jetR.position.set(0.72,2.3,1.15);
jetL2.position.set(-0.72,2.3,1.15);jetR2.position.set(0.72,2.3,1.15);
const jetGlow=new THREE.Mesh(
  new THREE.SphereGeometry(0.55,8,6),
  new THREE.MeshBasicMaterial({color:0x55DDFF,transparent:true,opacity:0.4,blending:THREE.AdditiveBlending,depthWrite:false,fog:false})
);
jetGlow.position.set(0,2.35,1.25);jetGlow.scale.set(1.4,1.1,1.8);
jetGroup.add(jetGlow);
jetGroup.visible=false;
bodyG.add(jetGroup);

// === TRANG TRÍ (TỐI ƯU HÓA SỐ LƯỢNG MESH CHO MOBILE) ===
const decor=[];
function placeDecor(d,far){
  const side=Math.random()<.5?-1:1;
  const dy=(d.userData.y||0)-spaceT*25;
  d.position.set(side*(6+Math.random()*28),dy,far?-115-Math.random()*10:-110+Math.random()*120);
  d.visible=(spaceT<0.95);
}

function deadTree(){
  const g=new THREE.Group(),tc=0x5A4A30;
  bx(.3,3,.3,tc,0,1.5,0,g);
  bx(.15,1.3,.15,tc,.35,2.7,.1,g);g.children[1].rotation.z=0.4;
  bx(.12,.9,.12,tc,-.25,2.4,-.1,g);g.children[2].rotation.z=-0.5;
  g.userData.y=0;
  return g;
}

function grassClump(){
  const g=new THREE.Group(),gc=0x6BA854;
  for(let i=0;i<3;i++){
    const h=.4+Math.random()*.35;
    bx(.06,h,.06,gc,(i-1)*.2,h/2,(Math.random()-.5)*.2,g);
  }
  g.userData.y=0;
  return g;
}

function wildFlower(){
  const g=new THREE.Group();
  const colors=[0xFF6B8A,0xFFD93D,0xFF8C42,0xC084FC,0x60D394];
  bx(.04,.6,.04,0x4A8A3A,0,.3,0,g);
  const fc=colors[Math.floor(Math.random()*colors.length)];
  const flower=new THREE.Mesh(flowerGeo,M(fc));
  flower.position.y=.6;flower.scale.y=.6;g.add(flower);
  g.userData.y=0;
  return g;
}

const decorCount=isMobile?18:38;
for(let i=0;i<decorCount;i++){
  let d;
  const r=Math.random();
  if(r<.25){d=new THREE.Mesh(rockGeo,M(0x9a8870));const s=.4+Math.random()*1.1;d.scale.set(s*1.2,s*.8,s);d.rotation.y=Math.random()*3;d.position.y=s*.4;d.userData.y=s*.4;}
  else if(r<.45){d=cactus(1.6+Math.random()*1.6,Math.random()<.6);d.userData.y=0;}
  else if(r<.65){d=deadTree();}
  else if(r<.80){d=grassClump();}
  else if(r<.92){d=wildFlower();}
  else{
    d=new THREE.Mesh(bushSmallGeo,M(0x5A8A4A));
    d.position.y=.2;d.userData.y=.2;
  }
  placeDecor(d,false);scene.add(d);decor.push(d);
}

const ripples=[];
const ripplesCount=isMobile?10:22;
for(let i=0;i<ripplesCount;i++){
  const m=bx(1+Math.random()*1.2,.04,.4,0xcbb48d,0,.03,0,scene);
  m.position.set((Math.random()-.5)*8,.03,-Math.random()*110);ripples.push(m);
}

// Mảnh vỡ
const FL=.7,parts=[];
const partsCount=isMobile?12:22;
for(let i=0;i<partsCount;i++){const m=new THREE.Mesh(G(.3,.3,.3),M(i%3?0x5f8f4e:0xd9c5a1));m.visible=false;scene.add(m);parts.push({m,vx:0,vy:0,vz:0,life:0,s:1});}
function burst(x,y,z){for(let i=0;i<parts.length;i++){const p=parts[i];p.m.visible=true;p.m.position.set(x+(Math.random()-.5),y+Math.random(),z);p.vx=(Math.random()-.5)*14;p.vy=3+Math.random()*10;p.vz=-3+Math.random()*10;p.life=.9+Math.random()*.6;p.s=.6+Math.random()*1.1;}}

// === TRẠNG THÁI GAME ===
let state='ready',t=0,runT=0,dist=0,score=0,lastScoreColor=-1,speed=20,py=0,vy=0,jumpBuf=0,gap=40,overT=0,hi=0,shake=0,last=performance.now(),camYaw=0,jumpDir=1,air=0,land=0,baseFov=58,punch=0,dvy=0,dvz=0,hitObs=null;
try{hi=+localStorage.getItem('dino3d_hi')||0;}catch(e){}
$('hi').textContent=pad(hi);
const JUMP=23,GRAV=52,msg=$('msg');
// Ở vũ trụ chỉ đổi hoạt ảnh bay + góc quay; vật lý nhảy giữ nguyên y như trên mặt đất

function reset(){
  for(let i=0;i<obs.length;i++)scene.remove(obs[i].g);
  obs.length=0;
  dist=0;score=0;lastScoreColor=-1;speed=20;py=0;vy=0;gap=40;jumpBuf=0;
  camYaw=0;jumpDir=1;air=0;land=0;punch=0;dvy=0;dvz=0;shake=0;
  hitObs=null;
  dino.rotation.set(0,0,0);dino.position.set(0,0,0);dino.scale.set(1,1,1);
  bodyG.position.set(0,0,0);bodyG.rotation.set(0,0,0);
  headG.rotation.set(0,0,0);
  legL.rotation.set(0,0,0);legR.rotation.set(0,0,0);
  armL.rotation.set(0,0,0);armR.rotation.set(0,0,0);
  tail.rotation.set(0,0,0);
  jetGroup.visible=false;
  shadow.visible=true;shadow.position.set(-0.5,0.07,0);shadow.scale.set(1.5,2.4,1);shadow.material.opacity=.32;
  for(let i=0;i<parts.length;i++){parts[i].life=0;parts[i].m.visible=false;}

  // Trả mặt đất và đường chạy về trạng thái ban đầu
  ground.position.y=0;ground.visible=true;
  lane.position.y=0.02;lane.visible=true;
  edgeL.position.y=0.04;edgeL.visible=true;
  edgeR.position.y=0.04;edgeR.visible=true;
  for(let i=0;i<dashes.length;i++){dashes[i].position.y=0.05;dashes[i].position.z=-i*dashSpacing;dashes[i].visible=true;}

  // Reset trạng thái không gian về mặt đất ban đầu
  inSpace=false;
  spaceT=0;
  scene.fog.near=30;
  scene.fog.far=130;
  hemiLight.color.setHex(0xffffff);
  moonLight.color.setHex(0x98C0FF);
  starsMat.opacity=0;
  astroHelmet.visible=false;
  oxyGroup.forEach(m=>{m.visible=false;});
  spaceGroup.visible=false;
  planetRing.material.opacity=0;
  neb1.material.opacity=0;neb2.material.opacity=0;neb3.material.opacity=0;
  dustMat.opacity=0;speedLineMat.opacity=0;
  sunSphere.scale.set(1,1,1);
  moonSphere.scale.set(1,1,1);
  for(let i=0;i<mountains.length;i++){mountains[i].visible=true;mountains[i].position.y=mountains[i].userData.baseH;}
  for(let i=0;i<snowCaps.length;i++){snowCaps[i].visible=true;snowCaps[i].position.y=snowCaps[i].userData.baseH;}
  for(let i=0;i<decor.length;i++){decor[i].visible=true;decor[i].position.y=decor[i].userData.y||0;}
  for(let i=0;i<ripples.length;i++){ripples[i].visible=true;ripples[i].position.y=0.03;}
  for(let i=0;i<clouds.length;i++){clouds[i].visible=true;}
  $('spaceBanner').classList.remove('show');

  $('sc').textContent=pad(0);msg.style.display='none';state='play';
  startBgm();
}
function die(o){
  playGameOverSound();
  state='over';overT=0;shake=.7;punch=1;hitObs=o||null;dvy=10;dvz=9;
  burst(o?o.g.position.x:0,py+1.6,o?o.g.position.z:-1.5);
  const fl=$('fl');fl.style.transition='none';fl.style.opacity='.5';void fl.offsetWidth;fl.style.transition='opacity .6s';fl.style.opacity='0';
  if(score>hi){hi=score;$('hi').textContent=pad(hi);try{localStorage.setItem('dino3d_hi',hi);}catch(e){}}
  $('t').textContent='Game over';
  $('s').textContent='Điểm '+score+'. Chạm để chơi lại .Được làm bởi: Minh Long';
  setTimeout(()=>{if(state==='over')msg.style.display='flex';},700);
}
function act(){
  initAudio();
  if(state==='ready'){state='play';msg.style.display='none';startBgm();}
  else if(state==='over'){if(overT>.5)reset();else return;}
  jumpBuf=.14;
}
addEventListener('pointerdown',e=>{e.preventDefault();act();},{passive:false});
addEventListener('keydown',e=>{
  if(e.code==='Space'||e.code==='ArrowUp'||e.code==='Enter'){e.preventDefault();if(!e.repeat)act();}
  // Phím tắt 'T' hoặc 'G' để thử nghiệm nhanh mốc 10.000 điểm
  if(e.code==='KeyT'||e.code==='KeyG'){triggerSpaceTest();}
});

// Cho phép nhấp vào ô Điểm để nhảy nhanh tới 10.000 điểm xem thử hiệu ứng
function triggerSpaceTest(){
  if(state!=='play')act();
  dist=(SPACE_THRESHOLD-5)/0.4;
  score=Math.floor(dist*0.4);
  $('sc').textContent=pad(score);
}
// $('scoreCard').addEventListener('pointerdown',e=>{e.stopPropagation();triggerSpaceTest();});

function resize(){
  const w=innerWidth,h=innerHeight,a=w/h;
  const dpr=isMobile?1.0:1.5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,dpr));
  renderer.setSize(w,h,false);
  cam.aspect=a;
  baseFov=a<.8?70:a<1.3?62:54;
  cam.fov=baseFov;
  cam.updateProjectionMatrix();
}
addEventListener('resize',resize);resize();

// === VÒNG LẶP CHÍNH (TÍCH HỢP CHẾ ĐỘ BAY KHI ĐẠT 10.000 ĐIỂM) ===
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min((now-last)/1000,.035);last=now;t+=dt;
  let mv=0;

  // Tiến trình chuyển cảnh được tính trước để vật lý bay bám theo mượt mà
  if(inSpace&&spaceT<1.0)spaceT=Math.min(1.0,spaceT+dt*0.4);
  if(!inSpace&&spaceT>0.0)spaceT=Math.max(0.0,spaceT-dt*0.8);
  const sp=smooth01(spaceT);

  if(state==='play'){
    const prevScore=score;
    score=Math.floor(dist*.4);
    if(Math.floor(score/100)>Math.floor(prevScore/100)) playScoreSound();
    speed=20+Math.min(32,score*.02);
    mv=speed*dt;dist+=mv;
    gap-=mv;if(gap<=0){spawn();gap=speed*(1.1+Math.random())+6;}
    // === LỐI CHƠI GIỮ NGUYÊN: chạm để nhảy với đúng lực nhảy/trọng lực như mặt đất ===
    // Trong vũ trụ chỉ đổi âm thanh sang jetpack và hoạt ảnh sang tư thế bay
    if(jumpBuf>0){jumpBuf-=dt;if(py<=0){vy=JUMP;py=.01;jumpBuf=0;jumpDir=-jumpDir;if(spaceT>0.3)playFlySound();else playJumpSound();}}
    if(py>0){vy-=GRAV*dt;py+=vy*dt;if(py<=0){py=0;vy=0;land=.18;shake=Math.max(shake,.07);}}
    for(let i=0;i<obs.length;i++){
      const o=obs[i];
      o.g.position.z+=mv;
      const z=o.g.position.z;
      const baseY=o.g.position.y;
      if(z+o.d/2>-1.5&&z-o.d/2<1&&Math.abs(o.g.position.x)<o.w*.35+.5&&py<(baseY+o.h)*.85&&py+3.5>baseY){die(o);break;}
    }
    for(let i=obs.length-1;i>=0;i--)if(obs[i].g.position.z>12){scene.remove(obs[i].g);obs.splice(i,1);}
    $('sc').textContent=pad(score);
  }

  // === KIỂM TRA MỐC 10.000 ĐIỂM ĐỂ KÍCH HOẠT CHẾ ĐỘ BAY ===
  if(score>=SPACE_THRESHOLD&&!inSpace){
    inSpace=true;
    playWarpSound();
    // Dọn vật cản mặt đất để chuyển cảnh sạch sẽ, sau đó vật cản vũ trụ sẽ bay tới
    for(let i=0;i<obs.length;i++)scene.remove(obs[i].g);
    obs.length=0;gap=Math.max(gap,70);
    // Chớp sáng siêu không gian (Warp Flash)
    const wf=$('warpFlash');
    wf.style.transition='none';
    wf.style.opacity='0.95';
    void wf.offsetWidth;
    wf.style.transition='opacity 1.2s ease-out';
    wf.style.opacity='0';
    // Hiện banner thông báo hoành tráng
    const sb=$('spaceBanner');
    sb.classList.add('show');
    setTimeout(()=>{sb.classList.remove('show');},4500);
    // Trang bị mũ phi hành gia, bình dưỡng khí và jetpack
    astroHelmet.visible=true;
    oxyGroup.forEach(m=>{m.visible=true;});
    jetGroup.visible=true;
  }

  // === CẬP NHẬT MÔI TRƯỜNG & CHU KỲ (NGÀY/ĐÊM HOẶC KHÔNG GIAN) ===
  const tod=getTimeOfDay(score);
  const bl=tod.blend;
  const isNight=(tod.phase==='night'||(tod.phase==='sunset'&&bl>0.5))?1:0;

  if(score!==lastScoreColor||spaceT>0){
    lastScoreColor=score;
    const phA=timePhases[tod.phase],phB=timePhases[tod.next];
    let curSky=lerpColor(phA.sky,phB.sky,bl);
    let curFog=lerpColor(phA.fog,phB.fog,bl);
    let curGround=lerpColor(phA.ground,phB.ground,bl);
    let curLane=lerpColor(phA.lane,phB.lane,bl);
    let curSunC=lerpColor(phA.sunC,phB.sunC,bl);
    let curSunI=lerpVal(phA.sunI,phB.sunI,bl);
    let curHemiI=lerpVal(phA.hemiI,phB.hemiI,bl);
    let curMountain=lerpColor(phA.mountainC,phB.mountainC,bl);

    // Khi bước vào vũ trụ: bầu trời tối dần thành không gian mở, không còn đường chạy
    if(sp>0){
      curSky=lerpColor(curSky,0x0B0720,sp);
      curFog=lerpColor(curFog,0x1A1140,sp);
      curGround=lerpColor(curGround,0x100C2A,sp);
      curLane=lerpColor(curLane,0x281F4E,sp);
      curSunC=lerpColor(curSunC,0xEDF4FF,sp);
      curSunI=lerpVal(curSunI,1.0,sp);
      curHemiI=lerpVal(curHemiI,1.25,sp);
      // Đẩy xa sương mù để nhìn rõ vật cản bay tới
      scene.fog.near=lerpVal(30,90,sp);
      scene.fog.far=lerpVal(130,280,sp);
    }else{
      edgeMat.color.setHex(isNight?0xDCE8FF:0xE8DCC0);
      dashMat.color.setHex(isNight?0x88A6C5:0xD0C098);
      scene.fog.near=30;
      scene.fog.far=130;
    }

    scene.background.setHex(curSky);
    scene.fog.color.setHex(curFog);
    groundMat.color.setHex(curGround);
    laneMat.color.setHex(curLane);
    mountainMat.color.setHex(curMountain);
    sun.color.setHex(curSunC);
    sun.intensity=curSunI;
    hemiLight.intensity=curHemiI;
    hemiLight.groundColor.setHex(curGround);

    cloudMat.opacity=0.85*(tod.phase==='night'?0.45:tod.phase==='sunset'?0.7:1.0)*(1-sp);
  }

  // === CHUYỂN CẢNH: MẶT ĐẤT CHÌM XUỐNG, KHÔNG GIAN MỞ HIỆN RA ===
  if(sp>0){
    const earthVisible=sp<0.6;
    const sink=sp*70;

    // Bỏ hoàn toàn đường chạy khi bay vào vũ trụ
    ground.position.y=-sink;ground.visible=earthVisible;
    lane.position.y=0.02-sink;lane.visible=earthVisible;
    edgeL.position.y=0.04-sink;edgeL.visible=earthVisible;
    edgeR.position.y=0.04-sink;edgeR.visible=earthVisible;
    for(let i=0;i<dashes.length;i++){dashes[i].position.y=0.05-sink;dashes[i].visible=earthVisible;}

    for(let i=0;i<mountains.length;i++){
      mountains[i].position.y=mountains[i].userData.baseH-sp*40;
      mountains[i].visible=earthVisible;
    }
    for(let i=0;i<snowCaps.length;i++){
      snowCaps[i].position.y=snowCaps[i].userData.baseH-sp*40;
      snowCaps[i].visible=earthVisible;
    }
    for(let i=0;i<decor.length;i++){
      decor[i].position.y=(decor[i].userData.y||0)-sp*30;
      decor[i].visible=earthVisible;
    }
    for(let i=0;i<ripples.length;i++){
      ripples[i].position.y=0.03-sp*30;
      ripples[i].visible=earthVisible;
    }
    for(let i=0;i<clouds.length;i++){
      clouds[i].visible=earthVisible;
    }
    shadow.visible=sp<0.35;

    // Mặt trời & Mặt trăng thu nhỏ biến mất nhường chỗ cho vũ trụ
    sunSphere.scale.setScalar(Math.max(0.001,1-sp));
    moonSphere.scale.setScalar(Math.max(0.001,1-sp));
    sunSphere.visible=earthVisible&&(sunSphere.position.y>2);
    moonSphere.visible=earthVisible&&(moonSphere.position.y>2);

    // Vũ trụ hiện dần
    spaceGroup.visible=(sp>0.1);
    planetRing.material.opacity=0.75*sp;
    neb1.material.opacity=0.25*sp;
    neb2.material.opacity=0.2*sp;
    neb3.material.opacity=0.16*sp;
    dustMat.opacity=0.65*sp;
    speedLineMat.opacity=0.32*sp;

    // Các thiên thể xoay chậm
    planetSphere.rotation.y+=dt*0.03;
    earthSphere.rotation.y+=dt*0.06;
    planetFar1.rotation.y+=dt*0.04;
    planetFar2.rotation.y+=dt*0.05;
    planetRing.rotation.z+=dt*0.08;
    neb1.rotation.z+=dt*0.02;
    neb2.rotation.z-=dt*0.02;
    neb3.rotation.z+=dt*0.015;
    dust.rotation.z+=dt*0.006;

    // Thiên thạch nền và vệt tốc độ trôi chậm rãi (nền tĩnh lặng, không lao nhanh)
    for(let i=0;i<driftRocks.length;i++){
      const r=driftRocks[i];
      r.position.z+=(r.userData.speed+speed*0.12)*dt;
      r.rotation.x+=r.userData.spinX*dt;
      r.rotation.y+=r.userData.spinY*dt;
      if(r.position.z>15){
        r.position.z=-175-Math.random()*40;
        r.position.x=(Math.random()-0.5)*70;
        r.position.y=-6+Math.random()*38;
      }
    }
    const lineSpeed=state==='play'?speed*0.35+16:12;
    for(let i=0;i<speedLines.length;i++){
      const l=speedLines[i];
      const ls=lineSpeed*(0.75+(l.userData.speed%10)/20);
      l.position.z+=ls*dt;
      if(l.position.z>15){
        l.position.z=-170-Math.random()*40;
        l.position.x=(Math.random()-0.5)*90;
        l.position.y=-10+Math.random()*50;
      }
    }
  }else{
    sunSphere.visible=(sunSphere.position.y>2);
    moonSphere.visible=(moonSphere.position.y>2);
  }

  // Vị trí mặt trời / mặt trăng
  const dayPos=(score%DAY_CYCLE)/DAY_CYCLE;
  const theta=(dayPos-0.2)*Math.PI*2;
  const sunX=Math.sin(theta)*115;
  const sunY=Math.cos(theta)*70+10;
  sunSphere.position.set(sunX,sunY,-190);
  sunSphere.material.color.setHex((dayPos>=0.38&&dayPos<0.58)?0xFF7722:(dayPos>=0.88)?0xFFAA44:0xFFEE55);

  const moonTheta=theta+Math.PI;
  const moonX=Math.sin(moonTheta)*110;
  const moonY=Math.cos(moonTheta)*65+10;
  moonSphere.position.set(moonX,moonY,-190);

  // Ánh sáng theo chu kỳ & ánh sáng viền tinh vân không gian
  if(sp>0){
    // Đèn viền xanh ngọc Neon từ tinh vân giúp khối 3D sắc nét
    moonLight.intensity=lerpVal(moonLight.intensity,0.7*sp,Math.min(1,dt*2));
    moonLight.color.setHex(lerpColor(0x98C0FF,0x00E5FF,sp));
    moonLight.position.set(-6,15,-10);
    // Vị trí ánh sáng chính ổn định trong vũ trụ, không bị lắc đảo theo chu kỳ ngày đêm
    const targetSunX=lerpVal(sunX*0.15,8,sp);
    const targetSunY=lerpVal(Math.max(10,sunY*0.2),16,sp);
    sun.position.set(targetSunX,targetSunY,20);
  }else{
    moonLight.intensity=lerpVal(moonLight.intensity,isNight?0.45:0,Math.min(1,dt*2));
    moonLight.color.setHex(0x98C0FF);
    moonLight.position.set(moonX*0.15,Math.max(8,moonY*0.2),15);
    sun.position.set(sunX*0.15,Math.max(10,sunY*0.2),20);
  }

  // Sao đêm & sao vũ trụ (lấp lánh cực đại trong không gian)
  const starTarget=(sp>0)?(0.95):(tod.phase==='night')?0.9:(tod.phase==='sunset'&&bl>0.6)?0.4:(tod.phase==='dawn'&&bl<0.4)?0.3:0;
  starsMat.opacity+=(starTarget-starsMat.opacity)*Math.min(1,dt*2);

  if(state==='over')overT+=dt;
  const ts=state==='over'?(overT<.08?0:Math.min(1,.25+(overT-.08)*1.2)):1,sd=dt*ts;

  if(mv>0&&sp<0.6){
    for(let i=0;i<decor.length;i++){
      decor[i].position.z+=mv;
      if(decor[i].position.z>12)placeDecor(decor[i],true);
    }
    for(let i=0;i<ripples.length;i++){
      ripples[i].position.z+=mv;
      if(ripples[i].position.z>10){ripples[i].position.z=-110;ripples[i].position.x=(Math.random()-.5)*8;}
    }
    const dashLoop=dashCount*dashSpacing;
    for(let i=0;i<dashes.length;i++){
      dashes[i].position.z+=mv;
      if(dashes[i].position.z>10)dashes[i].position.z-=dashLoop;
    }
  }

  // Mây trôi
  if(sp<0.6){
    for(let i=0;i<clouds.length;i++){
      clouds[i].position.x+=clouds[i].userData.speed*dt;
      if(clouds[i].position.x>100)clouds[i].position.x=-100;
    }
  }

  // Cánh vỗ / vật cản vũ trụ xoay tumbling khi lao tới
  for(let i=0;i<obs.length;i++){
    const o=obs[i];
    if(o.g.userData.flying){
      const wt=t*8;
      if(o.g.userData.wingL){
        o.g.userData.wingL.rotation.z=Math.sin(wt)*0.4;
        o.g.userData.wingR.rotation.z=-Math.sin(wt)*0.4;
      }
      const by=o.g.userData.baseY||0;
      o.g.position.y=by+Math.sin(t*3)*0.35;
    }
    if(o.space&&spaceT>0.05){
      const sf=dt*Math.min(1,spaceT*1.5);
      o.g.rotation.x+=o.spinX*sf;
      o.g.rotation.y+=o.spinY*sf;
      o.g.rotation.z+=o.spinZ*sf;
    }
  }

  for(let i=0;i<parts.length;i++){
    const p=parts[i];
    if(p.life<=0)continue;
    p.life-=sd;p.vy-=30*sd;
    const q=p.m.position;q.x+=p.vx*sd;q.y+=p.vy*sd;q.z+=p.vz*sd;
    if(q.y<.15){q.y=.15;p.vy*=-.3;p.vx*=.7;p.vz*=.7;}
    p.m.rotation.x+=sd*8;p.m.rotation.z+=sd*6;
    p.m.scale.setScalar(Math.max(.001,Math.min(1,p.life/.4)*p.s));
    if(p.life<=0)p.m.visible=false;
  }

  // Hoạt ảnh khủng long
  if(state==='over'){
    jetGroup.visible=false;
    dvy-=40*sd;dino.position.y+=dvy*sd;dino.position.z+=dvz*sd;
    if(dvy<0&&dino.position.y<FL){dino.position.y=FL;dvy=dvy<-4?-dvy*.3:0;dvz*=.55;}
    if(dino.position.y===FL&&dvy===0)dvz*=Math.pow(.02,sd);
    dino.rotation.x+=(1.45-dino.rotation.x)*Math.min(1,sd*5);
    dino.rotation.z+=(.35-dino.rotation.z)*Math.min(1,sd*4);
    const fl=Math.max(0,1-overT*1.5);
    legL.rotation.x=Math.sin(overT*22)*.9*fl-.3;legR.rotation.x=Math.sin(overT*22+2)*.9*fl-.3;
    armL.rotation.x=armR.rotation.x=1.2*fl+.2;
    headG.rotation.x=.3;
    dino.scale.set(1,1,1);
    if(hitObs)hitObs.g.rotation.x+=(-1.3-hitObs.g.rotation.x)*Math.min(1,sd*5);
  }else{
    runT+=dt*(state==='play'?9+speed*.25:0);
    air+=((py>0?1:0)-air)*Math.min(1,dt*14);
    land=Math.max(0,land-dt);
    const fb=smooth01((sp-0.12)/0.7);
    const s=Math.sin(runT),k=1-air,L=(a,b)=>a+(b-a)*air;

    // Pose chạy trên mặt đất
    const runLegL=L(s*.9,-.9),runLegR=L(-s*.9,.6);
    const runArmL=L(-s*.9,1),runArmR=L(s*.9,1);
    const runHead=L(Math.sin(runT*2)*.07,.28);
    const runTilt=Math.max(-.3,Math.min(.3,vy*.012));
    const runBob=state==='play'&&py<=0?Math.abs(s)*.14:Math.sin(t*3)*.04;

    // Pose bay: chân duỗi về sau, đầu ngẩng nhẹ, thân nghiêng theo vận tốc
    const flyWave=Math.sin(t*2.6);
    const flyLegL=-1.15+flyWave*.06,flyLegR=-1.05-flyWave*.06;
    const flyArmL=-1.25+Math.sin(t*2.2)*.08,flyArmR=-1.25+Math.sin(t*2.2+1.2)*.08;
    const flyHead=.18+Math.sin(t*1.8)*.03;
    const flyTilt=-.12+Math.max(-.18,Math.min(.18,vy*.008));
    const flyBob=.06+Math.sin(t*2.2)*.05;

    // Trộn mượt giữa chạy và bay
    legL.rotation.x=runLegL+(flyLegL-runLegL)*fb;
    legR.rotation.x=runLegR+(flyLegR-runLegR)*fb;
    armL.rotation.x=runArmL+(flyArmL-runArmL)*fb;
    armR.rotation.x=runArmR+(flyArmR-runArmR)*fb;
    headG.rotation.x=runHead+(flyHead-runHead)*fb;
    dino.rotation.x=runTilt+(flyTilt-runTilt)*fb;
    bodyG.position.y=runBob+(flyBob-runBob)*fb;
    bodyG.rotation.z=s*.06*k*(1-fb)+Math.sin(t*1.8)*.04*fb;
    bodyG.rotation.y=s*.05*k*(1-fb)+Math.sin(t*1.4)*.035*fb;
    tail.rotation.y=Math.sin(runT*.8+(state==='ready'?t*2:0))*.4*k*(1-fb)+Math.sin(t*2.2)*.18*fb;
    tail.rotation.x=L(Math.sin(runT*2)*.06,-.35)*(1-fb)+(-.15+Math.sin(t*2.4)*.06)*fb;

    const sq=(land/.18)*(1-fb),st=py>0?.08*Math.min(1,Math.abs(vy)/JUMP)*(1-fb):0;
    dino.scale.set(1+.1*sq-st*.5,1-.15*sq+st,1+.1*sq-st*.5);
    dino.position.y=py+fb*(0.06+Math.sin(t*2.2)*0.05);

    // Jetpack phản lực
    if(fb>0.01){
      jetGroup.visible=true;
      jetGroup.position.y=Math.sin(t*9)*.02;
      const thrust=Math.max(.6,Math.min(1.8,1+vy*.1));
      const boost=(.85+Math.random()*.4)*thrust;
      jetL.scale.set(1,boost,1);jetR.scale.set(1,boost,1);
      jetL2.scale.set(1,(.75+Math.random()*.5)*thrust,1);jetR2.scale.set(1,(.75+Math.random()*.5)*thrust,1);
      jetGlow.scale.set(1.4,1.1,1.6+Math.random()*.6+Math.max(0,vy)*.06);
    }else{
      jetGroup.visible=false;
    }
  }
  const sh=1/(1+dino.position.y*.25);
  shadow.position.z=dino.position.z;shadow.position.x=-.5;shadow.position.y=0.07-sp*70;
  shadow.scale.set(1.5*sh,2.4*sh,1);shadow.material.opacity=.32*sh*(1-sp);

  // Camera
  const yawTarget=(state==='play'&&py>0)?.16:0;
  camYaw+=(yawTarget-camYaw)*Math.min(1,dt*4);
  const cj=Math.abs(camYaw)/.16,ca=Math.cos(camYaw),sa=Math.sin(camYaw),dx=3.2,dz=11+sp*2.2;
  // Vũ trụ: đổi góc quay (xa hơn, cao hơn, FOV rộng hơn) nhưng vẫn bám độ cao nhảy như mặt đất
  cam.position.set(dx*ca+dz*sa,4.6+py*.3+cj*.3+sp*.9,-dx*sa+dz*ca);
  if(shake>0){shake-=dt;cam.position.x+=(Math.random()-.5)*shake*1.5;cam.position.y+=(Math.random()-.5)*shake;}
  cam.lookAt(-.3*(1-cj*.3),1.9+py*.3+sp*.8,-6*(1-cj*.3));
  cam.rotateZ(camYaw*.06);
  punch=Math.max(0,punch-dt*2.5);
  const f=baseFov+cj*2-punch*7+sp*4;if(Math.abs(cam.fov-f)>.05){cam.fov=f;cam.updateProjectionMatrix();}
  renderer.render(scene,cam);
}
requestAnimationFrame(frame);
})();
