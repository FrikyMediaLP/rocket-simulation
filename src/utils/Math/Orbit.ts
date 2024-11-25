import { Vector3 } from "three";
import { muEarth } from "./Constants.ts";
import { calculateGravity, rk4_step } from "./math.ts";

export function two_body_ode(t: number, r: Vector3, v: Vector3, mu: number = muEarth): [Vector3, Vector3] {
  const g = calculateGravity(r.length(), mu);
  const a = r.clone().multiplyScalar(-1).setLength(g);
  return [v, a];
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

export function getApoapsis(r: Array<Vector3> = [], is_sorted = false) {
  if(!is_sorted) r = [...r].sort((a, b) => b.length() - a.length());
  return r[0];
}

export function getPeriapsis(r: Array<Vector3> = [], is_sorted = false) {
  if(!is_sorted) r = [...r].sort((a, b) => b.length() - a.length());
  return r[r.length - 1];
}

export function getSemiMajorAxis(r: Array<Vector3> = [], is_sorted = false) {
  if(!is_sorted) r = [...r].sort((a, b) => b.length() - a.length());

  const apoapsis = getApoapsis(r, true);
  const periapsis = getPeriapsis(r, true);

  return (apoapsis.length() + periapsis.length()) / 2;
}

export function getOrbitalPeriod(mu = muEarth, r: Array<Vector3> = [], is_sorted = false) {
  const sma = getSemiMajorAxis(r, is_sorted);
  return 2 * Math.PI * Math.sqrt(Math.pow(sma, 3) / mu);
}

export function getEccentricity(r: Array<Vector3> = [], is_sorted = false) {
  if(!is_sorted) r = [...r].sort((a, b) => b.length() - a.length());

  const apoapsis = getApoapsis(r, true);
  const periapsis = getPeriapsis(r, true);

  return (apoapsis.length() - periapsis.length()) / (apoapsis.length() + periapsis.length());
}