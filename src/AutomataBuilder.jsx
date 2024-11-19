// import React, { useState, useRef, useEffect } from 'react';

// const AutomataBuilder = () => {
//   const [states, setStates] = useState([]);
//   const [transitions, setTransitions] = useState([]);
//   const [selectedState, setSelectedState] = useState(null);
//   const [startState, setStartState] = useState(null);
//   const [acceptStates, setAcceptStates] = useState([]);
//   const [drawMode, setDrawMode] = useState('state'); // 'state' or 'transition'
//   const [transitionStart, setTransitionStart] = useState(null);
  
//   const canvasRef = useRef(null);
//   const [draggedState, setDraggedState] = useState(null);
//   const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  
//   // Generate a simple unique ID
//   const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

//   const getMousePosition = (e) => {
//     const rect = canvasRef.current.getBoundingClientRect();
//     return {
//       x: e.clientX - rect.left,
//       y: e.clientY - rect.top
//     };
//   };
  

//   const findStateAtPosition = (pos) => {
//     return states.find(state => 
//       Math.sqrt(Math.pow(state.x - pos.x, 2) + Math.pow(state.y - pos.y, 2)) < 25
//     );
//   };

//   const handleCanvasMouseDown = (e) => {
//     const pos = getMousePosition(e);
//     const clickedState = findStateAtPosition(pos);

//     if (clickedState) {
//       if (drawMode === 'state') {
//         // Start dragging the state
//         setDraggedState(clickedState);
//         setDragOffset({
//           x: pos.x - clickedState.x,
//           y: pos.y - clickedState.y
//         });
//         setSelectedState(clickedState);
//       } else if (drawMode === 'transition') {
//         // Start drawing a transition
//         setTransitionStart(clickedState);
//       }
//     } else if (drawMode === 'state') {
//       // Create a new state
//       const newState = {
//         id: generateId(),
//         label: `q${states.length}`,
//         x: pos.x,
//         y: pos.y
//       };
//       setStates([...states, newState]);
//     }
//   };

//   const handleCanvasMouseMove = (e) => {
//     if (draggedState) {
//       const pos = getMousePosition(e);
//       setStates(states.map(state => 
//         state.id === draggedState.id 
//           ? { ...state, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
//           : state
//       ));
//     }
//   };

//   const handleCanvasMouseUp = (e) => {
//     if (drawMode === 'transition' && transitionStart) {
//       const pos = getMousePosition(e);
//       const endState = findStateAtPosition(pos);

//       if (endState && endState !== transitionStart) {
//         const symbol = prompt('Enter transition symbol:', '');
//         if (symbol !== null && symbol.trim() !== '') {
//           const newTransition = {
//             id: generateId(),
//             from: transitionStart.id,
//             to: endState.id,
//             symbol: symbol.trim()
//           };
//           setTransitions([...transitions, newTransition]);
//         }
//       }
//     }
//     setDraggedState(null);
//     setTransitionStart(null);
//   };

//   const toggleStartState = (state) => {
//     setStartState(startState === state.id ? null : state.id);
//   };

//   const toggleAcceptState = (state) => {
//     setAcceptStates(prev => 
//       prev.includes(state.id)
//         ? prev.filter(id => id !== state.id)
//         : [...prev, state.id]
//     );
//   };

//   const deleteState = () => {
//     if (!selectedState) return;
    
//     setStates(states.filter(s => s.id !== selectedState.id));
//     setTransitions(transitions.filter(t => 
//       t.from !== selectedState.id && t.to !== selectedState.id
//     ));
//     if (startState === selectedState.id) setStartState(null);
//     setAcceptStates(prev => prev.filter(id => id !== selectedState.id));
//     setSelectedState(null);
//   };

//   const saveAutomaton = () => {
//     const data = {
//       states,
//       transitions,
//       startState,
//       acceptStates
//     };
//     const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = 'automaton.json';
//     link.click();
//     URL.revokeObjectURL(url);
//   };

