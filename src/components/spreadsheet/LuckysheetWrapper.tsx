"use client";

import React, { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { SpreadsheetData, UserAction, ActionType } from '@/types/excel';
import SimpleSpreadsheet from './SimpleSpreadsheet';

interface LuckysheetWrapperProps {
  data?: SpreadsheetData;
  onActionPerformed?: (action: UserAction) => void;
  onDataChange?: (data: SpreadsheetData) => void;
  readonly?: boolean;
  height?: number;
  width?: number;
  className?: string;
}

interface LuckysheetWrapperRef {
  getCurrentData: () => SpreadsheetData | null;
  refresh: () => void;
}

interface LuckysheetInstance {
  create: (options: any) => void;
  destroy: () => void;
  getAllSheets: () => any[];
  getSheetData: (index?: number) => any[][];
  setSheetData: (data: any[][]) => void;
  refresh: () => void;
}

declare global {
  interface Window {
    luckysheet: LuckysheetInstance;
  }
}

const LuckysheetWrapper = forwardRef<LuckysheetWrapperRef, LuckysheetWrapperProps>(({
  data,
  onActionPerformed,
  onDataChange,
  readonly = false,
  height = 400,
  width = 800,
  className = '',
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [luckysheetInstance, setLuckysheetInstance] = useState<LuckysheetInstance | null>(null);
  const actionCounterRef = useRef(0);

  // Load Luckysheet dynamically
  useEffect(() => {
    const loadLuckysheet = async () => {
      if (typeof window === 'undefined') return;

      // Check if already loaded
      if (window.luckysheet) {
        setLuckysheetInstance(window.luckysheet);
        setIsLoaded(true);
        return;
      }

      try {
        // Load CSS files
        const cssFiles = [
          'https://cdn.jsdelivr.net/npm/luckysheet@latest/dist/plugins/css/pluginsCss.css',
          'https://cdn.jsdelivr.net/npm/luckysheet@latest/dist/plugins/plugins.css',
          'https://cdn.jsdelivr.net/npm/luckysheet@latest/dist/css/luckysheet.css',
          'https://cdn.jsdelivr.net/npm/luckysheet@latest/dist/assets/iconfont/iconfont.css'
        ];

        // Load all CSS files
        cssFiles.forEach(href => {
          if (!document.querySelector(`link[href="${href}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
          }
        });

        // Load JavaScript files
        const loadScript = (src: string): Promise<void> => {
          return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
              resolve();
              return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
          });
        };

        // Load plugins first, then main library
        await loadScript('https://cdn.jsdelivr.net/npm/luckysheet@latest/dist/plugins/js/plugin.js');
        await loadScript('https://cdn.jsdelivr.net/npm/luckysheet@latest/dist/luckysheet.umd.js');

        // Wait a bit for the library to initialize
        setTimeout(() => {
          if (window.luckysheet) {
            console.log('Luckysheet loaded successfully');
            setLuckysheetInstance(window.luckysheet);
            setIsLoaded(true);
          } else {
            console.error('Luckysheet failed to initialize, falling back to simple spreadsheet');
            setLoadingFailed(true);
          }
        }, 2000); // Increased timeout to 2 seconds

      } catch (error) {
        console.error('Failed to load Luckysheet:', error);
        setLoadingFailed(true);
      }
    };

    loadLuckysheet();
  }, []);

  // Track user actions
  const trackAction = useCallback((type: ActionType, actionData: any) => {
    if (onActionPerformed) {
      const action: UserAction = {
        timestamp: Date.now(),
        type,
        action_data: actionData,
        ...actionData,
      };
      onActionPerformed(action);
    }
  }, [onActionPerformed]);

  // Initialize Luckysheet
  useEffect(() => {
    if (!isLoaded || !luckysheetInstance || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = ''; // Clear any existing content

    // Convert our data format to Luckysheet format
    const luckysheetData = data ? convertToLuckysheetFormat(data) : getDefaultSheetData();

    console.log('Initializing Luckysheet with data:', luckysheetData);

    const options = {
      container: container,
      data: luckysheetData,
      title: "Excel Interview Task",
      lang: "en",
      allowCopy: !readonly,
      allowEdit: !readonly,
      allowUpdate: !readonly,
      showsheetbar: false,
      showstatisticBar: false,
      enableAddRow: !readonly,
      enableAddCol: !readonly,
      sheetBottomConfig: false,
      allowSheetChangePosition: false,
      allowSheetChangeSize: false,
      allowSheetChangeName: false,
      allowSheetChangeColor: false,
      allowSheetDelete: false,
      allowSheetCopy: false,
      allowSheetHide: false,
      allowSheetShow: false,
      hook: {
        cellEditBefore: function(range: any) {
          if (readonly) return false;
          console.log('Cell edit before:', range);
          trackAction('cell_edit', {
            cell_reference: `${String.fromCharCode(65 + range[0].column[0])}${range[0].row[0] + 1}`,
            range: range
          });
        },
        cellUpdateBefore: function(r: number, c: number, value: any, isRefresh: boolean) {
          if (readonly) return false;
          console.log('Cell update before:', r, c, value);
          trackAction('cell_edit', {
            cell_reference: `${String.fromCharCode(65 + c)}${r + 1}`,
            new_value: value,
            isRefresh
          });
        },
        rangeSelect: function(sheet: any, range: any) {
          console.log('Range select:', range);
          trackAction('cell_edit', {
            range: range,
            sheet: sheet
          });
        }
      }
    };

    try {
      console.log('Creating Luckysheet instance...');
      luckysheetInstance.create(options);
      console.log('Luckysheet instance created successfully');
    } catch (error) {
      console.error('Failed to initialize Luckysheet:', error);
    }

    return () => {
      try {
        if (luckysheetInstance && luckysheetInstance.destroy) {
          luckysheetInstance.destroy();
        }
      } catch (error) {
        console.error('Failed to destroy Luckysheet:', error);
      }
    };
  }, [isLoaded, luckysheetInstance, data, readonly, trackAction]);

  // Helper function to get default sheet data
  const getDefaultSheetData = () => [
    {
      name: "Sheet1",
      color: "",
      index: 0,
      status: 1,
      order: 0,
      hide: 0,
      row: 84,
      column: 60,
      defaultRowHeight: 19,
      defaultColWidth: 73,
      celldata: [
        { r: 0, c: 0, v: { v: "Sample Data", ct: { fa: "General", t: "g" } } },
        { r: 0, c: 1, v: { v: "Value", ct: { fa: "General", t: "g" } } },
        { r: 1, c: 0, v: { v: "Item 1", ct: { fa: "General", t: "g" } } },
        { r: 1, c: 1, v: { v: 100, ct: { fa: "General", t: "n" } } },
        { r: 2, c: 0, v: { v: "Item 2", ct: { fa: "General", t: "g" } } },
        { r: 2, c: 1, v: { v: 200, ct: { fa: "General", t: "n" } } }
      ],
      config: {},
      scrollLeft: 0,
      scrollTop: 0,
      luckysheet_select_save: [],
      calcChain: [],
      isPivotTable: false,
      pivotTable: {},
      filter_select: {},
      filter: null,
      luckysheet_alternateformat_save: [],
      luckysheet_alternateformat_save_modelCustom: [],
      luckysheet_conditionformat_save: {},
      frozen: {},
      chart: [],
      zoomRatio: 1,
      image: [],
      showGridLines: 1,
      dataVerification: {}
    }
  ];

  // Get current data
  const getCurrentData = useCallback((): SpreadsheetData | null => {
    if (!luckysheetInstance) return null;

    try {
      const sheets = luckysheetInstance.getAllSheets();
      return convertFromLuckysheetFormat(sheets);
    } catch (error) {
      console.error('Failed to get current data:', error);
      return null;
    }
  }, [luckysheetInstance]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getCurrentData,
    refresh: () => {
      if (luckysheetInstance) {
        luckysheetInstance.refresh();
      }
    }
  }));

  // Handle data changes
  useEffect(() => {
    if (onDataChange) {
      const interval = setInterval(() => {
        const currentData = getCurrentData();
        if (currentData) {
          onDataChange(currentData);
        }
      }, 1000); // Check for changes every second

      return () => clearInterval(interval);
    }
  }, [getCurrentData, onDataChange]);

  // Show fallback spreadsheet if Luckysheet failed to load
  if (loadingFailed) {
    return (
      <SimpleSpreadsheet
        data={data || {
          sheets: [{
            name: "Sheet1",
            data: [
              [{ v: "Sample Data" }, { v: "Value" }],
              [{ v: "Item 1" }, { v: 100 }],
              [{ v: "Item 2" }, { v: 200 }]
            ],
            config: {}
          }],
          metadata: { created_at: new Date(), version: "1.0" }
        }}
        onActionPerformed={onActionPerformed}
        onDataChange={onDataChange}
        readonly={readonly}
        height={height}
        className={className}
      />
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center border border-gray-300 rounded ${className}`}
        style={{ height, width }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading Spreadsheet...</p>
          <p className="text-xs text-gray-500 mt-2">If this takes too long, we'll show a fallback spreadsheet</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`luckysheet-container ${className}`}
      style={{ height, width }}
    />
  );
});

LuckysheetWrapper.displayName = 'LuckysheetWrapper';

// Helper functions to convert between our format and Luckysheet format
function convertToLuckysheetFormat(data: SpreadsheetData): any[] {
  console.log('Converting data to Luckysheet format:', data);
  
  return data.sheets.map((sheet, index) => {
    const celldata = convertCellData(sheet.data);
    console.log(`Sheet ${index} celldata:`, celldata);
    
    return {
      name: sheet.name,
      color: "",
      index: index,
      status: index === 0 ? 1 : 0,
      order: index,
      hide: 0,
      row: Math.max(84, sheet.data.length),
      column: Math.max(60, sheet.data[0]?.length || 0),
      defaultRowHeight: 19,
      defaultColWidth: 73,
      celldata: celldata,
      config: sheet.config || {},
      scrollLeft: 0,
      scrollTop: 0,
      luckysheet_select_save: [],
      calcChain: [],
      isPivotTable: false,
      pivotTable: {},
      filter_select: {},
      filter: null,
      luckysheet_alternateformat_save: [],
      luckysheet_alternateformat_save_modelCustom: [],
      luckysheet_conditionformat_save: {},
      frozen: {},
      chart: [],
      zoomRatio: 1,
      image: [],
      showGridLines: 1,
      dataVerification: {}
    };
  });
}

function convertCellData(data: any[][]): any[] {
  const celldata: any[] = [];
  
  data.forEach((row, r) => {
    if (Array.isArray(row)) {
      row.forEach((cell, c) => {
        if (cell && (cell.v !== undefined || cell.f !== undefined)) {
          celldata.push({
            r: r,
            c: c,
            v: {
              v: cell.v,
              f: cell.f,
              ct: cell.ct || { fa: "General", t: typeof cell.v === 'number' ? 'n' : 'g' },
              s: cell.s,
              m: cell.m || String(cell.v)
            }
          });
        }
      });
    }
  });
  
  console.log('Converted celldata:', celldata);
  return celldata;
}

function convertFromLuckysheetFormat(sheets: any[]): SpreadsheetData {
  return {
    sheets: sheets.map(sheet => ({
      name: sheet.name,
      data: convertFromCellData(sheet.celldata, sheet.row, sheet.column),
      config: sheet.config || {}
    })),
    metadata: {
      created_at: new Date(),
      version: '1.0.0'
    }
  };
}

function convertFromCellData(celldata: any[], rows: number, cols: number): any[][] {
  const data: any[][] = [];
  
  // Initialize empty grid
  for (let r = 0; r < rows; r++) {
    data[r] = [];
    for (let c = 0; c < cols; c++) {
      data[r][c] = null;
    }
  }
  
  // Fill with actual data
  celldata.forEach(cell => {
    if (cell.r < rows && cell.c < cols) {
      data[cell.r][cell.c] = cell.v;
    }
  });
  
  return data;
}

export default LuckysheetWrapper;
export type { LuckysheetWrapperProps, LuckysheetWrapperRef };