import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.js';
import Top from './Top.js';
import reportWebVitals from './reportWebVitals.js';
import EnterRoom from './components/EnterRoom.js';
import CreateRoom from './components/CreateRoom.js';
import { Routes, Route, BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Top />} />
        <Route path="/battle" element={<App />} />
        <Route path="/enter-room" element={<EnterRoom />} />
        <Route path="/create-room" element={<CreateRoom />} />
      </Routes>
    </BrowserRouter>
);

reportWebVitals();
