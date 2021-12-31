//timer
var days, hours, minutes, seconds;
var countDownDate = new Date("Feb 28, 2022 23:59:59").getTime();

var counter = document.getElementById("timer");

var myfunc = setInterval(function () {
  var now = new Date().getTime();
  var timeleft = countDownDate - now;

  days = Math.floor(timeleft / (1000 * 60 * 60 * 24));
  hours = Math.floor((timeleft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60));
  seconds = Math.floor((timeleft % (1000 * 60)) / 1000);
  counter.innerHTML = `in ${days} d : ${hours} h : ${minutes} min : ${seconds}s`;
}, 1000);

myfunc;

let scene, camera, renderer, stars, starGeo;

class Card extends HTMLElement {
  set card(infos) {
    this.innerHTML = `
            <div class="a-card">
                <img alt="nft" src="${infos.pic}" />
                <div class="a-card-coos">
                    <h1 class="a-card-title">Land #${infos.i}</h1>
                    <h3 class="a-card-coos-text">Between : ${infos.topLeft.lat}° , ${infos.topLeft.lon}° (top left)</h3>
                    <h3 class="a-card-coos-text">And : ${infos.bottomRight.lat}° , ${infos.bottomRight.lon}° (bottom right)</h3>
                </div>
            </div>
        `;
  }
}
customElements.define("nft-card", Card);

var container = document.getElementById("a-card-container");

for (let i = 0; i < 24; i++) {
  var topLeft = { lat: 90, lon: -180 + i * (360 / 12) };
  var bottomRight = { lat: 0, lon: -180 + (i + 1) * (360 / 12) };
  if (i >= 12) {
    topLeft = { lat: 0, lon: -180 + (i - 12) * (360 / 12) };
    bottomRight = { lat: -90, lon: -180 + (i - 12 + 1) * (360 / 12) };
  }
  var nft_src = "./assets/nfts/" + i + ".jpeg";
  const card = document.createElement("nft-card");
  card.card = { topLeft, bottomRight, pic: nft_src, i };
  container.appendChild(card);
}

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.z = 1;
  camera.rotation.x = Math.PI / 2;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  starGeo = new THREE.Geometry();
  for (let i = 0; i < 6000; i++) {
    star = new THREE.Vector3(
      Math.random() * 600 - 300,
      Math.random() * 600 - 300,
      Math.random() * 600 - 300
    );
    star.velocity = 0;
    star.acceleration = 0.02;
    starGeo.vertices.push(star);
  }

  let starMaterial = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0.4,
  });

  stars = new THREE.Points(starGeo, starMaterial);
  scene.add(stars);

  window.addEventListener("resize", onWindowResize, false);

  animate();
}
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
function animate() {
  starGeo.vertices.forEach((p) => {
    p.velocity += p.acceleration;
    p.y -= p.velocity;

    if (p.y < -200) {
      p.y = 200;
      p.velocity = 0;
    }
  });
  starGeo.verticesNeedUpdate = true;
  stars.rotation.y += 0.002;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
init();
