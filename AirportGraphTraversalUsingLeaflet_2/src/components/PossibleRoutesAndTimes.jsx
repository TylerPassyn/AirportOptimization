import React from "react";

const PossibleRoutesAndTimes = ({ routesAndTimes }) => {
	return (
		<div
			style={{
				border: "2px solid blue",
				height: "100%",
				width: "auto",
				alignItems: "center",
				justifyContent: "center",
				display: "flex",
				flexDirection: "column",
			}}>
			<div>
				<h1>Flights:</h1>
				{routesAndTimes.map((Path, index) => (
					<div key={index} style={{ marginBottom: "1rem" }}>
						<h2>Route {index + 1}:</h2>
						<p>Path: {Path.path.join(" -> ")}</p>
						{Path.routes.map((route, rIndex) => (
							<div key={rIndex} style={{ marginBottom: "0.5rem" }}>
								<strong>Flight {rIndex + 1}:</strong>
								{route.segments
									.map((seg) => `${seg.from} -> ${seg.to}`)
									.join(", ")}
								({route.totalDistance} km) - Time: {route.totalTime} hrs
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
};

export default PossibleRoutesAndTimes;
