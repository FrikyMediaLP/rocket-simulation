import { useEffect, useRef } from 'react';
import { TrajectoryOptions } from '../../utils/types.ts';
import { initWorld } from '../../utils/three/stage.ts';
import createEarth from '../../utils/Bodies/Earth.ts';
import { EarthRadius, EarthRotationDegreesPerSecond } from '../../utils/Bodies/Earth.ts';
import { GLTF } from 'three/examples/jsm/Addons.js';
import './World.css';
import { runRocketSimulation } from '../../utils/Math/Rocket.ts';
import { Color, ColorRepresentation, Group, Line, Mesh, MeshBasicMaterial, Object3D, SphereGeometry, Vector3 } from 'three';
import { drawLine, drawSpacecraft } from '../../utils/three/Trajectory.ts';
import { getFormattedTime } from '../../utils/Time.ts';

function createSphere(r: Vector3, size: number, color: ColorRepresentation) {
  const geometry = new SphereGeometry(size, 10, 10); 
  const material = new MeshBasicMaterial( { color } ); 
  const sphere = new Mesh( geometry, material );
  sphere.position.set(r.x, r.y, r.z);
  return sphere;
}

function World({trajectoryOptions}: {trajectoryOptions: TrajectoryOptions}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const altitudeRef = useRef<HTMLSpanElement>(null);
  const velocityRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const {camera, scene, controls} = initWorld(canvasRef.current as HTMLCanvasElement);

    camera.position.set(0, EarthRadius + 10000, 40000);
    controls.target.set(0, EarthRadius + 1000, 0);
    controls.update();
    
    let earth: GLTF | null = null;
    createEarth().then(_earth => {
      earth = _earth;

      const trajectoryGroup = new Group();
      scene.add(trajectoryGroup);
      scene.add(earth.scene);

      controls.enablePan = false;

      let lastLine: Line | null = null;
      let last_line_vec: Vector3 | null= null;
      let spacecraft: Group | null = null;

      let lowestThrustLevel = 0;

      let speculated_apoapsis: Vector3 | null = null;
      let verified_apoapsis: Object3D | null = null;

      let speculated_periapsis: Vector3 | null = null;
      let verified_periapsis: Object3D | null = null;

      runRocketSimulation(trajectoryOptions, (data) => {
        console.log(`Propellant left: ${(((data.Mass - trajectoryOptions.endMass) / (trajectoryOptions.startMass - trajectoryOptions.endMass)) * 100).toFixed(2)}%`)

        //Earth Rotation
        if(earth) {
          earth.scene.rotation.y += (EarthRotationDegreesPerSecond * Math.PI) / 180;
        }

        //HUD
        const Altitude = Math.floor((data.Altitude.length() - EarthRadius) / 1000);
        const Velocity = Math.floor(data.Velocity.length() * 3.6) + '';
        const {hours, minutes, seconds} = getFormattedTime(data.time);
        if(timeRef.current?.innerHTML) timeRef.current.innerHTML = `T+ ${hours}:${minutes}:${seconds}`;
        if(altitudeRef.current?.innerHTML) altitudeRef.current.innerHTML = `Altitude: ${(Math.max(0, Altitude) + '').padStart(5)}km`;
        if(velocityRef.current?.innerHTML) velocityRef.current.innerHTML = `Velocity: ${Velocity.padStart(8)}km/h`;

        //Spacecraft
        if(spacecraft) trajectoryGroup.remove(spacecraft);
        spacecraft = drawSpacecraft(trajectoryGroup, data);

        //Camera Controls
        const cameraOffset = controls.target.clone().sub(camera.position);
        controls.target.set(data.Altitude.x, data.Altitude.y, data.Altitude.z);
        controls.update();
        camera.position.set(
          data.Altitude.x - cameraOffset.x,
          data.Altitude.y - cameraOffset.y,
          data.Altitude.z - cameraOffset.z
        );

        //Apoapsis
        if(!speculated_apoapsis) {
          speculated_apoapsis = data.Altitude.clone();
        }
        if(data.Altitude.length() >= speculated_apoapsis.length()) {
          if(verified_apoapsis) trajectoryGroup.remove(verified_apoapsis);
          verified_apoapsis = null;
          speculated_apoapsis = data.Altitude.clone();
        }
        if(data.Altitude.length() < speculated_apoapsis.length() && !verified_apoapsis) {
          verified_apoapsis = createSphere(speculated_apoapsis, 200000, 0x00ffff);
          trajectoryGroup.add(verified_apoapsis);
          console.log(`Reached Apoapsis of ${((speculated_apoapsis.length() - EarthRadius) / 1000).toFixed(2)}km!`);
        }

        //Priapsis
        if(!speculated_periapsis && verified_apoapsis) {
          speculated_periapsis = data.Altitude.clone();
        }
        if(speculated_periapsis && data.Altitude.length() < speculated_periapsis.length()) {
          if(verified_periapsis) trajectoryGroup.remove(verified_periapsis);
          verified_periapsis = null;
          speculated_periapsis = data.Altitude.clone();
        }
        if(speculated_periapsis && data.Altitude.length() > speculated_periapsis.length() && !verified_periapsis) {
          verified_periapsis = createSphere(speculated_periapsis, 200000, 0xff00ff);
          trajectoryGroup.add(verified_periapsis);
          console.log(`Reached Priapsis of ${((speculated_periapsis.length() - EarthRadius) / 1000).toFixed(2)}km!`);
        }

        //Trajectory Line
        if(!last_line_vec) {
          last_line_vec = data.Altitude;
          return;
        }

        let lineInterval = 100;
        if(data.time < 500) lineInterval = 10;

        if(lastLine && data.time % lineInterval > 1) {
          trajectoryGroup.remove(lastLine);
        }

        if(data.Thrust.length() > 0) {
          if(lowestThrustLevel === 0) lowestThrustLevel = data.Thrust.length();
          lowestThrustLevel = Math.min(lowestThrustLevel, data.Thrust.length());
        }

        let color = new Color(0x00ff00);

        if(lowestThrustLevel > 0) {
          if(lowestThrustLevel >= trajectoryOptions.thrust * 0.999) color = new Color(0xff0000);
          if(lowestThrustLevel < trajectoryOptions.thrust * 0.999) color = new Color(0x0000ff);
        }

        lastLine = drawLine(trajectoryGroup, [last_line_vec, data.Altitude], color);

        if(data.time % lineInterval < lineInterval - 1) return;

        lowestThrustLevel = data.Thrust.length();
        last_line_vec = data.Altitude;
      });
    });
  }, []);

  return (
    <div id='container'>
      <span id='Altitude' ref={altitudeRef}>Altitude: 0km</span>
      <span id='Velocity' ref={velocityRef}>Velocity: 0km/h</span>
      <span id='Time' ref={timeRef}>T+00:00:00</span>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default World;
