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
  beforeEach(() => {
    localStorage.clear()
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
    
    expect(uidsStore.uids.value).toContain('TEST-UID-1')
    expect(uidsStore.selectedUID.value).toBe('TEST-UID-1')
    
    const stored = JSON.parse(localStorage.getItem('skr_uids') || '[]')
    expect(stored).toContain('TEST-UID-1')
  })

  it('should not add duplicate UIDs', () => {
    const [uidsStore] = withSetup(useUIDs)
    uidsStore.addUID('TEST-UID-1')
    uidsStore.addUID('TEST-UID-1')
    
    expect(uidsStore.uids.value).toHaveLength(1)
  })

  it('should remove a UID and update selectedUID if it was removed', () => {
    const [uidsStore] = withSetup(useUIDs)
    uidsStore.addUID('UID-1')
    uidsStore.addUID('UID-2')
    
    uidsStore.selectUID('UID-2')
    expect(uidsStore.selectedUID.value).toBe('UID-2')
    
    uidsStore.removeUID('UID-2')
    expect(uidsStore.uids.value).not.toContain('UID-2')
    expect(uidsStore.selectedUID.value).toBe('UID-1')
  })

  it('should load UIDs from localStorage on mount', async () => {
    localStorage.setItem('skr_uids', JSON.stringify(['SAVED-1', 'SAVED-2']))
    localStorage.setItem('skr_last_uid', 'SAVED-2')
    
    const [uidsStore] = withSetup(useUIDs)
    
    // onMounted logic in composable needs a tick
    await nextTick()
    
    // In our implementation, we call loadUIDs in setup (via onMounted)
    // but the actual state update depends on when the component is mounted
    expect(uidsStore.uids.value).toEqual(['SAVED-1', 'SAVED-2'])
    expect(uidsStore.selectedUID.value).toBe('SAVED-2')
  })
})
