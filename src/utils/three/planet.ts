import { Mesh, MeshStandardMaterial, SphereGeometry } from "three";

export function createPlanet(r: number, x: number, y: number, z: number, rx: number = 0, ry: number = 0, rz: number = 0, segW = 24, segH = 24) {
  const geomertry = new SphereGeometry(r, segW, segH);
  const material = new MeshStandardMaterial({ color: 0xffffff });
  const planet = new Mesh(geomertry, material);
  planet.position.set(x, y, z);
  planet.rotation.set(rx, ry, rz);
  return planet;
}