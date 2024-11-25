import { WebGLRenderer, PerspectiveCamera, PMREMGenerator, Scene, Color, Camera, Frustum, Matrix4, BufferAttribute, Vector3, BufferGeometry, Line } from "three";
import { OrbitControls, RoomEnvironment } from "three/examples/jsm/Addons.js";
import { EarthRadius } from "../../utils/Bodies/Earth.ts";


export function initWorld(canvas: HTMLCanvasElement): { renderer: WebGLRenderer, camera: Camera, scene: Scene, controls: OrbitControls, onUpdate: Function } {
  const renderer = new WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.0000000000001, EarthRadius * 500);

  const environment = new RoomEnvironment(renderer);
  const pmremGenerator = new PMREMGenerator(renderer);

  const scene = new Scene();
  scene.background = new Color(0x1D1D1D);
  scene.environment = pmremGenerator.fromScene(environment).texture;
  environment.dispose();

  const controls = new OrbitControls(camera, renderer.domElement);

  window.addEventListener('resize', onWindowResize);

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  let _onUpdate: Function | null = null;
  function onUpdate(func: Function) {
    _onUpdate = func;
  }

  function render() {
    if(window.pause !== true) window.requestAnimationFrame(render);

    if(_onUpdate) _onUpdate();
    controls.update();
    renderer.render(scene, camera);

    if(window.pause) {
      scene.traverse(node => console.log(node.visible))
    }
  }

  render();
  return {renderer, camera, scene, controls, onUpdate};
}