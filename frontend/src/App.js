import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import PartLibrary from "./components/PartLibrary";
import CanvasEditor from "./components/CanvasEditor";
import { mockProjects, getProject } from "./utils/mockData";
import { Button } from "./components/ui/button";
import { FileText, Download, Upload, Settings } from "lucide-react";

const FritzingEditor = () => {
  const [currentProject, setCurrentProject] = useState(null);

  useEffect(() => {
    // Load default project for demo
    const defaultProject = getProject('project-1') || mockProjects[0];
    setCurrentProject(defaultProject);
  }, []);

  const handlePartSelect = (part) => {
    console.log('Part selected:', part);
  };

  const handleProjectUpdate = (updatedProject) => {
    setCurrentProject(updatedProject);
  };

  const handleNewProject = () => {
    const newProject = {
      id: `project-${Date.now()}`,
      name: 'New Circuit',
      description: 'A new circuit design',
      parts: [],
      wires: []
    };
    setCurrentProject(newProject);
  };

  const handleExportProject = () => {
    if (currentProject) {
      const dataStr = JSON.stringify(currentProject, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentProject.name}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                Fritzing Editor
              </h1>
              {currentProject && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{currentProject.name}</span>
                  <span className="mx-2">•</span>
                  <span>{currentProject.parts?.length || 0} parts</span>
                  <span className="mx-2">•</span>
                  <span>{currentProject.wires?.length || 0} wires</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleNewProject}>
                <FileText className="w-4 h-4 mr-1" />
                New
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportProject}>
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-1" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Parts Library Sidebar */}
        <PartLibrary 
          className="w-80 flex-shrink-0"
          onPartSelect={handlePartSelect}
        />

        {/* Canvas Editor */}
        <CanvasEditor 
          className="flex-1"
          project={currentProject}
          onProjectUpdate={handleProjectUpdate}
        />
      </div>

      {/* Demo Instructions */}
      <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm shadow-lg">
        <h4 className="font-medium text-blue-900 mb-2">Quick Start Guide</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Drag parts from the library onto the canvas</li>
          <li>• Click "Wire" mode to connect components</li>
          <li>• Use Select mode to move and rotate parts</li>
          <li>• Right-click parts for additional options</li>
          <li>• Use mouse wheel or zoom buttons to zoom</li>
        </ul>
      </div>

      <Toaster />
    </div>
  );
};

const Home = () => {
  return <FritzingEditor />;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;