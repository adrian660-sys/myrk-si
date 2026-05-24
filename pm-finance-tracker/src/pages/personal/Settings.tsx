import { useState } from 'react';
import { usePersonalFinanceData } from '../../hooks/usePersonalFinanceData';
import { notifyPersonalChanged, PT } from '../../lib/personal/tables';
import { personalSubcategoriesForCategory } from '../../lib/personal/lookups';
import { supabase } from '../../lib/supabase';
import type {
  PersonalCategory,
  PersonalCategoryType,
  PersonalFundingSource,
  PersonalSubcategory,
} from '../../lib/personal/types';
export default function PersonalSettings() {
  const { categories, subcategories, fundingSources, reload } = usePersonalFinanceData();

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted">Manage categories, subcategories, and funding sources</p>
      </header>

      <FundingSourcesSection sources={fundingSources} onChanged={reload} />
      <CategoriesSection
        categories={categories}
        subcategories={subcategories}
        onChanged={reload}
      />
    </div>
  );
}

function FundingSourcesSection({
  sources,
  onChanged,
}: {
  sources: PersonalFundingSource[];
  onChanged: () => void;
}) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!newName.trim()) return;
    setError(null);
    const { error: err } = await supabase.from(PT.funding_sources).insert({ name: newName.trim() });
    if (err) setError(err.message);
    else {
      setNewName('');
      notifyPersonalChanged();
      onChanged();
    }
  }

  async function save(id: string) {
    if (!editName.trim()) return;
    const { error: err } = await supabase.from(PT.funding_sources).update({ name: editName.trim() }).eq('id', id);
    if (err) setError(err.message);
    else {
      setEditingId(null);
      notifyPersonalChanged();
      onChanged();
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this funding source? Transactions using it may block deletion.')) return;
    const { error: err } = await supabase.from(PT.funding_sources).delete().eq('id', id);
    if (err) alert(err.message);
    else {
      notifyPersonalChanged();
      onChanged();
    }
  }

  return (
    <section className="card-pad space-y-4">
      <h2 className="font-semibold">Funding sources</h2>
      <ul className="space-y-2">
        {sources.map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            {editingId === s.id ? (
              <>
                <input className="input flex-1" value={editName} onChange={(e) => setEditName(e.target.value)} />
                <button className="btn-primary text-xs" onClick={() => save(s.id)}>Save</button>
                <button className="btn-secondary text-xs" onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1">{s.name}</span>
                <button
                  className="btn-secondary text-xs"
                  onClick={() => {
                    setEditingId(s.id);
                    setEditName(s.name);
                  }}
                >
                  Rename
                </button>
                <button className="btn-danger text-xs" onClick={() => remove(s.id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="New source name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn-primary" onClick={add}>Add</button>
      </div>
      {error && <p className="text-sm text-expense">{error}</p>}
    </section>
  );
}

function CategoriesSection({
  categories,
  subcategories,
  onChanged,
}: {
  categories: PersonalCategory[];
  subcategories: PersonalSubcategory[];
  onChanged: () => void;
}) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<PersonalCategoryType>('expense');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function addCategory() {
    if (!newCatName.trim()) return;
    const { error: err } = await supabase
      .from(PT.categories)
      .insert({ name: newCatName.trim(), type: newCatType });
    if (err) setError(err.message);
    else {
      setNewCatName('');
      notifyPersonalChanged();
      onChanged();
    }
  }

  async function renameCategory(id: string) {
    const { error: err } = await supabase.from(PT.categories).update({ name: editCatName.trim() }).eq('id', id);
    if (err) setError(err.message);
    else {
      setEditingCatId(null);
      notifyPersonalChanged();
      onChanged();
    }
  }

  async function deleteCategory(id: string) {
    if (!window.confirm('Delete category and all its subcategories?')) return;
    const { error: err } = await supabase.from(PT.categories).delete().eq('id', id);
    if (err) alert(err.message);
    else {
      notifyPersonalChanged();
      onChanged();
    }
  }

  async function addSubcategory(categoryId: string) {
    if (!newSubName.trim()) return;
    const { error: err } = await supabase
      .from(PT.subcategories)
      .insert({ category_id: categoryId, name: newSubName.trim() });
    if (err) setError(err.message);
    else {
      setNewSubName('');
      notifyPersonalChanged();
      onChanged();
    }
  }

  async function renameSubcategory(id: string, name: string) {
    const { error: err } = await supabase.from(PT.subcategories).update({ name }).eq('id', id);
    if (err) alert(err.message);
    else {
      notifyPersonalChanged();
      onChanged();
    }
  }

  async function deleteSubcategory(id: string) {
    if (!window.confirm('Delete subcategory?')) return;
    const { error: err } = await supabase.from(PT.subcategories).delete().eq('id', id);
    if (err) alert(err.message);
    else {
      notifyPersonalChanged();
      onChanged();
    }
  }

  const grouped = ['expense', 'income', 'transfer'] as const;

  return (
    <section className="card-pad space-y-4">
      <h2 className="font-semibold">Categories & subcategories</h2>

      {grouped.map((type) => {
        const cats = categories.filter((c) => c.type === type);
        if (cats.length === 0) return null;
        return (
          <div key={type}>
            <h3 className="text-xs uppercase tracking-wide text-muted mb-2">{type}</h3>
            <ul className="space-y-3">
              {cats.map((cat) => {
                const subs = personalSubcategoriesForCategory(cat.id, subcategories);
                const expanded = expandedId === cat.id;
                return (
                  <li key={cat.id} className="border border-line rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      {editingCatId === cat.id ? (
                        <>
                          <input
                            className="input flex-1"
                            value={editCatName}
                            onChange={(e) => setEditCatName(e.target.value)}
                          />
                          <button className="btn-primary text-xs" onClick={() => renameCategory(cat.id)}>
                            Save
                          </button>
                          <button className="btn-secondary text-xs" onClick={() => setEditingCatId(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="flex-1 text-left font-medium"
                            onClick={() => setExpandedId(expanded ? null : cat.id)}
                          >
                            {expanded ? '▼' : '▶'} {cat.name}
                            <span className="text-muted text-xs ml-2">({subs.length} sub)</span>
                          </button>
                          <button
                            className="btn-secondary text-xs"
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setEditCatName(cat.name);
                            }}
                          >
                            Rename
                          </button>
                          <button className="btn-danger text-xs" onClick={() => deleteCategory(cat.id)}>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                    {expanded && (
                      <div className="mt-3 pl-4 space-y-2 border-l-2 border-line">
                        {subs.map((sub) => (
                          <SubcategoryRow
                            key={sub.id}
                            sub={sub}
                            onRename={(name) => renameSubcategory(sub.id, name)}
                            onDelete={() => deleteSubcategory(sub.id)}
                          />
                        ))}
                        <div className="flex gap-2">
                          <input
                            className="input flex-1 text-sm"
                            placeholder="New subcategory"
                            value={expandedId === cat.id ? newSubName : ''}
                            onChange={(e) => setNewSubName(e.target.value)}
                          />
                          <button
                            className="btn-secondary text-xs"
                            onClick={() => addSubcategory(cat.id)}
                          >
                            Add sub
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <div className="border-t border-line pt-4 space-y-2">
        <h3 className="text-xs uppercase tracking-wide text-muted">Add category</h3>
        <div className="flex flex-wrap gap-2">
          <input
            className="input flex-1 min-w-[140px]"
            placeholder="Category name"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
          />
          <select
            className="input w-auto"
            value={newCatType}
            onChange={(e) => setNewCatType(e.target.value as PersonalCategoryType)}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </select>
          <button className="btn-primary" onClick={addCategory}>Add category</button>
        </div>
      </div>
      {error && <p className="text-sm text-expense">{error}</p>}
    </section>
  );
}

function SubcategoryRow({
  sub,
  onRename,
  onDelete,
}: {
  sub: PersonalSubcategory;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sub.name);

  return (
    <div className="flex items-center gap-2 text-sm">
      {editing ? (
        <>
          <input className="input flex-1" value={name} onChange={(e) => setName(e.target.value)} />
          <button
            className="btn-primary text-xs"
            onClick={() => {
              onRename(name.trim());
              setEditing(false);
            }}
          >
            Save
          </button>
          <button className="btn-secondary text-xs" onClick={() => setEditing(false)}>Cancel</button>
        </>
      ) : (
        <>
          <span className="flex-1">{sub.name}</span>
          <button className="btn-secondary text-xs" onClick={() => setEditing(true)}>Rename</button>
          <button className="btn-danger text-xs" onClick={onDelete}>Delete</button>
        </>
      )}
    </div>
  );
}
