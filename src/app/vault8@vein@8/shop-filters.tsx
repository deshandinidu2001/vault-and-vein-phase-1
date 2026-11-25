import { configurableShopOptions, shopFilterControls, type ShopFilterConfig, type ShopFilterKey } from "@/lib/shop-filter-config"
import { addGemType, addShopFilterOption, setCategoryVisibility, setShopFilterVisibility } from "./actions"

function Visibility({ filter, value = "", label, visible }: { filter: ShopFilterKey; value?: string; label: string; visible: boolean }) {
  const action = filter === "type" && value
    ? setCategoryVisibility.bind(null, value, !visible)
    : setShopFilterVisibility.bind(null, filter, value, !visible)
  return <form action={action}>
    <button className="admin-button" type="submit" aria-label={`${visible ? "Hide" : "Show"} ${label}`}>
      {visible ? "Hide" : "Show"}
    </button>
  </form>
}

export function AdminShopFilters({ controls, options, ready }: ShopFilterConfig & { ready: boolean }) {
  if (!ready) return <p className="admin-notice">Apply the Prisma migrations to manage these controls.</p>
  return <div className="grid gap-4">
    <p className="admin-muted max-w-none">Hiding an individual Gem type also hides its listings. Hide the whole Gem type filter to remove just the dropdown.</p>
    <div className="grid items-start gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {(Object.keys(shopFilterControls) as ShopFilterKey[]).map((filter) => {
        const label = shopFilterControls[filter]
        const choices = filter in options ? options[filter as keyof typeof options] : []
        const canAdd = filter === "type" || configurableShopOptions.some((entry) => entry === filter)
        return <section key={filter} aria-labelledby={`filter-${filter}`} className="admin-panel grid min-w-0 overflow-hidden">
          <div className="admin-category-row">
            <div>
              <h3 id={`filter-${filter}`}>{label}</h3>
              <p className="admin-muted text-sm">{controls[filter] ? "Filter visible" : "Filter hidden"}</p>
            </div>
            <Visibility filter={filter} label={label + " filter"} visible={controls[filter]} />
          </div>
          {(choices.length > 0 || canAdd) && <details className="mx-4 mb-3 border-t border-current/15 pb-1">
            <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold">Manage options ({choices.length})</summary>
            <ul className="grid gap-2">
              {choices.map(({ value, label: option, isVisible }) => <li key={value} className="flex flex-wrap items-center justify-between gap-2 border-b border-current/15 pb-2">
                <div className="min-w-0">
                  <span className="wrap-anywhere font-semibold">{option}</span>
                  <p className="admin-muted text-sm">{isVisible ? "Visible" : "Hidden"}</p>
                </div>
                <Visibility filter={filter} value={value} label={`${label} option ${option}`} visible={isVisible} />
              </li>)}
            </ul>
            {canAdd && <form action={filter === "type" ? addGemType : addShopFilterOption.bind(null, filter)} className="mt-3 grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="grid gap-1 text-sm font-semibold">{filter === "type" ? "New gem type" : "New " + label.toLowerCase() + " option"}
                <input className="admin-field" type="text" name="label" required maxLength={filter === "type" || filter === "collection" ? 80 : 120} />
              </label>
              <button className="admin-button admin-button-primary w-fit" type="submit">{filter === "type" ? "Add gem type" : "Add option"}</button>
            </form>}
          </details>}
        </section>
      })}
    </div>
  </div>
}
