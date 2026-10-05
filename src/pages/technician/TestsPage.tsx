import { useState } from 'react';
import { Activity, CheckCircle2, Play, RefreshCw, XCircle } from 'lucide-react';

type TestStatus = 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED';

interface TestItem {
  id: string;
  name: string;
  description: string;
}

const testsList: TestItem[] = [
  { id: 'full_diag', name: 'Full Vehicle Diagnostic', description: 'Comprehensive sweep of all sub-systems, sensors, and actuators.' },
  { id: 'sensor_int', name: 'Sensor Integrity', description: 'Validates calibration and data stream latency for all active sensors.' },
  { id: 'brake_sys', name: 'Brake System', description: 'Actuator response test and pressure line validation.' },
  { id: 'cam_calib', name: 'Camera Calibration', description: 'Lens distortion check and stereoscopic alignment verification.' },
  { id: 'lidar_calib', name: 'LiDAR Calibration', description: 'Point cloud density check and motor spin rate validation.' },
];

export const TestsPage = () => {
  const [testStates, setTestStates] = useState<Record<string, { status: TestStatus, progress: number }>>(
    testsList.reduce((acc, test) => ({ ...acc, [test.id]: { status: 'IDLE', progress: 0 } }), {})
  );

  const runTest = (id: string) => {
    setTestStates(prev => ({ ...prev, [id]: { status: 'RUNNING', progress: 0 } }));
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        clearInterval(interval);
        const isSuccess = Math.random() > 0.15; // 85% chance of success
        setTestStates(prev => ({ ...prev, [id]: { status: isSuccess ? 'SUCCESS' : 'FAILED', progress: 100 } }));
      } else {
        setTestStates(prev => ({ ...prev, [id]: { status: 'RUNNING', progress: currentProgress } }));
      }
    }, 400);
  };

  return (
    <div className="w-full h-full bg-[#080A0D] p-6 lg:p-8 text-primary overflow-y-auto hide-scrollbar flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-light tracking-widest text-white uppercase flex items-center gap-3">
              <Activity className="w-8 h-8 text-accent" />
              System Testing
            </h1>
            <p className="text-sm text-primary-muted mt-2 tracking-wide">NOVA Technician Terminal · Automated Subsystem Validation</p>
          </div>
        </div>

        <div className="space-y-4">
          {testsList.map((test) => {
            const state = testStates[test.id];
            
            return (
              <div key={test.id} className="glass-panel p-6 rounded-2xl border border-border group transition-all duration-300 hover:border-border/80">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white mb-1">{test.name}</h3>
                    <p className="text-sm text-primary-muted max-w-xl">{test.description}</p>
                  </div>
                  
                  <div className="w-full md:w-64 flex flex-col justify-center">
                    {state.status === 'IDLE' && (
                      <button 
                        onClick={() => runTest(test.id)}
                        className="w-full py-3 rounded-xl bg-surface-elevated border border-border text-primary font-bold text-xs tracking-widest uppercase hover:bg-surface hover:text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" /> Run Test
                      </button>
                    )}
                    
                    {state.status === 'RUNNING' && (
                      <div className="w-full space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase text-accent">
                          <span className="flex items-center gap-2"><RefreshCw className="w-3 h-3 animate-spin" /> Running...</span>
                          <span>{Math.round(state.progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${state.progress}%` }} />
                        </div>
                      </div>
                    )}

                    {state.status === 'SUCCESS' && (
                      <button 
                        onClick={() => runTest(test.id)}
                        className="w-full py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-500 font-bold text-xs tracking-widest uppercase hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Passed - Re-run
                      </button>
                    )}

                    {state.status === 'FAILED' && (
                      <button 
                        onClick={() => runTest(test.id)}
                        className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-bold text-xs tracking-widest uppercase hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Failed - Re-run
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
