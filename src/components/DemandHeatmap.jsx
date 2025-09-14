import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

const DemandHeatmap = ({ points = [] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    const latlngs = points.map(p => [p.lat, p.lng, 0.5]);
    const heat = L.heatLayer(latlngs, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      minOpacity: 0.5
    });

    heat.addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
};

export default DemandHeatmap;
