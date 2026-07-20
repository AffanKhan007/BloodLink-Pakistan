import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

export default function RadarMap({ center, markers }) {
  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {markers.map((m) => (
        <Marker key={m.key} position={m.pos} icon={m.icon}>
          <Popup>{m.popup}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
