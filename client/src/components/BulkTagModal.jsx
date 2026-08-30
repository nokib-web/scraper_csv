import React, { useState, useMemo } from 'react';
import { X, Tag, Plus, Check, Trash2, Sparkles } from 'lucide-react';

export default function BulkTagModal({ 
  isOpen, 
  onClose, 
  selectedProductIds = [], 
  products = [], 
  onApplyAddTags, 
  onApplyRemoveTag 
}) {
  const [newTagInput, setNewTagInput] = useState('');
  const [feedback, setFeedback] = useState('');

  // Selected products list
  const selectedProducts = useMemo(() => {
    const set = new Set(selectedProductIds);
    return products.filter(p => set.has(p.id));
  }, [selectedProductIds, products]);

  // Aggregate all unique tags currently existing across selected products
  const currentTagsSummary = useMemo(() => {
    const tagCountMap = new Map();
    for (const prod of selectedProducts) {
      const tagsList = Array.isArray(prod.tags) ? prod.tags : (typeof prod.tags === 'string' ? prod.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
      for (const t of tagsList) {
        tagCountMap.set(t, (tagCountMap.get(t) || 0) + 1);
      }
    }
    return Array.from(tagCountMap.entries()).map(([tag, count]) => ({ tag, count }));
  }, [selectedProducts]);

  const quickTagPresets = [
    'Summer-Sale', 'Trending', 'Best-Seller', 'New-Arrival', 'Featured', 'Hot-Deal', 'Discount', 'Limited-Edition'
  ];

  if (!isOpen || selectedProducts.length === 0) return null;

  const handleAddTagsSubmit = (e) => {
    if (e) e.preventDefault();
    if (!newTagInput.trim()) return;

    const tagsToAdd = newTagInput
      .split(/[,;]+/)
      .map(t => t.trim())
      .filter(Boolean);

    if (tagsToAdd.length === 0) return;

    onApplyAddTags(selectedProductIds, tagsToAdd);
    setNewTagInput('');
    setFeedback(`Added ${tagsToAdd.length} tag(s) to ${selectedProducts.length} product(s)!`);
    setTimeout(() => setFeedback(''), 2000);
  };

  const handleAddQuickTag = (tag) => {
    onApplyAddTags(selectedProductIds, [tag]);
    setFeedback(`Added tag "${tag}" to ${selectedProducts.length} product(s)!`);
    setTimeout(() => setFeedback(''), 2000);
  };

  const handleRemoveTag = (tag) => {
    onApplyRemoveTag(selectedProductIds, tag);
    setFeedback(`Removed tag "${tag}" from selected products!`);
    setTimeout(() => setFeedback(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#121216] border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#F1FF0A]/10 border border-[#F1FF0A]/30 text-[#8b9900] dark:text-[#F1FF0A]">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                Manage Tags for Selected Products
              </h3>
              <p className="text-[11px] text-neutral-500">
                Applying to <strong className="text-neutral-900 dark:text-white font-bold">{selectedProducts.length}</strong> selected product(s) (existing tags are preserved)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Add New Tags Input */}
          <form onSubmit={handleAddTagsSubmit} className="space-y-2">
            <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
              <span>Add New Tag(s):</span>
              <span className="text-[10px] text-neutral-400 font-normal">Separate multiple tags with comma</span>
            </label>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="e.g. Summer-Sale, Trending, New-Arrival"
                  className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:border-[#F1FF0A] text-xs font-semibold"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!newTagInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#F1FF0A] hover:bg-[#D4FF00] disabled:opacity-40 text-black font-extrabold rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Tags</span>
              </button>
            </div>
          </form>

          {/* Quick Preset Tag Suggestions */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#8b9900] dark:text-[#F1FF0A]" />
              <span>Quick Preset Suggestions:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickTagPresets.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddQuickTag(tag)}
                  className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-[#F1FF0A] hover:text-black border border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Existing Tags on Selected Products with Remove option */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
            <span className="font-bold text-neutral-700 dark:text-neutral-300 block text-xs">
              Existing Tags on Selected Products:
            </span>

            {currentTagsSummary.length === 0 ? (
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 text-neutral-400 text-center text-[11px]">
                No tags currently attached to selected products. Add some above!
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                {currentTagsSummary.map(({ tag, count }) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                  >
                    <span>{tag}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 dark:bg-neutral-900 text-neutral-500 font-mono">
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                      title={`Remove tag "${tag}" from selected products`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feedback Toast */}
          {feedback && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2 text-xs">
              <Check className="w-4 h-4" />
              <span>{feedback}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#F1FF0A] hover:bg-[#D4FF00] text-black font-extrabold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
