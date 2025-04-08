// Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Create a Three.JS Scene
const scene = new THREE.Scene();
// Add background color with gradient
scene.background = new THREE.Color(0x0a0a1a);
// Add fog for better depth perception
scene.fog = new THREE.FogExp2(0x0a0a1a, 0.02);

// Create a new camera with positions and angles
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

// Keep track of the mouse position, so we can make the model move
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

// Keep the 3D object on a global variable so we can access it later
let object;
let mixer; // For animations if model has them
let clock = new THREE.Clock();

// OrbitControls allow the camera to move around the scene
let controls;

// Instantiate a loader for the .gltf file
const loader = new GLTFLoader();

// Reference the loading elements
const loadingInfo = document.getElementById('loadingInfo');
const loadingProgress = document.getElementById('loadingProgress');
const loadingPercentage = document.getElementById('loadingPercentage');

// Tentukan path yang benar ke model Anda
const modelPath = "./models/oiia/scene.gltf";

// Create scene environment
const createEnvironment = () => {
  // Add a floor (optional - remove if not desired)
  const floorGeometry = new THREE.CircleGeometry(20, 32);
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333344,
    roughness: 0.8,
    metalness: 0.2,
    transparent: true,
    opacity: 0.6
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  floor.receiveShadow = true;
  scene.add(floor);
  
  // Add environment lighting
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);
};

// Load the model
loader.load(
  modelPath,
  function (gltf) {
    // If the file is loaded, add it to the scene
    object = gltf.scene;
    scene.add(object);
    
    // Hide loading UI
    document.getElementById('loadingContainer').style.display = 'none';
    
    // Enable shadows for all meshes in the model
    object.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        
        // Enhance materials if needed
        if (node.material) {
          node.material.envMapIntensity = 1.5;
        }
      }
    });
    
    // Auto-center and scale the model to fill ~60% of view
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Center the model
    object.position.x -= center.x;
    object.position.y -= center.y;
    object.position.z -= center.z;
    
    // Scale the model to fill ~60% of view height
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / Math.sin(fov / 2) * 0.6);
    
    // Ensure the camera is positioned correctly to see ~60% of screen
    camera.position.z = cameraZ;
    
    // Handle animations if present
    if (gltf.animations && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(object);
      const animation = gltf.animations[0];
      const action = mixer.clipAction(animation);
      action.play();
    }
    
    // Show model info
    document.getElementById('modelInfo').style.display = 'block';
    document.getElementById('modelName').textContent = modelPath.split('/').pop();
    
    // Trigger confetti effect
    createConfetti();
  },
  function (xhr) {
    // While it is loading, update the progress bar
    if (xhr.lengthComputable) {
      const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
      loadingProgress.style.width = percentComplete + '%';
      loadingPercentage.textContent = percentComplete + '%';
    }
  },
  function (error) {
    // If there is an error, log it
    console.error(`Error loading model:`, error);
    loadingInfo.textContent = `Error loading model`;
    loadingInfo.style.color = 'red';
  }
);

// Create a confetti effect when model loads
function createConfetti() {
  const confettiContainer = document.getElementById('confetti');
  confettiContainer.style.display = 'block';
  
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.animationDelay = Math.random() * 3 + 's';
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    confettiContainer.appendChild(confetti);
  }
  
  // Remove confetti after animation
  setTimeout(() => {
    confettiContainer.style.display = 'none';
    confettiContainer.innerHTML = '';
  }, 5000);
}

// Create environment
createEnvironment();

// Instantiate a new renderer and set its size
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Add the renderer to the DOM
document.getElementById("container3D").appendChild(renderer.domElement);

// Improved lighting setup
// Main directional light (simulates sun)
const mainLight = new THREE.DirectionalLight(0xffffff, 3);
mainLight.position.set(10, 10, 10);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048; 
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 50;
mainLight.shadow.camera.left = -10;
mainLight.shadow.camera.right = 10;
mainLight.shadow.camera.top = 10;
mainLight.shadow.camera.bottom = -10;
scene.add(mainLight);

// Fill light from the opposite direction
const fillLight = new THREE.DirectionalLight(0x8888ff, 2);
fillLight.position.set(-10, 0, -10);
scene.add(fillLight);

// Rim light for highlighting edges
const rimLight = new THREE.DirectionalLight(0xff8888, 2);
rimLight.position.set(0, 5, -10);
scene.add(rimLight);

// Ambient light to illuminate shadowed areas
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

// This adds controls to the camera, so we can rotate / zoom it with the mouse
controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 3;
controls.maxDistance = 100;
controls.enablePan = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

// Add a listener to the control buttons
document.getElementById('toggleRotation').addEventListener('click', function() {
  controls.autoRotate = !controls.autoRotate;
  this.classList.toggle('active');
});

document.getElementById('toggleMovement').addEventListener('click', function() {
  controls.enabled = !controls.enabled;
  this.classList.toggle('active');
});

document.getElementById('zoomIn').addEventListener('click', function() {
  camera.position.z *= 0.9;
});

document.getElementById('zoomOut').addEventListener('click', function() {
  camera.position.z *= 1.1;
});

document.getElementById('resetView').addEventListener('click', function() {
  controls.reset();
  if (object) {
    // Reset to default view that shows ~60% of model
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / Math.sin(fov / 2) * 0.6);
    camera.position.set(0, 0, cameraZ);
    camera.lookAt(0, 0, 0);
  }
});

// Render the scene
function animate() {
  requestAnimationFrame(animate);

  // Update the controls
  controls.update();
  
  // Update animations if any
  if (mixer) {
    mixer.update(clock.getDelta());
  }
  
  // Make the model respond to mouse movement if not using OrbitControls
  if (object && !controls.enabled) {
    object.rotation.y = -3 + mouseX / window.innerWidth * 3;
    object.rotation.x = -1.2 + mouseY * 2.5 / window.innerHeight;
  }

  renderer.render(scene, camera);
}

// Add a listener to the window, so we can resize the window and the camera
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Mouse position listener
document.onmousemove = (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
};

// Start the 3D rendering
animate();