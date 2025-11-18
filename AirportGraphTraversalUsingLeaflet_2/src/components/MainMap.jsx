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
import {
	constructGraphFromGeoJSON,
	BFS,
	DFS,
	DFS_stack,
	KhansAlgorithm,
} from "../hooks/utils";

import flight_routes_geo_json from "../Configuration/flight_routes.json";
import FlightSearch from "./FlightSearch";

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

//display the ordering of nodes in Khan's algorithm
const find_node7 = KhansAlgorithm(directedGraphForKhans);
console.log("Found Node 7 (Khan's):", find_node7);

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
	const [searchResult, setSearchResult] = useState(null);

	function handleSearchResult(result) {
		console.log("Received search result:", result);
		setSearchResult(result);
	}

	function linesFromPath(pathArray) {
		console.log("Generating lines from path:", pathArray);
		const features = flight_routes_geo_json.features;
		const lines = [];
		for (let i = 0; i < pathArray.length - 1; i++) {
			const codeA = pathArray[i];
			const codeB = pathArray[i + 1];
			console.log(`Finding features for codes: ${codeA}, ${codeB}`);
			const featureA = features.find((f) => f.properties.iata_code === codeA);
			const featureB = features.find((f) => f.properties.iata_code === codeB);
			console.log("TEST FOR BOTH FEATURES", featureA, featureB);
			if (!featureA || !featureB) continue;
			const coordsA = [
				featureA.geometry.coordinates[1],
				featureA.geometry.coordinates[0],
			];
			const coordsB = [
				featureB.geometry.coordinates[1],
				featureB.geometry.coordinates[0],
			];
			console.log(`Adding line from ${coordsA} to ${coordsB}`);
			lines.push([coordsA, coordsB]);
		}
		console.log("Generated lines:", lines);
		return lines;
	}

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
		// Run Kahn's algorithm on the directed graph and log results for students
		try {
			const result = KhansAlgorithm(directedGraphForKhans);
			console.log("Kahn's Algorithm:", result);
		} catch (err) {
			console.error("Error running Kahn's Algorithm:", err);
		}
	}

	return (
		<div>
			<FlightSearch graph={graph} onResult={handleSearchResult} />
			{searchResult && (
				<div
					style={{
						margin: "10px",
						padding: "10px",
						background: "#f0f0f0",
						borderRadius: "5px",
					}}>
					<h3>Search Result</h3>
					<p>
						<strong>Route:</strong> {searchResult.path.join(" → ")}
					</p>
					<p>
						<strong>Distance:</strong>{" "}
						{Number(searchResult.distance).toFixed(2)} km
					</p>
					<p>
						<strong>From:</strong> {searchResult.start} <strong>To:</strong>{" "}
						{searchResult.dest}
					</p>
				</div>
			)}
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
					worldCopyJump={true} //make sure that it jumps across the world map
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

					{searchResult && (
						<>
							{linesFromPath(searchResult.path).map((line, idx) => (
								<Polyline
									key={`search-${idx}`}
									positions={line}
									color="#7b2cbf"
									weight={4}
									opacity={0.9}
								/>
							))}
						</>
					)}
				</MapContainer>
			</div>
		</div>
	);
};

export default MainMap;
