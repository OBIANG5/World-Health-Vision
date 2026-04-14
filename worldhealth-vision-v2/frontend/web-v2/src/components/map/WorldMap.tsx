import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";

const mapCenter: LatLngTuple = [18, 5];

export default function WorldMap() {
  return (
    <MapContainer
      center={mapCenter}
      zoom={2}
      minZoom={2}
      maxZoom={6}
      zoomControl={true}
      worldCopyJump={true}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap &copy; CARTO"
      />
    </MapContainer>
  );
}