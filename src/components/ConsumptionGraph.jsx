import React, { useState, useMemo } from 'react';
import { Network, ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import { formatRupees } from '../utils/formatCurrency.js';

export function ConsumptionGraph({ items = [], people = [] }) {
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Compute connections (edges)
  const edges = useMemo(() => {
    const list = [];
    items.forEach((item, itemIdx) => {
      (item.assignedTo || []).forEach((person) => {
        const personIdx = people.indexOf(person);
        if (personIdx !== -1) {
          list.push({
            id: `edge_${person}_${item.id}`,
            person,
            personIdx,
            itemId: item.id,
            itemIdx,
          });
        }
      });
    });
    return list;
  }, [items, people]);

  // Dimensions
  const width = 800;
  const height = Math.max(450, Math.max(people.length, items.length) * 75 + 60);

  const leftX = 140; // People node center X
  const rightX = 660; // Item node center X

  // Node positions
  const peoplePositions = useMemo(() => {
    const total = people.length || 1;
    const spacing = (height - 80) / total;
    return people.reduce((acc, person, idx) => {
      acc[person] = {
        x: leftX,
        y: 45 + idx * spacing + spacing / 2,
      };
      return acc;
    }, {});
  }, [people, height]);

  const itemPositions = useMemo(() => {
    const total = items.length || 1;
    const spacing = (height - 80) / total;
    return items.reduce((acc, item, idx) => {
      acc[item.id] = {
        x: rightX,
        y: 45 + idx * spacing + spacing / 2,
      };
      return acc;
    }, {});
  }, [items, height]);

  // Handle click toggles
  const handlePersonClick = (person) => {
    if (selectedPerson === person) {
      setSelectedPerson(null);
    } else {
      setSelectedPerson(person);
      setSelectedItem(null);
    }
  };

  const handleItemClick = (itemId) => {
    if (selectedItem === itemId) {
      setSelectedItem(null);
    } else {
      setSelectedItem(itemId);
      setSelectedPerson(null);
    }
  };

  const handleClearSelection = () => {
    setSelectedPerson(null);
    setSelectedItem(null);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Header & Controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                INTERACTIVE CONSUMPTION GRAPH
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                {edges.length} Connections
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Visualizes who consumed which dishes. Tap nodes to filter connections.
            </p>
          </div>
        </div>

        {(selectedPerson || selectedItem) && (
          <button
            onClick={handleClearSelection}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-400 mb-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
          <span>People (Consumers)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span>Food Items (Dishes)</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 ml-auto text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5" />
          <span>Click a person to highlight their dishes, or dish to see sharers</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto bg-slate-950/80 rounded-xl border border-slate-800/80">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[650px] h-auto select-none"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
            </linearGradient>

            <linearGradient id="edgeGradientActive" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Render connecting Bezier curves */}
          {edges.map((edge) => {
            const pPos = peoplePositions[edge.person];
            const iPos = itemPositions[edge.itemId];
            if (!pPos || !iPos) return null;

            const isHighlighted =
              (selectedPerson && edge.person === selectedPerson) ||
              (selectedItem && edge.itemId === selectedItem);

            const isDimmed =
              (selectedPerson && edge.person !== selectedPerson) ||
              (selectedItem && edge.itemId !== selectedItem);

            // Control points for smooth horizontal S-curve
            const dx = (iPos.x - pPos.x) * 0.5;
            const pathD = `M ${pPos.x + 80} ${pPos.y} C ${pPos.x + 80 + dx} ${pPos.y}, ${
              iPos.x - 80 - dx
            } ${iPos.y}, ${iPos.x - 80} ${iPos.y}`;

            return (
              <path
                key={edge.id}
                d={pathD}
                fill="none"
                stroke={isHighlighted ? 'url(#edgeGradientActive)' : 'url(#edgeGradient)'}
                strokeWidth={isHighlighted ? 3.5 : 2}
                strokeDasharray={isHighlighted ? 'none' : '4 2'}
                opacity={isDimmed ? 0.12 : isHighlighted ? 1 : 0.65}
                className="transition-all duration-300 pointer-events-none"
              />
            );
          })}

          {/* Render People Nodes (Left Column) */}
          {people.map((person) => {
            const pos = peoplePositions[person];
            if (!pos) return null;

            const isSelected = selectedPerson === person;
            const isRelated =
              selectedItem &&
              items.find((i) => i.id === selectedItem)?.assignedTo?.includes(person);

            const isDimmed = (selectedPerson && !isSelected) || (selectedItem && !isRelated);

            const consumedCount = items.filter((it) =>
              (it.assignedTo || []).includes(person)
            ).length;

            return (
              <g
                key={person}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => handlePersonClick(person)}
                className="cursor-pointer transition-all duration-200"
                opacity={isDimmed ? 0.25 : 1}
              >
                {/* Node Pill Background */}
                <rect
                  x="-85"
                  y="-22"
                  width="170"
                  height="44"
                  rx="22"
                  fill="#0b1329"
                  stroke={isSelected || isRelated ? '#60a5fa' : '#1e3a8a'}
                  strokeWidth={isSelected || isRelated ? 2.5 : 1.5}
                  filter={isSelected ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))' : 'none'}
                />

                {/* Avatar Icon */}
                <circle cx="-60" cy="0" r="14" fill="#2563eb" />
                <text
                  x="-60"
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {person.charAt(0)}
                </text>

                {/* Person Name */}
                <text
                  x="-38"
                  y="-2"
                  fill="#f1f5f9"
                  fontSize="13"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {person}
                </text>

                {/* Consumption Badge */}
                <text
                  x="-38"
                  y="13"
                  fill="#93c5fd"
                  fontSize="10"
                  fontFamily="sans-serif"
                >
                  {consumedCount} dish{consumedCount !== 1 ? 'es' : ''}
                </text>

                {/* Indicator connector dot */}
                <circle cx="85" cy="0" r="4" fill="#3b82f6" />
              </g>
            );
          })}

          {/* Render Food Item Nodes (Right Column) */}
          {items.map((item) => {
            const pos = itemPositions[item.id];
            if (!pos) return null;

            const isSelected = selectedItem === item.id;
            const isRelated =
              selectedPerson && (item.assignedTo || []).includes(selectedPerson);

            const isDimmed = (selectedItem && !isSelected) || (selectedPerson && !isRelated);
            const sharers = (item.assignedTo || []).length;

            return (
              <g
                key={item.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => handleItemClick(item.id)}
                className="cursor-pointer transition-all duration-200"
                opacity={isDimmed ? 0.25 : 1}
              >
                {/* Node Pill Background */}
                <rect
                  x="-105"
                  y="-22"
                  width="210"
                  height="44"
                  rx="22"
                  fill="#062218"
                  stroke={isSelected || isRelated ? '#34d399' : '#065f46'}
                  strokeWidth={isSelected || isRelated ? 2.5 : 1.5}
                  filter={isSelected ? 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))' : 'none'}
                />

                {/* Left Connector dot */}
                <circle cx="-105" cy="0" r="4" fill="#10b981" />

                {/* Dish Name */}
                <text
                  x="-90"
                  y="-2"
                  fill="#f1f5f9"
                  fontSize="12.5"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {item.name.length > 18 ? item.name.substring(0, 16) + '...' : item.name}
                </text>

                {/* Dish Price & Sharers count */}
                <text
                  x="-90"
                  y="13"
                  fill="#6ee7b7"
                  fontSize="10.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {formatRupees(item.price)}
                </text>

                <text
                  x="20"
                  y="13"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="sans-serif"
                >
                  {sharers === 0 ? '⚠ Unassigned' : `${sharers} sharer${sharers > 1 ? 's' : ''}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
