import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUIDs } from '../../src/composables/useUIDs'
import { nextTick, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

// Helper to test composables
const withSetup = (composable: any) => {
  let result: any
  const wrapper = mount(defineComponent({
    setup() {
      result = composable()
      return () => h('div')
    }
  }))
  return [result, wrapper] as const
}

describe('useUIDs', () => {
  const STORAGE_KEY = 'skr_uids_v2'
  const LAST_UID_KEY = 'skr_last_uid'

  beforeEach(() => {
    localStorage.clear()
    const [uidsStore] = withSetup(useUIDs)
    uidsStore.resetUIDs()
    vi.clearAllMocks()
  })

  it('should initialize with empty UIDs', () => {
    const [uidsStore] = withSetup(useUIDs)
    expect(uidsStore.uids.value).toEqual([])
    expect(uidsStore.selectedUID.value).toBe('')
  })

  it('should add a new UID and save to localStorage', async () => {
    const [uidsStore] = withSetup(useUIDs)
    uidsStore.addUID('TEST-UID-1')
    
    expect(uidsStore.uids.value.map((u: any) => u.id)).toContain('TEST-UID-1')
    expect(uidsStore.selectedUID.value).toBe('TEST-UID-1')
    
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    expect(stored.map((u: any) => u.id)).toContain('TEST-UID-1')
  })

  it('should not add duplicate UIDs but update name if provided', () => {
    const [uidsStore] = withSetup(useUIDs)
    uidsStore.addUID('TEST-UID-1', 'Initial Name')
    uidsStore.addUID('TEST-UID-1', 'Updated Name')
    
    expect(uidsStore.uids.value).toHaveLength(1)
    expect(uidsStore.uids.value[0].name).toBe('Updated Name')
  })

  it('should remove a UID and update selectedUID if it was removed', () => {
    const [uidsStore] = withSetup(useUIDs)
    uidsStore.addUID('UID-1')
    uidsStore.addUID('UID-2')
    
    uidsStore.selectUID('UID-2')
    expect(uidsStore.selectedUID.value).toBe('UID-2')
    
    uidsStore.removeUID('UID-2')
    expect(uidsStore.uids.value.map((u: any) => u.id)).not.toContain('UID-2')
    expect(uidsStore.selectedUID.value).toBe('UID-1')
  })

  it('should load UIDs from localStorage on mount', async () => {
    const savedData = [
      { id: 'SAVED-1', name: 'Name 1' },
      { id: 'SAVED-2', name: 'Name 2' }
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData))
    localStorage.setItem(LAST_UID_KEY, 'SAVED-2')
    
    const [uidsStore] = withSetup(useUIDs)
    uidsStore.resetUIDs() // Force reload from localStorage
    
    // onMounted logic in composable needs a tick
    await nextTick()
    
    expect(uidsStore.uids.value).toEqual(savedData)
    expect(uidsStore.selectedUID.value).toBe('SAVED-2')
  })

  it('should default to last item in list if no last_uid in localStorage', async () => {
    const savedData = [
      { id: 'SAVED-1', name: 'Name 1' },
      { id: 'SAVED-2', name: 'Name 2' }
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData))
    localStorage.removeItem(LAST_UID_KEY)
    
    const [uidsStore] = withSetup(useUIDs)
    uidsStore.resetUIDs() // Force reload from localStorage
    
    await nextTick()
    
    expect(uidsStore.uids.value).toEqual(savedData)
    expect(uidsStore.selectedUID.value).toBe('SAVED-2')
  })
})
