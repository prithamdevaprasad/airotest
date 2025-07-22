// Real Fritzing parts loader
import { parseFzpFile } from './parseFzp';

export const loadRealFritzingParts = async () => {
  // For now, return empty array to use mock data
  // The fritzing-parts repository is available at /app/public/parts/
  // This can be extended later with a proper backend API
  return [];
};

export const mockParts = [
  {
    id: 'led-red',
    moduleId: 'led-red',
    title: 'Red LED (5mm)',
    description: 'A standard 5mm red LED',
    author: 'Sample Author',
    properties: {
      family: 'LED',
      color: 'red',
      size: '5mm',
      'forward voltage': '2.0V',
      'max current': '20mA'
    },
    tags: ['LED', 'light', 'red'],
    imagePath: '/parts/breadboard/led-red-breadboard.svg',
    connectors: [
      {
        id: 'connector0',
        name: 'anode',
        type: 'male',
        description: 'positive lead',
        svgId: 'connector0pin',
        terminalId: 'connector0terminal'
      },
      {
        id: 'connector1',
        name: 'cathode',
        type: 'male',
        description: 'negative lead',
        svgId: 'connector1pin',
        terminalId: 'connector1terminal'
      }
    ]
  },
  {
    id: 'resistor-330',
    moduleId: 'resistor-330',
    title: '330Ω Resistor',
    description: 'A 330 ohm through-hole resistor',
    author: 'Sample Author',
    properties: {
      family: 'Resistor',
      resistance: '330Ω',
      tolerance: '±5%',
      power: '0.25W'
    },
    tags: ['resistor', '330', 'ohm'],
    imagePath: '/parts/breadboard/resistor-330-breadboard.svg',
    connectors: [
      {
        id: 'connector0',
        name: 'pin0',
        type: 'male',
        description: 'pin',
        svgId: 'connector0pin',
        terminalId: 'connector0terminal'
      },
      {
        id: 'connector1',
        name: 'pin1',
        type: 'male',
        description: 'pin',
        svgId: 'connector1pin',
        terminalId: 'connector1terminal'
      }
    ]
  },
  {
    id: 'arduino-uno',
    moduleId: 'arduino-uno',
    title: 'Arduino Uno R3',
    description: 'Arduino Uno R3 microcontroller board',
    author: 'Sample Author',
    properties: {
      family: 'Arduino',
      type: 'Uno R3',
      processor: 'ATmega328P'
    },
    tags: ['Arduino', 'microcontroller', 'Uno'],
    imagePath: '/parts/breadboard/arduino-uno-breadboard.svg',
    connectors: [
      {
        id: 'connector0',
        name: 'D13',
        type: 'male',
        description: 'Digital pin 13',
        svgId: 'connector0pin',
        terminalId: 'connector0terminal'
      },
      {
        id: 'connector1',
        name: 'GND',
        type: 'male',
        description: 'Ground',
        svgId: 'connector1pin',
        terminalId: 'connector1terminal'
      },
      {
        id: 'connector2',
        name: '5V',
        type: 'male',
        description: '5V power',
        svgId: 'connector2pin',
        terminalId: 'connector2terminal'
      }
    ]
  }
];

// Mock projects data
export const mockProjects = [
  {
    id: 'project-1',
    name: 'LED Blink Circuit',
    description: 'Simple LED blink circuit with Arduino',
    parts: [
      {
        id: 'part-1',
        partId: 'arduino-uno',
        position: { x: 100, y: 100 },
        rotation: 0
      },
      {
        id: 'part-2',
        partId: 'led-red',
        position: { x: 300, y: 150 },
        rotation: 0
      },
      {
        id: 'part-3',
        partId: 'resistor-330',
        position: { x: 250, y: 200 },
        rotation: 0
      }
    ],
    wires: [
      {
        id: 'wire-1',
        fromPartId: 'part-1',
        fromConnector: 'connector0',
        toPartId: 'part-3',
        toConnector: 'connector0',
        color: '#ff0000'
      },
      {
        id: 'wire-2',
        fromPartId: 'part-3',
        fromConnector: 'connector1',
        toPartId: 'part-2',
        toConnector: 'connector0',
        color: '#ff0000'
      }
    ]
  }
];

// Local storage helpers for mock data persistence
export const saveProject = (project) => {
  const projects = getProjects();
  const existingIndex = projects.findIndex(p => p.id === project.id);
  
  if (existingIndex >= 0) {
    projects[existingIndex] = project;
  } else {
    projects.push(project);
  }
  
  localStorage.setItem('fritzing-projects', JSON.stringify(projects));
};

export const getProjects = () => {
  const stored = localStorage.getItem('fritzing-projects');
  return stored ? JSON.parse(stored) : [...mockProjects];
};

export const getProject = (id) => {
  const projects = getProjects();
  return projects.find(p => p.id === id);
};

export const deleteProject = (id) => {
  const projects = getProjects();
  const filtered = projects.filter(p => p.id !== id);
  localStorage.setItem('fritzing-projects', JSON.stringify(filtered));
};