import { Vector3, Vector2 } from "three";
import { EarthRadius } from "../../utils/Bodies/Earth.ts";
import { calculateAerodynamicDrag, calculateGravity, calculateMassflow, calculateDynamicPressure } from "./math.ts";
import { FlightData, FlightData3D, TrajectoryOptions } from "../types.ts";
import { getHighPerformanceTime } from "../Time.ts";

export function runRocketSimulation(trajectoryOptions: TrajectoryOptions, onProgress: (data: FlightData3D) => void) {
  let t = trajectoryOptions.start || 0;
  
  let velVec = new Vector3(0, 1, 0);
  let posVec = new Vector3(0, EarthRadius, 0);
  let mass = trajectoryOptions.startMass;

  const getTimestamp = getHighPerformanceTime();
  let lastTimestamp = getTimestamp();

  function step() {
    if(getTimestamp() - lastTimestamp < 10) return requestAnimationFrame(step);

    const data = stepTrajectory(t, posVec, velVec, mass, trajectoryOptions);

    posVec = data.Altitude.clone();
    velVec = data.Velocity.clone();
    mass = data.Mass;

    onProgress(data);
    
    t++;
    lastTimestamp = getTimestamp();
    if(t <= (trajectoryOptions.end || 60)) requestAnimationFrame(step);
  }

  step();
}

export function stepTrajectory(t: number, posVec: Vector3, velVec: Vector3, mass: number, {Cd, A, Isp, thrust, phases = {}, endMass }: TrajectoryOptions): FlightData3D {
  const drag = calculateAerodynamicDrag(velVec.length(), posVec.length() - EarthRadius, Cd, A);
  const dragVec = new Vector3().copy(velVec).multiplyScalar(-1).setLength(drag);

  const g = calculateGravity(posVec.length());
  const gravVec = new Vector3().copy(posVec).multiplyScalar(-1).setLength(g);

  let thrustVec = new Vector3().copy(velVec);

  //max q
  if(phases.max_q && t >= phases.max_q.start && t <= phases.max_q.end) {
    thrustVec.setLength(thrust * phases.max_q.thrust_ratio);
  }

  //ascent
  else if(phases.ascent && t >= phases.ascent.start && t <= phases.ascent.end) {
    thrustVec.setLength(thrust * phases.ascent.thrust_ratio);
  }

  //circularization
  else if(phases.circularization && t >= phases.circularization.start && t <= phases.circularization.end) {
    thrustVec.setLength(thrust * phases.circularization.thrust_ratio);
  }

  //coast
  else {
    thrustVec.setLength(0);
  }

  //TODO: MATH ERROR - it should not be Isp but rather I0 (Impulse divided by liftoff gravity, since Isp is mesured in a SPECIFIC environment and should not be recalculated in other environments)
  mass -= calculateMassflow(thrustVec.length(), Isp, g);

  if(mass <= endMass && thrustVec.length() > 0) {
    console.log("Ran out of propellant!");
    mass = endMass;
    thrustVec = thrustVec.setLength(0);
  }

  const accVec = thrustVec.clone().add(dragVec).divideScalar(mass).add(gravVec);

  velVec.add(accVec);
  posVec.add(velVec);

  if(posVec.length() < EarthRadius) {
    posVec.setLength(EarthRadius);
    velVec.setLength(0);
  }

  //gravity turn
  if(phases.gravity_turn && t === phases.gravity_turn.start) {
    velVec.add(phases.gravity_turn.vector);
  }

  return {
    time: t,
    Altitude: posVec.clone(),
    Velocity: velVec.clone(),
    Gravity: gravVec.clone(),
    Thrust: thrustVec.clone(),
    Mass: mass,
    DynamicPressure: dragVec.clone()
  };
}

export function calculateTrajectory3D(trajectoryOptions: TrajectoryOptions): FlightData3D[] {
  let velVec = new Vector3(0, 1, 0);
  let posVec = new Vector3(0, EarthRadius, 0);
  let mass = trajectoryOptions.startMass;

  const data: FlightData3D[] = [];

  for(let t = (trajectoryOptions.start || 0); t < (trajectoryOptions.end || 60); t++) {
    let step = stepTrajectory(t, posVec, velVec, mass, trajectoryOptions);

    posVec = step.Altitude.clone();
    velVec = step.Velocity.clone();
    mass = step.Mass;

    data.push(step);
    
    if(posVec.length() < EarthRadius) {
      break;
    }
  }

  return data;
}

export function calculateTrajectory(
  {
    startMass,endMass, thrust, Isp, Cd, A, start = 0, end, TIMESTEP = 1, phases = {}
  }: TrajectoryOptions
): FlightData {
  let posVec = new Vector2(0, EarthRadius);
  let velVec = new Vector2(0, 0);
  let mass = startMass;
  
  const data: FlightData = {
    Altitude: [],
    Velocity: [],
    Acceleration: [],
    Gravity: [],
    TWR: [],
    Mass: [],
    DynamicPressure: [],
    Thrust: [],
    _meta: {
      thrust_section: [],
      coast_section: []
    }
  };
  if(!data._meta) data._meta = {};

  for(let t = 0; t <= end; t++) {
    const drag = calculateAerodynamicDrag(velVec.length(), posVec.length() - EarthRadius, Cd, A);
    const g = calculateGravity(posVec.length());

    let _thrust = thrust;

    if(phases.max_q && t > phases.max_q.start && t < phases.max_q.end) {
      _thrust *= phases.max_q.thrust_ratio;
    }

    mass -= calculateMassflow(_thrust, Isp, g);

    if(mass < endMass) {
      mass = endMass;
      _thrust = 0;
    }
    
    const twr = (_thrust === 0 ? 0 : _thrust) / (mass * g);
    const acc = ((_thrust + (velVec.y < 0 ? drag : - drag)) / mass) - g;

    velVec = velVec.add(new Vector2(0, acc));
    posVec = posVec.add(velVec);

    if(t > start && (t % TIMESTEP === 0 || posVec.y <= EarthRadius)) {
      if(posVec.y < EarthRadius) posVec.y = EarthRadius;
      data.Altitude.push({ x: t, y: posVec.y - EarthRadius });
      data.Velocity.push({ x: t, y: velVec.y });
      data.Acceleration.push({ x: t, y: acc });
      data.Gravity.push({ x: t, y: g });
      data.TWR.push({ x: t, y: twr });
      data.Mass.push({ x: t, y: mass });
      data.DynamicPressure.push({ x: t, y: calculateDynamicPressure(velVec.length(), posVec.length() - EarthRadius) });
      data.Thrust.push({ x: t, y: _thrust });

      if(_thrust === 0) data._meta?.coast_section?.push(t);
      else data._meta?.thrust_section?.push(t);

      if(posVec.y <= EarthRadius && _thrust <= 0) {
        data._meta.impact = {
          time: t,
          velocity: velVec.length()
        };
        break;
      }
    }
  }

  return data;
}