//   const loadAutomaton = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       try {
//         const data = JSON.parse(event.target.result);
//         setStates(data.states || []);
//         setTransitions(data.transitions || []);
//         setStartState(data.startState || null);
//         setAcceptStates(data.acceptStates || []);
//       } catch (error) {
//         console.error('Error loading automaton:', error);
//         alert('Invalid automaton file');
//       }
//     };
//     reader.readAsText(file);
//   };
  

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     // Draw transitions
//     transitions.forEach(({ from, to, symbol }) => {
//       const fromState = states.find(s => s.id === from);
//       const toState = states.find(s => s.id === to);
//       if (!fromState || !toState) return;

//       ctx.beginPath();
//       ctx.strokeStyle = '#666';
//       ctx.lineWidth = 2;
      
//       // Calculate control point for curved line
//       const dx = toState.x - fromState.x;
//       const dy = toState.y - fromState.y;
//       const midX = (fromState.x + toState.x) / 2;
//       const midY = (fromState.y + toState.y) / 2;
      
//       // Draw curved arrow
//       ctx.beginPath();
//       ctx.moveTo(fromState.x, fromState.y);
//       ctx.quadraticCurveTo(midX, midY - 20, toState.x, toState.y);
//       ctx.stroke();

//       // Draw arrowhead
//       const angle = Math.atan2(toState.y - midY, toState.x - midX);
//       ctx.beginPath();
//       ctx.moveTo(toState.x, toState.y);
//       ctx.lineTo(
//         toState.x - 15 * Math.cos(angle - Math.PI / 6),
//         toState.y - 15 * Math.sin(angle - Math.PI / 6)
//       );
//       ctx.lineTo(
//         toState.x - 15 * Math.cos(angle + Math.PI / 6),
//         toState.y - 15 * Math.sin(angle + Math.PI / 6)
//       );
//       ctx.closePath();
//       ctx.fillStyle = '#666';
//       ctx.fill();

//       // Draw transition symbol
//       ctx.fillStyle = '#000';
//       ctx.font = '14px Arial';
//       ctx.textAlign = 'center';
//       ctx.textBaseline = 'middle';
//       ctx.fillText(symbol, midX, midY - 20);
//     });

//     // Draw states
//     states.forEach(state => {
//       // Draw outer circle
//       ctx.beginPath();
//       ctx.arc(state.x, state.y, 25, 0, 2 * Math.PI);
//       ctx.fillStyle = selectedState?.id === state.id ? '#e3e3e3' : '#fff';
//       ctx.fill();
//       ctx.strokeStyle = '#000';
//       ctx.lineWidth = 2;
//       ctx.stroke();

//       // Draw inner circle for accept states
//       if (acceptStates.includes(state.id)) {
//         ctx.beginPath();
//         ctx.arc(state.x, state.y, 20, 0, 2 * Math.PI);
//         ctx.stroke();
//       }

//       // Draw arrow for start state
//       if (startState === state.id) {
//         ctx.beginPath();
//         ctx.moveTo(state.x - 40, state.y);
//         ctx.lineTo(state.x - 25, state.y);
//         ctx.strokeStyle = '#000';
//         ctx.lineWidth = 2;
//         ctx.stroke();

//         // Arrowhead
//         ctx.beginPath();
//         ctx.moveTo(state.x - 25, state.y);
//         ctx.lineTo(state.x - 35, state.y - 5);
//         ctx.lineTo(state.x - 35, state.y + 5);
//         ctx.fillStyle = '#000';
//         ctx.fill();
//       }

//       // Draw state label
//       ctx.fillStyle = '#000';
//       ctx.font = '16px Arial';
//       ctx.textAlign = 'center';
//       ctx.textBaseline = 'middle';
//       ctx.fillText(state.label, state.x, state.y);
//     });

//   }, [states, transitions, startState, acceptStates, selectedState, transitionStart]);

