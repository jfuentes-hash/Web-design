/* ============================================================
   scene.js — fondo 3D del hero: "puente Peninsula Iberica -> EE.UU."
   Globo estilizado, dos nodos luminosos, arco de luz con pulso en
   bucle, particulas y FogExp2 en tonos de marca. La camara recorre
   el arco con el scroll (lerp). Salvaguardas: sin WebGL en movil,
   respeta prefers-reduced-motion, pixelRatio capado, resize, try/catch.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('hero-canvas');
  var hero = document.querySelector('.hero');
  if (!canvas || !hero) return;

  // No inicializar WebGL en movil: dejar fallback CSS.
  if (window.innerWidth < 900) return;
  if (typeof THREE === 'undefined') return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    var COLORS = getComputedStyle(document.documentElement);
    var purpleDeep = (COLORS.getPropertyValue('--purple-deep') || '#3a1e68').trim();
    var purple = (COLORS.getPropertyValue('--purple') || '#753bbd').trim();
    var green = (COLORS.getPropertyValue('--green') || '#44944a').trim();

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(new THREE.Color(purpleDeep), 0.085);

    var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0.4, 6.2);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.classList.add('webgl-on');

    /* --- Globo estilizado (wireframe sutil) --- */
    var globeGroup = new THREE.Group();
    var globeGeo = new THREE.SphereGeometry(2, 36, 28);
    var globeMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(purple),
      wireframe: true,
      transparent: true,
      opacity: 0.16
    });
    var globe = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globe);

    var globeFill = new THREE.Mesh(
      new THREE.SphereGeometry(1.97, 36, 28),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(purpleDeep), transparent: true, opacity: 0.55 })
    );
    globeGroup.add(globeFill);
    scene.add(globeGroup);

    /* --- Convertir lat/lon a posicion en la esfera --- */
    function latLonToVec(lat, lon, r) {
      var phi = (90 - lat) * Math.PI / 180;
      var theta = (lon + 180) * Math.PI / 180;
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    }

    // Region peninsula iberica (~40N, -4O) y EE.UU. (~39N, -98O)
    var iberia = latLonToVec(40, -4, 2);
    var usa = latLonToVec(39, -98, 2);

    function makeNode(pos, colorHex) {
      var g = new THREE.Group();
      var core = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 16, 16),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex) })
      );
      var halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 16, 16),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex), transparent: true, opacity: 0.3 })
      );
      g.add(core); g.add(halo);
      g.position.copy(pos);
      g.userData.halo = halo;
      return g;
    }
    var nodeA = makeNode(iberia, green);
    var nodeB = makeNode(usa, purple);
    globeGroup.add(nodeA); globeGroup.add(nodeB);

    /* --- Arco de luz entre ambos nodos --- */
    var mid = iberia.clone().add(usa).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(3.1); // elevar el arco fuera de la esfera
    var curve = new THREE.QuadraticBezierCurve3(iberia.clone(), mid, usa.clone());
    var arcPoints = curve.getPoints(80);
    var arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
    var arcMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(green),
      transparent: true,
      opacity: 0.7
    });
    var arc = new THREE.Line(arcGeo, arcMat);
    globeGroup.add(arc);

    /* --- Pulso que viaja por el arco --- */
    var pulse = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff') })
    );
    globeGroup.add(pulse);

    /* --- Particulas sutiles --- */
    var pCount = 320;
    var pPos = new Float32Array(pCount * 3);
    for (var i = 0; i < pCount; i++) {
      var r = 4 + Math.random() * 5;
      var th = Math.random() * Math.PI * 2;
      var ph = Math.acos(2 * Math.random() - 1);
      pPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pPos[i * 3 + 1] = r * Math.cos(ph);
      pPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: new THREE.Color(purple),
      size: 0.035,
      transparent: true,
      opacity: 0.5
    }));
    scene.add(particles);

    // Orientar el grupo para que el arco mire a la camara
    globeGroup.rotation.y = -1.0;
    globeGroup.rotation.x = 0.15;

    /* --- Scroll: la camara recorre el arco (suavizado con lerp) --- */
    var scrollTarget = 0;
    var scrollCurrent = 0;
    function onScroll() {
      var rect = hero.getBoundingClientRect();
      var total = rect.height + window.innerHeight;
      var p = 1 - (rect.bottom / total);
      scrollTarget = Math.max(0, Math.min(1, p));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* --- Resize --- */
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    /* --- Bucle --- */
    var t = 0;
    var pulseT = 0;
    function animate() {
      requestAnimationFrame(animate);
      t += 0.0025;

      if (!reduced) {
        globeGroup.rotation.y = -1.0 + Math.sin(t) * 0.12 + t * 0.05;
        particles.rotation.y += 0.0004;
      }

      // pulso viajando por el arco en bucle
      pulseT += reduced ? 0.0 : 0.006;
      var u = pulseT % 1;
      var pp = curve.getPoint(u);
      pulse.position.copy(pp);
      pulse.material.opacity = Math.sin(u * Math.PI);

      // halos latiendo
      var hs = 1 + Math.sin(t * 6) * 0.18;
      nodeA.userData.halo.scale.setScalar(hs);
      nodeB.userData.halo.scale.setScalar(1 + Math.sin(t * 6 + 1.5) * 0.18);

      // camara recorre suavemente segun scroll
      scrollCurrent += (scrollTarget - scrollCurrent) * 0.06;
      camera.position.x = Math.sin(scrollCurrent * 1.2) * 2.2;
      camera.position.y = 0.4 + scrollCurrent * 0.8;
      camera.position.z = 6.2 - scrollCurrent * 1.6;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    animate();
  } catch (e) {
    // Si WebGL falla, el contenido sigue legible y el fallback CSS permanece visible.
    document.body.classList.remove('webgl-on');
  }
})();
