import { EarthAtmosphereFunction, EarthRadius, muEarth } from "../../utils/Bodies/Earth.ts";
import { FlightData, FlightData3D, TrajectoryOptions } from "./../types.ts";
import { Vector2, Vector3 } from 'three';

export function two_body_ode(t: number, r: Vector3, v: Vector3, mu: number = muEarth): [Vector3, Vector3] {
  const g = calculateGravity(r.length(), mu);
  const a = r.clone().multiplyScalar(-1).setLength(g);
  return [v, a];
}

export function rk4_step(f: (t: number, r: Vector3, v: Vector3, mu?: number) => [Vector3, Vector3], t: number, r: Vector3, v: Vector3, h: number): [Vector3, Vector3] {
  const k1 = f(t, r, v);

  const _k1_r = k1[0].clone().multiplyScalar(0.5 * h);
  const _k1_v = k1[1].clone().multiplyScalar(0.5 * h);
  const k2 = f(t + 0.5 * h, r.clone().add(_k1_r), v.clone().add(_k1_v));

  const _k2_r = k2[0].clone().multiplyScalar(0.5 * h);
  const _k2_v = k2[1].clone().multiplyScalar(0.5 * h);
  const k3 = f(t + 0.5 * h, r.clone().add(_k2_r), v.clone().add(_k2_v));

  const _k3_r = k3[0].clone().multiplyScalar(h);
  const _k3_v = k3[1].clone().multiplyScalar(h);
  const k4 = f(t + h, r.clone().add(_k3_r), v.clone().add(_k3_v));

  const temp_r = k1[0].clone()
    .add(k2[0].clone().multiplyScalar(2))
    .add(k3[0].clone().multiplyScalar(2))
    .add(k4[0].clone());

  const temp_v = k1[1].clone()
    .add(k2[1].clone().multiplyScalar(2))
    .add(k3[1].clone().multiplyScalar(2))
    .add(k4[1].clone());

  return [
    r.clone().add(temp_r.multiplyScalar(h / 6.0)),
    v.clone().add(temp_v.multiplyScalar(h / 6.0))
  ];
}

export function calculateOrbit(r: Vector3, v: Vector3, tspan: number = 100 * 60, dt: number = 100): Array<[Vector3, Vector3]> {
  const data: Array<[Vector3, Vector3]> = [];

  data[0] = [r, v];

  const steps = tspan / dt;

  for(let step = 0; step < steps; step++) {
    data[step + 1] = rk4_step(two_body_ode, step * dt, data[step][0], data[step][1], dt);
  }

  return data;
}

export function calculateTrajectory3D(
  {
    startMass,endMass, thrust, Isp, Cd, A, start = 0, end, TIMESTEP = 1, phases = {}
  }: TrajectoryOptions
): FlightData3D[] {
  let velVec = new Vector3(0, 1, 0);
  let posVec = new Vector3(0, EarthRadius, 0);
  let mass = startMass;

  const data: FlightData3D[] = [];

  for(let t = start; t <= end; t++) {
    const drag = calculateAerodynamicDrag(velVec.length(), posVec.length() - EarthRadius, Cd, A);
    const dragVec = new Vector3().copy(velVec).multiplyScalar(-1).setLength(drag);

    const g = calculateGravity(posVec.length());
    const gravVec = new Vector3().copy(posVec).multiplyScalar(-1).setLength(g);

    let thrustVec = new Vector3().copy(velVec).setLength(thrust);
    
    if(phases.max_q && t >= phases.max_q.start && t <= phases.max_q.end) {
      thrustVec.setLength(thrust * phases.max_q.thrust_ratio);
    }

    mass -= calculateMassflow(thrustVec.length(), Isp, g);

    if(mass < endMass) {
      mass = endMass;
      thrustVec = thrustVec.setLength(0);
    }

    const accVec = thrustVec.clone().add(dragVec).divideScalar(mass).add(gravVec);

    velVec.add(accVec);
    posVec.add(velVec);

    if(phases.gravity_turn && t === phases.gravity_turn.start) {
      velVec.add(phases.gravity_turn.vector);
    }

    data.push({
      time: t,
      Altitude: posVec.clone(),
      Velocity: velVec.clone(),
      Gravity: gravVec.clone(),
      Thrust: thrustVec.clone(),
      DynamicPressure: dragVec.clone()
    });
    
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

export function calculateGravity(r: number, mu:number = muEarth): number {
  return mu / Math.pow(r, 2);
}

export function calculateDynamicPressure(v: number, alt: number): number {
  const p = EarthAtmosphereFunction(alt);
  return (p * Math.pow(v, 2)) / 2;
}
export function calculateAerodynamicDrag(v: number, alt: number, Cd: number, A: number): number {
  const q = calculateDynamicPressure(v, alt);
  return Cd * A * q;
}

export function calculateMassflow(thrust: number, Isp: number, g: number): number {
  //TODO: MATH ERROR - it should not be Isp but rather I0 (Impulse divided by liftoff gravity, since Isp is mesured in a SPECIFIC environment and should not be recalculated in other environments)
  return thrust / (Isp * g);
}