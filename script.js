import * as THREE from './three.module.js';
import { PointerLockControls } from './PointerLockControls.js';

let camera, scene, renderer, controls;
let objects = [];
const move = { forward: false, backward: false, left: false, right: false };
let prevTime = performance.now();
let velocity = new THREE.Vector3();

init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202533);
  const light = new THREE.HemisphereLight(0xffffff, 0x444444);
  light.position.set(0, 200, 0);
  scene.add(light);

  controls = new PointerLockControls(camera, document.body);
  document.addEventListener('click', () => {
    controls.lock();
  });

  const onKeyDown = function (event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW': move.forward = true; break;
      case 'ArrowLeft':
      case 'KeyA': move.left = true; break;
      case 'ArrowDown':
      case 'KeyS': move.backward = true; break;
      case 'ArrowRight':
      case 'KeyD': move.right = true; break;
    }
  };

  const onKeyUp = function (event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW': move.forward = false; break;
      case 'ArrowLeft':
      case 'KeyA': move.left = false; break;
      case 'ArrowDown':
      case 'KeyS': move.backward = false; break;
      case 'ArrowRight':
      case 'KeyD': move.right = false; break;
    }
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  scene.add(controls.getObject());

  // Floor
  const floorGeometry = new THREE.PlaneGeometry(200, 200, 10, 10);
  floorGeometry.rotateX(-Math.PI / 2);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  scene.add(floor);

  // Random boxes as obstacles
  const boxGeo = new THREE.BoxGeometry(4, 4, 4);
  for (let i = 0; i < 30; i++) {
    const boxMat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set((Math.random() - 0.5) * 160, 2, (Math.random() - 0.5) * 160);
    scene.add(box);
    objects.push(box);
  }

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();
  const delta = (time - prevTime) / 1000;

  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  const speed = 400.0;
  if (move.forward) velocity.z -= speed * delta;
  if (move.backward) velocity.z += speed * delta;
  if (move.left) velocity.x -= speed * delta;
  if (move.right) velocity.x += speed * delta;

  controls.moveRight(-velocity.x * delta);
  controls.moveForward(-velocity.z * delta);

  prevTime = time;

  renderer.render(scene, camera);
}
