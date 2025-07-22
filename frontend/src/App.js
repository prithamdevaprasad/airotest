import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import PartLibrary from "./components/PartLibrary";
import CanvasEditor from "./components/CanvasEditor";
import { useProjects } from "./hooks/useProjects";
import { Button } from "./components/ui/button";
import { FileText, Download, Upload, Settings, Loader2 } from "lucide-react";
import { useToast } from "./hooks/use-toast";

const FritzingEditor = () => {
  const { toast } = useToast();
  const { 
    currentProject, 
    createProject, 
    updateProject, 
    duplicateProject,
    loading,
    error 
  } = useProjects();

  // Initialize with a new project if none exists
  useEffect(() => {
    if (!loading && !currentProject) {
      createProject({
        name: 'New Circuit',
        description: 'A new circuit design',
        parts: [],
        wires: [],
        canvas_settings: {}
      }).catch(console.error);
    }
  }, [loading, currentProject, createProject]);

  const handlePartSelect = (part) => {
    console.log('Part selected:', part);
  };

  const handleProjectUpdate = async (updatedProject) => {
    if (!currentProject) return;
    
    try {
      await updateProject(currentProject.id, {
        parts: updatedProject.parts,
        wires: updatedProject.wires,
        canvas_settings: updatedProject.canvas_settings
      });
    } catch (error) {
      console.error('Failed to update project:', error);
      // Don't show error toast as the app has fallback mechanisms
    }
  };

  const handleNewProject = async () => {
    try {
      await createProject({
        name: 'New Circuit',
        description: 'A new circuit design',
        parts: [],
        wires: [],
        canvas_settings: {}
      });
      
      toast({
        title: "New Project Created",
        description: "Started a new circuit design"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new project",
        variant: "destructive"
      });
    }
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
      
      toast({
        title: "Project Exported",
        description: "Circuit design downloaded successfully"
      });
    }
  };

  const handleDuplicateProject = async () => {
    if (currentProject) {
      try {
        await duplicateProject(currentProject.id, `${currentProject.name} (Copy)`);
        toast({
          title: "Project Duplicated",
          description: "Created a copy of the current circuit"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to duplicate project",
          variant: "destructive"
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading Fritzing Editor...</p>
          <p className="text-sm text-gray-400 mt-1">Connecting to backend</p>
        </div>
      </div>
    );
  }

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
                  {error && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="text-orange-600">Offline mode</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleNewProject}>
                <FileText className="w-4 h-4 mr-1" />
                New
              </Button>
              <Button variant="outline" size="sm" onClick={handleDuplicateProject} disabled={!currentProject}>
                <FileText className="w-4 h-4 mr-1" />
                Duplicate
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportProject} disabled={!currentProject}>
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
        <h4 className="font-medium text-blue-900 mb-2">Fritzing Editor</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Drag parts from the library onto the canvas</li>
          <li>• Click "Wire" mode to connect components</li>
          <li>• Use Select mode to move and rotate parts</li>
          <li>• Projects auto-save with backend integration</li>
          <li>• Export circuits as JSON files</li>
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