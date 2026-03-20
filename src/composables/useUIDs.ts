import { ref } from 'vue'

export interface UIDRecord {
  id: string
  name: string
}

const STORAGE_KEY = 'skr_uids_v2'
const OLD_STORAGE_KEY = 'skr_uids'
const LAST_UID_KEY = 'skr_last_uid'

// Global state to persist across different components/calls
const uids = ref<UIDRecord[]>([])
const selectedUID = ref<string>('')
const isInitialized = ref(false)

const saveUIDs = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(uids.value))
}

const loadUIDs = () => {
  if (isInitialized.value) return
  
  // Migration logic
  const oldStored = localStorage.getItem(OLD_STORAGE_KEY)
  if (oldStored) {
    try {
      const oldUids: string[] = JSON.parse(oldStored)
      uids.value = oldUids.map(id => ({ id, name: '' }))
      saveUIDs()
      localStorage.removeItem(OLD_STORAGE_KEY)
    } catch (e) {}
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      uids.value = JSON.parse(stored)
    } catch (e) {
      uids.value = []
    }
  }
  
  const last = localStorage.getItem(LAST_UID_KEY)
  if (last && uids.value.some(u => u.id === last)) {
    selectedUID.value = last
  } else if (uids.value.length > 0) {
    selectedUID.value = uids.value[uids.value.length - 1].id
  }
  
  isInitialized.value = true
}

// Load immediately when this module is imported
if (typeof window !== 'undefined') {
  loadUIDs()
}

export function useUIDs() {
  const addUID = (id: string, name: string = '') => {
    const cleanID = id.trim()
    const cleanName = name.trim()
    if (cleanID) {
      const existingIndex = uids.value.findIndex(u => u.id === cleanID)
      if (existingIndex > -1) {
        uids.value[existingIndex].name = cleanName
      } else {
        uids.value.push({ id: cleanID, name: cleanName })
      }
      saveUIDs()
    }
    selectedUID.value = cleanID
    localStorage.setItem(LAST_UID_KEY, cleanID)
  }

  const removeUID = (id: string) => {
    uids.value = uids.value.filter(u => u.id !== id)
    saveUIDs()
    if (selectedUID.value === id) {
      selectedUID.value = uids.value[0]?.id || ''
      localStorage.setItem(LAST_UID_KEY, selectedUID.value)
    }
  }

  const selectUID = (id: string) => {
    selectedUID.value = id
    localStorage.setItem(LAST_UID_KEY, id)
  }

  const resetUIDs = () => {
    uids.value = []
    selectedUID.value = ''
    isInitialized.value = false
    loadUIDs()
  }

  return {
    uids,
    selectedUID,
    addUID,
    removeUID,
    selectUID,
    resetUIDs
  }
}
