import { Marker, Popup } from "react-leaflet";

const BestSpot = ({ points = [], driverPos }) => {
  if (!points.length) return null;

  let best = points[0];
  let bestDist = Infinity;

  points.forEach(p => {
    const dist = Math.sqrt(
      Math.pow(driverPos[0] - p.lat, 2) +
      Math.pow(driverPos[1] - p.lng, 2)
    );
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
