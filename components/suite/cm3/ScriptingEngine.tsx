import React, { useState, useEffect } from 'react';
import { MOCK_SCRIPT, MOCK_MATERIALS } from '../../../constants';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

declare const loadPyodide: any;

export const ScriptingEngine: React.FC = () => {
    const [pyodide, setPyodide] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState<string>('Initializing Python environment...');
    const [code, setCode] = useState(MOCK_SCRIPT.code);

    useEffect(() => {
        async function setupPyodide() {
            try {
                const pyodideInstance = await loadPyodide();
                setOutput('Python environment ready.\n');
                setPyodide(pyodideInstance);
            } catch (error) {
                console.error("Pyodide loading failed:", error);
                setOutput('Error: Could not load Python environment.');
            } finally {
                setIsLoading(false);
            }
        }
        setupPyodide();
    }, []);
    
    const runScript = async () => {
        if (!pyodide) return;
        setIsRunning(true);
        setOutput('Running script...');
        
        // Use a timeout to allow the UI to update to "Running..."
        setTimeout(async () => {
            let scriptOutput = '';
            pyodide.setStdout({
                batched: (str: string) => {
                    scriptOutput += str + '\n';
                }
            });
            
            try {
                // Inject mock project data into the python environment
                pyodide.globals.set('project_data', JSON.stringify(MOCK_MATERIALS));
                await pyodide.runPythonAsync(code);
                setOutput(scriptOutput);
            } catch (error) {
                 if (error instanceof Error) {
                    setOutput(`Error:\n${error.message}`);
                } else {
                    setOutput('An unknown error occurred during script execution.');
                }
            } finally {
                setIsRunning(false);
            }
        }, 50);
    };

    return (
         <div className="h-full flex flex-col">
            <h1 className="text-2xl font-bold text-brand-light mb-4">Scripting & Automation Engine</h1>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex flex-col bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-brand-light mb-2">{MOCK_SCRIPT.name}</h2>
                    <p className="text-sm text-gray-400 mb-4">{MOCK_SCRIPT.description}</p>
                    <div className="flex-1 w-full overflow-hidden border border-gray-600 rounded-lg focus-within:ring-1 focus-within:ring-purple-500 focus-within:border-purple-500">
                        <CodeMirror
                            value={code}
                            height="100%"
                            theme={vscodeDark}
                            extensions={[python()]}
                            onChange={(value) => setCode(value)}
                            className="h-full text-sm"
                        />
                    </div>
                </div>
                 <div className="flex flex-col bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={runScript}
                            disabled={isLoading || isRunning}
                            className="flex-1 py-2 px-4 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-500 disabled:opacity-50"
                        >
                            {isLoading ? 'Initializing...' : isRunning ? 'Running...' : 'Run Script'}
                        </button>
                        <button
                            onClick={async () => {
                                if (!pyodide) return;
                                try {
                                    pyodide.runPython(`compile(${JSON.stringify(code)}, "<string>", "exec")`);
                                    setOutput('Syntax is valid.\n');
                                } catch (error) {
                                    if (error instanceof Error) {
                                        setOutput(`Syntax Error:\n${error.message}`);
                                    } else {
                                        setOutput('An unknown syntax error occurred.');
                                    }
                                }
                            }}
                            disabled={isLoading || isRunning}
                            className="py-2 px-4 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 disabled:opacity-50"
                        >
                            Check Syntax
                        </button>
                        <button
                            onClick={() => setOutput('')}
                            className="py-2 px-4 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 disabled:opacity-50"
                        >
                            Clear
                        </button>
                        <button
                            onClick={async () => {
                                if (!pyodide) return;
                                try {
                                    const vars = pyodide.runPython(`
import json
def get_vars():
    res = {}
    for k, v in globals().items():
        if not k.startswith('_') and type(v) in (int, float, str, bool, list, dict):
            res[k] = v
    return json.dumps(res, indent=2)
get_vars()
                                    `);
                                    setOutput(`Variables:\n${vars}`);
                                } catch (error) {
                                    setOutput('Could not retrieve variables.');
                                }
                            }}
                            disabled={isLoading || isRunning}
                            className="py-2 px-4 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 disabled:opacity-50"
                        >
                            Debug Vars
                        </button>
                    </div>
                    <h3 className="text-md font-semibold text-brand-light mb-2">Output Console</h3>
                    <pre className="flex-1 bg-gray-900/70 p-3 rounded-md text-sm text-gray-300 overflow-y-auto whitespace-pre-wrap">
                        <code>{output}</code>
                    </pre>
                 </div>
            </div>
        </div>
    );
};
