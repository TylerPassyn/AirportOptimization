import React, { useState, useEffect } from "react";
import {
	MapContainer,
	TileLayer,
	GeoJSON,
	Polyline,
	useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-polylinedecorator";
import { constructGraphFromGeoJSON, BFS, DFS, DFS_stack } from "../hooks/utils";

import flight_routes_geo_json from "../Configuration/flight_routes.json";

const graph = constructGraphFromGeoJSON(flight_routes_geo_json);

const directedGraphForKhans = {
	YYZ: ["JFK"], // Toronto -> New York
	JFK: ["LAX"], // New York -> Los Angeles
	ORD: ["LAX"], // Chicago -> Los Angeles
	LAX: ["HND"], // Los Angeles -> Tokyo
	HND: ["SYD"], // Tokyo -> Sydney
	SYD: [], // Sydney -> (no outgoing - end node)
};

console.log("Directed Graph for Khan's:", directedGraphForKhans);

const find_node3 = DFS(graph, "ATL", "LAX");
console.log("Found Node 3 (DFS):", find_node3);
const find_node4 = DFS(graph, "JFK", "LAX");
console.log("Found Node 4 (DFS):", find_node4);

const find_node5 = DFS_stack(graph, "ATL", "LAX");
console.log("Found Node 5 (DFS_stack):", find_node5);
const find_node6 = DFS_stack(graph, "JFK", "LAX");
console.log("Found Node 6 (DFS_stack):", find_node6);

// Component to add arrow decorators to polylines
function DirectedEdges({ lines }) {
	const map = useMap();

	useEffect(() => {
		const layers = [];

		lines.forEach((line) => {
			const polyline = L.polyline(line, {
				color: "green",
				weight: 3,
				opacity: 0.7,
			}).addTo(map);

			// Add arrow decorator
			const decorator = L.polylineDecorator(polyline, {
				patterns: [
					{
						offset: "100%",
						repeat: 0,
						symbol: L.Symbol.arrowHead({
							pixelSize: 15,
							polygon: false,
							pathOptions: {
								stroke: true,
								color: "green",
								weight: 3,
								opacity: 0.7,
							},
						}),
					},
				],
			}).addTo(map);

			layers.push(polyline, decorator);
		});

		return () => {
			layers.forEach((layer) => map.removeLayer(layer));
		};
	}, [map, lines]);

	return null;
}

const MainMap = () => {
	const [showLines, setShowLines] = useState(false);
	const [showLinesBFSPath, setShowLinesBFSPath] = useState(false);
	const [showDirectedGraph, setShowDirectedGraph] = useState(false);

	/***
	 * A really cool function!
	 *@abstract Loops through each feature, and binds a popup to it
	 */
	function bindPopupstoMarkers(feature, layer) {
		if (feature.properties && feature.properties.name) {
			const popupContent = `<p>${feature.properties.name}</p><p>IATA: ${feature.properties.iata_code}</p>
			<p>LatLng: ${feature.geometry.coordinates}</p>`;
			layer.bindPopup(popupContent);
		}
	}

	//displays the directed graph
	function displayDirectedGraphKhan() {
		const lines = [];
		const features = flight_routes_geo_json.features;

		// Log all available airport codes
		const availableCodes = features.map((f) => f.properties.iata_code);
		console.log("Available airport codes:", availableCodes);

		// Iterate through each node in the directed graph
		for (const [fromCode, toNodes] of Object.entries(directedGraphForKhans)) {
			const featureFrom = features.find(
				(f) => f.properties.iata_code === fromCode
			);

			if (!featureFrom) {
				console.error(`❌ Airport ${fromCode} NOT FOUND in GeoJSON`);
				continue;
			}

			const coordsFrom = [
				featureFrom.geometry.coordinates[1],
				featureFrom.geometry.coordinates[0],
			];

			console.log(
				`✓ Found ${fromCode} at [${coordsFrom}], has ${toNodes.length} outgoing edges`
			);

			// Create lines to each destination
			toNodes.forEach((toCode) => {
				const featureTo = features.find(
					(f) => f.properties.iata_code === toCode
				);

				if (featureTo) {
					const coordsTo = [
						featureTo.geometry.coordinates[1],
						featureTo.geometry.coordinates[0],
					];

					lines.push([coordsFrom, coordsTo]);
					console.log(`  ✓ Added edge: ${fromCode} -> ${toCode}`);
				} else {
					console.error(`  ❌ Destination ${toCode} NOT FOUND in GeoJSON`);
				}
			});
		}

		console.log(`📊 Total directed edges created: ${lines.length}`);
		console.log("Lines array:", lines);
		return lines;
	}

	function displayPathOfBFS() {
		const bfsResult = BFS(graph, "YYZ", "JFK");
		if (!bfsResult || !Array.isArray(bfsResult.visited)) {
			// BFS didn't find end or returned unexpected result — return no lines
			console.warn("BFS returned no path or unexpected result:", bfsResult);
			return [];
		}

		const features = flight_routes_geo_json.features;
		const visitedNodes = bfsResult.visited;
		console.log("BFS Visited Nodes:", visitedNodes);
		const lines = [];

		for (let i = 0; i < visitedNodes.length - 1; i++) {
			const featureA = features.find(
				(f) => f.properties.iata_code === visitedNodes[i]
			);
			if (!featureA) continue;
			const coordsA = [
				featureA.geometry.coordinates[1],
				featureA.geometry.coordinates[0],
			];

			for (let j = i + 1; j < visitedNodes.length; j++) {
				const featureB = features.find(
					(f) => f.properties.iata_code === visitedNodes[j]
				);
				if (!featureB) continue;
				const coordsB = [
					featureB.geometry.coordinates[1],
					featureB.geometry.coordinates[0],
				];

				lines.push([coordsA, coordsB]);
			}
		}
		return lines;
	}

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

	function toggleLinesBFSPath() {
		setShowLinesBFSPath(!showLinesBFSPath);
	}

	function toggleDirectedGraph() {
		setShowDirectedGraph(!showDirectedGraph);
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
			<button
				onClick={toggleLinesBFSPath}
				style={{
					margin: "10px",
					padding: "10px 20px",
					backgroundColor: showLinesBFSPath ? "#ff4444" : "#4444ff",
					color: "white",
					border: "none",
					borderRadius: "5px",
					cursor: "pointer",
				}}>
				{showLinesBFSPath ? "Hide BFS Path" : "Show BFS Path"}
			</button>
			<button
				onClick={toggleDirectedGraph}
				style={{
					margin: "10px",
					padding: "10px 20px",
					backgroundColor: showDirectedGraph ? "#ff4444" : "#44ff44",
					color: "white",
					border: "none",
					borderRadius: "5px",
					cursor: "pointer",
				}}>
				{showDirectedGraph
					? "Hide Directed Graph"
					: "Show Directed Graph (Khan's)"}
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

					{showLinesBFSPath &&
						displayPathOfBFS().map((line, index) => (
							<Polyline
								key={index}
								positions={line}
								color="red"
								weight={3}
								opacity={0.8}
							/>
						))}

					{showDirectedGraph && (
						<DirectedEdges lines={displayDirectedGraphKhan()} />
					)}
				</MapContainer>
			</div>
		</div>
	);
};

export default MainMap;
