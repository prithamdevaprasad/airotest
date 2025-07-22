import { useState, useEffect, useCallback } from 'react';
import { partsApi } from '../services/api';
import { mockParts } from '../utils/mockData';

export const useParts = () => {
  const [parts, setParts] = useState([]);
  const [families, setFamilies] = useState(['all']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadParts = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedParts = await partsApi.getParts(params);
      
      // If no parts returned from backend, use mock data as fallback
      if (fetchedParts && fetchedParts.length > 0) {
        setParts(fetchedParts);
      } else {
        console.log('No parts from backend, using mock data');
        setParts(mockParts);
      }
    } catch (err) {
      console.error('Failed to load parts from backend:', err);
      // Use mock data as fallback
      setParts(mockParts);
      setError('Using offline data - backend unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFamilies = useCallback(async () => {
    try {
      const fetchedFamilies = await partsApi.getPartFamilies();
      setFamilies(['all', ...fetchedFamilies]);
    } catch (err) {
      console.error('Failed to load families:', err);
      // Extract families from current parts as fallback
      const uniqueFamilies = [...new Set(
        parts.map(part => part.properties?.family).filter(Boolean)
      )];
      setFamilies(['all', ...uniqueFamilies]);
    }
  }, [parts]);

  const createPart = useCallback(async (partData) => {
    try {
      const newPart = await partsApi.createPart(partData);
      setParts(prev => [newPart, ...prev]);
      return newPart;
    } catch (err) {
      console.error('Failed to create part:', err);
      throw err;
    }
  }, []);

  const updatePart = useCallback(async (partId, partData) => {
    try {
      const updatedPart = await partsApi.updatePart(partId, partData);
      setParts(prev => prev.map(part => 
        part.id === partId ? updatedPart : part
      ));
      return updatedPart;
    } catch (err) {
      console.error('Failed to update part:', err);
      throw err;
    }
  }, []);

  const deletePart = useCallback(async (partId) => {
    try {
      await partsApi.deletePart(partId);
      setParts(prev => prev.filter(part => part.id !== partId));
    } catch (err) {
      console.error('Failed to delete part:', err);
      throw err;
    }
  }, []);

  const loadFritzingParts = useCallback(async (forceReload = false) => {
    try {
      setLoading(true);
      const result = await partsApi.loadFritzingParts(forceReload);
      await loadParts(); // Reload parts after loading from Fritzing
      return result;
    } catch (err) {
      console.error('Failed to load Fritzing parts:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadParts]);

  // Load parts on mount
  useEffect(() => {
    loadParts();
  }, [loadParts]);

  // Load families when parts change
  useEffect(() => {
    if (parts.length > 0) {
      loadFamilies();
    }
  }, [parts, loadFamilies]);

  return {
    parts,
    families,
    loading,
    error,
    loadParts,
    createPart,
    updatePart,
    deletePart,
    loadFritzingParts,
    refetch: loadParts
  };
};