import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import Test from "./components/Test";
import MainMap from "./components/MainMap";

function App() {
	return (
		<Routes>
			<Route path="/" element={<MainMap />} />
			<Route path="/test" element={<Test />} />
		</Routes>
	);
}

export default App;
