import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";

export default function SiteLiveMap({ site, userPos, height = 320, zoom = 15 }) {
  if (!site?.lat || !site?.lng) return null;

  const siteCenter = [site.lat, site.lng];
  const radius = Number(site.radiusMeters ?? 100);

  const userCenter =
    userPos?.lat && userPos?.lng ? [userPos.lat, userPos.lng] : null;

  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #e5e7eb"
      }}
    >
      <MapContainer center={siteCenter} zoom={zoom} style={{ width: "100%", height: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* site marker + allowed radius */}
        <Marker position={siteCenter} />
        <Circle center={siteCenter} radius={radius} />

        {/* employee marker */}
        {userCenter && <Marker position={userCenter} />}
      </MapContainer>
    </div>
  );
}