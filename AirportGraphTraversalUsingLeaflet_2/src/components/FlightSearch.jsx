import React, { useState } from "react";
import flight_routes_geo_json from "../Configuration/flight_routes.json";

const FlightSearch = ({ graph, onResult }) => {
	const [start, setStart] = useState("");
	const [destination, setDestination] = useState("");

	//Validates existence of airport codes in the dataset
	const airportExists = (code) => {
		const features = flight_routes_geo_json.features;
		return features.some((f) => f.properties.iata_code === code);
	};

	const Djikstra = (graph, startNode, endNode, { earlyExit = true } = {}) => {
		if (!graph) return null;

		const keyMap = {};
		for (const k of Object.keys(graph)) keyMap[k.toUpperCase()] = k;
		const sKey = keyMap[startNode?.toUpperCase()];
		const eKey = keyMap[endNode?.toUpperCase()];
		if (!sKey || !eKey) return null;

		// Check for negative weights — Dijkstra requires non-negative weights
		for (const neighbors of Object.values(graph)) {
			if (!Array.isArray(neighbors)) continue;
			for (const n of neighbors) {
				if (typeof n.weight === "number" && n.weight < 0) {
					console.warn(
						"Dijkstra: negative edge weight detected — algorithm invalid."
					);
					return null;
				}
			}
		}

		const distances = {};
		const previous = {};
		const unvisited = new Set(Object.keys(graph));

		// init distances
		for (const node of Object.keys(graph)) {
			distances[node] = Infinity;
			previous[node] = null;
		}
		distances[sKey] = 0;

		while (unvisited.size > 0) {
			// select node in unvisited with minimum distance (linear scan)
			let current = null;
			let currentDist = Infinity;
			for (const node of unvisited) {
				if (distances[node] < currentDist) {
					current = node;
					currentDist = distances[node];
				}
			}

			// unreachable remaining nodes
			if (current === null || currentDist === Infinity) break;

			// If earlyExit requested, we can stop as soon as end is extracted
			if (earlyExit && current === eKey) break;

			unvisited.delete(current);

			const neighbors = graph[current];
			if (Array.isArray(neighbors)) {
				for (const neighbor of neighbors) {
					const alt = distances[current] + (neighbor.weight ?? 1);
					if (alt < (distances[neighbor.node] ?? Infinity)) {
						distances[neighbor.node] = alt;
						previous[neighbor.node] = current;
					}
				}
			}
		}

		if (distances[eKey] === Infinity) return null;

		const path = [];
		let u = eKey;
		while (u) {
			path.unshift(u);
			u = previous[u];
		}

		return { distance: distances[eKey], path };
	};

	const handleRouteSearch = (startCode, destCode) => {
		if (!startCode || !destCode) {
			alert("Please enter both start and destination airport codes.");
			return;
		}

		//Optional
		const s = startCode.trim().toUpperCase();
		const d = destCode.trim().toUpperCase();

		// Step 1: check airports exist
		if (!airportExists(s) || !airportExists(d)) {
			alert("One or both of the airports do not exist in our database.");
			return;
		}

		// Step 2: run Dijkstra
		const result = Djikstra(graph, s, d);
		if (!result) {
			alert(`No route found between ${s} and ${d}.`);
			console.warn("Dijkstra returned null or no path.");
			return;
		}

		// Step 3: present result
		const { distance, path } = result;
		const distanceStr = Number(distance).toFixed(2);

		//excessive error checking
		if (typeof onResult === "function") {
			onResult({ start: s, dest: d, distance, path });
		} else {
			alert(
				`Shortest path: ${path.join(" -> ")} (distance: ${distanceStr} km)`
			);
		}
		console.log("Dijkstra result:", result);
	};

	const handleSearch = () => {
		handleRouteSearch(start, destination);
	};

	return (
		<div className="flight-search-container">
			<h2>Enter your route</h2>
			<input
				type="text"
				placeholder="Start"
				onChange={(e) => setStart(e.target.value)}></input>
			<input
				type="text"
				placeholder="Destination"
				onChange={(e) => setDestination(e.target.value)}></input>
			<button onClick={handleSearch}>Search</button>
		</div>
	);
};

export default FlightSearch;
