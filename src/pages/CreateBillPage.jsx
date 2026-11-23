import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Sliders,
  DollarSign,
  Users,
  CreditCard,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../services/api.js';
import { enhanceReceiptImage } from '../utils/imageEnhancer.js';
import { formatRupees } from '../utils/formatCurrency.js';

export function CreateBillPage() {
  const navigate = useNavigate();
  const { user, contacts, refreshBills, refreshContacts, showToast } = useApp();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('₹');
  const [paidBy, setPaidBy] = useState(user.name || 'Me');
  const [notes, setNotes] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([user.name || 'Me']);

  // Receipt items list
  const [items, setItems] = useState([]);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [printedTotal, setPrintedTotal] = useState(0);

  // New item inputs
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);

  // Receipt image states
  const [receiptImage, setReceiptImage] = useState(null);
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [ocrError, setOcrError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);

  // Compute calculated subtotal and total
  const itemsSubtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (parseInt(item.qty, 10) || 1), 0);
  const extrasTotal = (parseFloat(cgst) || 0) + (parseFloat(sgst) || 0) + (parseFloat(serviceCharge) || 0) - (parseFloat(discount) || 0) + (parseFloat(roundOff) || 0);
  const calculatedTotal = itemsSubtotal + extrasTotal;

  const diff = Number((calculatedTotal - (parseFloat(printedTotal) || 0)).toFixed(2));
  const isMatch = Math.abs(diff) <= 0.01;

  // Handle Receipt Upload & Groq Vision
  const handleReceiptUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setOcrError('Please upload a valid receipt image (JPG, PNG, or WEBP)');
      return;
    }

    setOcrError(null);
    setIsProcessing(true);

    try {
      setProcessingStatus('Enhancing thermal receipt contrast via Canvas...');
      const { dataUrl: enhancedDataUrl, base64: enhancedBase64 } = await enhanceReceiptImage(file);
      setEnhancedImage(enhancedDataUrl);

      // Raw preview
      const reader = new FileReader();
      reader.onload = (e) => setReceiptImage(e.target.result);
      reader.readAsDataURL(file);

      setProcessingStatus('Groq Vision extracting dishes, prices & GST...');
      const extracted = await api.extractReceipt(enhancedBase64, 'image/jpeg');

      if (extracted.restaurantName) setTitle(extracted.restaurantName);
      if (extracted.items && extracted.items.length > 0) {
        setItems(extracted.items);
      }
      if (extracted.cgst !== undefined) setCgst(extracted.cgst);
      if (extracted.sgst !== undefined) setSgst(extracted.sgst);
      if (extracted.serviceCharge !== undefined) setServiceCharge(extracted.serviceCharge);
      if (extracted.discount !== undefined) setDiscount(extracted.discount);
      if (extracted.roundOff !== undefined) setRoundOff(extracted.roundOff);
      if (extracted.printedTotal !== undefined && extracted.printedTotal > 0) {
        setPrintedTotal(extracted.printedTotal);
      } else {
        const estTotal = (extracted.items || []).reduce((s, i) => s + i.price, 0) + (extracted.cgst || 0) + (extracted.sgst || 0);
        setPrintedTotal(estTotal);
      }

      showToast('Receipt parsed successfully with Groq Vision!');
    } catch (err) {
      console.warn('OCR error:', err);
      setOcrError(err.message || 'Could not parse receipt with AI. You can enter or edit items manually below.');
      showToast('Receipt OCR had an issue. You can enter items manually.', 'warning');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Add Item Manually
  const handleAddItem = (e) => {
    e.preventDefault();
    const p = parseFloat(newItemPrice);
    const q = parseInt(newItemQty, 10) || 1;
    if (!newItemName.trim() || isNaN(p) || p <= 0) return;

    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newItemName.trim(),
      qty: q,
      price: p,
      confidence: 'high',
      assignedTo: [],
    };

    setItems([...items, newItem]);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemQty(1);

    // Update printedTotal if currently 0
    if (printedTotal === 0) {
      setPrintedTotal(calculatedTotal + p * q);
    }
  };

  const handleDeleteItem = (id) => {
    setItems(items.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id, field, value) => {
    setItems(
      items.map((it) => {
        if (it.id === id) {
          return {
            ...it,
            [field]: field === 'name' ? value : parseFloat(value) || 0,
            confidence: 'high', // Mark verified upon manual edit
          };
        }
        return it;
      })
    );
  };

  // Participant selection toggle
  const toggleParticipant = (personName) => {
    if (selectedParticipants.includes(personName)) {
      if (selectedParticipants.length > 1) {
        setSelectedParticipants(selectedParticipants.filter((p) => p !== personName));
      }
    } else {
      setSelectedParticipants([...selectedParticipants, personName]);
    }
  };

  // Submit and create bill
  const handleSaveBill = async () => {
    if (!title.trim()) {
      showToast('Please enter a bill or restaurant name', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Please add at least one line item or dish', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const created = await api.createBill({
        title: title.trim(),
        date,
        currency,
        paidBy,
        items,
        cgst: parseFloat(cgst) || 0,
        sgst: parseFloat(sgst) || 0,
        serviceCharge: parseFloat(serviceCharge) || 0,
        discount: parseFloat(discount) || 0,
        roundOff: parseFloat(roundOff) || 0,
        printedTotal: parseFloat(printedTotal) || calculatedTotal,
        calculatedTotal,
        participants: selectedParticipants,
        notes: notes.trim(),
        receiptImage: enhancedImage || receiptImage || null,
      });

      await refreshBills();
      showToast(`Bill "${created.title}" created successfully!`);
      // Redirect to split page for this bill
      navigate(`/split/${created.id}`);
    } catch (err) {
      console.error('Save bill error:', err);
      showToast(err.message || 'Failed to save bill', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Page Title */}
      <div>
        <h2 className="font-serif text-3xl font-bold text-[#292929]">
          Create New Bill
        </h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Upload a receipt for instant Groq Vision extraction, or add food items manually.
        </p>
      </div>

      {/* Section 1: Bill Overview */}
      <div className="bg-white border border-[#FFE494] rounded-3xl p-6 sm:p-8 shadow-warm-sm space-y-6">
        <h3 className="font-serif text-xl font-bold text-[#292929] flex items-center gap-2">
          <span>1. Bill Details</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#292929] uppercase tracking-wider mb-2">
              Restaurant / Bill Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Spice Garden"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FFFDF7] border border-[#FFE494] text-sm text-[#292929] focus:outline-none focus:border-[#FF8A1E] font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#292929] uppercase tracking-wider mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FFFDF7] border border-[#FFE494] text-sm text-[#292929] focus:outline-none focus:border-[#FF8A1E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#292929] uppercase tracking-wider mb-2">
              Paid By
            </label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FFFDF7] border border-[#FFE494] text-sm text-[#292929] focus:outline-none focus:border-[#FF8A1E]"
            >
              <option value={user.name || 'Me'}>{user.name || 'Me'} (You)</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Participants Selector */}
        <div>
          <label className="block text-xs font-bold text-[#292929] uppercase tracking-wider mb-2">
            Who was at the table? (Participants)
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {/* User pill */}
            <button
              type="button"
              onClick={() => toggleParticipant(user.name || 'Me')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedParticipants.includes(user.name || 'Me')
                  ? 'bg-[#FFD83D] text-[#292929] border border-[#FFC928] shadow-warm-sm'
                  : 'bg-[#FFFDF7] text-[#6B7280] border border-[#FFE494]'
              }`}
            >
              {user.name || 'Me'} (You) &check;
            </button>

            {/* Contacts pills */}
            {contacts.map((c) => {
              const isSelected = selectedParticipants.includes(c.name);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleParticipant(c.name)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFD83D] text-[#292929] border border-[#FFC928] shadow-warm-sm font-bold'
                      : 'bg-[#FFFDF7] text-[#6B7280] border border-[#FFE494]'
                  }`}
                >
                  {c.name} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Receipt Upload with Groq Vision */}
      <div className="bg-white border border-[#FFE494] rounded-3xl p-6 sm:p-8 shadow-warm-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#292929] flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#FF8A1E]" />
              <span>2. Snap Receipt (Groq Vision)</span>
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Upload thermal paper bill &bull; Canvas boosts contrast before Groq extraction
            </p>
          </div>
        </div>

        {/* Upload Drop Zone */}
        <div
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all cursor-pointer ${
            isProcessing
              ? 'bg-[#FFFDF0] border-[#FFC928] opacity-80 pointer-events-none'
              : 'border-[#FFE494] hover:border-[#FF8A1E] bg-[#FFFDF7] hover:bg-[#FFFDF0]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => e.target.files?.[0] && handleReceiptUpload(e.target.files[0])}
            className="hidden"
          />

          {isProcessing ? (
            <div className="py-4 flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 border-3 border-[#FF8A1E] border-t-transparent rounded-full animate-spin" />
              <p className="font-bold text-sm text-[#FF8A1E]">{processingStatus}</p>
              <p className="text-xs text-[#6B7280]">
                Canvas pre-processing + Groq Multimodal Vision
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#FFF4D9] flex items-center justify-center text-[#FF8A1E] text-xl border border-[#FFE494]">
                <Upload className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-[#292929]">
                Click or drag & drop restaurant receipt
              </p>
              <p className="text-xs text-[#6B7280]">
                Supports JPG, PNG, WEBP &bull; Enhanced for faded thermal printouts
              </p>
            </div>
          )}
        </div>

        {/* OCR Error / Info */}
        {ocrError && (
          <div className="p-3 rounded-2xl bg-[#FFF0E5] border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1">
              <span className="font-bold">OCR Notice:</span> {ocrError}
            </div>
          </div>
        )}

        {/* Receipt Preview */}
        {(receiptImage || enhancedImage) && (
          <div className="p-4 rounded-2xl bg-[#FFFDF7] border border-[#FFE494] flex items-center gap-4">
            <img
              src={enhancedImage || receiptImage}
              alt="Receipt"
              className="w-20 h-20 object-cover rounded-xl border border-[#FFE494]"
            />
            <div>
              <span className="text-xs font-bold text-[#009F93] block">
                &check; Receipt Image Captured
              </span>
              <span className="text-[11px] text-[#6B7280]">
                Canvas thermal filter applied (Grayscale + 150% contrast)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Food Items List & Manual Add */}
      <div className="bg-white border border-[#FFE494] rounded-3xl p-6 sm:p-8 shadow-warm-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#292929]">
              3. Line Items & Dishes ({items.length})
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Review extracted items, edit prices, or add dishes manually.
            </p>
          </div>
        </div>

        {/* Items Table / Cards */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                item.confidence === 'low'
                  ? 'bg-[#FFF9E6] border-amber-300'
                  : 'bg-[#FFFDF7] border-[#FFE494]/80'
              }`}
            >
              <div className="flex-1 flex items-center gap-3">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#FFE494] text-sm font-semibold text-[#292929] focus:outline-none focus:border-[#FF8A1E] flex-1"
                />
                <input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => handleUpdateItem(item.id, 'qty', e.target.value)}
                  className="w-16 px-2.5 py-1.5 rounded-xl bg-white border border-[#FFE494] text-sm text-center text-[#292929] focus:outline-none focus:border-[#FF8A1E]"
                  title="Quantity"
                />
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-[#6B7280]">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => handleUpdateItem(item.id, 'price', e.target.value)}
                    className="w-24 px-3 py-1.5 rounded-xl bg-white border border-[#FFE494] text-sm font-bold text-[#292929] focus:outline-none focus:border-[#FF8A1E] text-right font-mono"
                  />
                </div>

                {item.confidence === 'low' && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Check OCR
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 rounded-lg text-[#6B7280] hover:text-red-500 hover:bg-[#FFF0E5] transition-colors cursor-pointer"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Item Form */}
        <form
          onSubmit={handleAddItem}
          className="p-4 rounded-2xl bg-[#FFFDF0] border border-[#FFE494] flex flex-col sm:flex-row items-center gap-3"
        >
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Add dish (e.g. Paneer Tikka)..."
            className="flex-1 w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-[#FFE494] text-sm text-[#292929] focus:outline-none focus:border-[#FF8A1E]"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="number"
              min="1"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              className="w-16 px-3 py-2 rounded-xl bg-white border border-[#FFE494] text-sm text-center font-mono"
              title="Quantity"
            />
            <input
              type="number"
              step="0.01"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              placeholder="Price ₹"
              className="w-24 px-3 py-2 rounded-xl bg-white border border-[#FFE494] text-sm font-bold font-mono"
            />
            <button
              type="submit"
              disabled={!newItemName.trim() || !newItemPrice}
              className="px-4 py-2 rounded-xl bg-[#009F93] hover:bg-[#00847A] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 shadow-teal cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* Section 4: Taxes, Service Charge, Discount & Math Check */}
        <div className="pt-6 border-t border-[#FFE494]/80 space-y-4">
          <h4 className="font-serif text-lg font-bold text-[#292929]">
            4. Taxes, Charges & Verification
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="block font-bold text-[#6B7280] mb-1">CGST (₹)</label>
              <input
                type="number"
                step="0.01"
                value={cgst}
                onChange={(e) => setCgst(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#FFFDF7] border border-[#FFE494] font-mono text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-[#6B7280] mb-1">SGST (₹)</label>
              <input
                type="number"
                step="0.01"
                value={sgst}
                onChange={(e) => setSgst(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#FFFDF7] border border-[#FFE494] font-mono text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-[#6B7280] mb-1">Service Chg (₹)</label>
              <input
                type="number"
                step="0.01"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#FFFDF7] border border-[#FFE494] font-mono text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-[#6B7280] mb-1">Discount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#FFFDF7] border border-[#FFE494] font-mono text-sm text-red-600"
              />
            </div>
            <div>
              <label className="block font-bold text-[#6B7280] mb-1">Round Off (₹)</label>
              <input
                type="number"
                step="0.01"
                value={roundOff}
                onChange={(e) => setRoundOff(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#FFFDF7] border border-[#FFE494] font-mono text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-[#FF8A1E] mb-1">Printed Total (₹)</label>
              <input
                type="number"
                step="0.01"
                value={printedTotal}
                onChange={(e) => setPrintedTotal(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#FF8A1E] font-mono font-bold text-sm text-[#FF8A1E]"
              />
            </div>
          </div>

          {/* Real-time Math Check Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs ${
              isMatch
                ? 'bg-[#E6F7F5] border-[#009F93]/40 text-[#009F93]'
                : 'bg-[#FFF0E5] border-[#FF8A1E] text-red-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {isMatch ? (
                <CheckCircle2 className="w-5 h-5 text-[#009F93] shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[#FF8A1E] shrink-0" />
              )}
              <div>
                <span className="font-bold block">
                  {isMatch ? 'Math Reconciled (No Jhol!)' : 'Math Discrepancy Detected'}
                </span>
                <span className="text-[11px] opacity-80">
                  Items ({formatRupees(itemsSubtotal)}) + Extras ({formatRupees(extrasTotal)}) ={' '}
                  <strong>{formatRupees(calculatedTotal)}</strong>
                  {!isMatch && ` vs Printed: ${formatRupees(printedTotal)} (Diff: ₹${diff})`}
                </span>
              </div>
            </div>

            <div className="font-serif text-lg font-bold">
              {formatRupees(calculatedTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* Save & Continue Button */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => navigate('/bills')}
          className="px-6 py-3 rounded-full bg-white hover:bg-[#FFF4D9] text-[#292929] font-bold text-sm border border-[#FFE494] cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSaveBill}
          disabled={isSaving || items.length === 0}
          className="px-8 py-3.5 rounded-full bg-[#009F93] hover:bg-[#00847A] disabled:opacity-40 text-white font-bold text-sm shadow-teal transition-all active:scale-95 cursor-pointer flex items-center gap-2"
        >
          {isSaving ? 'Saving Bill...' : 'Save & Choose Split Mode →'}
        </button>
      </div>
    </div>
  );
}
