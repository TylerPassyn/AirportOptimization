import L from "leaflet";

/**
 * @abstract Creates a graph adjacency list from a GeoJSON FeatureCollection of points.
 * @param {object} geoJson - The GeoJSON data.
 * @returns {object} An adjacency list representing the graph.
 */
function constructGraphFromGeoJSON(geoJson) {
	const adjacencyList = {};
	const { features } = geoJson; //destructure features from geoJson

	// First, initialize the adjacency list with an empty array for each airport.
	for (let i = 0; i < features.length; i++) {
		const feature = features[i];
		if (feature.properties && feature.properties.iata_code) {
			adjacencyList[feature.properties.iata_code] = [];
		}
	}

	// Then, for each airport, calculate the distance to every other airport.
	for (let i = 0; i < features.length; i++) {
		const featureA = features[i];
		const codeA = featureA.properties.iata_code;
		const latlngA = L.latLng(
			featureA.geometry.coordinates[1],
			featureA.geometry.coordinates[0]
		);

		for (let j = 0; j < features.length; j++) {
			// Avoid creating self-loops
			if (i === j) continue;

			const featureB = features[j];
			const codeB = featureB.properties.iata_code;
			const latlngB = L.latLng(
				featureB.geometry.coordinates[1],
				featureB.geometry.coordinates[0]
			);

			const distance = latlngA.distanceTo(latlngB) / 1000; // Convert to kilometers
			adjacencyList[codeA].push({ node: codeB, weight: distance });
		}
	}
	return adjacencyList;
}

function BFS(graph, startNode, endNode) {
	const visited = new Set();
	const queue = [startNode];
	const result = [];
	visited.add(startNode);
	while (queue.length > 0) {
		const currentNode = queue.shift();
		if (currentNode === endNode) {
			return currentNode;
		}
		const neighbors = graph[currentNode];
		for (const neighbor of neighbors) {
			if (!visited.has(neighbor.node)) {
				visited.add(neighbor.node);
				queue.push(neighbor.node);
			}
		}
	}
	return result;
}

export default constructGraphFromGeoJSON;
