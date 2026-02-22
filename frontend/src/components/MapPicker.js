import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    }
  });
  return null;
}

export default function MapPicker({
  value,
  onChange,
  height = 320,
  defaultCenter = { lat: 53.3498, lng: -6.2603 },
  defaultZoom = 12
}) {
  const center = value?.lat && value?.lng ? [value.lat, value.lng] : [defaultCenter.lat, defaultCenter.lng];

  return (
    <div style={{ width: "100%", height, borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb" }}>
      <MapContainer center={center} zoom={defaultZoom} style={{ width: "100%", height: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler
          onPick={(latlng) => {
            onChange({ lat: latlng.lat, lng: latlng.lng });
          }}
        />

        {value?.lat && value?.lng && <Marker position={[value.lat, value.lng]} />}
      </MapContainer>
    </div>
  );
}