import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import EarthFile from './../../assets/Moon.glb';
import { Box3, Vector3 } from 'three';

export default async function createMoon(pos: Vector3 = new Vector3(0, 0, 0)) {
  const loader = new GLTFLoader();
  return loader
    .loadAsync(EarthFile)
    .then(earth => {
      const boundingBox = new Box3().setFromObject(earth.scene)
      const size = boundingBox.getSize(pos);
      earth.scene.scale.set((EarthRadius * 2) / size.x, (EarthRadius * 2) / size.y, (EarthRadius * 2) / size.z);
      earth.scene.position.set(pos.x, pos.y, pos.z);
      return earth;
    });
}