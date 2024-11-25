import { Scene, Vector3, Mesh, MeshStandardMaterial, SphereGeometry, ArrowHelper, Color, Group, Camera, Line, BufferGeometry, LineBasicMaterial, NeverDepth, AlwaysCompare, AlwaysDepth, LessDepth, LessEqualCompare, LessEqualDepth, EqualDepth, GreaterDepth, NotEqualDepth  } from "three";
import { FlightData3D, TrajectoryOptions } from "../types.ts";
import { calculateTrajectory3D } from "../Math/math.ts";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { EarthRadius } from "../../utils/Bodies/Earth.ts";

export function drawOrbit(orbit: Array<[Vector3, Vector3]>, animate = false, dt = 100) {
  let last_line_vec: Vector3 = orbit[0][0];
  let spacecraft: Group |null = null;

  const orbitGroup = new Group();

  for(let i = 1; i < orbit.length; i++) {
    setTimeout(() => {
      const Altitude = orbit[i][0];
      const Velocity = orbit[i][1];

      if(spacecraft) orbitGroup.remove(spacecraft);
      spacecraft = drawSpacecraftSimple(orbitGroup, Altitude, Velocity);

      let color = new Color(0xff0000);
      drawLine(orbitGroup, [last_line_vec, Altitude], color);
      last_line_vec = Altitude;
    }, animate ? i * dt : 0);
  }

  return orbitGroup;
}

export function drawSpacecraftSimple(scene: Group | Scene, r: Vector3, v: Vector3): Group {
  const SIZE = 50000;
  
  const geomertry = new SphereGeometry(SIZE, 24, 24);
  const material = new MeshStandardMaterial({ color: 0x00ff00 });
  const spacecraft = new Mesh(geomertry, material);
  spacecraft.position.set(r.x, r.y, r.z);

  const spacecraftGroup = new Group();

  drawArrow(spacecraftGroup, v.clone(), r, SIZE * 5, new Color(0xffffff));
  spacecraftGroup.add(spacecraft);

  scene.add(spacecraftGroup);
  
  return spacecraftGroup;
}

export function drawTrajectory(scene: Scene, camera: Camera, controls: OrbitControls, trajectoryOptions: TrajectoryOptions) {
  const flightData = calculateTrajectory3D(trajectoryOptions);

  let spacecraft: Group |null = null;
  function show(data: FlightData3D) {
    if(spacecraft) scene.remove(spacecraft);
    spacecraft = drawSpacecraft(scene, data);
  }
  
  controls.enablePan = false;

  let last_line_vec: Vector3 = flightData[0].Altitude;

  for(const data of flightData) {
    setTimeout(() => {
      show(data);
      controls.target.set(data.Altitude.x, data.Altitude.y, data.Altitude.z);
      controls.update();

      let color = new Color(0xff0000);
      if(data.Thrust.length() < trajectoryOptions.thrust * 0.999) color = new Color(0x0000ff);
      if(data.Thrust.length() === 0) color = new Color(0x00ff00);

      drawLine(scene, [last_line_vec, data.Altitude], color);
      last_line_vec = data.Altitude;
    }, data.time * 10);
  }

  const tempt = flightData.find(elt => elt.Thrust.length() === 0);
  if(tempt) console.log(tempt.Altitude.length() - EarthRadius);

  return scene;
}

export function drawSpacecraft(scene: Scene | Group, { Altitude, Velocity, DynamicPressure, Gravity, Thrust }: FlightData3D): Group {
  const SIZE = 500;
  
  const geomertry = new SphereGeometry(SIZE, 24, 24);
  const material = new MeshStandardMaterial({ color: 0x00ff00 });
  const spacecraft = new Mesh(geomertry, material);
  spacecraft.position.set(Altitude.x, Altitude.y, Altitude.z);

  const spacecraftGroup = new Group();

  drawArrow(spacecraftGroup, Velocity.clone(), Altitude, Velocity.length(), new Color(0xffffff));
  drawArrow(spacecraftGroup, DynamicPressure.clone(), Altitude, DynamicPressure.length(), new Color(0xff00ff));
  drawArrow(spacecraftGroup, Gravity.clone(), Altitude, Gravity.length() * 500, new Color(0xff0000));
  if(Thrust.length() > 0) drawArrow(spacecraftGroup, Thrust.clone(), Altitude, Thrust.length() / 1000, new Color(0x0000ff));
  spacecraftGroup.add(spacecraft);

  scene.add(spacecraftGroup);
  
  return spacecraftGroup;
}

export function drawArrow(scene: Group, dir: Vector3, origin: Vector3, length: number, color: Color): ArrowHelper {
  dir = dir.normalize();
  const arrow = new ArrowHelper(dir, origin, length, color, 0.2 * length, 0.5 * 0.2 * length);
  scene.add(arrow);
  return arrow;
}

export function drawLine(scene: Scene | Group, points: Array<Vector3> = [], color: Color): Line {
  const material = new LineBasicMaterial({ color });
  const geometry = new BufferGeometry().setFromPoints(points);
  const line = new Line(geometry, material);
  scene.add(line);
  return line;
}