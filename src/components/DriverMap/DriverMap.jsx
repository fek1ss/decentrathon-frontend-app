import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  ScaleControl,
} from 'react-leaflet';
import { useGeolocation } from 'react-use';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './styles.module.scss';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const demandIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const bestSpotIcon = new L.Icon({
  iconUrl: '/assets/path_to_blue_marker.png', // любой другой цвет
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const ALMATY_CENTER = [43.222, 76.8512];

// Компонент для плавного изменения центра карты
function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

const DriverMap = () => {
  const [demandData, setDemandData] = useState([]);

  const geo = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 10000,
  });

  const [position, setPosition] = useState([43.238949, 76.889709]);

  useEffect(() => {
    if (geo.latitude && geo.longitude) {
      setPosition([geo.latitude, geo.longitude]);
    }

    fetch('/mock/mock_geo.json')
      .then(res => res.json())
      .then(data => {
        setDemandData(data);
      })
      .catch(err => console.error(err));
  }, [geo.latitude, geo.longitude]);

  // шаг 1: делим на сетку
  const gridSize = 0.01;
  const gridCounts = {};

  demandData.forEach(p => {
    const key = `${Math.floor(p.lat / gridSize)}-${Math.floor(p.lng / gridSize)}`;
    if (!gridCounts[key])
      gridCounts[key] = { count: 0, lat: p.lat, lng: p.lng };
    gridCounts[key].count += 1;
  });

  // шаг 2: находим лучший квадрат
  const bestSpot = Object.values(gridCounts).reduce(
    (a, b) => (b.count > a.count ? b : a),
    { count: 0, lat: 0, lng: 0 },
  );

  return (
    <div className={styles.driverMap}>
      <div className={styles.mapWrapper}>
        <MapContainer
          center={position}
          zoom={13}
          className={styles.mapContainer}
          scrollWheelZoom
          style={{ width: '500px' }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Маркер пользователя */}
          <Marker position={position} icon={demandIcon}>
            <Popup>Вы здесь</Popup>
          </Marker>

          {/* Маркеры точек спроса */}
          {demandData.map((point, index) => (
            <Marker
              key={`${point.id}-${index}`} // уникальный ключ
              position={[point.lat, point.lng]}
            >
              <Popup>Возможный заказ</Popup>
            </Marker>
          ))}

          {/* Маркер лучшего места */}
          {bestSpot.count > 0 && (
            <Marker
              position={[bestSpot.lat, bestSpot.lng]}
              icon={bestSpotIcon}
            >
              <Popup>Лучшее место стоять водителю</Popup>
            </Marker>
          )}

          <RecenterMap center={position} />
          <ScaleControl position="bottomleft" />
        </MapContainer>
      </div>

      {/* Нижняя панель */}
      <div className={styles.bottomPanel}>
        <div>
          Центр карты: {position[0].toFixed(5)},{' '}
          {position[1].toFixed(5)}
        </div>
        <div className={styles.zoomInfo}>Zoom: 13</div>
        {geo.error && (
          <div className={styles.error}>
            Ошибка: {geo.error.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverMap;
