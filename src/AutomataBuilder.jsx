//For NFA Membership test we need to implement the following functions:
// We need to run all the possible transitions for each symbol in the input string
// We need to keep track of the current state and the path taken
// We need to check if the current state is an accept state after processing the input string
// We need to display the result and the path taken.

import React, { useState, useRef, useEffect } from 'react';
import Button from './components/Button';

const AutomataBuilder = () => {
 
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

  // Adding the  save/load functions
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

    // Helper function to explore all possible paths
    const explore = (currentStateId, remainingInput, currentPath) => {
      // Base case: if no more input, check if we're in an accept state
      if (remainingInput.length === 0) {
        return acceptStates.includes(currentStateId) ? {
          accepted: true,
          path: currentPath
        } : null;
      }

      const symbol = remainingInput[0];


      // Find all possible transitions for the current state and symbol
      const possibleTransitions = transitions.filter(t =>
        t.from === currentStateId && t.symbol === symbol
      );

      // If no transitions found for this symbol, this path fails
      if (possibleTransitions.length === 0) {
        return null;
      }

      // Try each possible transition
      for (const transition of possibleTransitions) {
        const nextState = states.find(s => s.id === transition.to);
        const result = explore(
          transition.to,
          remainingInput.slice(1),
          [...currentPath, nextState.label]
        );

        // If any path leads to acceptance, return it
        if (result && result.accepted) {
          return result;
        }
      }

      // If no paths lead to acceptance, return null
      return null;
    };

    const initialState = states.find(s => s.id === startState);
    const result = explore(startState, testString.split(''), [initialState.label]);

    if (result) {
      setTestResult({
        accepted: true,
        message: 'String accepted!',
        path: result.path.join(' → ')
      });
    } else {
      setTestResult({
        accepted: false,
        message: 'String rejected: no accepting path found',
        path: 'No accepting path'
      });
    }
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
        const symbolInput = prompt('Enter transition symbol(s), separated by a comma (e.g., a,b):', '');
        if (symbolInput !== null && symbolInput.trim() !== '') {
          const symbols = symbolInput.split(',').map(symbol => symbol.trim());
          
          // Check if a transition already exists between these states
          const existingTransition = transitions.find(t => 
            t.from === transitionStart.id && t.to === endState.id
          );

          if (existingTransition) {
            // Combine symbols with existing transition
            const existingSymbols = existingTransition.symbol.split(',');
            const newSymbols = [...new Set([...existingSymbols, ...symbols])]; // Remove duplicates
            
            setTransitions(prevTransitions => prevTransitions.map(t =>
              t.id === existingTransition.id
                ? { ...t, symbol: newSymbols.join(',') }
                : t
            ));
          } else {
            // Create new transition with all symbols
            const newTransition = {
              id: generateId(),
              from: transitionStart.id,
              to: endState.id,
              symbol: symbols.join(',')
            };
            setTransitions(prevTransitions => [...prevTransitions, newTransition]);
          }
        }
      }
    }
    setDraggedState(null);
    setTransitionStart(null);
  };

  // Function to clear the DFA/NFA
  const clearAutomaton = () => {
    setStates([]); // Clear all states
    setTransitions([]); // Clear all transitions
    setStartState(null); // Reset the start state
    setAcceptStates([]); // Clear the accept states
    setSelectedState(null); // Reset the selected state
    setTestString(''); // Clear the test string
    setTestResult(null); // Clear the test result
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // To store the label positions for overlap detection
    let labelPositions = [];

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

      let labelX, labelY;
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Automata Builder</h1>

            <div className="space-y-6">
              {/* Tools Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Tools</h2>
                <div className="flex flex-wrap gap-3">
                  <Button
                      variant={drawMode === 'state' ? 'primary' : 'ghost'}
                      onClick={() => setDrawMode('state')}
                      active={drawMode === 'state'}
                  >
                    Add States
                  </Button>
                  <Button
                      variant={drawMode === 'transition' ? 'primary' : 'ghost'}
                      onClick={() => setDrawMode('transition')}
                      active={drawMode === 'transition'}
                  >
                    Draw Transitions
                  </Button>

                  {selectedState && (
                      <>
                        <Button
                            variant="secondary"
                            onClick={() => toggleStartState(selectedState)}
                        >
                          Set Start State
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => toggleAcceptState(selectedState)}
                        >
                          Toggle Accept State
                        </Button>
                        <Button
                            variant="danger"
                            onClick={deleteState}
                        >
                          Delete State
                        </Button>
                      </>
                  )}

                  <Button
                      variant="ghost"
                      onClick={saveAutomaton}
                  >
                    Save
                  </Button>
                  <Button
                      variant="ghost"
                      onClick={() => document.getElementById('file-input').click()}
                  >
                    Load
                  </Button>
                  <input
                      id="file-input"
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={loadAutomaton}
                  />
                  <Button
                      variant="ghost"
                      onClick={clearAutomaton} // Calls the clearAutomaton function
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Test Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Test Membership</h2>
                <div className="flex gap-6">
                  <div className="flex-1">
                    <label htmlFor="testString" className="block text-sm font-medium text-gray-700 mb-1">
                      Test String
                    </label>
                    <div className="flex gap-2">
                      <input
                          id="testString"
                          type="text"
                          value={testString}
                          onChange={(e) => setTestString(e.target.value)}
                          className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <Button
                          variant="primary"
                          onClick={testMembership}
                      >
                        Test
                      </Button>
                    </div>
                  </div>

                  {testResult && (
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Result</h3>
                        <div className={`p-3 rounded-lg ${testResult.accepted ? 'bg-green-100' : 'bg-red-100'}`}>
                          <p className={`font-medium ${testResult.accepted ? 'text-green-800' : 'text-red-800'}`}>
                            {testResult.message}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Path: {testResult.path}
                          </p>
                        </div>
                      </div>
                  )}
                </div>
              </div>

              {/* Canvas */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <canvas
                    ref={canvasRef}
                    width={1200}
                    height={800}
                    style={{ backgroundColor: '#f0f0f0', border: '1px solid #ccc' }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    className="w-full border border-gray-200 rounded-lg bg-white shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
  );

};

export default AutomataBuilder;
