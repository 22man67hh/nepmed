import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Image as ImageIcon, Type, List, Box } from 'lucide-react';

interface JsonVisualEditorProps {
  data: any;
  onChange: (newData: any) => void;
}

export function JsonVisualEditor({ data, onChange }: JsonVisualEditorProps) {
  const isObject = (val: any) => val !== null && typeof val === 'object' && !Array.isArray(val);
  const isArray = (val: any) => Array.isArray(val);

  const handleUpdate = (key: string | number, value: any) => {
    const newData = Array.isArray(data) ? [...data] : { ...data };
    newData[key as any] = value;
    onChange(newData);
  };

  const handleDelete = (key: string | number) => {
    if (Array.isArray(data)) {
      const newData = [...data];
      newData.splice(key as number, 1);
      onChange(newData);
    } else {
      const newData = { ...data };
      delete newData[key];
      onChange(newData);
    }
  };

  const handleAddField = (type: 'string' | 'object' | 'array') => {
    if (Array.isArray(data)) {
      const newData = [...data];
      if (type === 'string') newData.push("");
      else if (type === 'object') newData.push({});
      else if (type === 'array') newData.push([]);
      onChange(newData);
    } else {
      const key = prompt("Enter field key:");
      if (!key) return;
      const newData = { ...data };
      if (type === 'string') newData[key] = "";
      else if (type === 'object') newData[key] = {};
      else if (type === 'array') newData[key] = [];
      onChange(newData);
    }
  };

  if (!isObject(data) && !isArray(data)) {
    return <div className="text-red-400">Root must be an object or array.</div>;
  }

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex flex-col gap-2 p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">{key}</span>
            <button onClick={() => handleDelete(key)} className="text-slate-500 hover:text-red-400">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          {typeof value === 'string' ? (
             key.toLowerCase().includes('image') || key.toLowerCase().includes('icon') || key.toLowerCase().includes('logo') || key.toLowerCase().includes('avatar') ? (
               <div className="flex gap-3 items-center">
                 {value && <img src={value} className="w-10 h-10 object-cover rounded border border-slate-700 bg-black" alt="" />}
                 <input 
                   type="text" 
                   value={value} 
                   onChange={(e) => handleUpdate(key, e.target.value)}
                   className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                   placeholder="https://..."
                 />
               </div>
             ) : value.length > 50 || key.toLowerCase().includes('text') || key.toLowerCase().includes('description') || key.toLowerCase().includes('body') ? (
               <textarea 
                 value={value} 
                 onChange={(e) => handleUpdate(key, e.target.value)}
                 rows={3}
                 className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
               />
             ) : (
               <input 
                 type="text" 
                 value={value} 
                 onChange={(e) => handleUpdate(key, e.target.value)}
                 className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
               />
             )
          ) : typeof value === 'number' ? (
             <input 
               type="number" 
               value={value} 
               onChange={(e) => handleUpdate(key, parseFloat(e.target.value))}
               className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
             />
          ) : typeof value === 'boolean' ? (
             <label className="flex items-center gap-2 cursor-pointer">
               <input 
                 type="checkbox" 
                 checked={value} 
                 onChange={(e) => handleUpdate(key, e.target.checked)}
                 className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
               />
               <span className="text-xs text-slate-300">True/False</span>
             </label>
          ) : isObject(value) || isArray(value) ? (
             <div className="pl-4 border-l border-slate-700/50">
               <JsonVisualEditor data={value} onChange={(newVal) => handleUpdate(key, newVal)} />
             </div>
          ) : null}
        </div>
      ))}
      
      <div className="flex gap-2 pt-2">
        <button onClick={() => handleAddField('string')} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded flex items-center gap-1 font-bold">
          <Plus className="w-3 h-3" /> Text / Image
        </button>
        <button onClick={() => handleAddField('object')} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded flex items-center gap-1 font-bold">
          <Plus className="w-3 h-3" /> Object
        </button>
        <button onClick={() => handleAddField('array')} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded flex items-center gap-1 font-bold">
          <Plus className="w-3 h-3" /> List
        </button>
      </div>
    </div>
  );
}
