import { deleteCategory, saveCategory } from "./actions"
import type { GemCategory } from "@/types/stone"

export function AdminCategories({ categories }: { categories: GemCategory[] }) {
  return <div className="admin-categories">
    <form action={saveCategory.bind(null, null)} className="admin-panel grid content-start gap-4 p-5">
      <h3>Add category</h3>
      <label className="grid gap-1">Name
        <input className="admin-field" name="name" maxLength={80} required />
      </label>
      <label className="grid gap-1">URL slug
        <input className="admin-field" name="slug" pattern="[a-z0-9]+(?:\x2d[a-z0-9]+)*" maxLength={80} required />
        <span className="admin-muted text-sm">Use lowercase letters, numbers and hyphens.</span>
      </label>
      <button type="submit" className="admin-button admin-button-primary w-fit">Add category</button>
    </form>
    <ul className="admin-ledger">
      {categories.map(({ slug, name, is_builtin }) => <li key={slug} className="admin-panel grid gap-2 p-4">
        <form action={saveCategory.bind(null, slug)} className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-0 flex-1 gap-1">Name <span className="sr-only">for {slug}</span>
            <input className="admin-field" name="name" defaultValue={name} maxLength={80} required />
          </label>
          <button type="submit" className="admin-button">Save name</button>
        </form>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="admin-muted wrap-anywhere text-sm">{slug}{is_builtin && " · Built-in"}</p>
          {!is_builtin && <details className="admin-delete">
            <summary>Delete category</summary>
            <form action={deleteCategory.bind(null, slug)} className="mt-2 grid gap-2">
              <p className="text-sm">Only categories without products can be deleted.</p>
              <button type="submit" className="admin-button admin-button-danger w-fit">Confirm delete</button>
            </form>
          </details>}
        </div>
      </li>)}
    </ul>
  </div>
}
