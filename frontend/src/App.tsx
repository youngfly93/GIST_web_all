import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dataset from './pages/Dataset';
import Guide from './pages/Guide';
import GeneInfo from './pages/GeneInfo';
import AIChat from './pages/AIChat';
import MiRNAResults from './pages/MiRNAResults';
import NcRNAResults from './pages/NcRNAResults';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dataset" element={<Dataset />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/gene-info" element={<GeneInfo />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/mirna-results" element={<MiRNAResults />} />
            <Route path="/circrna-results" element={<NcRNAResults />} />
            <Route path="/lncrna-results" element={<NcRNAResults />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>&copy; 2024 ChatGIST - 基因信息智能助手</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;