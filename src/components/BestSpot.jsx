import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const BestSpot = ({ points = [], driverPos }) => {
  if (!points.length) return null;

  let best = points[0];
  let bestDist = Infinity;

  points.forEach(p => {
    const dist = L.latLng(driverPos).distanceTo(L.latLng(p.lat, p.lng));
    if (dist < bestDist) {
      bestDist = dist;
      best = p;
    }
  });

  return (
    <Marker position={[best.lat, best.lng]}>
      <Popup>🔥 Здесь больше всего потенциальных заказов рядом</Popup>
    </Marker>
  );
};

export default BestSpot;
  