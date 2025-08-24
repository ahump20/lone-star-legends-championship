(function(){
  if (!window.THREE) return;
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const c = document.getElementById('blaze-hero'); if(!c) return;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 100);
  cam.position.set(0,0,6);
  const r = new THREE.WebGLRenderer({canvas:c, alpha:true, antialias:true});
  r.setSize(innerWidth,innerHeight); r.setPixelRatio(Math.min(devicePixelRatio,2));
  const amb = new THREE.AmbientLight(0xffffff,.45);
  const key = new THREE.DirectionalLight(0xfff8dc,.9); key.position.set(2,3,4);
  const rim = new THREE.DirectionalLight(0xFF6B35,.6); rim.position.set(-3,-2,-4);
  scene.add(amb,key,rim);
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(1.15,40,40),
    new THREE.MeshStandardMaterial({color:0xffffff,roughness:.45,metalness:.1})
  );
  scene.add(ball);
  const mkStitch = (path)=> new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path),64,.02,8,false),
    new THREE.MeshStandardMaterial({color:0xFF6B35,emissive:0xFF6B35,emissiveIntensity:.15,roughness:.6})
  );
  scene.add(mkStitch([new THREE.Vector3(-.9,.7,.45),new THREE.Vector3(0,1.1,0),new THREE.Vector3(.9,.7,.45)]));
  scene.add(mkStitch([new THREE.Vector3(-.9,-.7,.45),new THREE.Vector3(0,-1.1,0),new THREE.Vector3(.9,-.7,.45)]));
  const pGeo=new THREE.BufferGeometry(), COUNT=prefersReduced?600:2000;
  const pos=new Float32Array(COUNT*3);
  for(let i=0;i<COUNT;i++){pos[i*3]=(Math.random()-0.5)*16;pos[i*3+1]=(Math.random()-0.5)*10;pos[i*3+2]=(Math.random()-0.5)*14;}
  pGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const pts=new THREE.Points(pGeo,new THREE.PointsMaterial({size:.01,color:0xffffff,transparent:true,opacity:.45}));
  scene.add(pts);
  let mx=0,my=0; addEventListener('mousemove',e=>{mx=(e.clientX/innerWidth-.5);my=(e.clientY/innerHeight-.5);},{passive:true});
  function tick(){ball.rotation.y+=.003;ball.rotation.x+=.002;
    if(!prefersReduced){ball.rotation.y+=mx*.01;ball.rotation.x+=my*.01;pts.rotation.y+=mx*.02;pts.rotation.x+=my*.01;}
    r.render(scene,cam); requestAnimationFrame(tick);
  } tick();
  addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();r.setSize(innerWidth,innerHeight);});
})();