//   return (
//     <div className="w-full max-w-4xl mx-auto p-4">
//       <div className="space-y-4">
//         <div className="flex gap-2">
//           <button
//             className={`px-4 py-2 rounded ${drawMode === 'state' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//             onClick={() => setDrawMode('state')}
//           >
//             Add States
//           </button>
//           <button
//             className={`px-4 py-2 rounded ${drawMode === 'transition' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
//             onClick={() => setDrawMode('transition')}
//           >
//             Draw Transitions
//           </button>
//           {selectedState && (
//             <>
//               <button
//                 className="px-4 py-2 rounded bg-green-500 text-white"
//                 onClick={() => toggleStartState(selectedState)}
//               >
//                 Set Start State
//               </button>
//               <button
//                 className="px-4 py-2 rounded bg-purple-500 text-white"
//                 onClick={() => toggleAcceptState(selectedState)}
//               >
//                 Toggle Accept State
//               </button>
//               <button
//                 className="px-4 py-2 rounded bg-red-500 text-white"
//                 onClick={deleteState}
//               >
//                 Delete State
//               </button>
//             </>
//           )}
//           <button
//             className="px-4 py-2 rounded bg-gray-500 text-white"
//             onClick={saveAutomaton}
//           >
//             Save
//           </button>
//           <button
//             className="px-4 py-2 rounded bg-gray-500 text-white"
//             onClick={() => document.getElementById('file-input').click()}
//           >
//             Load
//           </button>
//           <input
//             id="file-input"
//             type="file"
//             accept=".json"
//             className="hidden"
//             onChange={loadAutomaton}
//           />
//           <input
//            type="text"
//               placeholder="Enter test membership string"
//                 className="px-4 py-2 rounded bg-gray-500 text-white"
//                 onSubmit={() => console.log("testing membership")}
//            /> {/*  input for testing membership */} 
//         </div>

//         <canvas
//           ref={canvasRef}
//           width={800}
//           height={400}
//           className="border rounded bg-white"
//           onMouseDown={handleCanvasMouseDown}
//           onMouseMove={handleCanvasMouseMove}
//           onMouseUp={handleCanvasMouseUp}
//         />
//       </div>
//     </div>
//   );
// };

// export default AutomataBuilder;

import React, { useState, useRef, useEffect } from 'react';

