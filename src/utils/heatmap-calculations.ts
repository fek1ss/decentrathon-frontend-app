import { GeoLocation, GeoPoint, HeatmapPoint, ClusteredPoint, HeatmapConfig } from '../types';
import { HEATMAP_CONFIG } from '../constants';

export const calculateDistance = (point1: GeoPoint, point2: GeoPoint): number => {
  const R = 6371e3;
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

export const clusterPoints = (points: GeoLocation[], distance: number): ClusteredPoint[] => {
  const clusters: ClusteredPoint[] = [];
  const processed = new Set<number>();

  for (let i = 0; i < points.length; i++) {
    if (processed.has(i)) continue;

    const cluster: ClusteredPoint = {
      center: { lat: points[i].lat, lng: points[i].lng },
      points: [points[i]],
      radius: 0,
      intensity: 0,
      count: 1,
    };

    for (let j = i + 1; j < points.length; j++) {
      if (processed.has(j)) continue;

      const dist = calculateDistance(
        { lat: points[i].lat, lng: points[i].lng },
        { lat: points[j].lat, lng: points[j].lng }
      );

      if (dist <= distance) {
        cluster.points.push(points[j]);
        processed.add(j);
      }
    }

    processed.add(i);
    clusters.push(cluster);
  }

  return clusters;
};

export const calculateClusterProperties = (cluster: ClusteredPoint): ClusteredPoint => {
  if (cluster.points.length === 1) {
    return {
      ...cluster,
      radius: HEATMAP_CONFIG.CLUSTERING_DISTANCE,
      intensity: 1,
    };
  }

  let totalLat = 0;
  let totalLng = 0;
  let maxDistance = 0;

  cluster.points.forEach(point => {
    totalLat += point.lat;
    totalLng += point.lng;
  });

  const centerLat = totalLat / cluster.points.length;
  const centerLng = totalLng / cluster.points.length;

  cluster.points.forEach(point => {
    const distance = calculateDistance(
      { lat: centerLat, lng: centerLng },
      { lat: point.lat, lng: point.lng }
    );
    maxDistance = Math.max(maxDistance, distance);
  });

  const radius = Math.max(maxDistance * 2, HEATMAP_CONFIG.CLUSTERING_DISTANCE);
  const intensity = Math.min(cluster.points.length / 10, 1);

  return {
    ...cluster,
    center: { lat: centerLat, lng: centerLng },
    radius,
    intensity,
    count: cluster.points.length,
  };
};

export const createHeatmapGrid = (
  points: GeoLocation[],
  config: HeatmapConfig
): HeatmapPoint[] => {
  const clusters = clusterPoints(points, config.gridSize * 1000);
  const processedClusters = clusters.map(calculateClusterProperties);

  return processedClusters
    .filter(cluster => cluster.intensity >= config.intensityThreshold)
    .slice(0, config.maxPoints)
    .map(cluster => ({
      lat: cluster.center.lat,
      lng: cluster.center.lng,
      radius: cluster.radius,
      intensity: cluster.intensity,
      count: cluster.count,
    }));
};

export const filterPointsByBounds = (
  points: GeoLocation[],
  bounds: { north: number; south: number; east: number; west: number }
): GeoLocation[] => {
  return points.filter(point => 
    point.lat >= bounds.south &&
    point.lat <= bounds.north &&
    point.lng >= bounds.west &&
    point.lng <= bounds.east
  );
};

export const calculateHeatmapStats = (heatmapPoints: HeatmapPoint[]) => {
  if (heatmapPoints.length === 0) {
    return {
      totalPoints: 0,
      totalIntensity: 0,
      averageIntensity: 0,
      maxIntensity: 0,
      minIntensity: 0,
    };
  }

  const intensities = heatmapPoints.map(p => p.intensity);
  const totalIntensity = intensities.reduce((sum, intensity) => sum + intensity, 0);
  const maxIntensity = Math.max(...intensities);
  const minIntensity = Math.min(...intensities);

  return {
    totalPoints: heatmapPoints.length,
    totalIntensity,
    averageIntensity: totalIntensity / heatmapPoints.length,
    maxIntensity,
    minIntensity,
  };
};
