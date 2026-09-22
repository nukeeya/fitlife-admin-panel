import React, { useState } from 'react';
import Modal from '../common/Modal';
import { getSmartSubstitutions, BANGLADESHI_FOODS } from '../../data/bangladeshiFoods';
import { RefreshCw, Check, Info } from 'lucide-react';

export default function FoodSubstitutionModal({
  isOpen,
  onClose,
  currentFoodItem,
  mealIndex,
  itemIndex,
  onSelectSubstitution,
}) {
  const [selectedSub, setSelectedSub] = useState(null);

  if (!currentFoodItem) return null;

  // Find base food ID or match by name
  let baseFoodId = currentFoodItem.foodId;
  if (!baseFoodId) {
    const match = BANGLADESHI_FOODS.find(
      (f) =>
        f.name.toLowerCase() === currentFoodItem.name?.toLowerCase() ||
        f.banglaName === currentFoodItem.banglaName
    );
    if (match) baseFoodId = match.id;
  }

  const substitutions = baseFoodId ? getSmartSubstitutions(baseFoodId) : [];

  const handleApply = () => {
    if (!selectedSub) return;
    onSelectSubstitution(mealIndex, itemIndex, selectedSub);
    setSelectedSub(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bangladeshi Food Smart Substitution"
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!selectedSub}
            onClick={handleApply}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Check size={16} />
            Apply Food Swap
          </button>
        </div>
      }
    >
      <div style={{ padding: '0.25rem 0' }}>
        {/* Currently Selected Food Card */}
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.08)',
          borderRadius: '10px',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          marginBottom: '1.25rem'
        }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', fontWeight: 700 }}>
            CURRENT FOOD ITEM TO SWAP
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {currentFoodItem.name} {currentFoodItem.banglaName ? `(${currentFoodItem.banglaName})` : ''}
            </h4>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {currentFoodItem.portionGrams}g ({currentFoodItem.servingDesc || `${currentFoodItem.portionGrams}g`})
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <span>Calories: <strong style={{ color: 'var(--text-main)' }}>{currentFoodItem.calories} kcal</strong></span>
            <span>•</span>
            <span>Protein: <strong style={{ color: '#10b981' }}>{currentFoodItem.protein}g</strong></span>
            <span>•</span>
            <span>Carbs: <strong style={{ color: '#3b82f6' }}>{currentFoodItem.carbs}g</strong></span>
            <span>•</span>
            <span>Fat: <strong style={{ color: '#f59e0b' }}>{currentFoodItem.fat}g</strong></span>
          </div>
        </div>

        {/* Guidance Notice */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0.65rem 0.9rem',
          background: 'var(--bg-main)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '1rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <Info size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
          <span>
            Portion sizes below are dynamically calculated to match caloric and macronutrient parity with the original food item.
          </span>
        </div>

        {/* Substitution Choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto' }}>
          {substitutions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No alternative substitutions mapped for this specific food. You can choose any staple from the Bangladeshi food database.
            </div>
          ) : (
            substitutions.map((sub) => {
              const isSelected = selectedSub?.id === sub.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSub(sub)}
                  style={{
                    padding: '0.9rem 1.1rem',
                    borderRadius: '10px',
                    border: isSelected
                      ? '2px solid var(--primary)'
                      : '1px solid var(--border-color)',
                    background: isSelected
                      ? 'rgba(239, 68, 68, 0.06)'
                      : 'var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 2px 10px rgba(239, 68, 68, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {sub.name} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({sub.banglaName})</span>
                      </span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {sub.rationale}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#10b981',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}>
                        {sub.portionGrams}g ({sub.servingDesc})
                      </span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '8px',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.8rem'
                  }}>
                    <span>Calories: <strong>{sub.calories} kcal</strong></span>
                    <span>Protein: <strong style={{ color: '#10b981' }}>{sub.protein}g</strong></span>
                    <span>Carbs: <strong style={{ color: '#3b82f6' }}>{sub.carbs}g</strong></span>
                    <span>Fat: <strong style={{ color: '#f59e0b' }}>{sub.fat}g</strong></span>
                    <span>Fiber: <strong>{sub.fiber}g</strong></span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
