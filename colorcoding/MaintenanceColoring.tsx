import React, { useState, useEffect } from 'react';   
import * as XLSX from 'xlsx';
import { useSettings } from '../../services/useSettings';
import './MaintenanceColoring.css'; 

const strategyColors: { [key: string]: string } = {
    "Run-to-failure": "#333", 
    "Corrective": "#ffa500", 
    "Condition-Based": "#00008b", 
    "Preventive": "#fc0909" 
} ; 

const hexToRGB = (hex: string) => {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r / 255, g / 255, b / 255];
};

const MaintenanceColoring = () => {
    const { viewer, picked } = useSettings(); 
    const [showLegend, setShowLegend] = useState(false); 
    const [maintenanceTasks, setMaintenanceTasks] = useState<string[]>([]); 

    const [jsonData, setJsonData] = useState<any[]>([]); 

    const loadAndParseExcel = async () => {
        const excelFileUrl = `${window.location.origin}/maintenance_strategy.xlsx`;

        try {
            const response = await fetch(excelFileUrl);
            const data = await response.arrayBuffer();

            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const parsedData = XLSX.utils.sheet_to_json(worksheet);
            
            setJsonData(parsedData); 

            // Apply coloring
            parsedData.forEach((row: any) => {
                const guid = row['GUID'];
                const strategy = row['Maintenance Strategy'];

                colorElementByGUID(guid, strategy);
            });

            setShowLegend(true);
        } catch (error) {
            console.error('Error loading or parsing Excel file:', error);
        }
    };

    const colorElementByGUID = (guid: string, strategy: string) => {
        if (!viewer) return;

        const color = strategyColors[strategy] || '#ffffff';
        const compressedGUID = guid;
        const rgbColor = hexToRGB(color);

        const objectId = compressedGUID;

        viewer.scene.setObjectsColorized([objectId], rgbColor);
    };

    // get the maintenance task for the selected element based on the GUID
    const findMaintenanceTaskForSelectedElement = () => {
        if (picked && jsonData.length > 0) {
            const selectedRow = jsonData.find((row: any) => row['GUID'] === picked);
            if (selectedRow) {
                
                const tasksArray: string[] = selectedRow['Maintenance Tasks']
                    .split('-')
                    .map((task: string) => task.trim()) 
                    .filter((task: string) => task.length > 0); 
                
                setMaintenanceTasks(tasksArray);
            } else {
                setMaintenanceTasks([]);
            }
        }
    };

    useEffect(() => {
        findMaintenanceTaskForSelectedElement();
    }, [picked, jsonData]);

    const activateColoring = () => {
        loadAndParseExcel();
    };

    return (
        <div>
            <button id="colorButton" onClick={activateColoring}>Show Maintenance Activities</button>

            {showLegend && (
                <div id="legend">
                    <h4><b>Maintenance Activities:</b></h4>
                    <ul>
                        {Object.keys(strategyColors).map((strategy, index) => (
                            <li key={index} style={{ color: strategyColors[strategy] }}>
                                <strong>{strategy}</strong>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {picked && maintenanceTasks.length > 0 && (
                <div id="maintenanceTask">
                    <h4><b>Maintenance Task for Selected Component:</b></h4>
                    <table className="tasks-table">
                        <tbody>
                            {maintenanceTasks.map((task, index) => (
                                <tr key={index}>
                                    <td>{task}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button id="reportButton">Fill in Maintenance Report</button>
                </div>
            )}
        </div>
    );
};

export default MaintenanceColoring;





