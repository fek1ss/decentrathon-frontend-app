// TrafficMap.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  ScaleControl,
  useMap,
} from "react-leaflet";
import { useInterval } from "react-use";
import HeatmapLayer from "./HeatmapLayer";
import styles from "./styles.module.scss";

// Цвет линии по средней скорости (spd в m/s)
function colorBySpeed(avgSpeed) {
  if (avgSpeed <= 2) return "#d73027"; // красный — пробка
  if (avgSpeed <= 5) return "#fc8d59"; // оранжевый — медленно
  return "#1a9850"; // зелёный — свободно
}

// Толщина линии по скорости
function weightBySpeed(avgSpeed) {
  if (avgSpeed <= 2) return 6;
  if (avgSpeed <= 5) return 4;
  return 2;
}

const DEFAULT_CENTER = [43.2220, 76.8512]; // Алматы

// (опционально) компонент для ресайза карты
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    setTimeout(() => map.invalidateSize(), 0);
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export default function TrafficMap() {
  const [raw, setRaw] = useState([]);

  // грузим мок-файл
  const fetchData = async () => {
    try {
      const res = await fetch("../../../public/mock/mock_geo.json"); 
      if (!res.ok) throw new Error("fetch error " + res.status);
      const data = await res.json();
      setRaw(data);
    } catch (e) {
      console.error("Failed to load mock data:", e);
    }
  };

  // 1) первичная загрузка
  useEffect(() => {
    fetchData();
  }, []);

  // 2) обновление каждые 5 секунд (имитация real-time)
  useInterval(fetchData, 5000);

  // 3) готовим траектории и heatmap-точки
  const { trajectories, heatPoints } = useMemo(() => {
    if (!raw || raw.length === 0) return { trajectories: [], heatPoints: [] };

    const byId = {};
    for (const p of raw) {
      const id = String(p.randomized_id ?? "unknown");
      if (!byId[id]) byId[id] = [];
      byId[id].push({
        lat: +p.lat,
        lng: +p.lng,
        spd: isFinite(+p.spd) ? +p.spd : 0,
      });
    }

    const trajectories = Object.entries(byId).map(([id, pts]) => {
      const coords = pts.map((x) => [x.lat, x.lng]);
      const avgSpeed =
        pts.length > 0
          ? pts.reduce((a, b) => a + b.spd, 0) / pts.length
          : 0;
      return { id, coords, avgSpeed };
    });

    const heatPoints = raw.map((p) => [
      +p.lat,
      +p.lng,
      1, // интенсивность фиксированная
    ]);

    return { trajectories, heatPoints };
  }, [raw]);

  return (
    <div className={styles.driverMap}>
      <div className={styles.mapWrapper}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={13}
          className={styles.mapContainer}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />

          {/* Heatmap для спроса */}
          <HeatmapLayer points={heatPoints} />

          {/* Линии пробок */}
          {trajectories.map((t) => {
            if (!t.coords || t.coords.length < 2) return null;
            return (
              <Polyline
                key={t.id}
                positions={t.coords}
                pathOptions={{
                  color: colorBySpeed(t.avgSpeed),
                  weight: weightBySpeed(t.avgSpeed),
                  opacity: 0.9,
                }}
              />
            );
          })}

          <ScaleControl position="bottomleft" />
        </MapContainer>
      </div>
      <div className={styles.bottomPanel}>
        <div>Траекторий: {trajectories.length}</div>
        <div style={{ marginLeft: "auto" }}>
          Источник: mock_geo.json (polling 5s)
        </div>
      </div>
    </div>
  );
}
