import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dna, Home, Database, BookOpen } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <img 
            src="/GIST_gpt.png" 
            alt="GIST Logo" 
            style={{ 
              width: '32px', 
              height: '32px', 
              marginRight: '8px',
              borderRadius: '50%'
            }} 
          />
          <span className="logo-text">ChatGIST</span>
        </Link>
        
        <div className="nav-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link
            to="/dataset"
            className={`nav-link ${location.pathname === '/dataset' ? 'active' : ''}`}
          >
            <Database size={18} />
            <span>Dataset</span>
          </Link>
          <Link
            to="/guide"
            className={`nav-link ${location.pathname === '/guide' ? 'active' : ''}`}
          >
            <BookOpen size={18} />
            <span>Guide</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;