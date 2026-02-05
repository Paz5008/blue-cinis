"use client";
import React, { useMemo, useState } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface EntityOption { id: string; title: string; imageUrl?: string }

interface MultiEntityPickerProps {
  label?: string;
  value?: string[];
  onChange: (v: string[]) => void;
  options: EntityOption[];
}

export default function MultiEntityPicker({ label, value = [], onChange, options }: MultiEntityPickerProps) {
  const [q, setQ] = useState('');
  const selected = new Set(value);
  const filtered = useMemo(() => {
    if (!q) return options;
    const qq = q.toLowerCase();
    return options.filter(o => o.title.toLowerCase().includes(qq));
  }, [q, options]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(Array.from(next));
  };

  const selectedOrdered = value.map(id => options.find(o => o.id == id) || { id, title: id });

  const SortableItem: React.FC<{ id: string; title: string; imageUrl?: string }> = ({ id, title, imageUrl }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-1.5 border rounded bg-white" {...attributes} {...listeners}>
        <span className="cursor-grab select-none text-gray-500">⋮⋮</span>
        {imageUrl && <img src={imageUrl} alt="" className="h-6 w-6 object-cover rounded" />}
        <span className="text-sm truncate flex-1" title={title}>{title}</span>
        <button type="button" className="text-xs text-red-600" onClick={() => toggle(id)}>Retirer</button>
      </div>
    );
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = value.indexOf(String(active.id));
    const newIndex = value.indexOf(String(over.id));
    if (oldIndex >= 0 && newIndex >= 0) {
      onChange(arrayMove(value, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-3">
      {label && <div className="text-xs text-gray-600">{label}</div>}
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher…"
        className="w-full p-1.5 border rounded text-sm"
      />
      <div className="max-h-40 overflow-auto border rounded p-1 space-y-1">
        {filtered.map(o => (
          <label key={o.id} className="flex items-center gap-2 text-sm p-1 rounded hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.has(o.id)}
              onChange={() => toggle(o.id)}
            />
            {o.imageUrl && <img src={o.imageUrl} alt="" className="h-6 w-6 object-cover rounded" />}
            <span className="truncate" title={o.title}>{o.title}</span>
          </label>
        ))}
        {filtered.length === 0 && <div className="text-xs text-gray-400 p-2">Aucun résultat</div>}
      </div>
      <div>
        <div className="text-xs text-gray-600 mb-1">Sélection actuelle ({selected.size})</div>
        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={value} strategy={verticalListSortingStrategy}>
            <div className="space-y-1 max-h-40 overflow-auto">
              {selectedOrdered.map(o => (
                <SortableItem key={o.id} id={o.id} title={o.title} imageUrl={o.imageUrl} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
