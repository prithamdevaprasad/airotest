import React, { useState, useEffect } from 'react';
import { Search, Package, Tag } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { mockParts } from '../utils/mockData';

const PartLibrary = ({ onPartSelect, className }) => {
  const [parts, setParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('all');
  const [filteredParts, setFilteredParts] = useState([]);

  useEffect(() => {
    // Load parts (using mock data for now)
    setParts(mockParts);
    setFilteredParts(mockParts);
  }, []);

  useEffect(() => {
    let filtered = parts;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(part =>
        part.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by family
    if (selectedFamily !== 'all') {
      filtered = filtered.filter(part =>
        part.properties.family?.toLowerCase() === selectedFamily.toLowerCase()
      );
    }

    setFilteredParts(filtered);
  }, [parts, searchTerm, selectedFamily]);

  const families = ['all', ...new Set(parts.map(part => part.properties.family).filter(Boolean))];

  const handleDragStart = (event, part) => {
    event.dataTransfer.setData('application/json', JSON.stringify(part));
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Package size={20} />
          Parts Library
        </h3>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Search parts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Family filter */}
        <div className="flex flex-wrap gap-2">
          {families.map(family => (
            <Badge
              key={family}
              variant={selectedFamily === family ? "default" : "outline"}
              className="cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setSelectedFamily(family)}
            >
              {family}
            </Badge>
          ))}
        </div>
      </div>

      {/* Parts list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredParts.map(part => (
            <div
              key={part.id}
              className="bg-gray-50 rounded-lg p-3 cursor-grab hover:bg-gray-100 transition-colors border border-gray-200 hover:border-blue-300 hover:shadow-sm"
              draggable
              onDragStart={(e) => handleDragStart(e, part)}
              onClick={() => onPartSelect && onPartSelect(part)}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-white rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                  {part.imagePath ? (
                    <img
                      src={part.imagePath}
                      alt={part.title}
                      className="max-w-full max-h-full object-contain"
                      style={{ width: '40px', height: '40px' }}
                    />
                  ) : (
                    <Package size={20} className="text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 truncate">
                    {part.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {part.description}
                  </p>
                  
                  {part.tags && part.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {part.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                          <Tag size={10} className="mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {part.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          +{part.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {filteredParts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package size={48} className="mx-auto mb-3 text-gray-300" />
              <p>No parts found</p>
              <p className="text-sm">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PartLibrary;