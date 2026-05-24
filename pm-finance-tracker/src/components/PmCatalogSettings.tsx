import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyCatalogChanged } from '../hooks/useFinanceData';
import type { PmCategoryRow, PmSubcategoryRow } from '../lib/categoryCatalog';
import { supabase } from '../lib/supabase';

interface Props {
  categories: PmCategoryRow[];
  subcategories: PmSubcategoryRow[];
  onChanged: () => void;
}

export default function PmCatalogSettings({ categories, subcategories, onChanged }: Props) {
  const { t } = useTranslation();
  const [newCatName, setNewCatName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sorted = [...categories].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
  );

  async function renameCategoryOnTransactions(oldName: string, newName: string) {
    await supabase.from('transactions').update({ category: newName }).eq('category', oldName);
    await supabase.from('planned_transactions').update({ category: newName }).eq('category', oldName);
  }

  async function renameSubcategoryOnTransactions(
    categoryName: string,
    oldSub: string,
    newSub: string
  ) {
    await supabase.from('transactions').update({ subcategory: newSub })
      .eq('category', categoryName).eq('subcategory', oldSub);
    await supabase.from('planned_transactions').update({ subcategory: newSub })
      .eq('category', categoryName).eq('subcategory', oldSub);
  }

  async function addCategory() {
    if (!newCatName.trim()) return;
    setError(null);
    const maxOrder = sorted.reduce((m, c) => Math.max(m, c.sort_order), 0);
    const { error: err } = await supabase.from('pm_categories').insert({
      name: newCatName.trim(),
      sort_order: maxOrder + 1,
    });
    if (err) setError(err.message);
    else {
      setNewCatName('');
      notifyCatalogChanged();
      onChanged();
    }
  }

  async function renameCategory(id: string, oldName: string) {
    const name = editCatName.trim();
    if (!name) return;
    const { error: err } = await supabase.from('pm_categories').update({ name }).eq('id', id);
    if (err) {
      setError(err.message);
      return;
    }
    if (name !== oldName) await renameCategoryOnTransactions(oldName, name);
    setEditingCatId(null);
    notifyCatalogChanged();
    onChanged();
  }

  async function deleteCategory(id: string, name: string) {
    if (!window.confirm(t('settings.confirmDeleteCategory', { name }))) return;
    const { count } = await supabase.from('transactions').select('id', { count: 'exact', head: true })
      .eq('category', name);
    if (count && count > 0) {
      alert(t('settings.categoryInUse', { count }));
      return;
    }
    const { error: err } = await supabase.from('pm_categories').delete().eq('id', id);
    if (err) alert(err.message);
    else {
      notifyCatalogChanged();
      onChanged();
    }
  }

  async function addSubcategory(categoryId: string) {
    if (!newSubName.trim()) return;
    const { error: err } = await supabase.from('pm_subcategories').insert({
      category_id: categoryId,
      name: newSubName.trim(),
    });
    if (err) setError(err.message);
    else {
      setNewSubName('');
      notifyCatalogChanged();
      onChanged();
    }
  }

  async function renameSubcategory(
    id: string,
    categoryName: string,
    oldName: string,
    newName: string
  ) {
    const { error: err } = await supabase.from('pm_subcategories').update({ name: newName }).eq('id', id);
    if (err) alert(err.message);
    else {
      if (newName !== oldName) await renameSubcategoryOnTransactions(categoryName, oldName, newName);
      notifyCatalogChanged();
      onChanged();
    }
  }

  async function deleteSubcategory(id: string) {
    if (!window.confirm(t('settings.confirmDeleteSubcategory'))) return;
    const { error: err } = await supabase.from('pm_subcategories').delete().eq('id', id);
    if (err) alert(err.message);
    else {
      notifyCatalogChanged();
      onChanged();
    }
  }

  if (categories.length === 0) {
    return (
      <section className="card-pad space-y-3">
        <h2 className="font-semibold">{t('settings.categories')}</h2>
        <p className="text-sm text-muted">{t('settings.runMigration0007')}</p>
      </section>
    );
  }

  return (
    <section className="card-pad space-y-4">
      <h2 className="font-semibold">{t('settings.categories')}</h2>
      <p className="text-sm text-muted">{t('settings.categoriesHint')}</p>

      <ul className="space-y-3">
        {sorted.map((cat) => {
          const subs = subcategories.filter((s) => s.category_id === cat.id);
          const expanded = expandedId === cat.id;
          return (
            <li key={cat.id} className="border border-line rounded-lg p-3">
              <div className="flex items-center gap-2">
                {editingCatId === cat.id ? (
                  <>
                    <input className="input flex-1" value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)} />
                    <button className="btn-primary text-xs" type="button"
                      onClick={() => renameCategory(cat.id, cat.name)}>{t('common.save')}</button>
                    <button className="btn-secondary text-xs" type="button"
                      onClick={() => setEditingCatId(null)}>{t('common.cancel')}</button>
                  </>
                ) : (
                  <>
                    <button type="button" className="flex-1 text-left font-medium"
                      onClick={() => setExpandedId(expanded ? null : cat.id)}>
                      {expanded ? '▼' : '▶'} {cat.name}
                      <span className="text-muted text-xs ml-2">({subs.length})</span>
                    </button>
                    <button className="btn-secondary text-xs" type="button"
                      onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); }}>
                      {t('common.edit')}
                    </button>
                    <button className="btn-danger text-xs" type="button"
                      onClick={() => deleteCategory(cat.id, cat.name)}>{t('common.delete')}</button>
                  </>
                )}
              </div>
              {expanded && (
                <div className="mt-3 pl-4 space-y-2 border-l-2 border-line">
                  {subs.map((sub) => (
                    <SubRow
                      key={sub.id}
                      sub={sub}
                      onRename={(newName) => renameSubcategory(sub.id, cat.name, sub.name, newName)}
                      onDelete={() => deleteSubcategory(sub.id)}
                    />
                  ))}
                  <div className="flex gap-2">
                    <input className="input flex-1 text-sm" placeholder={t('settings.newSubcategory')}
                      value={expandedId === cat.id ? newSubName : ''}
                      onChange={(e) => setNewSubName(e.target.value)} />
                    <button className="btn-secondary text-xs" type="button"
                      onClick={() => addSubcategory(cat.id)}>{t('settings.addSub')}</button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex gap-2 border-t border-line pt-4">
        <input className="input flex-1" placeholder={t('settings.newCategory')}
          value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
        <button className="btn-primary" type="button" onClick={addCategory}>{t('settings.addCategory')}</button>
      </div>
      {error && <p className="text-sm text-expense">{error}</p>}
    </section>
  );
}

function SubRow({
  sub,
  onRename,
  onDelete,
}: {
  sub: PmSubcategoryRow;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sub.name);

  return (
    <div className="flex items-center gap-2 text-sm">
      {editing ? (
        <>
          <input className="input flex-1" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn-primary text-xs" type="button"
            onClick={() => { onRename(name.trim()); setEditing(false); }}>{t('common.save')}</button>
          <button className="btn-secondary text-xs" type="button"
            onClick={() => setEditing(false)}>{t('common.cancel')}</button>
        </>
      ) : (
        <>
          <span className="flex-1">{sub.name}</span>
          <button className="btn-secondary text-xs" type="button"
            onClick={() => setEditing(true)}>{t('common.edit')}</button>
          <button className="btn-danger text-xs" type="button" onClick={onDelete}>{t('common.delete')}</button>
        </>
      )}
    </div>
  );
}
