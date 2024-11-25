import Graph from '../../components/Graphs/Graph.tsx';
import { useState } from 'react';
import './App.css';
import { Vector3 } from 'three';
import { TrajectoryOptions } from '../../utils/types.ts';
import ODE from '../../components/ODE/ODE.tsx';
import World from '../../components/World/World.tsx';

function App() {
  //REALISTIC FALCON 9
  /* const trajectoryOptions: TrajectoryOptions = {
    startMass: 549054,
    endMass: 200000,
    thrust: 7607000,
    Isp: 290,
    Cd: 0.3,
    A: 10.7521,
    start: 0,
    end: 8000,
    TIMESTEP: 1,
    phases: {
      gravity_turn: {
        start: 11,
        vector: new Vector3(1, 0, 0)
      },
      max_q: {
        start: 30,
        end: 65,
        thrust_ratio: 0.9
      }
    }
  }; */

  //ORBIT F9
  const trajectoryOptions: TrajectoryOptions = {
    startMass: 549054,
    endMass: 200000,
    thrust: 7607000,
    Isp: 1200,
    Cd: 0.3,
    A: 10.7521,
    start: 0,
    end: 10000,
    TIMESTEP: 1,
    phases: {
      ascent: {
        start: 0,
        end: 8 * 60 + 10,
        thrust_ratio: 1
      },
      gravity_turn: {
        start: 23,
        vector: new Vector3(1, 0, 0)
      },
      max_q: {
        start: 30,
        end: 65,
        thrust_ratio: 0.9
      },
      circularization: {
        start: 34 * 60 + 55,
        end: 35 * 60 + 6.8,
        thrust_ratio: 0.5
      }
    }
  };

  const [activeTab, setActiveTab] = useState(1);

  const tabs: Array<{name: string, children: Array<JSX.Element>}> = [
    { name: 'Graphs', children: [<Graph trajectoryOptions={trajectoryOptions}/>] },
    { name: '3D World', children: [<World trajectoryOptions={trajectoryOptions}/>] },
    { name: 'ODE', children: [<ODE />] }
  ];

  return (
    <>
      <div className='tabs'>
         <div className='ui'>
            {
              tabs.map((tab, i) => <button key={i} onClick={() => setActiveTab(i)}>{tab.name}</button>)
            }
         </div>
         { ...tabs[activeTab].children }
      </div>
    </>
  )
};

export default App;
