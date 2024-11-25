import { DataPacket, FlightData, LABELS, TrajectoryOptions } from '../../utils/types.ts';
import { calculateTrajectory } from '../../utils/Math/math.ts';
import { Chart } from 'chart.js/auto';
import { useEffect } from 'react';
import './Graph.css';

const GRAPHS = [
  'Altitude',
  'Velocity',
  'Acceleration',
  'Gravity',
  'TWR',
  'Mass',
  'DynamicPressure',
  'Thrust',
];

function init(trajectoryOptions: TrajectoryOptions) {
  let data: FlightData = calculateTrajectory(trajectoryOptions);
  
  const graphs = [];
  for(let key in data) {
    const _data: DataPacket[] = data[key] as DataPacket[];
  
    const canvas: HTMLCanvasElement = document.querySelector('#' + key) as HTMLCanvasElement;
    if(!canvas) continue;
  
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
  
    const thrusting = _data.filter(row => data._meta?.thrust_section?.find(t => t === row.x) !== undefined);
    let coasting = _data;
  
    graphs.push(new Chart(ctx, {
      type: 'line',
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time (s)'
            }
          },
          y: {
            title: {
              display: true,
              text: LABELS[key]
            }
          }
        }
      },
      data: {
        labels: _data.map(row => row.x),
        datasets: [
          { label: 'thrusting',  data: thrusting.map(row => row.y) },
          { label: 'coasting', data: coasting.map(row => row.y) }
        ]
        /* datasets: [
          { label: key,  data: _data.map(row => row.y) }
        ] */
      }
    }));
    
  }

  return graphs;
}

function Graph({trajectoryOptions}: {trajectoryOptions: TrajectoryOptions}) {
  useEffect(() => {
    const graphs = init(trajectoryOptions);

    return () => {
      graphs.forEach(graph => graph.destroy());
    };
  }, []);

  return (
    <div id='container'>
      {
        GRAPHS.map(graph => (
          <div key={graph}>
            <canvas id={graph}></canvas>
          </div>
        ))
      }
    </div>
  );
};

export default Graph;
