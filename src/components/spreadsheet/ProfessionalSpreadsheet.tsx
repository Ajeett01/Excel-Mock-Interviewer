"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SpreadsheetData, UserAction } from '@/types/excel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Plus,
  Minus,
  Calculator,
  Save,
  Download
} from 'lucide-react';

interface ProfessionalSpreadsheetProps {
  data: SpreadsheetData;
  onActionPerformed?: (action: UserAction) => void;
  onDataChange?: (data: SpreadsheetData) => void;
  readonly?: boolean;
  height?: number;
  className?: string;
}

interface CellPosition {
  row: number;
  col: number;
}

const ProfessionalSpreadsheet: React.FC<ProfessionalSpreadsheetProps> = ({
  data,
  onActionPerformed,
  onDataChange,
  readonly = false,
  height = 600,
  className = ''
}) => {
  const [currentData, setCurrentData] = useState(data);
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [selectedRange, setSelectedRange] = useState<CellPosition[]>([]);
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [activeSheet, setActiveSheet] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<{ [key: string]: HTMLInputElement }>({});

  const ROWS = 25;
  const COLS = 15;

  // Initialize empty data if needed
  useEffect(() => {
    if (!currentData.sheets[activeSheet]) return;
    
    const sheet = currentData.sheets[activeSheet];
    const needsExpansion = sheet.data.length < ROWS || (sheet.data[0]?.length || 0) < COLS;
    
    if (needsExpansion) {
      const newData = { ...currentData };
      const newSheet = { ...sheet };
      
      // Expand rows
      while (newSheet.data.length < ROWS) {
        newSheet.data.push([]);
      }
      
      // Expand columns
      newSheet.data.forEach(row => {
        while (row.length < COLS) {
          row.push({ v: '' });
        }
      });
      
      newData.sheets[activeSheet] = newSheet;
      setCurrentData(newData);
    }
  }, [currentData, activeSheet]);

  // Update formula bar when cell selection changes
  useEffect(() => {
    if (selectedCell) {
      const cellValue = getCellValue(selectedCell.row, selectedCell.col);
      const cellData = getCellData(selectedCell.row, selectedCell.col);
      setFormulaBarValue(cellData?.f || cellValue || '');
    }
  }, [selectedCell, currentData]);

  const getCellReference = (row: number, col: number): string => {
    return `${String.fromCharCode(65 + col)}${row + 1}`;
  };

  const getCellValue = (row: number, col: number): string => {
    const cell = currentData.sheets[activeSheet]?.data[row]?.[col];
    return cell?.v?.toString() || '';
  };

  const getCellData = (row: number, col: number) => {
    return currentData.sheets[activeSheet]?.data[row]?.[col];
  };

  const setCellValue = useCallback((row: number, col: number, value: string, formula?: string) => {
    const newData = { ...currentData };
    const sheet = newData.sheets[activeSheet];
    
    // Ensure row exists
    while (sheet.data.length <= row) {
      sheet.data.push([]);
    }
    
    // Ensure column exists
    while (sheet.data[row].length <= col) {
      sheet.data[row].push({ v: '' });
    }
    
    // Determine if it's a number or text
    const numValue = parseFloat(value);
    const cellValue = !isNaN(numValue) && value.trim() !== '' ? numValue : value;
    
    // Update cell
    sheet.data[row][col] = {
      v: cellValue,
      f: formula,
      ct: { fa: "General", t: typeof cellValue === 'number' ? 'n' : 'g' }
    };
    
    setCurrentData(newData);
    
    // Notify parent components
    if (onDataChange) {
      onDataChange(newData);
    }
    
    if (onActionPerformed) {
      const action: UserAction = {
        timestamp: Date.now(),
        type: formula ? 'formula_input' : 'cell_edit',
        cell_reference: getCellReference(row, col),
        new_value: cellValue,
        formula: formula,
        action_data: {
          sheet_index: activeSheet,
          row,
          col,
          value: cellValue,
          formula
        }
      };
      onActionPerformed(action);
    }
  }, [currentData, activeSheet, onDataChange, onActionPerformed]);

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    setSelectedRange([]);
    setIsEditing(false);
  };

  const handleCellDoubleClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    setIsEditing(true);
    
    // Focus the cell input
    const cellKey = `${row}-${col}`;
    setTimeout(() => {
      cellRefs.current[cellKey]?.focus();
    }, 0);
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    if (readonly) return;
    
    const isFormula = value.startsWith('=');
    setCellValue(row, col, value, isFormula ? value : undefined);
  };

  const handleFormulaBarChange = (value: string) => {
    setFormulaBarValue(value);
    if (selectedCell) {
      const isFormula = value.startsWith('=');
      setCellValue(selectedCell.row, selectedCell.col, value, isFormula ? value : undefined);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(false);
      // Move to next row
      if (row < ROWS - 1) {
        setSelectedCell({ row: row + 1, col });
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setIsEditing(false);
      // Move to next column
      if (col < COLS - 1) {
        setSelectedCell({ row, col: col + 1 });
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const renderToolbar = () => (
    <div className="flex items-center space-x-2 p-2 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center space-x-1">
        <Button variant="ghost" size="sm" disabled={readonly}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" disabled={readonly}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" disabled={readonly}>
          <Underline className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="w-px h-6 bg-gray-300" />
      
      <div className="flex items-center space-x-1">
        <Button variant="ghost" size="sm" disabled={readonly}>
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" disabled={readonly}>
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" disabled={readonly}>
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="w-px h-6 bg-gray-300" />
      
      <div className="flex items-center space-x-1">
        <Button variant="ghost" size="sm" disabled={readonly}>
          <Calculator className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" disabled={readonly}>
          <Save className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderFormulaBar = () => (
    <div className="flex items-center p-2 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-2 min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-600 min-w-fit">
          {selectedCell ? getCellReference(selectedCell.row, selectedCell.col) : 'A1'}
        </div>
        <div className="w-px h-6 bg-gray-300" />
        <input
          type="text"
          value={formulaBarValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFormulaBarChange(e.target.value)}
          placeholder="Enter value or formula (e.g., =SUM(A1:A5))"
          className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={readonly || !selectedCell}
        />
      </div>
    </div>
  );

  const renderCell = (row: number, col: number) => {
    const cellValue = getCellValue(row, col);
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const cellKey = `${row}-${col}`;
    
    return (
      <td
        key={col}
        className={`
          relative border border-gray-300 p-0 
          ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
        `}
        onClick={() => handleCellClick(row, col)}
        onDoubleClick={() => handleCellDoubleClick(row, col)}
      >
        <input
          ref={(el) => {
            if (el) cellRefs.current[cellKey] = el;
          }}
          type="text"
          value={isEditing && isSelected ? formulaBarValue : cellValue}
          onChange={(e) => {
            if (isEditing && isSelected) {
              setFormulaBarValue(e.target.value);
            } else {
              handleCellChange(row, col, e.target.value);
            }
          }}
          onKeyDown={(e) => handleKeyDown(e, row, col)}
          onBlur={() => {
            if (isEditing && isSelected) {
              handleCellChange(row, col, formulaBarValue);
              setIsEditing(false);
            }
          }}
          disabled={readonly}
          className={`
            w-full h-8 px-2 text-sm border-none outline-none bg-transparent
            ${readonly ? 'cursor-default' : 'cursor-cell'}
            ${isSelected ? 'bg-blue-50' : ''}
          `}
          style={{ minWidth: '80px' }}
        />
      </td>
    );
  };

  const renderSheet = () => (
    <div className="overflow-auto flex-1 min-h-0">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-gray-100 z-10">
          <tr>
            <th className="w-12 h-8 bg-gray-200 border border-gray-300 text-xs font-medium"></th>
            {Array.from({ length: COLS }, (_, colIndex) => (
              <th key={colIndex} className="min-w-20 h-8 bg-gray-100 border border-gray-300 text-xs font-medium">
                {String.fromCharCode(65 + colIndex)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: ROWS }, (_, rowIndex) => (
            <tr key={rowIndex}>
              <td className="w-12 h-8 bg-gray-100 border border-gray-300 text-xs text-center font-medium sticky left-0 z-5">
                {rowIndex + 1}
              </td>
              {Array.from({ length: COLS }, (_, colIndex) => renderCell(rowIndex, colIndex))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSheetTabs = () => (
    <div className="flex items-center bg-gray-50 border-t border-gray-200 p-1">
      {currentData.sheets.map((sheet, index) => (
        <button
          key={index}
          onClick={() => setActiveSheet(index)}
          className={`
            px-3 py-1 text-sm rounded-t border-t border-l border-r
            ${activeSheet === index 
              ? 'bg-white border-gray-300 text-gray-900' 
              : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          {sheet.name}
        </button>
      ))}
      {!readonly && (
        <button className="ml-2 p-1 text-gray-400 hover:text-gray-600">
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <Card className={`${className} flex flex-col`} style={{ height }}>
      <div ref={containerRef} className="flex flex-col h-full min-h-0">
        {/* Fixed Header Elements */}
        <div className="flex-shrink-0">
          {renderToolbar()}
          {renderFormulaBar()}
        </div>
        
        {/* Scrollable Sheet Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {renderSheet()}
        </div>
        
        {/* Fixed Footer Elements */}
        <div className="flex-shrink-0">
          {renderSheetTabs()}
          <div className="text-xs text-gray-500 text-center p-1 bg-gray-50 border-t border-gray-200">
            Professional Excel-like Spreadsheet • {readonly ? 'Read-only' : 'Editable'} •
            {selectedCell && ` Selected: ${getCellReference(selectedCell.row, selectedCell.col)}`}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfessionalSpreadsheet;