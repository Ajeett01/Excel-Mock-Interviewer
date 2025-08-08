"use client";

import React, { useState, useCallback } from 'react';
import { SpreadsheetData, UserAction } from '@/types/excel';

interface SimpleSpreadsheetProps {
  data: SpreadsheetData;
  onActionPerformed?: (action: UserAction) => void;
  onDataChange?: (data: SpreadsheetData) => void;
  readonly?: boolean;
  height?: number;
  width?: number;
  className?: string;
}

const SimpleSpreadsheet: React.FC<SimpleSpreadsheetProps> = ({
  data,
  onActionPerformed,
  onDataChange,
  readonly = false,
  height = 400,
  className = ''
}) => {
  const [currentData, setCurrentData] = useState(data);

  const handleCellChange = useCallback((sheetIndex: number, rowIndex: number, colIndex: number, value: string) => {
    if (readonly) return;

    const newData = { ...currentData };
    const sheet = newData.sheets[sheetIndex];
    
    // Ensure the row exists
    while (sheet.data.length <= rowIndex) {
      sheet.data.push([]);
    }
    
    // Ensure the column exists
    while (sheet.data[rowIndex].length <= colIndex) {
      sheet.data[rowIndex].push({ v: '' });
    }
    
    // Update the cell
    const cellValue = isNaN(Number(value)) ? value : Number(value);
    sheet.data[rowIndex][colIndex] = { v: cellValue };
    
    setCurrentData(newData);
    
    // Notify parent components
    if (onDataChange) {
      onDataChange(newData);
    }
    
    if (onActionPerformed) {
      const action: UserAction = {
        timestamp: Date.now(),
        type: 'cell_edit',
        cell_reference: `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`,
        new_value: cellValue,
        action_data: {
          sheet_index: sheetIndex,
          row: rowIndex,
          col: colIndex,
          value: cellValue
        }
      };
      onActionPerformed(action);
    }
  }, [currentData, readonly, onDataChange, onActionPerformed]);

  const renderSheet = (sheet: any, sheetIndex: number) => {
    const maxRows = Math.max(20, sheet.data.length);
    const maxCols = Math.max(10, sheet.data[0]?.length || 0);

    return (
      <div key={sheetIndex} className="overflow-auto border border-gray-300">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-12 h-8 bg-gray-100 border border-gray-300 text-xs"></th>
              {Array.from({ length: maxCols }, (_, colIndex) => (
                <th key={colIndex} className="min-w-20 h-8 bg-gray-100 border border-gray-300 text-xs font-medium">
                  {String.fromCharCode(65 + colIndex)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxRows }, (_, rowIndex) => (
              <tr key={rowIndex}>
                <td className="w-12 h-8 bg-gray-100 border border-gray-300 text-xs text-center font-medium">
                  {rowIndex + 1}
                </td>
                {Array.from({ length: maxCols }, (_, colIndex) => {
                  const cellValue = sheet.data[rowIndex]?.[colIndex]?.v || '';
                  return (
                    <td key={colIndex} className="border border-gray-300 p-0">
                      <input
                        type="text"
                        value={cellValue}
                        onChange={(e) => handleCellChange(sheetIndex, rowIndex, colIndex, e.target.value)}
                        disabled={readonly}
                        className="w-full h-8 px-2 text-sm border-none outline-none focus:bg-blue-50 disabled:bg-gray-50"
                        style={{ minWidth: '80px' }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`${className}`} style={{ height, maxHeight: height }}>
      <div className="mb-2">
        <div className="flex space-x-2">
          {currentData.sheets.map((sheet, index) => (
            <button
              key={index}
              className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded-t"
            >
              {sheet.name}
            </button>
          ))}
        </div>
      </div>
      
      {currentData.sheets.map((sheet, index) => (
        <div key={index} style={{ height: height - 40 }}>
          {renderSheet(sheet, index)}
        </div>
      ))}
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        Simple Spreadsheet (Fallback Mode)
      </div>
    </div>
  );
};

export default SimpleSpreadsheet;