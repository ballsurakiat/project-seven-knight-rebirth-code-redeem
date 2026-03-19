import { ref, watch, onMounted } from 'vue'

const STORAGE_KEY = 'skr_uids'
const LAST_UID_KEY = 'skr_last_uid'

export function useUIDs() {
  const uids = ref<string[]>([])
  const selectedUID = ref<string>('')

  const loadUIDs = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        uids.value = JSON.parse(stored)
      } catch (e) {
        uids.value = []
      }
    }
    
    const last = localStorage.getItem(LAST_UID_KEY)
    if (last) {
      selectedUID.value = last
    }
  }

  const saveUIDs = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uids.value))
  }

  const addUID = (uid: string) => {
    const cleanUID = uid.trim()
    if (cleanUID && !uids.value.includes(cleanUID)) {
      uids.value.push(cleanUID)
      saveUIDs()
    }
    selectedUID.value = cleanUID
    localStorage.setItem(LAST_UID_KEY, cleanUID)
  }

  const removeUID = (uid: string) => {
    uids.value = uids.value.filter(u => u !== uid)
    saveUIDs()
    if (selectedUID.value === uid) {
      selectedUID.value = uids.value[0] || ''
      localStorage.setItem(LAST_UID_KEY, selectedUID.value)
    }
  }

  const selectUID = (uid: string) => {
    selectedUID.value = uid
    localStorage.setItem(LAST_UID_KEY, uid)
  }

  onMounted(loadUIDs)

  return {
    uids,
    selectedUID,
    addUID,
    removeUID,
    selectUID
  }
}
