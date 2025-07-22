// Utility to parse .fzp files and extract component information
export const parseFzpFile = async (fzpPath) => {
  try {
    const response = await fetch(fzpPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${fzpPath}: ${response.status}`);
    }
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    // Check for XML parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error(`XML parse error: ${parseError.textContent}`);
    }
    
    const module = xmlDoc.querySelector('module');
    if (!module) {
      throw new Error('No module element found in FZP file');
    }
    
    const title = xmlDoc.querySelector('title')?.textContent || '';
    const description = xmlDoc.querySelector('description')?.textContent || '';
    const author = xmlDoc.querySelector('author')?.textContent || '';
    
    // Parse properties
    const properties = {};
    const propertyElements = xmlDoc.querySelectorAll('property');
    propertyElements.forEach(prop => {
      const name = prop.getAttribute('name');
      const value = prop.textContent;
      if (name && value) {
        properties[name] = value;
      }
    });
    
    // Parse tags
    const tags = [];
    const tagElements = xmlDoc.querySelectorAll('tag');
    tagElements.forEach(tag => {
      if (tag.textContent) {
        tags.push(tag.textContent);
      }
    });
    
    // Parse breadboard view
    const breadboardView = xmlDoc.querySelector('breadboardView');
    let imagePath = '';
    if (breadboardView) {
      const layers = breadboardView.querySelector('layers');
      if (layers) {
        const imageAttr = layers.getAttribute('image');
        if (imageAttr) {
          imagePath = `/parts/svg/core/${imageAttr}`;
        }
      }
    }
    
    // Parse connectors
    const connectors = [];
    const connectorElements = xmlDoc.querySelectorAll('connector');
    connectorElements.forEach(connector => {
      const id = connector.getAttribute('id');
      const name = connector.getAttribute('name');
      const type = connector.getAttribute('type');
      const description = connector.querySelector('description')?.textContent || '';
      
      // Get pin information from breadboard view
      const breadboardView = connector.querySelector('breadboardView p');
      const svgId = breadboardView?.getAttribute('svgId') || '';
      const terminalId = breadboardView?.getAttribute('terminalId') || '';
      
      connectors.push({
        id,
        name,
        type,
        description,
        svgId,
        terminalId
      });
    });
    
    return {
      moduleId: module?.getAttribute('moduleId') || '',
      title,
      description,
      author,
      properties,
      tags,
      imagePath,
      connectors
    };
  } catch (error) {
    console.error('Error parsing FZP file:', error);
    throw new Error(`Failed to parse FZP file: ${error.message}`);
  }
};

// Load SVG content and extract connector positions
export const loadSvgWithConnectors = async (svgPath) => {
  try {
    const response = await fetch(svgPath);
    const svgText = await response.text();
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
    
    // Get SVG dimensions
    const svgElement = svgDoc.querySelector('svg');
    const width = parseFloat(svgElement.getAttribute('width')) || 100;
    const height = parseFloat(svgElement.getAttribute('height')) || 100;
    
    // Extract connector positions
    const connectorPositions = {};
    
    // Look for elements with IDs ending in 'terminal' or 'pin'
    const connectorElements = svgDoc.querySelectorAll('[id*="connector"]');
    connectorElements.forEach(element => {
      const id = element.getAttribute('id');
      let x = 0, y = 0;
      
      if (element.tagName === 'circle') {
        x = parseFloat(element.getAttribute('cx')) || 0;
        y = parseFloat(element.getAttribute('cy')) || 0;
      } else if (element.tagName === 'line') {
        // Use the end point of the line for pins
        x = parseFloat(element.getAttribute('x2')) || 0;
        y = parseFloat(element.getAttribute('y2')) || 0;
      }
      
      if (id) {
        connectorPositions[id] = { x, y };
      }
    });
    
    return {
      svgContent: svgText,
      width,
      height,
      connectorPositions
    };
  } catch (error) {
    console.error('Error loading SVG:', error);
    throw new Error(`Failed to load SVG: ${error.message}`);
  }
};