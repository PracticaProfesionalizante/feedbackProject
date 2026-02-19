import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export type TabValue = 'received' | 'sent'

const DEFAULT_LIMIT = 10

type QueryMap = Record<string, string | number | undefined>

function omitEmpty(q: QueryMap): QueryMap {
  const out: QueryMap = {}
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === '') continue
    out[k] = v
  }
  return out
}

/**
 * Composable para filtros y paginación de feedbacks.
 * - Sincroniza con query params de la URL (tab, type, status, search, dateFrom, dateTo, page, limit).
 * - Al cambiar de tab, resetea filtros y page a 1.
 * - Mantiene filtros al navegar back (están en la URL).
 */
export function useFeedbackFilters() {
  const route = useRoute()
  const router = useRouter()

  const query = computed<QueryMap>(() => {
    const q = (route.query || {}) as Record<string, string>
    return {
      tab: q.tab === 'sent' ? 'sent' : 'received',
      search: (q.search ?? '').trim() || undefined,
      dateFrom: q.dateFrom || undefined,
      dateTo: q.dateTo || undefined,
      userId: q.userId || undefined,
      page: Math.max(1, parseInt(String(q.page || '1'), 10) || 1),
      limit: Math.max(1, Math.min(100, parseInt(String(q.limit || DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)),
    }
  })

  const tab = computed<TabValue>(() => query.value.tab as TabValue)
  const search = computed<string>(() => (query.value.search as string) ?? '')
  const dateFrom = computed<string>(() => (query.value.dateFrom as string) ?? '')
  const dateTo = computed<string>(() => (query.value.dateTo as string) ?? '')
  const userId = computed<string | undefined>(() => query.value.userId as string | undefined)
  const page = computed<number>(() => query.value.page as number)
  const limit = computed<number>(() => query.value.limit as number)

  const hasActiveFilters = computed(() => {
    return !!(
      (query.value.search && String(query.value.search).trim()) ||
      query.value.dateFrom ||
      query.value.dateTo ||
      query.value.userId
    )
  })

  function updateQuery(partial: QueryMap) {
    const current = { ...query.value }
    const next = omitEmpty({ ...current, ...partial })
    if (JSON.stringify(next) === JSON.stringify(omitEmpty(current))) return
    const q: Record<string, string> = {}
    for (const [k, v] of Object.entries(next)) {
      if (v !== undefined && v !== null) q[k] = String(v)
    }
    router.replace({ path: route.path, query: q })
  }

  function setTab(value: TabValue) {
    updateQuery({
      tab: value,
      search: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      userId: undefined,
      page: 1,
    })
  }

  function setUserId(value: string | undefined) {
    updateQuery({
      userId: value || undefined,
      page: 1,
    })
  }

  function setSearch(value: string) {
    updateQuery({
      search: value.trim() || undefined,
      page: 1,
    })
  }

  function setDateRange(from: string, to: string) {
    updateQuery({
      dateFrom: from || undefined,
      dateTo: to || undefined,
      page: 1,
    })
  }

  function setPage(value: number) {
    updateQuery({ page: Math.max(1, value) })
  }

  function clearFilters() {
    updateQuery({
      search: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      userId: undefined,
      page: 1,
    })
  }

  const apiFilters = computed(() => ({
    type: tab.value,
    search: search.value || undefined,
    dateFrom: dateFrom.value || undefined,
    dateTo: dateTo.value || undefined,
    userId: userId.value || undefined,
    page: page.value,
    limit: limit.value,
  }))

  return {
    tab,
    search,
    dateFrom,
    dateTo,
    userId,
    page,
    limit,
    hasActiveFilters,
    apiFilters,
    setTab,
    setSearch,
    setUserId,
    setDateRange,
    setPage,
    clearFilters,
    updateQuery,
  }
}
