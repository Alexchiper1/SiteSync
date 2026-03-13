import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

function LocationMarker({ value, onChange }) {
  useMapEvents({
    click(e) {
      onChange({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    }
  });

  return value ? <Marker position={[value.lat, value.lng]} /> : null;
}

export default function MapPicker({
  value,
  onChange,
  size = 320,
  defaultCenter = { lat: 53.3498, lng: -6.2603 },
  defaultZoom = 13
}) {
  const center = value
    ? [value.lat, value.lng]
    : [defaultCenter.lat, defaultCenter.lng];

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        margin: "0 auto"
      }}
    >
      <MapContainer
        center={center}
        zoom={defaultZoom}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker value={value} onChange={onChange} />
      </MapContainer>
    </div>
  );
}