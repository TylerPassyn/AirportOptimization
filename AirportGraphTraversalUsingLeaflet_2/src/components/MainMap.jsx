import React from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import constructGraphFromGeoJSON from "../hooks/utils";

import flight_routes_geo_json from "../Configuration/flight_routes.json";

const graph = constructGraphFromGeoJSON(flight_routes_geo_json);
console.log(graph);

const MainMap = () => {
	/***
	 *@abstract Loops through each feature, and binds a popup to it
	 */
	function bindPopupstoMarkers(feature, layer) {
		if (feature.properties && feature.properties.name) {
			const popupContent = `<p>${feature.properties.name}</p><p>IATA: ${feature.properties.iata_code}</p>
			<p>LatLng: ${feature.geometry.coordinates}</p>`;
			layer.bindPopup(popupContent);
		}
	}

	return (
		<div style={{ height: "80vh", width: "180vh", border: "3px solid red" }}>
			<MapContainer
				center={[39.8283, -98.5795]}
				zoom={4}
				style={{ height: "100%", width: "100%" }}>
				<TileLayer
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				/>
				{/* The GeoJSON component will render your flight routes data */}
				<GeoJSON
					data={flight_routes_geo_json}
					onEachFeature={bindPopupstoMarkers} //Implicitly passes our parameters into the function, we do not pass them ourselves
				/>
			</MapContainer>
		</div>
	);
};

export default MainMap;
