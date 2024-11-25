import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import EarthFile from './../../assets/Earth.glb';
import { Box3, Vector3 } from 'three';

export const EarthRadius = 6371000;
export const EarthMass = 5972000000000000000000000;
export const muEarth = 597200000 * 667384;
export const EarthRotationDegreesPerSecond = 360 / (24 * 60 * 60);

export default async function createEarth(pos: Vector3 = new Vector3(0, 0, 0)) {
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

export const EarthAtmosphereFunction = (alt: number): number => {
  const p0 = 1.3;
  return p0 * Math.exp(- alt / 7000);
};