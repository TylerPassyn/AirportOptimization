import L from "leaflet";
import queue from "queue-fifo"; // Import the queue-fifo library for BFS to remove from the front in O(1) while adding to the back in O(1)

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
	let nodes_visited = [];
	const visited = new Set();
	const q = new queue();

	q.enqueue(startNode);
	visited.add(startNode);

	while (q.size() > 0) {
		const currentNode = q.dequeue(); //removes the first element in O(1) time
		nodes_visited.push(currentNode);
		console.log("Visiting Node:", currentNode);
		if (currentNode === endNode) {
			console.log("Found Node:", currentNode);
			return { found: currentNode, visited: nodes_visited };
		}
		let neighbors = graph[currentNode];
		if (Array.isArray(neighbors)) {
			for (const neighbor of neighbors) {
				if (!visited.has(neighbor.node)) {
					visited.add(neighbor.node);
					q.enqueue(neighbor.node);
				}
			}
		}
	}
	return null; // Return null if the endNode is not found
}

function DFS_stack(graph, startNode, endNode) {
	// This implementation is correct for an iterative DFS.
	const visited = new Set();
	const stack = [];
	stack.push(startNode);
	visited.add(startNode);

	while (stack.length > 0) {
		const currentNode = stack.pop();
		console.log("Visiting Node:", currentNode);
		if (currentNode === endNode) {
			console.log("Found Node:", currentNode);
			return currentNode;
		}
		let neighbors = graph[currentNode];
		// Check if neighbors exists and is an array before iterating, which is to say check that it is not undefined
		if (Array.isArray(neighbors)) {
			for (const neighbor of neighbors) {
				if (!visited.has(neighbor.node)) {
					visited.add(neighbor.node);
					stack.push(neighbor.node);
				}
			}
		}
	}
	return null;
}

function DFS(graph, startNode, endNode) {
	const visited = new Set();

	function dfsHelper(currentNode) {
		console.log("Visiting Node:", currentNode);
		visited.add(currentNode);

		if (currentNode === endNode) {
			console.log("Found Node:", currentNode);
			return currentNode;
		}

		let neighbors = graph[currentNode];
		// Check if neighbors exists and is an array before iterating
		if (Array.isArray(neighbors)) {
			for (const neighbor of neighbors) {
				if (!visited.has(neighbor.node)) {
					const result = dfsHelper(neighbor.node);
					if (result) return result; // Found the target
				}
			}
		}
		return null;
	}

	return dfsHelper(startNode);
}

export { constructGraphFromGeoJSON, BFS, DFS, DFS_stack };