const AutomataBuilder = () => {
  // ... (keep existing state declarations)
  const [states, setStates] = useState([]);
  const [transitions, setTransitions] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [startState, setStartState] = useState(null);
  const [acceptStates, setAcceptStates] = useState([]);
  const [drawMode, setDrawMode] = useState('state');
  const [transitionStart, setTransitionStart] = useState(null);
  const [testString, setTestString] = useState('');
  const [testResult, setTestResult] = useState(null);
  
  const canvasRef = useRef(null);
  const [draggedState, setDraggedState] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Add the missing save/load functions
  const saveAutomaton = () => {
    const data = {
      states,
      transitions,
      startState,
      acceptStates
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'automaton.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadAutomaton = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setStates(data.states || []);
        setTransitions(data.transitions || []);
        setStartState(data.startState || null);
        setAcceptStates(data.acceptStates || []);
      } catch (error) {
        console.error('Error loading automaton:', error);
        alert('Invalid automaton file');
      }
    };
    reader.readAsText(file);
  };

  // Add the missing toggle functions
  const toggleStartState = (state) => {
    setStartState(startState === state.id ? null : state.id);
  };

  const toggleAcceptState = (state) => {
    setAcceptStates(prev => 
      prev.includes(state.id)
        ? prev.filter(id => id !== state.id)
        : [...prev, state.id]
    );
  };

  const deleteState = () => {
    if (!selectedState) return;
    
    setStates(states.filter(s => s.id !== selectedState.id));
    setTransitions(transitions.filter(t => 
      t.from !== selectedState.id && t.to !== selectedState.id
    ));
    if (startState === selectedState.id) setStartState(null);
    setAcceptStates(prev => prev.filter(id => id !== selectedState.id));
    setSelectedState(null);
  };

  // ... (keep all the existing helper functions, event handlers, and useEffect)
  const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

  const getMousePosition = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const findStateAtPosition = (pos) => {
    return states.find(state => 
      Math.sqrt(Math.pow(state.x - pos.x, 2) + Math.pow(state.y - pos.y, 2)) < 25
    );
  };

  const testMembership = () => {
    if (!startState) {
      setTestResult({ accepted: false, message: 'No start state defined!' });
      return;
    }

    let currentState = states.find(s => s.id === startState);
    const input = testString.split('');
    const path = [currentState.label];

    for (const symbol of input) {
      const transition = transitions.find(t => 
        t.from === currentState.id && t.symbol === symbol
      );

      if (!transition) {
        setTestResult({ 
          accepted: false, 
          message: `No transition from state ${currentState.label} with symbol ${symbol}`,
          path: path.join(' → ')
        });
        return;
      }

      currentState = states.find(s => s.id === transition.to);
      path.push(currentState.label);
    }

    const isAccepted = acceptStates.includes(currentState.id);
    setTestResult({
      accepted: isAccepted,
      message: isAccepted ? 'String accepted!' : 'String rejected: ended in non-accepting state',
      path: path.join(' → ')
    });
  };

  const handleCanvasMouseDown = (e) => {
    const pos = getMousePosition(e);
    const clickedState = findStateAtPosition(pos);

    if (clickedState) {
      if (drawMode === 'state') {
        setDraggedState(clickedState);
        setDragOffset({
          x: pos.x - clickedState.x,
          y: pos.y - clickedState.y
        });
        setSelectedState(clickedState);
      } else if (drawMode === 'transition') {
        setTransitionStart(clickedState);
      }
    } else if (drawMode === 'state') {
      const newState = {
        id: generateId(),
        label: `q${states.length}`,
        x: pos.x,
        y: pos.y
      };
      setStates([...states, newState]);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (draggedState) {
      const pos = getMousePosition(e);
      setStates(states.map(state => 
        state.id === draggedState.id 
          ? { ...state, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
          : state
      ));
    }
  };

  const handleCanvasMouseUp = (e) => {
    if (drawMode === 'transition' && transitionStart) {
      const pos = getMousePosition(e);
      const endState = findStateAtPosition(pos);

      if (endState) {
        const symbol = prompt('Enter transition symbol:', '');
        if (symbol !== null && symbol.trim() !== '') {
          const newTransition = {
            id: generateId(),
            from: transitionStart.id,
            to: endState.id,
            symbol: symbol.trim()
          };
          setTransitions([...transitions, newTransition]);
        }
      }
    }
    setDraggedState(null);
    setTransitionStart(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw transitions with enhanced arrows
    transitions.forEach(({ from, to, symbol }) => {
      const fromState = states.find(s => s.id === from);
      const toState = states.find(s => s.id === to);
      if (!fromState || !toState) return;

      // Calculate control points for bezier curve
      const dx = toState.x - fromState.x;
      const dy = toState.y - fromState.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Determine if it's a self-loop
      const isSelfLoop = from === to;
      
      if (isSelfLoop) {
        // Draw self-loop
        ctx.beginPath();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        const radius = 25;
        ctx.arc(fromState.x, fromState.y - radius, radius, 0.3 * Math.PI, 2.7 * Math.PI);
        ctx.stroke();

        // Draw arrowhead for self-loop
        const angle = -0.3 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(fromState.x + radius * Math.cos(angle), fromState.y - radius + radius * Math.sin(angle));
        ctx.lineTo(
          fromState.x + (radius + 10) * Math.cos(angle + 0.2),
          fromState.y - radius + (radius + 10) * Math.sin(angle + 0.2)
        );
        ctx.lineTo(
          fromState.x + (radius - 10) * Math.cos(angle - 0.2),
          fromState.y - radius + (radius - 10) * Math.sin(angle - 0.2)
        );
        ctx.fillStyle = '#666';
        ctx.fill();

        // Draw symbol above self-loop
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, fromState.x, fromState.y - 2 * radius);
      } else {
        // Calculate control point for curved line
        const midX = (fromState.x + toState.x) / 2;
        const midY = (fromState.y + toState.y) / 2;
        const curvature = 30; // Increase for more curve
        
        // Normal vector to the line between states
        const nx = -dy / distance;
        const ny = dx / distance;
        
        // Control point
        const cpX = midX + nx * curvature;
        const cpY = midY + ny * curvature;
        
        // Draw the curved arrow
        ctx.beginPath();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.moveTo(fromState.x, fromState.y);
        ctx.quadraticCurveTo(cpX, cpY, toState.x, toState.y);
        ctx.stroke();

        // Calculate point near the end for arrowhead
        const t = 0.9; // Position along the curve (0-1)
        const arrowX = (1-t)*(1-t)*fromState.x + 2*(1-t)*t*cpX + t*t*toState.x;
        const arrowY = (1-t)*(1-t)*fromState.y + 2*(1-t)*t*cpY + t*t*toState.y;
        
        // Calculate angle for arrowhead
        const angle = Math.atan2(toState.y - arrowY, toState.x - arrowX);
        
        // Draw enhanced arrowhead
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - 15 * Math.cos(angle - Math.PI / 6),
          arrowY - 15 * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          arrowX - 15 * Math.cos(angle + Math.PI / 6),
          arrowY - 15 * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = '#666';
        ctx.fill();

        // Draw transition symbol
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, cpX, cpY);
      }
    });

    // Draw states
    states.forEach(state => {
      // Draw outer circle
      ctx.beginPath();
      ctx.arc(state.x, state.y, 25, 0, 2 * Math.PI);
      ctx.fillStyle = selectedState?.id === state.id ? '#e3e3e3' : '#fff';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw inner circle for accept states
      if (acceptStates.includes(state.id)) {
        ctx.beginPath();
        ctx.arc(state.x, state.y, 20, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Draw arrow for start state
      if (startState === state.id) {
        ctx.beginPath();
        ctx.moveTo(state.x - 40, state.y);
        ctx.lineTo(state.x - 25, state.y);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(state.x - 25, state.y);
        ctx.lineTo(state.x - 35, state.y - 5);
        ctx.lineTo(state.x - 35, state.y + 5);
        ctx.fillStyle = '#000';
        ctx.fill();
      }

      // Draw state label
      ctx.fillStyle = '#000';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(state.label, state.x, state.y);
    });

  }, [states, transitions, startState, acceptStates, selectedState, transitionStart]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button
            className={`px-4 py-2 rounded ${drawMode === 'state' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setDrawMode('state')}
          >
            Add States
          </button>
          <button
            className={`px-4 py-2 rounded ${drawMode === 'transition' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setDrawMode('transition')}
          >
            Draw Transitions
          </button>
          {selectedState && (
            <>
              <button
                className="px-4 py-2 rounded bg-green-500 text-white"
                onClick={() => toggleStartState(selectedState)}
              >
                Set Start State
              </button>
              <button
                className="px-4 py-2 rounded bg-purple-500 text-white"
                onClick={() => toggleAcceptState(selectedState)}
              >
                Toggle Accept State
              </button>
              <button
                className="px-4 py-2 rounded bg-red-500 text-white"
                onClick={deleteState}
              >
                Delete State
              </button>
            </>
          )}
          <button
            className="px-4 py-2 rounded bg-gray-500 text-white"
            onClick={saveAutomaton}
          >
            Save
          </button>
          <button
            className="px-4 py-2 rounded bg-gray-500 text-white"
            onClick={() => document.getElementById('file-input').click()}
          >
            Load
          </button>
          <input
            id="file-input"
            type="file"
            accept=".json"
            className="hidden"
            onChange={loadAutomaton}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col">
            <label htmlFor="testString">Test String:</label>
            <input
              id="testString"
              type="text"
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              className="px-4 py-2 border rounded"
            />
            <button
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
              onClick={testMembership}
            >
              Test Membership
            </button>
          </div>
          {testResult && (
            <div className="flex flex-col">
              <h3 className="font-bold">Test Result:</h3>
              <p className={testResult.accepted ? 'text-green-600' : 'text-red-600'}>
                {testResult.message}
              </p>
              <p className="italic">Path: {testResult.path}</p>
            </div>
          )}
        </div>

        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          className="border border-gray-400"
        ></canvas>
      </div>
    </div>
  );
};

export default AutomataBuilder;
