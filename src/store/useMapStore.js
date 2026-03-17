import { create } from 'zustand';

const useMapStore = create((set, get) => ({
  // Layer visibility toggles
  layers: {
    webcams: false,
    satellites: false,
    radioTowers: false,
    traffic: false,
    overpass: false,
  },

  // Per-layer item counts
  counts: {
    webcams: 0,
    satellites: 0,
    radioTowers: 0,
    traffic: 0,
    overpass: 0,
  },

  // Per-layer loading state
  loading: {
    webcams: false,
    satellites: false,
    radioTowers: false,
    traffic: false,
    overpass: false,
  },

  // Map viewport
  mapCenter: [39.5, -98.35],
  mapZoom: 5,

  // Detail panel
  detailPanel: null, // { type, data }

  // TomTom key (entered by user in UI)
  tomtomKey: '',

  // Actions
  toggleLayer: (layerName) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layerName]: !state.layers[layerName],
      },
    })),

  setLayerOn: (layerName) =>
    set((state) => ({
      layers: { ...state.layers, [layerName]: true },
    })),

  setLayerOff: (layerName) =>
    set((state) => ({
      layers: { ...state.layers, [layerName]: false },
    })),

  setCount: (layerName, count) =>
    set((state) => ({
      counts: { ...state.counts, [layerName]: count },
    })),

  setLoading: (layerName, isLoading) =>
    set((state) => ({
      loading: { ...state.loading, [layerName]: isLoading },
    })),

  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),

  openDetailPanel: (type, data) => set({ detailPanel: { type, data } }),
  closeDetailPanel: () => set({ detailPanel: null }),

  setTomtomKey: (key) => set({ tomtomKey: key }),
}));

export default useMapStore;
