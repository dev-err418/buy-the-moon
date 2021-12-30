var renderer, moon, world, mouse, scene, camera, arcs;

var textureURL =
  "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/lroc_color_poles_1k.jpg";
// var textureURL = "./assets/moon.tif";
var textureURL = "./assets/moon_small.jpg";
// var displacementURL =
// "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/ldem_3_8bit.jpg";
// var displacementURL = "./assets/texture.tif";
var displacementURL = "./assets/texture_small.jpg";
// var worldURL = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/hipp8_s.jpg";
var worldURL = "./assets/sky.png";

//loader
var loadingScreen = {
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(
    90,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  ),
  box: new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshBasicMaterial({ color: 0x4444ff })
  ),
};

var loadingManager = null;
var RESOURCES_LOADED = false;

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  //loading start
  // loadingScreen.box.position.set(0, 0, 5);
  // loadingScreen.camera.lookAt(loadingScreen.box.position);
  // loadingScreen.scene.add(loadingScreen.box);
  loadingManager = new THREE.LoadingManager();
  loadingManager.onProgress = function (item, loaded, total) {
    console.log(item, loaded, total);
  };
  loadingManager.onLoad = function () {
    console.log("loaded all resources");
    RESOURCES_LOADED = true;
  };
  //end loading

  renderer = new THREE.WebGLRenderer();

  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.minDistance = 3.5;
  controls.maxDistance = 10;

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  var geometry = new THREE.SphereGeometry(2, 60, 60);

  var textureLoader = new THREE.TextureLoader(loadingManager);
  var texture = textureLoader.load(textureURL);
  var displacementMap = textureLoader.load(displacementURL);
  var worldTexture = textureLoader.load(worldURL);

  var material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    map: texture,
    displacementMap: displacementMap,
    displacementScale: 0.1,
    bumpMap: displacementMap,
    bumpScale: 0.04,
    reflectivity: 0,
    shininess: 0,
  });

  moon = new THREE.Mesh(geometry, material);
  moon.name = "moon";

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(-100, 10, 50);
  scene.add(light);

  hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.1);
  hemiLight.color.setHSL(0.6, 1, 0.6);
  hemiLight.groundColor.setHSL(0.095, 1, 0.75);
  hemiLight.position.set(0, 0, 0);
  scene.add(hemiLight);

  var worldGeometry = new THREE.SphereGeometry(1000, 60, 60);
  var worldMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: worldTexture,
    side: THREE.BackSide,
  });
  world = new THREE.Mesh(worldGeometry, worldMaterial);
  scene.add(world);

  //func to draw in x y z from lat and lon
  function calcPosFromLatLonRad(lat, lon, radius) {
    var phi = (90 - lat) * (Math.PI / 180);
    var theta = (lon + 180) * (Math.PI / 180);

    x = -(radius * Math.sin(phi) * Math.cos(theta));
    z = radius * Math.sin(phi) * Math.sin(theta);
    y = radius * Math.cos(phi);

    return [x, y, z];
  }

  //data
  const apollo11 = { lat: 0.67416, lon: 23.47314, color: "#845ec1" };
  const apollo12 = { lat: -3.01239, lon: -23.42157, color: "#d65db2" };
  const apollo14 = { lat: -3.651711, lon: -17.494815, color: "#eb6b8f" };
  const apollo15 = { lat: 26.1008, lon: 3.6527, color: "#ef946f" };
  const apollo16 = { lat: -8.9913, lon: 15.5144, color: "#f6c660" };
  const apollo17 = { lat: 20.1653, lon: 30.7658, color: "#f9f771" };
  const apollos = [apollo11, apollo12, apollo14, apollo15, apollo16, apollo17];
  //draw points

  for (let i = 0; i < apollos.length; i++) {
    var mission = apollos[i];
    var dotGeometry = new THREE.Geometry();
    var coos = calcPosFromLatLonRad(mission.lat, mission.lon, 2.05);
    dotGeometry.vertices.push(new THREE.Vector3(coos[0], coos[1], coos[2]));
    var dotMaterial = new THREE.PointsMaterial({
      size: 10,
      sizeAttenuation: false,
      color: mission.color,
    });
    var dot = new THREE.Points(dotGeometry, dotMaterial);
    moon.add(dot);
  }

  scene.add(moon);
  camera.position.z = 5;

  moon.rotation.x = 3.1415 * 0.02;
  moon.rotation.y = 3.1415 * 1.54;

  world.material.transparent = true;
  world.material.opacity = 0;
  camera.position.y = 2.4;
  camera.zoom = 3;
  camera.updateProjectionMatrix();

  //draw the 16 lands
  function setArc3D(pointStart, pointEnd, smoothness, color, clockWise) {
    // calculate normal
    var cb = new THREE.Vector3(),
      ab = new THREE.Vector3(),
      normal = new THREE.Vector3();
    cb.subVectors(new THREE.Vector3(), pointEnd);
    ab.subVectors(pointStart, pointEnd);
    cb.cross(ab);
    normal.copy(cb).normalize();

    // get angle between vectors
    var angle = pointStart.angleTo(pointEnd);
    if (clockWise) angle = angle - Math.PI * 2;
    var angleDelta = angle / (smoothness - 1);

    //var geometry = new THREE.Geometry();
    var pts = [];
    for (var i = 0; i < smoothness; i++) {
      pts.push(pointStart.clone().applyAxisAngle(normal, angleDelta * i));
    }
    var geometry = new THREE.BufferGeometry().setFromPoints(pts);

    var arc = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({
        color: color,
      })
    );
    arc.scale.set(2.1, 2.1, 2.1);

    return arc;
  }

  function addMiddle() {
    var coos1 = calcPosFromLatLonRad(0, -180, 2.1);
    var coos2 = calcPosFromLatLonRad(0, 180, 2.1);
    var p1 = new THREE.Vector3(coos1[0], coos1[1], coos1[2]).normalize();
    var p2 = new THREE.Vector3(coos2[0], coos2[1], coos2[2]).normalize();
    var arc2 = new setArc3D(p1, p2, 50, "gray", true);

    moon.add(arc2);
    arcs.push(arc2);
  }

  arcs = [];

  function addCurve(lat, lon) {
    var coos1 = calcPosFromLatLonRad(lon, lat, 2.1);
    var coos2 = calcPosFromLatLonRad(-lon, lat, 2.1);
    var p1 = new THREE.Vector3(coos1[0], coos1[1], coos1[2]).normalize();
    var p2 = new THREE.Vector3(coos2[0], coos2[1], coos2[2]).normalize();
    var arc = new setArc3D(p1, p2, 50, "gray", false);
    var arc2 = new setArc3D(p1, p2, 50, "gray", true);

    moon.add(arc);
    moon.add(arc2);

    arcs.push(arc);
    arcs.push(arc2);
  }

  addMiddle();
  addCurve(-180, 90);
  addCurve(-150, 90);
  addCurve(-120, 90);
  addCurve(-90, 90);
  addCurve(-60, 90);
  addCurve(-30, 90);

  for (let i = 0; i < arcs.length; i++) {
    var arc = arcs[i];
    arc.visible = false;
  }

  //

  //

  //

  // Modal
  var current = null;
  var isOpen = false;
  function showModal() {
    if (current != null) {
      const main = document.getElementById("infos");
      main.style.visibility = "visible"; // "hidden"
      if (isOpen) {
        main.innerHTML = "";
        console.log("in");
      } else {
        isOpen = true;
      }
      const title = document.createElement("h2");
      title.className = "title";
      title.innerHTML = `Land #${current}`;
      const area = document.createElement("h6");
      area.className = "text";
      area.innerHTML =
        "Area : 1'580'417 km²";

      main.appendChild(title);
      main.appendChild(area);

      if (current == 17) {
        const apollo = document.createElement("h6");
        apollo.className = "text";
        apollo.innerHTML =
          "Apollo 12 and 14 landed in this area." +
          "<br />" +
          "Apollo 12 : -3.01239° | -23.42157°" +
          "<br />" +
          "Apollo 14 : -3.651711° | -17.494815°";
        main.append(apollo);
      } else if (current == 18) {
        const apollo = document.createElement("h6");
        apollo.className = "text";
        apollo.innerHTML =
          "Apollo 16 landed in this area." +
          "<br />" +
          "Apollo 16 : -8.9913° | 15.5144°";
        main.append(apollo);
      } else if (current == 6) {
        const apollo = document.createElement("h6");
        apollo.className = "text";
        apollo.innerHTML =
          "Apollo 11 and 15 landed in this area." +
          "<br />" +
          "Apollo 11 : 0.67416° | 23.47314°" +
          "<br />" +
          "Apollo 15 : 26.1008° | 3.6527°";
        main.append(apollo);
      } else if (current == 7) {
        const apollo = document.createElement("h6");
        apollo.className = "text";
        apollo.innerHTML =
          "Apollo 17 landed in this area." +
          "<br />" +
          "Apollo 16 : 20.1653° | 30.7658°";
        main.append(apollo);
      }
    }
  }

  //

  //

  //

  //

  //

  //

  //
  mouse = new THREE.Vector2();

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", onResize, false);

  function moveCamera() {
    const t = document.body.getBoundingClientRect().top;

    camera.position.y = 2.4 - 2.4 * (t / -1000);
    camera.zoom = 3 - 2 * (t / -1000);

    if (-t <= window.innerHeight * 0.99) {
      world.material.opacity = 0;
      var div = document.getElementById("above-div");
      div.style["pointer-events"] = "all";
    } else {
      world.material.opacity = 1;
      var div = document.getElementById("above-div");
      div.style["pointer-events"] = "none";
    }

    camera.updateProjectionMatrix();
  }

  document.body.onscroll = moveCamera;

  //on mouse move
  var canvas = renderer.domElement;

  canvas.addEventListener("mousemove", onMouseMove, false);
  canvas.addEventListener("mousedown", onDocumentMouseDown, false);

  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  const raycaster = new THREE.Raycaster();

  function onDocumentMouseDown(event) {
    event.preventDefault();
    raycaster.setFromCamera(mouse, camera);
    var object = scene.getObjectByName("moon");
    var intersects = raycaster.intersectObject(object);
    if (intersects.length > 0) {
      var pixelX = Math.round(intersects[0].uv.x * 8192);
      var pixelY = Math.round(intersects[0].uv.y * 4096);
      var x = Math.trunc(pixelX / (8192 / 12));
      var y = Math.trunc(pixelY / (4096 / 2));
      current = y < 1 ? x + 12 : x;
      console.log(current);
      showModal();
      //if not, show border + check the checkbox
      if (!document.getElementById("borders").checked) {
        for (let i = 0; i < arcs.length; i++) {
          var arc = arcs[i];
          arc.visible = true;
        }
        document.getElementById("borders").checked = "checked";
      }
    }
  }
  animate();
}

function showHideBorders() {
  if (!document.getElementById("borders").checked) {
    for (let i = 0; i < arcs.length; i++) {
      var arc = arcs[i];
      arc.visible = false;
    }
  } else {
    for (let i = 0; i < arcs.length; i++) {
      var arc = arcs[i];
      arc.visible = true;
    }
  }
}

function animate() {
  if (RESOURCES_LOADED == false) {
    requestAnimationFrame(animate);
    renderer.render(loadingScreen.scene, loadingScreen.camera);
    document.getElementById("above-div").style.display = "none";
    // document.getElementById("loading-div").style.display = "block";
    return;
  } else if (document.getElementById("above-div").style.display == "none") {
    document.getElementById("above-div").style.display = "block";
    document.getElementById("loading-div").style.display = "none";
  }
  // showHideBorders();

  requestAnimationFrame(animate);
  moon.rotation.y += 0.0001;
  moon.rotation.x += 0.00001;

  world.rotation.y += 0.00015 * (mouse.y > 0 ? mouse.y + 1 : mouse.y - 1) * 1.4;
  world.rotation.x += 0.00005 * (mouse.x > 0 ? mouse.x + 1 : mouse.x - 1) * 1.4;

  renderer.render(scene, camera);
}

window.onload = init;
