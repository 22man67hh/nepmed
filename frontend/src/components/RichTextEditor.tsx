
import React, { useState, useRef, useEffect } from "react";
import { 
  Bold, 
  Italic, 
  Underline, 
  Highlighter, 
  List, 
  Table, 
  Image, 
  Workflow, 
  Undo2, 
  Redo2,
  Code2,
  Check,
  Copy,
  Trash2,
  Maximize2,
  Minimize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  ChevronDown,
  FileSpreadsheet,
  Upload,
  X
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [showSource, setShowSource] = useState(false);
  const [showPicturePermission, setShowPicturePermission] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  // Formatting state indicators
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Dropdown states for Google Docs features
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showSpacingDropdown, setShowSpacingDropdown] = useState(false);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const [showCellBgDropdown, setShowCellBgDropdown] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [pastedExcelTableText, setPastedExcelTableText] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [lineSpacing, setLineSpacing] = useState("1.15");

  // Sync internal contenteditable DOM with external value prop
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // If it's just a blank line or empty paragraph, normalize to empty string
      if (html === "<br>" || html === "<p><br></p>" || html === "") {
        onChange("");
      } else {
        onChange(html);
      }
    }
  };

  const updateToolbarStates = () => {
    try {
      setIsBold(document.queryCommandState("bold"));
      setIsItalic(document.queryCommandState("italic"));
      setIsUnderline(document.queryCommandState("underline"));
      
      const bg = document.queryCommandValue("backColor") || document.queryCommandValue("hiliteColor");
      const isBgPresent = bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)" && bg !== "rgb(255, 255, 255)" && bg !== "none";
      setIsHighlighted(!!isBgPresent);
    } catch (e) {
      // safe fallback
    }
  };

  // Keep formatting states in sync with user cursor selections in real time
  useEffect(() => {
    const handleSelectionChange = () => {
      updateToolbarStates();
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  // Helper to execute native formatting commands
  const execCommand = (command: string, val: string = "") => {
    document.execCommand(command, false, val);
    handleInput();
    updateToolbarStates();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const applyLineSpacing = (spacingVal: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    let parent: HTMLElement | null = range.startContainer.parentElement;
    
    // Find closest block level element
    while (parent && parent !== editorRef.current) {
      if (["P", "DIV", "TD", "TH", "LI", "H1", "H2", "H3"].includes(parent.nodeName)) {
        parent.style.lineHeight = spacingVal;
        break;
      }
      parent = parent.parentElement;
    }
    if (!parent && editorRef.current) {
      editorRef.current.style.lineHeight = spacingVal;
    }
    handleInput();
  };

  // Append HTML content below the already written text
  const appendHTMLAtEnd = (html: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      const currentHTML = editorRef.current.innerHTML.trim();
      if (currentHTML === "" || currentHTML === "<br>" || currentHTML === "<p><br></p>") {
        editorRef.current.innerHTML = html;
      } else {
        // Append with break if it doesn't already end with a block or break
        if (!currentHTML.endsWith("<br>") && !currentHTML.endsWith("</p>") && !currentHTML.endsWith("</div>")) {
          editorRef.current.innerHTML += "<p><br></p>" + html;
        } else {
          editorRef.current.innerHTML += html;
        }
      }
      handleInput();

      // Move cursor to the end of editor
      const range = document.createRange();
      const sel = window.getSelection();
      if (sel) {
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else {
      onChange(value ? value + html : html);
    }
  };

  // Toggle highlight styling on current selection
  const toggleHighlight = () => {
    if (isHighlighted) {
      document.execCommand("hiliteColor", false, "transparent");
      document.execCommand("backColor", false, "transparent");
    } else {
      document.execCommand("hiliteColor", false, "rgba(245, 158, 11, 0.25)");
      document.execCommand("backColor", false, "rgba(245, 158, 11, 0.25)");
    }
    updateToolbarStates();
    handleInput();
  };

  const insertPresetTable = () => {
    const tableHTML = `<table class="border-collapse border border-slate-400 my-4 w-full text-xs text-left rounded-lg overflow-hidden bg-white" style="border-collapse: collapse; border: 1px solid #cbd5e1; width: 100%; color: #000000;">
  <thead>
    <tr class="bg-slate-100 font-bold" style="background-color: #f1f5f9; color: #000000; font-weight: 700;">
      <th class="border border-slate-300 px-3 py-2 font-bold" style="border: 1px solid #cbd5e1; padding: 0.5rem; color: #000000;">&nbsp;</th>
      <th class="border border-slate-300 px-3 py-2 font-bold" style="border: 1px solid #cbd5e1; padding: 0.5rem; color: #000000;">&nbsp;</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-slate-300 px-3 py-2" style="border: 1px solid #cbd5e1; padding: 0.5rem; color: #000000; background-color: #ffffff;">&nbsp;</td>
      <td class="border border-slate-300 px-3 py-2" style="border: 1px solid #cbd5e1; padding: 0.5rem; color: #000000; background-color: #ffffff;">&nbsp;</td>
    </tr>
    <tr>
      <td class="border border-slate-300 px-3 py-2" style="border: 1px solid #cbd5e1; padding: 0.5rem; color: #000000; background-color: #ffffff;">&nbsp;</td>
      <td class="border border-slate-300 px-3 py-2" style="border: 1px solid #cbd5e1; padding: 0.5rem; color: #000000; background-color: #ffffff;">&nbsp;</td>
    </tr>
  </tbody>
</table><p><br></p>`;
    appendHTMLAtEnd(tableHTML);
  };

  const expandTableVertically = () => {
    if (!editorRef.current) return;
    const table = editorRef.current.querySelector("table");
    if (!table) {
      insertPresetTable();
      return;
    }
    const tbody = table.querySelector("tbody") || table;
    const firstRow = tbody.querySelector("tr") || table.querySelector("thead tr");
    const colCount = firstRow ? firstRow.querySelectorAll("td, th").length : 2;
    
    const newRow = document.createElement("tr");
    for (let i = 0; i < colCount; i++) {
      const td = document.createElement("td");
      td.className = "border border-slate-300 px-3 py-2";
      td.style.cssText = "border: 1px solid #cbd5e1; padding: 0.5rem; color: #000000; background-color: #ffffff;";
      td.innerHTML = "&nbsp;";
      newRow.appendChild(td);
    }
    tbody.appendChild(newRow);
    handleInput();
    editorRef.current.focus();
  };

  const expandTableHorizontally = () => {
    if (!editorRef.current) return;
    const table = editorRef.current.querySelector("table");
    if (!table) {
      insertPresetTable();
      return;
    }
    const theadRow = table.querySelector("thead tr");
    if (theadRow) {
      const th = document.createElement("th");
      th.className = "border border-slate-300 px-3 py-2 font-bold";
      th.style.cssText = "border: 1px solid #cbd5e1; padding: 0.5rem; font-weight: 700; color: #000000; background-color: #f1f5f9;";
      th.innerHTML = "&nbsp;";
      theadRow.appendChild(th);
    }
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach(row => {
      const td = document.createElement("td");
      td.className = "border border-slate-300 px-3 py-2";
      td.style.cssText = "border: 1px solid #cbd5e1; padding: 0.5rem; color: #000000; background-color: #ffffff;";
      td.innerHTML = "&nbsp;";
      row.appendChild(td);
    });
    handleInput();
    editorRef.current.focus();
  };

  const deleteActiveRow = () => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    let node: Node | null = range.startContainer;
    
    let cell: HTMLTableCellElement | null = null;
    while (node && node !== editorRef.current) {
      if (node.nodeName === "TD" || node.nodeName === "TH") {
        cell = node as HTMLTableCellElement;
        break;
      }
      node = node.parentNode;
    }
    
    if (cell) {
      const row = cell.closest("tr");
      if (row) {
        const table = row.closest("table");
        row.remove();
        if (table && table.querySelectorAll("tr").length === 0) {
          table.remove();
        }
        handleInput();
        editorRef.current.focus();
      }
    }
  };

  const deleteActiveColumn = () => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    let node: Node | null = range.startContainer;
    
    let cell: HTMLTableCellElement | null = null;
    while (node && node !== editorRef.current) {
      if (node.nodeName === "TD" || node.nodeName === "TH") {
        cell = node as HTMLTableCellElement;
        break;
      }
      node = node.parentNode;
    }
    
    if (cell) {
      const colIndex = cell.cellIndex;
      const table = cell.closest("table");
      if (table) {
        const rows = table.querySelectorAll("tr");
        rows.forEach(r => {
          const targetCell = r.cells[colIndex];
          if (targetCell) {
            targetCell.remove();
          }
        });
        const firstRow = table.querySelector("tr");
        if (firstRow && firstRow.cells.length === 0) {
          table.remove();
        }
        handleInput();
        editorRef.current.focus();
      }
    }
  };

  const applyCellBackground = (color: string) => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    let node: Node | null = range.startContainer;
    
    let cell: HTMLTableCellElement | null = null;
    while (node && node !== editorRef.current) {
      if (node.nodeName === "TD" || node.nodeName === "TH") {
        cell = node as HTMLTableCellElement;
        break;
      }
      node = node.parentNode;
    }
    
    if (cell) {
      cell.style.backgroundColor = color;
      handleInput();
      editorRef.current.focus();
    } else {
      // Fallback: If not inside a cell, alert user
      alert("Please place your cursor inside a table cell to apply a cell background color.");
    }
  };

  const handleInsertSpreadsheetTable = (text: string, isTabSeparated: boolean = true) => {
    if (!text.trim()) return;
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return;
    
    let html = `<table class="border-collapse border border-slate-400 my-4 w-full text-xs text-left" style="border-collapse: collapse; border: 1px solid #cbd5e1; width: 100%; color: #000000; background-color: #ffffff;">`;
    
    lines.forEach((line, index) => {
      let cols: string[] = [];
      const delimiter = isTabSeparated ? "\t" : ",";
      
      if (!isTabSeparated && line.includes(",")) {
        // Simple CSV parser supporting double quoted strings
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
        cols = matches.map(c => c.replace(/^"|"$/g, "").trim());
      } else {
        cols = line.split(delimiter).map(c => c.trim());
      }
      
      const isHeader = index === 0;
      const tag = isHeader ? "th" : "td";
      const styleStr = isHeader 
        ? 'style="background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1; padding: 0.5rem; color: #000000;"' 
        : 'style="border: 1px solid #cbd5e1; padding: 0.5rem; color: #000000; background-color: #ffffff;"';
      
      html += `<tr>`;
      cols.forEach(col => {
        html += `<${tag} class="border border-slate-300 px-3 py-2" ${styleStr}>${col || "&nbsp;"}</${tag}>`;
      });
      html += `</tr>`;
    });
    
    html += `</table><p><br></p>`;
    appendHTMLAtEnd(html);
  };

  const insertPresetFlowchart = () => {
    const flowchartHTML = `<div class="flowchart-container-v my-4 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center gap-2 text-center" style="margin: 1rem 0; padding: 1rem; border: 1px solid #1e293b; background-color: #020617; border-radius: 0.75rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
  <div class="px-6 py-3 bg-violet-600 text-white rounded min-w-[120px] min-h-[30px]" style="padding: 0.5rem 1rem; background-color: #7c3aed; color: #ffffff; border-radius: 0.25rem; font-size: 11px;">&nbsp;</div>
  <div class="text-slate-500 text-xs" style="color: #64748b; font-size: 12px;">▼</div>
  <div class="px-6 py-3 bg-amber-600 text-white rounded min-w-[120px] min-h-[30px]" style="padding: 0.5rem 1rem; background-color: #d97706; color: #ffffff; border-radius: 0.25rem; font-size: 11px;">&nbsp;</div>
</div><p><br></p>`;
    appendHTMLAtEnd(flowchartHTML);
  };

  const expandFlowchartVertically = () => {
    if (!editorRef.current) return;
    const flowchart = editorRef.current.querySelector(".flowchart-container-v");
    if (!flowchart) {
      insertPresetFlowchart();
      return;
    }
    const arrow = document.createElement("div");
    arrow.className = "text-slate-500 text-xs my-1";
    arrow.style.cssText = "color: #64748b; font-size: 12px; margin: 0.25rem 0;";
    arrow.innerHTML = "▼";
    flowchart.appendChild(arrow);
    
    const colors = ["bg-emerald-600", "bg-violet-600", "bg-amber-600", "bg-rose-600", "bg-blue-600"];
    const hexColors = ["#059669", "#7c3aed", "#d97706", "#e11d48", "#2563eb"];
    const randomIdx = Math.floor(Math.random() * colors.length);
    
    const step = document.createElement("div");
    step.className = `px-6 py-3 ${colors[randomIdx]} text-white rounded min-w-[120px] min-h-[30px]`;
    step.style.cssText = `padding: 0.5rem 1rem; background-color: ${hexColors[randomIdx]}; color: #ffffff; border-radius: 0.25rem; font-size: 11px;`;
    step.innerHTML = "&nbsp;";
    flowchart.appendChild(step);
    
    handleInput();
    editorRef.current.focus();
  };

  const expandFlowchartHorizontally = () => {
    if (!editorRef.current) return;
    let flowchart = editorRef.current.querySelector(".flowchart-container-h");
    if (!flowchart) {
      // Insert a fresh horizontal flowchart
      const containerHTML = `<div class="flowchart-container-h flex flex-row items-center justify-center gap-2 my-4 bg-slate-950/20 p-4 rounded-xl border border-slate-800" style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 0.5rem; margin: 1rem 0; padding: 1rem; border-radius: 0.75rem; border: 1px solid #1e293b; background-color: rgba(2, 6, 23, 0.2);">
  <div class="px-6 py-3 bg-violet-600 text-white rounded min-w-[100px] min-h-[30px]" style="padding: 0.5rem 1rem; background-color: #7c3aed; color: #ffffff; border-radius: 0.25rem; font-size: 11px;">&nbsp;</div>
  <div class="text-slate-500 text-xs" style="color: #64748b; font-size: 12px;">▶</div>
  <div class="px-6 py-3 bg-amber-600 text-white rounded min-w-[100px] min-h-[30px]" style="padding: 0.5rem 1rem; background-color: #d97706; color: #ffffff; border-radius: 0.25rem; font-size: 11px;">&nbsp;</div>
</div><p><br></p>`;
      appendHTMLAtEnd(containerHTML);
      return;
    }
    const arrow = document.createElement("div");
    arrow.className = "text-slate-500 text-xs mx-1";
    arrow.style.cssText = "color: #64748b; font-size: 12px; margin: 0 0.25rem;";
    arrow.innerHTML = "▶";
    flowchart.appendChild(arrow);
    
    const colors = ["bg-emerald-600", "bg-violet-600", "bg-amber-600", "bg-rose-600", "bg-blue-600"];
    const hexColors = ["#059669", "#7c3aed", "#d97706", "#e11d48", "#2563eb"];
    const randomIdx = Math.floor(Math.random() * colors.length);
    
    const step = document.createElement("div");
    step.className = `px-6 py-3 ${colors[randomIdx]} text-white rounded min-w-[100px] min-h-[30px]`;
    step.style.cssText = `padding: 0.5rem 1rem; background-color: ${hexColors[randomIdx]}; color: #ffffff; border-radius: 0.25rem; font-size: 11px;`;
    step.innerHTML = "&nbsp;";
    flowchart.appendChild(step);
    
    handleInput();
    editorRef.current.focus();
  };

  const handlePictureClick = () => {
    setShowPicturePermission(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        if (base64Url) {
          const imageHTML = `<img src="${base64Url}" alt="Device Upload" class="max-h-72 rounded-xl border border-slate-800 my-4 shadow-lg max-w-full block mx-auto hover:opacity-95 transition-all" style="max-height: 18rem; border-radius: 0.75rem; border: 1px solid #1e293b; margin: 1rem auto; display: block; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);" /><p><br></p>`;
          appendHTMLAtEnd(imageHTML);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleClearAll = () => {
    onChange("");
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      editorRef.current.focus();
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={isFullscreen ? "fixed inset-0 z-[150] bg-slate-900 flex flex-col w-screen h-screen p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200" : "bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col w-full relative"}>
      {/* Styles Injection for WYSIWYG Editor styling inside contentEditable */}
      <style>{`
        .wysiwyg-editor[contenteditable]:empty:before {
          content: attr(placeholder);
          color: #64748b !important;
          font-style: italic;
          cursor: text;
        }
        .wysiwyg-editor table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 0.8rem;
          background-color: #ffffff;
          color: #000000;
          border: 1px solid #cbd5e1;
        }
        .wysiwyg-editor th, .wysiwyg-editor td {
          border: 1px solid #cbd5e1;
          padding: 0.5rem 0.75rem !important;
          color: #000000;
          background-color: #ffffff;
        }
        .wysiwyg-editor th {
          background-color: #f1f5f9;
          font-weight: bold;
        }
        .wysiwyg-editor ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin: 0.75rem 0 !important;
        }
        .wysiwyg-editor p {
          margin-bottom: 0.5rem;
        }
      `}</style>

      {/* WYSIWYG Editor Toolbar */}
      <div className="bg-slate-950 p-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 select-none">
        <div className="flex items-center flex-wrap gap-1">
          {/* Bold */}
          <button
            type="button"
            onClick={() => execCommand("bold")}
            className={`p-1.5 rounded transition-colors ${
              isBold 
                ? "bg-violet-600/30 text-violet-300 ring-1 ring-violet-500/50 font-extrabold" 
                : "hover:bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => execCommand("italic")}
            className={`p-1.5 rounded transition-colors ${
              isItalic 
                ? "bg-violet-600/30 text-violet-300 ring-1 ring-violet-500/50 italic" 
                : "hover:bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          {/* Underline */}
          <button
            type="button"
            onClick={() => execCommand("underline")}
            className={`p-1.5 rounded transition-colors ${
              isUnderline 
                ? "bg-violet-600/30 text-violet-300 ring-1 ring-violet-500/50 underline" 
                : "hover:bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          {/* Highlight */}
          <button
            type="button"
            onClick={toggleHighlight}
            className={`p-1.5 rounded transition-colors ${
              isHighlighted 
                ? "bg-amber-500/30 text-amber-300 ring-1 ring-amber-500/50" 
                : "hover:bg-slate-800 text-slate-300 hover:text-white"
            }`}
            title="Highlight selection"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {/* Bullet List */}
          <button
            type="button"
            onClick={() => execCommand("insertUnorderedList")}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-800 mx-1" />

          {/* Google Docs Color Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowColorDropdown(!showColorDropdown);
                setShowSpacingDropdown(false);
                setShowHeadingDropdown(false);
              }}
              className={`p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1 ${showColorDropdown ? "bg-slate-800 text-white" : ""}`}
              title="Text Color"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="w-2 h-2 rounded-full border border-slate-700" style={{ backgroundColor: textColor }} />
            </button>
            {showColorDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-slate-900 border border-slate-800 p-2 rounded-lg shadow-xl z-50 grid grid-cols-5 gap-1 min-w-[120px]">
                {[
                  { name: "White", hex: "#ffffff" },
                  { name: "Black", hex: "#000000" },
                  { name: "Gray", hex: "#94a3b8" },
                  { name: "Red", hex: "#ef4444" },
                  { name: "Orange", hex: "#f97316" },
                  { name: "Yellow", hex: "#eab308" },
                  { name: "Green", hex: "#10b981" },
                  { name: "Blue", hex: "#3b82f6" },
                  { name: "Indigo", hex: "#6366f1" },
                  { name: "Violet", hex: "#8b5cf6" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => {
                      execCommand("foreColor", c.hex);
                      setTextColor(c.hex);
                      setShowColorDropdown(false);
                    }}
                    className="w-5 h-5 rounded border border-slate-800 hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Paragraph styles / Headings */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowHeadingDropdown(!showHeadingDropdown);
                setShowColorDropdown(false);
                setShowSpacingDropdown(false);
              }}
              className={`px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-[10px] font-bold flex items-center gap-1 border border-slate-800 ${showHeadingDropdown ? "bg-slate-800 text-white" : ""}`}
              title="Paragraph Style / Headings"
            >
              <span>Aa</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
            {showHeadingDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-slate-900 border border-slate-800 p-1 rounded-lg shadow-xl z-50 flex flex-col gap-0.5 min-w-[110px] text-left">
                {[
                  { label: "Normal Paragraph", command: "P" },
                  { label: "Heading 1", command: "H1" },
                  { label: "Heading 2", command: "H2" },
                  { label: "Heading 3", command: "H3" },
                ].map((h) => (
                  <button
                    key={h.label}
                    type="button"
                    onClick={() => {
                      execCommand("formatBlock", h.command);
                      setShowHeadingDropdown(false);
                    }}
                    className="text-[10px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 px-2 py-1 rounded transition-colors text-left cursor-pointer"
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Line Spacing */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowSpacingDropdown(!showSpacingDropdown);
                setShowColorDropdown(false);
                setShowHeadingDropdown(false);
              }}
              className={`px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-[10px] font-bold flex items-center gap-1 border border-slate-800 ${showSpacingDropdown ? "bg-slate-800 text-white" : ""}`}
              title="Line Spacing"
            >
              <span>↕ {lineSpacing}</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
            {showSpacingDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-slate-900 border border-slate-800 p-1 rounded-lg shadow-xl z-50 flex flex-col gap-0.5 min-w-[85px] text-left">
                {["1.0", "1.15", "1.5", "2.0"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      applyLineSpacing(s);
                      setLineSpacing(s);
                      setShowSpacingDropdown(false);
                    }}
                    className="text-[10px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 px-2 py-1 rounded transition-colors text-left cursor-pointer"
                  >
                    {s} Spacing
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Alignments Group */}
          <div className="flex items-center gap-0.5 bg-slate-900/40 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => execCommand("justifyLeft")}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand("justifyCenter")}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand("justifyRight")}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand("justifyFull")}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Align Justify"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="w-px h-4 bg-slate-800 mx-1" />

          {/* Table Operations */}
          <div className="flex items-center gap-1 bg-slate-900/40 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={insertPresetTable}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-bold"
              title="Insert standard 2x2 table"
            >
              <Table className="w-3.5 h-3.5 text-blue-400" />
              <span>+ Table</span>
            </button>
            <button
              type="button"
              onClick={expandTableVertically}
              className="px-1.5 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-violet-300 transition-colors flex items-center text-[9px] font-extrabold"
              title="Add Table Row (Expand Vertically)"
            >
              <span>Row+⬇️</span>
            </button>
            <button
              type="button"
              onClick={expandTableHorizontally}
              className="px-1.5 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-violet-300 transition-colors flex items-center text-[9px] font-extrabold"
              title="Add Table Column (Expand Horizontally)"
            >
              <span>Col+➡️</span>
            </button>
            <button
              type="button"
              onClick={deleteActiveRow}
              className="px-1.5 py-1 rounded hover:bg-slate-800 text-rose-400 hover:text-rose-300 transition-colors flex items-center text-[9px] font-extrabold"
              title="Delete Active Row (Row-❌)"
            >
              <span>Row-❌</span>
            </button>
            <button
              type="button"
              onClick={deleteActiveColumn}
              className="px-1.5 py-1 rounded hover:bg-slate-800 text-rose-400 hover:text-rose-300 transition-colors flex items-center text-[9px] font-extrabold"
              title="Delete Active Column (Col-❌)"
            >
              <span>Col-❌</span>
            </button>

            {/* Cell Background Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowCellBgDropdown(!showCellBgDropdown);
                  setShowColorDropdown(false);
                  setShowSpacingDropdown(false);
                  setShowHeadingDropdown(false);
                }}
                className={`px-1.5 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[9px] font-extrabold border border-slate-800/60 ${showCellBgDropdown ? "bg-slate-800 text-white" : ""}`}
                title="Cell Background Color"
              >
                <span>🎨 Cell Bg</span>
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
              {showCellBgDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-slate-900 border border-slate-800 p-2 rounded-lg shadow-xl z-50 grid grid-cols-3 gap-1 min-w-[140px]">
                  {[
                    { name: "White", hex: "#ffffff" },
                    { name: "Light Gray", hex: "#f1f5f9" },
                    { name: "Yellow Accent", hex: "#fef08a" },
                    { name: "Green Accent", hex: "#bbf7d0" },
                    { name: "Blue Accent", hex: "#bfdbfe" },
                    { name: "Red Accent", hex: "#fecaca" },
                  ].map((bg) => (
                    <button
                      key={bg.hex}
                      type="button"
                      onClick={() => {
                        applyCellBackground(bg.hex);
                        setShowCellBgDropdown(false);
                      }}
                      className="flex flex-col items-center justify-center p-1 hover:bg-slate-800 rounded border border-slate-800 cursor-pointer"
                      title={`Apply ${bg.name}`}
                    >
                      <span className="w-4 h-4 rounded border border-slate-700" style={{ backgroundColor: bg.hex }} />
                      <span className="text-[8px] mt-0.5 text-slate-400 font-sans font-medium text-center truncate w-full">{bg.name.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Import Excel / CSV Button */}
            <button
              type="button"
              onClick={() => {
                setShowExcelImportModal(true);
                setShowCellBgDropdown(false);
                setShowColorDropdown(false);
                setShowSpacingDropdown(false);
                setShowHeadingDropdown(false);
              }}
              className="px-2 py-1 rounded hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 text-[10px] font-bold"
              title="Import or paste clipboard rows from Microsoft Excel or Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>📋 Paste/Import Excel</span>
            </button>
          </div>

          {/* Flowchart Operations */}
          <div className="flex items-center gap-1 bg-slate-900/40 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={insertPresetFlowchart}
              className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-bold"
              title="Insert standard flowchart"
            >
              <Workflow className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Flowchart</span>
            </button>
            <button
              type="button"
              onClick={expandFlowchartVertically}
              className="px-1.5 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors flex items-center text-[9px] font-extrabold"
              title="Add Vertical Step (Expand Vertically)"
            >
              <span>Step+⬇️</span>
            </button>
            <button
              type="button"
              onClick={expandFlowchartHorizontally}
              className="px-1.5 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors flex items-center text-[9px] font-extrabold"
              title="Add Horizontal Step (Expand Horizontally)"
            >
              <span>Step+➡️</span>
            </button>
          </div>

          {/* Insert Picture from Device with Storage Permission */}
          <button
            type="button"
            onClick={handlePictureClick}
            className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-bold border border-slate-800"
            title="Upload image from device storage"
          >
            <Image className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Picture</span>
          </button>

          {/* Hidden File Input for Image Selection */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* Clear All Content Button */}
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2 py-1 rounded hover:bg-red-950/40 hover:text-red-400 text-slate-400 transition-colors flex items-center gap-1 text-[10px] font-bold border border-slate-800"
            title="Clear all text and formatting"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>Clear All</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Undo */}
          <button
            type="button"
            onClick={() => execCommand("undo")}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={() => execCommand("redo")}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-800 mx-1" />

          {/* Raw HTML Source Code Toggle */}
          <button
            type="button"
            onClick={() => setShowSource(!showSource)}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
              showSource 
                ? "bg-violet-600 text-white" 
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title="Toggle HTML Source Editor"
          >
            <Code2 className="w-3 h-3" />
            <span>HTML Code</span>
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
              isFullscreen 
                ? "bg-amber-500 text-slate-950 font-black ring-1 ring-amber-400" 
                : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750"
            }`}
            title={isFullscreen ? "Exit Fullscreen" : "Edit in Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3 text-slate-950" /> : <Maximize2 className="w-3 h-3" />}
            <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>
        </div>
      </div>

      {/* Editor Main Surface */}
      <div className={`relative bg-slate-900 flex-1 min-h-[160px] flex flex-col ${isFullscreen ? "h-full" : "max-h-[400px]"}`}>
        {/* Floating Expand/Collapse Button */}
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute top-2.5 right-2.5 z-20 p-2 rounded-lg bg-slate-950/80 hover:bg-slate-950 text-slate-400 hover:text-white transition-all border border-slate-800 cursor-pointer shadow-md opacity-60 hover:opacity-100"
          title={isFullscreen ? "Exit Fullscreen Mode" : "Expand to Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {!showSource ? (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            data-placeholder={placeholder || "Type description here... Standard formatting and layouts render visually live."}
            className={`wysiwyg-editor w-full overflow-y-auto bg-slate-900 text-white p-4 text-xs focus:outline-none focus:bg-slate-900/40 transition-colors select-text ${isFullscreen ? "h-full flex-1 max-h-none text-sm" : "min-h-[160px] max-h-[350px]"}`}
            style={{ outline: "none" }}
          />
        ) : (
          <div className="relative flex flex-col w-full h-full flex-1">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="HTML source code..."
              className={`w-full bg-slate-950 text-emerald-400 p-4 font-mono text-xs focus:outline-none resize-y leading-relaxed ${isFullscreen ? "h-full flex-1 max-h-none text-sm" : "min-h-[160px] max-h-[350px]"}`}
            />
            <button
              type="button"
              onClick={handleCopyCode}
              className="absolute right-3 top-3 p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[9px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied!" : "Copy HTML"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="bg-slate-950/40 px-3 py-1.5 border-t border-slate-800/40 text-[9px] text-slate-500 flex justify-between items-center select-none font-mono">
        <span>Google Docs WYSIWYG Editor Emulation Active</span>
        <span>HTML Source toggle supported</span>
      </div>

      {showPicturePermission && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-violet-600/10 text-violet-400 flex items-center justify-center mx-auto border border-violet-500/20">
              <Image className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">Storage Access Requested</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                NepMed requests authorization to access your device's image store to select and embed illustrations into the custom MCQ editor.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPicturePermission(false)}
                className="flex-1 py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold border border-slate-800 transition-colors"
              >
                Deny
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPicturePermission(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-violet-600/20"
              >
                Allow & Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spreadsheet / Excel Paste/Import Modal */}
      {showExcelImportModal && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h4 className="text-white font-bold text-sm">📋 Import / Paste Spreadsheet as Table</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowExcelImportModal(false);
                  setPastedExcelTableText("");
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Instantly convert a spreadsheet file or copied Excel rows into a beautiful, editable HTML table in your text.
            </p>

            <div className="space-y-3">
              {/* Option A: Paste copied cells */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Option 1: Paste Copied Rows (Google Sheets / Excel)
                </label>
                <textarea
                  value={pastedExcelTableText}
                  onChange={(e) => setPastedExcelTableText(e.target.value)}
                  placeholder="Paste copied cells from Excel/Sheets here (separated by tabs)..."
                  className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Option B: Upload file */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Option 2: Import Spreadsheet File (.csv / .tsv)
                </label>
                <div className="border border-dashed border-slate-800 rounded-xl p-4 bg-slate-950/40 text-center flex flex-col items-center gap-1.5 relative hover:border-slate-700 transition-colors">
                  <Upload className="w-5 h-5 text-slate-500" />
                  <p className="text-[10px] text-slate-400 font-medium">Select a CSV or TSV spreadsheet file from your device</p>
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const text = evt.target?.result as string;
                          if (text) {
                            const isTab = file.name.endsWith(".tsv") || text.includes("\t");
                            handleInsertSpreadsheetTable(text, isTab);
                            setShowExcelImportModal(false);
                          }
                        };
                        reader.readAsText(file);
                      }
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowExcelImportModal(false);
                  setPastedExcelTableText("");
                }}
                className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold border border-slate-800 transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!pastedExcelTableText.trim()}
                onClick={() => {
                  handleInsertSpreadsheetTable(pastedExcelTableText, true);
                  setPastedExcelTableText("");
                  setShowExcelImportModal(false);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-emerald-600/20 cursor-pointer text-center"
              >
                Parse & Insert Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
