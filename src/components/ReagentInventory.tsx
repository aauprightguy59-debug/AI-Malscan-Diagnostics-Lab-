/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Package, AlertTriangle, Plus, Search, Filter, CheckCircle2, Clock, Calendar, RefreshCw, BarChart3 } from 'lucide-react';
import { ReagentItem, INITIAL_REAGENTS } from '../types';

interface ReagentInventoryProps {
  onUpdateInventory?: (items: ReagentItem[]) => void;
}

export default function ReagentInventory({ onUpdateInventory }: ReagentInventoryProps) {
  const [reagents, setReagents] = useState<ReagentItem[]>(INITIAL_REAGENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Reagent Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ReagentItem['category']>('RDT Cassettes');
  const [newQuantity, setNewQuantity] = useState('');
  const [newUnit, setNewUnit] = useState('Tests');
  const [newBatch, setNewBatch] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newThreshold, setNewThreshold] = useState('50');
  const [newSupplier, setNewSupplier] = useState('');

  const filteredReagents = reagents.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRestock = (id: string, amount: number) => {
    setReagents(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.stockQuantity + amount;
        return {
          ...item,
          stockQuantity: newQty,
          status: newQty <= item.lowStockThreshold ? 'Low Stock' : 'Adequate'
        };
      }
      return item;
    }));
  };

  const handleAddNewReagent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newQuantity) return;

    const qty = parseInt(newQuantity) || 0;
    const threshold = parseInt(newThreshold) || 20;

    const newItem: ReagentItem = {
      id: `REA-${Math.floor(Math.random() * 900) + 100}`,
      name: newName,
      category: newCategory,
      stockQuantity: qty,
      unit: newUnit,
      batchNumber: newBatch || `LOT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900)}`,
      expiryDate: newExpiry || '2027-12-31',
      lowStockThreshold: threshold,
      supplier: newSupplier || 'National Malaria Elimination Programme (NMEP)',
      status: qty <= threshold ? 'Low Stock' : 'Adequate'
    };

    const updated = [newItem, ...reagents];
    setReagents(updated);
    if (onUpdateInventory) onUpdateInventory(updated);

    // Reset Form
    setNewName('');
    setNewQuantity('');
    setShowAddModal(false);
  };

  const lowStockCount = reagents.filter(r => r.status === 'Low Stock' || r.status === 'Critical').length;

  return (
    <div id="reagent-inventory-container" className="space-y-6 animate-fade-in">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-tight">Clinical Reagents & Store Inventory</h2>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/40 font-bold uppercase">
                Gboko & IDP Central Store
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time monitoring of Giemsa stain stock, RDT cassettes, HemoCue microcuvettes, G6PD strips, and LAMP reagents
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Reagent Batch</span>
        </button>
      </div>

      {/* Low Stock Warning Header */}
      {lowStockCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div className="text-xs text-amber-200">
              <span className="font-bold">{lowStockCount} Reagents approaching critical thresholds: </span>
              Ensure replenishment requests are submitted to Benue State Ministry of Health / NMEP central depot.
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-1 rounded">
            ACTION REQUIRED
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search reagent name or lot batch..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['All', 'Stains & Buffers', 'RDT Cassettes', 'Microcuvettes & Strips', 'G6PD Biosensors', 'Molecular Mastermix'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Reagent Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-4">Reagent / Consumable Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">In-Stock Quantity</th>
                <th className="p-4">Batch / Lot #</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredReagents.map((item) => (
                <tr key={item.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="p-4">
                    <div className="font-sans font-bold text-white text-xs">{item.name}</div>
                    <div className="text-[10px] text-slate-500 font-sans">{item.supplier}</div>
                  </td>
                  <td className="p-4">
                    <span className="text-slate-300 text-[11px] font-sans">{item.category}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-white text-sm">
                      {item.stockQuantity} <span className="text-xs text-slate-400 font-normal">{item.unit}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Threshold: {item.lowStockThreshold} {item.unit}</div>
                  </td>
                  <td className="p-4 text-slate-300">{item.batchNumber}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>{item.expiryDate}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.status === 'Adequate' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                      item.status === 'Low Stock' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1.5">
                    <button
                      onClick={() => handleRestock(item.id, 50)}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-teal-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      title="Add 50 units"
                    >
                      +50
                    </button>
                    <button
                      onClick={() => handleRestock(item.id, 200)}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-teal-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      title="Add 200 units"
                    >
                      +200
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white uppercase">Register New Reagent Batch</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xs">
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddNewReagent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Reagent Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Field Giemsa Stain 500ml"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Stains & Buffers">Stains & Buffers</option>
                    <option value="RDT Cassettes">RDT Cassettes</option>
                    <option value="Microcuvettes & Strips">Microcuvettes & Strips</option>
                    <option value="G6PD Biosensors">G6PD Biosensors</option>
                    <option value="Molecular Mastermix">Molecular Mastermix</option>
                    <option value="PPE & Consumables">PPE & Consumables</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Initial Quantity</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500"
                    value={newQuantity}
                    onChange={e => setNewQuantity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Lot / Batch Number</label>
                  <input
                    type="text"
                    placeholder="e.g. LOT-2026-NMEP"
                    value={newBatch}
                    onChange={e => setNewBatch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newExpiry}
                    onChange={e => setNewExpiry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs uppercase"
                >
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
