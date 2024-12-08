//For NFA Membership test we need to implement the following functions:
// We need to run all the possible transitions for each symbol in the input string
// We need to keep track of the current state and the path taken
// We need to check if the current state is an accept state after processing the input string
// We need to display the result and the path taken.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Button from './components/Button';

const EPSILON = 'ε';

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
  const [selectedTransition, setSelectedTransition] = useState(null);
  
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

    // Helper function to get epsilon closure of a state
    const getEpsilonClosure = (stateId, visited = new Set()) => {
      if (visited.has(stateId)) return [];
      visited.add(stateId);

      const epsilonTransitions = transitions.filter(t => 
        t.from === stateId && t.symbol === EPSILON
      );

      const reachableStates = [stateId];
      epsilonTransitions.forEach(transition => {
        reachableStates.push(...getEpsilonClosure(transition.to, visited));
      });

      return [...new Set(reachableStates)];
    };

    // Helper function to explore all possible paths
    const explore = (currentStates, remainingInput, currentPath, visited = new Set()) => {
      // Convert visited array to string for Set storage
      const visitedKey = `${currentStates.join(',')}:${remainingInput}`;
      if (visited.has(visitedKey)) return null;
      visited.add(visitedKey);

      // Get epsilon closure for all current states
      const expandedStates = currentStates.flatMap(stateId => getEpsilonClosure(stateId));
      const uniqueExpandedStates = [...new Set(expandedStates)];

      // Base case: if no more input, check if any current state is an accept state
      if (remainingInput.length === 0) {
        return uniqueExpandedStates.some(stateId => acceptStates.includes(stateId)) 
          ? { accepted: true, path: currentPath }
          : null;
      }

      const symbol = remainingInput[0];
      const nextStates = new Set();
      const nextPaths = new Map();

      // Find all possible transitions for current states and symbol
      uniqueExpandedStates.forEach(stateId => {
        const possibleTransitions = transitions.filter(t =>
          t.from === stateId && t.symbol === symbol
        );

        possibleTransitions.forEach(transition => {
          nextStates.add(transition.to);
          const state = states.find(s => s.id === transition.to);
          if (state) {
            nextPaths.set(transition.to, state.label);
          }
        });
      });

      // If no transitions found for this symbol, this path fails
      if (nextStates.size === 0) {
        return null;
      }

      // Try each possible next state
      const nextStatesArray = Array.from(nextStates);
      const result = explore(
        nextStatesArray,
        remainingInput.slice(1),
        [...currentPath, Array.from(nextPaths.values()).join('/')],
        visited
      );

      return result;
    };

    const initialState = states.find(s => s.id === startState);
    const result = explore([startState], testString.split(''), [initialState.label]);

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

    // Reset selections
    setSelectedTransition(null);
    
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
    } else {
      // Check if clicked on a transition
      const clickedTransition = findTransitionAtPosition(pos);
      if (clickedTransition) {
        setSelectedTransition(clickedTransition);
        setSelectedState(null);
      } else if (drawMode === 'state') {
        const newState = {
          id: generateId(),
          label: `q${states.length}`,
          x: pos.x,
          y: pos.y
        };
        setStates([...states, newState]);
      }
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
        const symbolInput = prompt('Enter transition symbol(s), separated by comma. Use "ε" for epsilon transition:', '');
        if (symbolInput !== null && symbolInput.trim() !== '') {
          // Split the symbols by comma and trim any extra spaces
          const symbols = symbolInput.split(',').map(symbol => symbol.trim());

          // Create a new transition for each symbol
          symbols.forEach(symbol => {
            const newTransition = {
              id: generateId(),
              from: transitionStart.id,
              to: endState.id,
              symbol: symbol === 'e' ? EPSILON : symbol // Convert 'e' to ε symbol
            };
            setTransitions(prevTransitions => [...prevTransitions, newTransition]);
          });
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

  // Add this helper function to get all transitions between two states
  const getTransitionsBetweenStates = useCallback((fromId, toId) => {
    return transitions.filter(t => t.from === fromId && t.to === toId);
  }, [transitions]);

  // Update the drawArrow function to handle multiple transitions
  const drawArrow = useCallback((ctx, from, to, transition, isSelected = false, transitionIndex = 0, totalTransitions = 1) => {
    const headLength = 15;
    const headAngle = Math.PI / 6;
    const stateRadius = 25;
    
    // Handle self-transitions (loops)
    if (from.id === to.id) {
      // Calculate offset based on number of self-loops
      const angleOffset = (Math.PI / 6) * (transitionIndex - (totalTransitions - 1) / 2);
      const loopRadius = 35;
      
      // Starting point on the state circle
      const startAngle = -Math.PI / 2 + angleOffset;
      const startX = from.x + stateRadius * Math.cos(startAngle);
      const startY = from.y + stateRadius * Math.sin(startAngle);
      
      // Control points for the bezier curve
      const controlX1 = from.x + loopRadius * 2 * Math.cos(startAngle - Math.PI / 6);
      const controlY1 = from.y + loopRadius * 2 * Math.sin(startAngle - Math.PI / 6);
      const controlX2 = from.x + loopRadius * 2 * Math.cos(startAngle + Math.PI / 6);
      const controlY2 = from.y + loopRadius * 2 * Math.sin(startAngle + Math.PI / 6);
      
      // End point slightly offset from start point
      const endAngle = startAngle + Math.PI / 6;
      const endX = from.x + stateRadius * Math.cos(endAngle);
      const endY = from.y + stateRadius * Math.sin(endAngle);
      
      // Draw the loop
      ctx.beginPath();
      ctx.strokeStyle = isSelected ? '#7c3aed' : '#4b5563';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
      ctx.stroke();
      
      // Calculate arrow head position and angle
      const arrowAngle = Math.atan2(endY - controlY2, endX - controlX2);
      
      // Draw arrow head
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(arrowAngle - headAngle),
        endY - headLength * Math.sin(arrowAngle - headAngle)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(arrowAngle + headAngle),
        endY - headLength * Math.sin(arrowAngle + headAngle)
      );
      ctx.stroke();
      
      // Draw label
      const labelRadius = loopRadius * 1.5;
      const labelAngle = startAngle + Math.PI / 12;
      const labelX = from.x + labelRadius * Math.cos(labelAngle);
      const labelY = from.y + labelRadius * Math.sin(labelAngle);
      
      drawTransitionLabel(ctx, transition.symbol, labelX, labelY, isSelected);
      return;
    }
    
    // Rest of the existing drawArrow code for non-self-loops...
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // For transitions between different states
    const curveOffset = totalTransitions > 1 
      ? (transitionIndex - (totalTransitions - 1) / 2) * 30 
      : 0;
      
    // Calculate control point for curved line
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const normalX = -dy / distance;
    const normalY = dx / distance;
    
    const controlX = midX + normalX * curveOffset;
    const controlY = midY + normalY * curveOffset;
    
    // Calculate points outside the state circles
    const startAngle = Math.atan2(controlY - from.y, controlX - from.x);
    const endAngle = Math.atan2(controlY - to.y, controlX - to.x);
    
    const startX = from.x + stateRadius * Math.cos(startAngle);
    const startY = from.y + stateRadius * Math.sin(startAngle);
    const endX = to.x + stateRadius * Math.cos(endAngle);
    const endY = to.y + stateRadius * Math.sin(endAngle);
    
    // Draw the curved arrow
    ctx.beginPath();
    ctx.strokeStyle = isSelected ? '#7c3aed' : '#4b5563';
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(controlX, controlY, endX, endY);
    ctx.stroke();
    
    // Draw arrow head
    const arrowAngle = Math.atan2(endY - controlY, endX - controlX);
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(arrowAngle - headAngle),
      endY - headLength * Math.sin(arrowAngle - headAngle)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(arrowAngle + headAngle),
      endY - headLength * Math.sin(arrowAngle + headAngle)
    );
    ctx.stroke();
    
    // Draw transition label
    const labelX = controlX;
    const labelY = controlY;
    drawTransitionLabel(ctx, transition.symbol, labelX, labelY, isSelected);
  }, []);

  // Add a helper function to draw transition labels
  const drawTransitionLabel = (ctx, symbol, x, y, isSelected) => {
    const padding = 8;
    const textWidth = ctx.measureText(symbol).width;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = 24;
    
    // Draw tooltip background
    ctx.fillStyle = isSelected ? '#7c3aed' : '#ffffff';
    ctx.strokeStyle = isSelected ? '#7c3aed' : '#4b5563';
    ctx.beginPath();
    ctx.roundRect(
      x - boxWidth / 2,
      y - boxHeight / 2,
      boxWidth,
      boxHeight,
      5
    );
    ctx.fill();
    ctx.stroke();
    
    // Draw symbol text
    ctx.fillStyle = isSelected ? '#ffffff' : '#1f2937';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, x, y);
  };

  // Add this helper function to detect clicks on transitions
  const findTransitionAtPosition = (pos) => {
    return transitions.find(t => 
      Math.sqrt(Math.pow(t.x - pos.x, 2) + Math.pow(t.y - pos.y, 2)) < 25
    );
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Group transitions by their from/to states
    const drawnTransitions = new Set();
    
    states.forEach(fromState => {
      states.forEach(toState => {
        const transitionsForPair = getTransitionsBetweenStates(fromState.id, toState.id);
        if (transitionsForPair.length > 0) {
          transitionsForPair.forEach((transition, index) => {
            const isSelected = selectedState?.id === transition.id;
            drawArrow(
              ctx,
              fromState,
              toState,
              transition,
              isSelected,
              index,
              transitionsForPair.length
            );
            drawnTransitions.add(transition.id);
          });
        }
      });
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

  }, [
    states, 
    transitions, 
    startState, 
    acceptStates, 
    selectedState, 
    selectedTransition,
    drawArrow, 
    getTransitionsBetweenStates
  ]);

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