import { useEffect, useRef } from 'react';
import { TrajectoryOptions } from '../../utils/Math/types.ts';
import { initWorld } from '../../utils/three/stage.ts';
import createEarth from '../../utils/Bodies/Earth.ts';
import { Box3, Vector3 } from 'three';
import { drawTrajectory } from '../../utils/three/Trajectory.ts';
import { EarthRadius } from '../../utils/Bodies/Earth.ts';
import './Three.css';

function Three({trajectoryOptions}: {trajectoryOptions: TrajectoryOptions}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const {camera, scene, controls, onUpdate} = initWorld(ref.current as HTMLCanvasElement);

    camera.position.set(0, EarthRadius + 10000, 40000);
    controls.target.set(0, EarthRadius + 1000, 0);
    controls.update();

    createEarth().then(earth => {
      const boundingBox = new Box3().setFromObject(earth.scene)
      const vec3 = new Vector3(0, 0, 0);
      const size = boundingBox.getSize(vec3);
      earth.scene.scale.set((EarthRadius * 2) / size.x, (EarthRadius * 2) / size.y, (EarthRadius * 2) / size.z);
      scene.add(earth.scene);

      drawTrajectory(scene, camera, controls, trajectoryOptions);

      return earth;
    });
  }, []);

  return (
    <div id='container'>
      <canvas ref={ref}></canvas>
    </div>
  );
};

export default Three;
