import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet.heat";

const HeatmapLayer = ({ points = [] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const heatLayer = L.heatLayer(points, {
      radius: 25,   // радиус пятна
      blur: 15,     // размытие
      maxZoom: 17,  // при каком зуме детализация
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
};

export default HeatmapLayer;
