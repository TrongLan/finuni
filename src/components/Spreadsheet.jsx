import { useState, useEffect, useRef } from "react";
import ReactSpreadsheet from "react-spreadsheet";
import { colLetter } from "../utils/helpers.js";

const DEFAULT_ROWS = 32;
const DEFAULT_COLS = 16;

function makeEmptyGrid(rows = DEFAULT_ROWS, columns = DEFAULT_COLS) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => ({ value: "" })),
  );
}

function copyGrid(grid) {
  return grid.map((row) => row.map((cell) => (cell ? { ...cell } : cell)));
}

function gridsEqual(left, right) {
  return (
    left.length === right.length &&
    left.every(
      (row, rowIndex) =>
        row.length === right[rowIndex].length &&
        row.every((cell, columnIndex) => cell?.value === right[rowIndex][columnIndex]?.value),
    )
  );
}

function serializeGrid(grid) {
  let lastRow = -1;
  let lastColumn = -1;
  grid.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (cell?.value !== "" && cell?.value != null) {
        lastRow = Math.max(lastRow, rowIndex);
        lastColumn = Math.max(lastColumn, columnIndex);
      }
    });
  });
  if (lastRow < 0) return "";

  const valueAt = (row, column) => grid[row]?.[column]?.value ?? "";
  return JSON.stringify({
    columns: Array.from({ length: lastColumn + 1 }, (_, column) => valueAt(0, column)),
    data: Array.from({ length: lastRow }, (_, row) =>
      Array.from({ length: lastColumn + 1 }, (_, column) => valueAt(row + 1, column)),
    ),
  });
}

function gridFromSpreadsheet(data) {
  if (!data || !Array.isArray(data.columns) || !Array.isArray(data.data)) {
    throw new Error("Spreadsheet response has an invalid format.");
  }
  if (!data.data.every((row) => Array.isArray(row))) {
    throw new Error("Spreadsheet response contains invalid rows.");
  }

  const values = [data.columns, ...data.data];
  const columnCount = Math.max(DEFAULT_COLS, ...values.map((row) => row.length));
  const rowCount = Math.max(DEFAULT_ROWS, values.length);
  return makeEmptyGrid(rowCount, columnCount).map((row, rowIndex) =>
    row.map((cell, columnIndex) => {
      const value = values[rowIndex]?.[columnIndex];
      return value == null ? cell : { value: String(value) };
    }),
  );
}

