import React from 'react';
import TranscriptomicsIcon from '../components/icons/TranscriptomicsIcon';
import ProteomicsIcon from '../components/icons/ProteomicsIcon';
import PTMIcon from '../components/icons/PTMIcon';
import SingleCellIcon from '../components/icons/SingleCellIcon';
import NcRNAIcon from '../components/icons/NcRNAIcon';
import { Activity, FlaskConical, Dna, DnaOff, ScatterChart } from 'lucide-react';

const IconPreview: React.FC = () => {
  return (
    <div style={{ 
      padding: '40px', 
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ marginBottom: '40px', color: '#1C484C' }}>
        GIST Data Analysis Icons Preview
      </h1>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '30px',
        marginBottom: '60px'
      }}>
        {/* Genomics */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <Dna size={48} color="#1C484C" />
          </div>
          <h3 style={{ margin: '10px 0', color: '#1C484C' }}>Genomics</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>Current: Dna (lucide)</p>
        </div>

        {/* Transcriptomics - NEW */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '3px solid #4CAF50'
        }}>
          <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
            <TranscriptomicsIcon size={48} color="#1C484C" />
          </div>
          <h3 style={{ margin: '10px 0', color: '#1C484C' }}>Transcriptomics</h3>
          <p style={{ fontSize: '14px', color: '#4CAF50', fontWeight: 'bold' }}>NEW Custom Icon</p>
        </div>

        {/* Transcriptomics - OLD */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          opacity: 0.6
        }}>
          <div style={{ marginBottom: '15px' }}>
            <Activity size={48} color="#1C484C" />
          </div>
          <h3 style={{ margin: '10px 0', color: '#1C484C' }}>Transcriptomics</h3>
          <p style={{ fontSize: '14px', color: '#999' }}>Old: Activity (lucide)</p>
        </div>

        {/* Proteomics - NEW */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '3px solid #4CAF50'
        }}>
          <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
            <ProteomicsIcon size={48} color="#1C484C" />
          </div>
          <h3 style={{ margin: '10px 0', color: '#1C484C' }}>Proteomics</h3>
          <p style={{ fontSize: '14px', color: '#4CAF50', fontWeight: 'bold' }}>NEW Custom Icon</p>
        </div>

        {/* Proteomics - OLD */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          opacity: 0.6
        }}>
          <div style={{ marginBottom: '15px' }}>
            <FlaskConical size={48} color="#1C484C" />
          </div>
          <h3 style={{ margin: '10px 0', color: '#1C484C' }}>Proteomics</h3>
          <p style={{ fontSize: '14px', color: '#999' }}>Old: FlaskConical</p>
        </div>

        {/* PTM - NEW */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '3px solid #4CAF50'
        }}>
          <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
            <PTMIcon size={48} color="#1C484C" />
          </div>
          <h3 style={{ margin: '10px 0', color: '#1C484C' }}>PTM Omics</h3>
          <p style={{ fontSize: '14px', color: '#4CAF50', fontWeight: 'bold' }}>NEW Custom Icon</p>
        </div>

        {/* Single-cell - NEW */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '3px solid #4CAF50'
        }}>
          <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
            <SingleCellIcon size={48} color="#1C484C" />
          </div>
          <h3 style={{ margin: '10px 0', color: '#1C484C' }}>Single-cell</h3>
          <p style={{ fontSize: '14px', color: '#4CAF50', fontWeight: 'bold' }}>NEW Custom Icon</p>
        </div>

        {/* Single-cell - OLD */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          opacity: 0.6
        }}>
          <div style={{ marginBottom: '15px' }}>
            <ScatterChart size={48} color="#1C484C" />
          </div>
          <h3 style={{ margin: '10px 0', color: '#1C484C' }}>Single-cell</h3>
          <p style={{ fontSize: '14px', color: '#999' }}>Old: ScatterChart</p>
        </div>

        {/* Non-coding RNA - NEW */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '3px solid #4CAF50'
        }}>
          <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
            <NcRNAIcon size={48} color="#1C484C" />
          </div>
          <h3 style={{ margin: '10px 0', color: '#1C484C' }}>Non-coding RNA</h3>
          <p style={{ fontSize: '14px', color: '#4CAF50', fontWeight: 'bold' }}>NEW Custom Icon</p>
        </div>

        {/* Non-coding RNA - OLD */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          opacity: 0.6
        }}>
          <div style={{ marginBottom: '15px' }}>
            <DnaOff size={48} color="#1C484C" />
          </div>
          <h3 style={{ margin: '10px 0', color: '#1C484C' }}>Non-coding RNA</h3>
          <p style={{ fontSize: '14px', color: '#999' }}>Old: DnaOff</p>
        </div>
      </div>

      {/* Size variations */}
      <h2 style={{ marginTop: '60px', marginBottom: '30px', color: '#1C484C' }}>
        Transcriptomics Icon - Size Variations
      </h2>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '40px',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ textAlign: 'center' }}>
          <TranscriptomicsIcon size={24} color="#1C484C" />
          <p style={{ marginTop: '10px', fontSize: '12px' }}>24px</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <TranscriptomicsIcon size={32} color="#1C484C" />
          <p style={{ marginTop: '10px', fontSize: '12px' }}>32px</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <TranscriptomicsIcon size={48} color="#1C484C" />
          <p style={{ marginTop: '10px', fontSize: '12px' }}>48px (default)</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <TranscriptomicsIcon size={64} color="#1C484C" />
          <p style={{ marginTop: '10px', fontSize: '12px' }}>64px</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <TranscriptomicsIcon size={96} color="#1C484C" />
          <p style={{ marginTop: '10px', fontSize: '12px' }}>96px</p>
        </div>
      </div>

      {/* Color variations */}
      <h2 style={{ marginTop: '60px', marginBottom: '30px', color: '#1C484C' }}>
        Transcriptomics Icon - Color Variations
      </h2>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '40px',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ textAlign: 'center' }}>
          <TranscriptomicsIcon size={64} color="#1C484C" />
          <p style={{ marginTop: '10px', fontSize: '12px' }}>#1C484C (default)</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <TranscriptomicsIcon size={64} color="#2196F3" />
          <p style={{ marginTop: '10px', fontSize: '12px' }}>Blue</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <TranscriptomicsIcon size={64} color="#4CAF50" />
          <p style={{ marginTop: '10px', fontSize: '12px' }}>Green</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <TranscriptomicsIcon size={64} color="#FF5722" />
          <p style={{ marginTop: '10px', fontSize: '12px' }}>Orange</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <TranscriptomicsIcon size={64} color="#9C27B0" />
          <p style={{ marginTop: '10px', fontSize: '12px' }}>Purple</p>
        </div>
      </div>
    </div>
  );
};

export default IconPreview;

