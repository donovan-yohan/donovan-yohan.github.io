import * as THREE from 'https://unpkg.com/three@0.121.1/build/three.module.js';
import fragment from './fragment.js'

// mess with these to change how the animation looks, edit CSS variables to modify gradient colours
const GRADIENT_VARIABLE_NAME = "gradient-color";
const THREE_COMPONENT_ID = "container"
const WAVE_X_FREQ = 0.9;
const WAVE_Y_FREQ = 0.7;
const WAVE_SPEED = 10.0;
const WAVE_SPEED_VARIATION = 5.0;
const WAVE_FLOW = 25.0;
const WAVE_FLOW_VARIATION = 10.0;
const SEED = 99.0;
const WAVE_NOISE_FLOOR = 0.4;
const WAVE_NOISE_CEIL = 0.5;
const WAVE_NOISE_VARIATION = 0.085;
const NOISE_SEPARATION = 55.0;

const INCLINE = Math.PI / 12;


let container;
let camera, scene, renderer, mesh;
let uniforms;
let startTime;
let fovYAdjust;

let gradientColors = [];
let TOTAL_COLORS;

init();
animate();

function init() {
    container = document.getElementById(THREE_COMPONENT_ID);
    initGradientColors(container);

    startTime = Date.now();

    uniforms = {
        iGlobalTime: {
            type: "f",
            value: 1.0
        },
        iResolution: {
            type: "v2",
            value: new THREE.Vector2(1920.0, 1080.0)
        },
        u_waves: {
            value: []
        },
        u_total_colors: {
            value: gradientColors.length
        },
        u_noise_magnitude: {
            value: NOISE_SEPARATION
        }
    };

    for (let i = 0; i < gradientColors.length; i++) {
        let wave = {
            color: new THREE.Vector3(...gradientColors[i]),
            noiseFreq: new THREE.Vector2(WAVE_X_FREQ + i / gradientColors.length, WAVE_Y_FREQ + i / gradientColors.length),
            noiseSpeed: WAVE_SPEED + (i % 2 == 0 ? -1 : 1) * WAVE_SPEED_VARIATION * i,
            noiseFlow: WAVE_FLOW + (i % 2 == 0 ? 1 : -1) * WAVE_FLOW_VARIATION * i,
            noiseSeed: SEED + 10 * i,
            noiseFloor: WAVE_NOISE_FLOOR,
            noiseCeil: WAVE_NOISE_CEIL + i * WAVE_NOISE_VARIATION,
            offsetHorz: i % 2 == 0 ? -1 : 1,
            offsetVert: i % 3 == 0 ? -1 : 1
        }
        uniforms.u_waves.value.push(wave);
    }

    scene = new THREE.Scene();

    // CAMERA SETTINGS
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / container.clientHeight, 1, 1000);
    scene.add(camera);
    camera.position.set(0, 0, 5)

    fovYAdjust = camera.position.z * camera.getFilmHeight() / camera.getFocalLength();

    var geometry = new THREE.PlaneGeometry(500, fovYAdjust);

    var material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fragmentShader: fragment(TOTAL_COLORS)
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);

    container.appendChild(renderer.domElement);

    
    // Adjust positioning of gradient to match styling
    // offset uses an appropximation that holds sorta for angles < 45 degrees (PI/4 radians)
    
    // reliable part
    let verticalOffset = Math.tan(INCLINE) * fovYAdjust * camera.aspect / 2.0
    
    // approximation
    verticalOffset += (Math.sin(INCLINE) * fovYAdjust / 2.0 / Math.sin(Math.PI / 2.0 - INCLINE)) / 3
        
    mesh.position.set(0, verticalOffset, 0);
    mesh.rotation.set(0, 0, INCLINE);
    
    onWindowResize();

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize(event) {
    camera.aspect = window.innerWidth / container.clientHeight;
    renderer.setSize(window.innerWidth, container.clientHeight);
    fovYAdjust = camera.position.z * camera.getFilmHeight() / camera.getFocalLength();
    camera.updateProjectionMatrix();
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    var currentTime = Date.now();
    uniforms.iGlobalTime.value = (currentTime - startTime) * 0.001;
    renderer.render(scene, camera);
}

function initGradientColors(container) {
    let color = getComputedStyle(container).getPropertyValue("--" + GRADIENT_VARIABLE_NAME + "-1");
    let current = 1;
    while (color != "") {
        gradientColors.push("--" + GRADIENT_VARIABLE_NAME + "-" + current);
        color = getComputedStyle(container).getPropertyValue("--" + GRADIENT_VARIABLE_NAME + "-" + ++current);

    }

    gradientColors = gradientColors.map(cssPropertyName => {
        let hex = getComputedStyle(container).getPropertyValue(cssPropertyName).trim();
        //Check if shorthand hex value was used and double the length so the conversion in normalizeColor will work.
        if (4 === hex.length) {
            const hexTemp = hex.substr(1).split("").map(hexTemp => hexTemp + hexTemp).join("");
            hex = `#${hexTemp}`
        }
        return hex && `0x${hex.substr(1)}`
    }).filter(Boolean).map(normalizeColor);
    TOTAL_COLORS = gradientColors.length
}

//Converting colors to proper format
function normalizeColor(hexCode) {
    return [(hexCode >> 16 & 255) / 255, (hexCode >> 8 & 255) / 255, (255 & hexCode) / 255]
}