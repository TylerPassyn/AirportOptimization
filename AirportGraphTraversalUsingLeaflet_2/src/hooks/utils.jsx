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

			//anti-meridian check
			//sometimes the shortest distance crosses the anti-meridian, so we need to account for that
			// Calculate the distance between the two points in kilometers

			const distance = latlngA.distanceTo(latlngB) / 1000; // Convert to kilometers
			if (Math.abs(latlngA.lng - latlngB.lng) > 180) {
				// Adjust longitudes for anti-meridian crossing
				const adjustedLngB =
					latlngB.lng > 0 ? latlngB.lng - 360 : latlngB.lng + 360;
				const adjustedLatLngB = L.latLng(latlngB.lat, adjustedLngB);
				const adjustedDistance = latlngA.distanceTo(adjustedLatLngB) / 1000;
				adjacencyList[codeA].push({ node: codeB, weight: adjustedDistance });
			} else {
				adjacencyList[codeA].push({ node: codeB, weight: distance });
			}
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

//Special note
//This algoirthm requires that the graph be directred
function KhansAlgorithm(directedGraph) {
	// Build indegree map (assume directedGraph: { nodeId: [neighborId, ...], ... })
	const indegree = {};

	// ensure all nodes (keys) are present with 0 initial indegree
	for (const node of Object.keys(directedGraph)) {
		indegree[node] = 0;
	}

	for (const [u, neighbors] of Object.entries(directedGraph)) {
		if (!Array.isArray(neighbors)) continue;
		for (const v of neighbors) {
			if (!(v in indegree)) indegree[v] = 0;
			indegree[v] += 1;
		}
	}

	// enqueue nodes with indegree 0
	const q = new queue();
	for (const [node, deg] of Object.entries(indegree)) {
		if (deg === 0) q.enqueue(node);
	}

	const order = [];
	while (q.size() > 0) {
		const u = q.dequeue();
		order.push(u);

		const neighbors = directedGraph[u] || [];
		for (const v of neighbors) {
			indegree[v] -= 1;
			if (indegree[v] === 0) q.enqueue(v);
		}
	}

	const allNodesCount = Object.keys(indegree).length;
	const hasCycle = order.length !== allNodesCount;

	return {
		order,
		hasCycle,
		processed: order.length,
		totalNodes: allNodesCount,
	};
}

export { constructGraphFromGeoJSON, BFS, DFS, DFS_stack, KhansAlgorithm };