export default function Spreadsheet({ spreadsheetData, onGridChange }) {
  const [grid, setGrid] = useState(makeEmptyGrid);
  const [activeCell, setActiveCell] = useState({ row: 0, column: 0 });
  const gridRef = useRef(grid);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const modeRef = useRef("view");
  const editStartRef = useRef(null);
  const formulaStartRef = useRef(null);

  useEffect(() => {
    onGridChange?.(serializeGrid(grid));
  }, [grid, onGridChange]);

  useEffect(() => {
    if (spreadsheetData) {
      const nextGrid = gridFromSpreadsheet(spreadsheetData);
      gridRef.current = nextGrid;
      undoStackRef.current = [];
      redoStackRef.current = [];
      editStartRef.current = null;
      setGrid(nextGrid);
      setActiveCell({ row: 0, column: 0 });
    }
  }, [spreadsheetData]);

  const setGridState = (nextGrid) => {
    gridRef.current = nextGrid;
    setGrid(nextGrid);
  };

  const saveUndoSnapshot = (snapshot) => {
    undoStackRef.current.push(copyGrid(snapshot));
    if (undoStackRef.current.length > 100) undoStackRef.current.shift();
    redoStackRef.current = [];
  };

  const commitEdit = () => {
    const editStart = editStartRef.current;
    editStartRef.current = null;
    if (editStart && !gridsEqual(editStart, gridRef.current)) {
      saveUndoSnapshot(editStart);
    }
  };

  const undo = () => {
    const currentGrid = gridRef.current;
    const formulaStart = formulaStartRef.current;
    if (formulaStart && !gridsEqual(formulaStart, currentGrid)) {
      redoStackRef.current.push(copyGrid(currentGrid));
      setGridState(copyGrid(formulaStart));
      return;
    }

    const editStart = editStartRef.current;
    if (editStart && !gridsEqual(editStart, currentGrid)) {
      redoStackRef.current.push(copyGrid(currentGrid));
      setGridState(copyGrid(editStart));
      return;
    }

    const previousGrid = undoStackRef.current.pop();
    if (!previousGrid) return;
    redoStackRef.current.push(copyGrid(currentGrid));
    setGridState(previousGrid);
    if (modeRef.current === "edit") editStartRef.current = copyGrid(previousGrid);
  };

  const redo = () => {
    const nextGrid = redoStackRef.current.pop();
    if (!nextGrid) return;
    undoStackRef.current.push(copyGrid(gridRef.current));
    setGridState(nextGrid);
    if (modeRef.current === "edit") editStartRef.current = copyGrid(nextGrid);
    if (formulaStartRef.current) formulaStartRef.current = copyGrid(nextGrid);
  };

  const handleKeyDownCapture = (event) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key !== "z" && key !== "y") return;

    event.preventDefault();
    event.stopPropagation();
    if (key === "z" && !event.shiftKey) {
      undo();
    } else {
      redo();
    }
  };

  const handleModeChange = (mode) => {
    modeRef.current = mode;
    if (mode === "edit") {
      if (!editStartRef.current) editStartRef.current = copyGrid(gridRef.current);
    } else {
      commitEdit();
    }
  };

  const handleGridChange = (nextGrid) => {
    const previousGrid = gridRef.current;
    if (modeRef.current !== "edit" && !gridsEqual(previousGrid, nextGrid)) {
      saveUndoSnapshot(previousGrid);
    }
    setGridState(nextGrid);
  };

  const setCell = (row, column, value) => {
    const previous = gridRef.current;
    const nextGrid =
      previous.map((cells, rowIndex) =>
        rowIndex === row
          ? cells.map((cell, columnIndex) =>
              columnIndex === column ? { ...cell, value } : cell,
            )
          : cells,
      );
    setGridState(nextGrid);
  };

  const addRow = () => {
    const previous = gridRef.current;
    saveUndoSnapshot(previous);
    setGridState([
      ...previous,
      Array.from({ length: previous[0]?.length ?? DEFAULT_COLS }, () => ({ value: "" })),
    ]);
  };
  const addColumn = () => {
    const previous = gridRef.current;
    saveUndoSnapshot(previous);
    setGridState(previous.map((row) => [...row, { value: "" }]));
  };

  const selectedValue = grid[activeCell.row]?.[activeCell.column]?.value ?? "";
  const cellReference = `${colLetter(activeCell.column)}${activeCell.row + 1}`;

  return (
    <div className="main" onKeyDownCapture={handleKeyDownCapture}>
      <div className="toolbar">
        <div className="cell-ref">{cellReference}</div>
        <input
          className="formula-input"
          value={selectedValue}
          onChange={(event) => setCell(activeCell.row, activeCell.column, event.target.value)}
          onFocus={() => {
            formulaStartRef.current = copyGrid(gridRef.current);
          }}
          onBlur={() => {
            const formulaStart = formulaStartRef.current;
            formulaStartRef.current = null;
            if (formulaStart && !gridsEqual(formulaStart, gridRef.current)) {
              saveUndoSnapshot(formulaStart);
            }
          }}
          placeholder="Type cell value here..."
        />
        <div className="toolbar-sep"></div>
        <button className="tbtn" onClick={addRow}>
          + Row
        </button>
        <button className="tbtn" onClick={addColumn}>
          + Column
        </button>
      </div>

      <div className="grid-scroll">
        <ReactSpreadsheet
          className="app-spreadsheet"
          data={grid}
          onChange={handleGridChange}
          onActivate={setActiveCell}
          onModeChange={handleModeChange}
        />
      </div>
    </div>
  );
}
