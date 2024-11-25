import { useEffect, useRef } from 'react';
import { initWorld } from '../../utils/three/stage.ts';
import createEarth, { EarthRadius } from '../../utils/Bodies/Earth.ts';
import { Box3, Line, Vector3 } from 'three';
import './ODE.css';
import { calculateOrbit } from '../../utils/Math/math.ts';
import { drawOrbit, drawSpacecraftSimple } from '../../utils/three/Trajectory.ts';
import { GLTF } from 'three/examples/jsm/Addons.js';

function ODE() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const {camera, scene, controls, onUpdate} = initWorld(ref.current as HTMLCanvasElement);

    camera.position.set(0, 0, EarthRadius * 5);
    controls.target.set(0, 0, 0);
    controls.update();

    function addOrbit(r: Vector3, v: Vector3) {
      const orbitData = calculateOrbit(r, v, 95 * 60, 10);
      const orbit = drawOrbit(orbitData, true, 5);
      scene.add(orbit);


      return orbit;
    }

    let earth: GLTF | null = null;
    createEarth().then(_earth => {
      earth = _earth;
      scene.add(earth.scene);

      const v = Math.pow(muEarth / (EarthRadius + 450000), 0.5);

      addOrbit(
        new Vector3(EarthRadius + 450000, 0, 0),
        new Vector3(0, 1, 0).setLength(v)
      );

      addOrbit(
        new Vector3(0, EarthRadius + 450000, 0),
        new Vector3(0, 0, 1).setLength(v)
      );

      addOrbit(
        new Vector3(EarthRadius + 450000, 0, 0),
        new Vector3(0, 1, 1).setLength(v)
      );
    });

    return () => {
      if(earth) {
        scene.remove(earth.scene);
      }
    };
  }, []);

  return (
    <div id='container'>
      <canvas ref={ref}></canvas>
    </div>
  );
};

export default ODE;
