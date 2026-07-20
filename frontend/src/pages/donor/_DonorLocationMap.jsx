import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultCenter = [31.52, 74.35];

const pinIcon = L.divIcon({
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#e53935;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>',
});

function ClickHandler({ onLocationChange }) {
  useMapEvents({
    click(event) {
      onLocationChange(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function CenterButton() {
  const map = useMapEvents({});
  return (
    <button
      type="button"
      onClick={() => {
        navigator.geolocation?.getCurrentPosition(
          (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 13),
          () => {}
        );
      }}
      style={{
        position: "absolute",
        bottom: "12px",
        right: "12px",
        zIndex: 1000,
        padding: "6px 12px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)",
        background: "var(--surface)",
        color: "var(--text)",
        cursor: "pointer",
        fontSize: "0.8rem",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      }}
    >
      Center on my location
    </button>
  );
}

export default function DonorLocationMap({ latitude, longitude, onLocationChange }) {
  const center = latitude != null && longitude != null ? [latitude, longitude] : defaultCenter;
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    setMapKey((k) => k + 1);
  }, [center[0], center[1]]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <MapContainer key={mapKey} center={center} zoom={13} style={{ width: "100%", height: "100%" }} scrollWheelZoom>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler onLocationChange={onLocationChange} />
        {latitude != null && longitude != null ? (
          <Marker position={[latitude, longitude]} icon={pinIcon} />
        ) : null}
        <CenterButton />
      </MapContainer>
    </div>
  );
}
