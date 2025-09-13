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
  }, [geo.latitude, geo.longitude]);

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

          <Marker position={position}>
            <Popup>Вы здесь</Popup>
          </Marker>

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
