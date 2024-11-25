import { Vector3 } from "three";

export type DataPacket = {
  x: number,
  y: number
};

type KeyValueObject<Tvalue> = {
  [key: string]: Tvalue,
};

export type FlightDataMeta = {
  thrust_section?: Array<number>,
  coast_section?: Array<number>,
  impact?: {
    time: number,
    velocity: number
  }
};

export type FlightData = {
  Altitude: DataPacket[],
  Velocity: DataPacket[],
  Acceleration: DataPacket[],
  Gravity: DataPacket[],
  TWR: DataPacket[],
  Mass: DataPacket[],
  DynamicPressure: DataPacket[],
  Thrust: DataPacket[],
  _meta?: FlightDataMeta,
} & KeyValueObject<DataPacket[] | FlightDataMeta>;


export type FlightData3D = {
  time: number,
  Altitude: Vector3,
  Velocity: Vector3,
  Gravity: Vector3,
  DynamicPressure: Vector3,
  Thrust: Vector3,
  Mass: number,
} & KeyValueObject<Vector3 | number>;

export const LABELS: KeyValueObject<string> = {
  Altitude: 'Altitude (m)',
  Velocity: 'Velocity (m/s)',
  Acceleration: 'Acceleration (m/s²)',
  Gravity: 'Gravity (m/s²)',
  TWR: 'TWR',
  Mass: 'Mass (kg)',
  DynamicPressure: 'DynamicPressure (Pa)',
  Thrust: 'Thrust (N)',
};

export type TrajectoryOptions = {
  startMass: number,
  endMass: number,
  thrust: number,
  Isp: number,
  Cd: number,
  A: number,
  start?: number,
  end: number,
  TIMESTEP?: number,
  phases?: {
    ascent?: {
      start: number,
      end: number,
      thrust_ratio: number
    },
    gravity_turn?: {
      start: number,
      vector: Vector3
    },
    max_q?: {
      start: number,
      end: number,
      thrust_ratio: number
    },
    circularization?: {
      start: number,
      end: number,
      thrust_ratio: number
    }
  }
};