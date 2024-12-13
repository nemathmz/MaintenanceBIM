import React, { useState, useEffect } from 'react';    
import * as XLSX from 'xlsx';
import './FmecaWindow.css';
import { useSettings } from '../../services/useSettings';  

const SearchFields: React.FC = () => {
  const [compressedGuid, setCompressedGuid] = useState<string>(''); 
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [maintenanceStrategies, setMaintenanceStrategies] = useState<{ [key: string]: string }>({});
  const [inputValues, setInputValues] = useState<{ [key: string]: { severity: number; occurrence: number; detectability: number } }>({});
  const { picked } = useSettings();  

  // read the Excel file
  const readExcelFile = async () => {
    try {
      const response = await fetch('/FMECA.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      setExcelData(data);
    } catch (error) {
      console.error('Error reading Excel file:', error);
    }
  };

  useEffect(() => {
    readExcelFile();
  }, []);

  useEffect(() => {
    if (!picked && !compressedGuid) {
      setFilteredResults([]);  
      return;
    }
    
    const filtered = excelData.filter((item: any) => {
      const guidMatch = compressedGuid
        ? item['Compressed Guid']?.toString().toLowerCase().includes(compressedGuid.toLowerCase())
        : true;

      return guidMatch;
    });

    setFilteredResults(filtered);
  }, [compressedGuid, excelData, picked]);

  // Use compressed GUID from picked
  useEffect(() => {
    if (picked) {
      setCompressedGuid(picked);  
    } else {
      
      setCompressedGuid('');
      setFilteredResults([]);
    }
  }, [picked]);

  // RCM decision logic
  const determineMaintenanceStrategy = (failureId: string) => {
    const { severity, occurrence, detectability } = inputValues[failureId] || {};
    let strategy = '';
    if (severity <= 2) {
      strategy = 'Run-to-failure maintenance';
    } else if (severity > 2) {
      if (occurrence <= 2) {
        strategy = 'Corrective maintenanc';
      } else {
        if (detectability <= 2) {
          strategy = 'Condition-based maintenance';
        } else {
          strategy = 'Preventive maintenance';
        }
      }
    }
    setMaintenanceStrategies(prev => ({ ...prev, [failureId]: strategy }));
  };

  const handleInputChange = (failureId: string, field: string, value: number) => {
    setInputValues(prev => ({
      ...prev,
      [failureId]: {
        ...prev[failureId],
        [field]: value,
      },
    }));
  };

  return (
    <div id='projects-window'>
      <h3>Failure Modes, Effects and Criticality Analysis</h3>
      <div id='search-fields-container'>
        <div id='search-fields'>
          <label htmlFor="compressedGuid">Search by Compressed GUID:</label>
          <input
            type="text"
            id="compressedGuid"
            placeholder="Enter Compressed GUID"
            value={compressedGuid}
            onChange={(e) => setCompressedGuid(e.target.value)}
          />
        </div>

      
        {filteredResults.length > 0 ? (
          <div id='filtered-results'>
           
            <h4>Component with GUID: {compressedGuid} has ID: {filteredResults[0]['Component Id']}</h4>

            {filteredResults.map((result, index) => (
              <table className="faults-table" key={index}>
                <thead>
                  <tr>
                    <th>Failure ID</th>
                    <th>{result['Failure Id']}</th>
                    <th>Maintenance Strategy</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="label-cell">Description</td>
                    <td>{result['Failure Mode']}</td>
                    <td rowSpan={6}>
                      <div className="input-fields">
                        <label>Severity</label>
                        <input
                          type="number"
                          placeholder="Rating 1-5"
                          onChange={(e) => handleInputChange(result['Failure Id'], 'severity', Number(e.target.value))}
                        />
                        <label>Occurrence</label>
                        <input
                          type="number"
                          placeholder="Rating 1-5"
                          onChange={(e) => handleInputChange(result['Failure Id'], 'occurrence', Number(e.target.value))}
                        />
                        <label>Detectability</label>
                        <input
                          type="number"
                          placeholder="Rating 1-5"
                          onChange={(e) => handleInputChange(result['Failure Id'], 'detectability', Number(e.target.value))}
                        />
                        <button onClick={() => determineMaintenanceStrategy(result['Failure Id'])}>
                          View maintenance strategy
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="label-cell">Cause</td>
                    <td>{result['Failure Cause']}</td>
                  </tr>
                  <tr>
                    <td className="label-cell">Effect</td>
                    <td>{result['Failure Effect']}</td>
                  </tr>
                  <tr>
                    <td className="label-cell">Severity</td>
                    <td>{result['Severity']}</td>
                  </tr>
                  <tr>
                    <td className="label-cell">Occurrence</td>
                    <td>{result['Occurrence']}</td>
                  </tr>
                  <tr>
                    <td className="label-cell">Detectability</td>
                    <td>{result['Detection']}</td>
                  </tr>
                </tbody>
              </table>
            ))}
            {Object.entries(maintenanceStrategies).map(([failureId, strategy]) => (
              <div key={failureId} id="maintenance-strategy">
                <h4>Recommended Maintenance Strategy for {failureId}: {strategy}</h4>
              </div>
            ))}
          </div>
        ) : (
          compressedGuid && <p>No results found for the selected GUID.</p> 
        )}
      </div>
    </div>
  );
};

export default SearchFields;



