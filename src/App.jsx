import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MapPage from './pages/Map/MapPage';
import CronicasPage from './pages/Cronicas/CronicasPage';
import './App.css';

function App() {
 const [isMestre, setIsMestre] = useState(false);

 return (
 <div className="app-layout">
 <Sidebar isMestre={isMestre} setIsMestre={setIsMestre} />
 
 <main className="main-content">
 <Routes>
 <Route path="/" element={<MapPage />} />
 <Route path="/cronicas" element={<CronicasPage isMestre={isMestre} />} />
 </Routes>
 </main>
 </div>
 );
}

export default App;
