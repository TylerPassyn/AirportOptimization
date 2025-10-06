import React, { useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { constructGraphFromGeoJSON, BFS } from "../hooks/utils";

import flight_routes_geo_json from "../Configuration/flight_routes.json";

const graph = constructGraphFromGeoJSON(flight_routes_geo_json);

const find_node = BFS(graph, "ATL", "LAX");
console.log(graph);
console.log("Found Node:", find_node);
const find_node2 = BFS(graph, "JFK", "LAX");
console.log("Found Node 2:", find_node2);

const MainMap = () => {
	const [showLines, setShowLines] = useState(false);

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

	// Function to generate lines between all points
	function generateLinesBetweenAllPoints() {
		const lines = [];
		const { features } = flight_routes_geo_json;

		for (let i = 0; i < features.length; i++) {
			const featureA = features[i];
			const coordsA = [
				featureA.geometry.coordinates[1],
				featureA.geometry.coordinates[0],
			];

			for (let j = i + 1; j < features.length; j++) {
				const featureB = features[j];
				const coordsB = [
					featureB.geometry.coordinates[1],
					featureB.geometry.coordinates[0],
				];

				lines.push([coordsA, coordsB]);
			}
		}
		return lines;
	}

	// Toggle function for showing/hiding lines
	function toggleLines() {
		setShowLines(!showLines);
	}

	return (
		<div>
			<button
				onClick={toggleLines}
				style={{
					margin: "10px",
					padding: "10px 20px",
					backgroundColor: showLines ? "#ff4444" : "#4444ff",
					color: "white",
					border: "none",
					borderRadius: "5px",
					cursor: "pointer",
				}}>
				{showLines ? "Hide Lines" : "Show Lines Between All Points"}
			</button>

			<div style={{ height: "80vh", width: "180vh", border: "3px solid red" }}>
				<MapContainer
					center={[39.8283, -98.5795]}
					zoom={4}
					style={{ height: "100%", width: "100%" }}>
					<TileLayer
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					/>

					<GeoJSON
						data={flight_routes_geo_json}
						onEachFeature={bindPopupstoMarkers}
					/>

					{/* Render lines if showLines is true */}
					{showLines &&
						generateLinesBetweenAllPoints().map((line, index) => (
							<Polyline
								key={index}
								positions={line}
								color="blue"
								weight={1}
								opacity={0.5}
							/>
						))}
				</MapContainer>
			</div>
		</div>
	);
};

export default MainMap;
