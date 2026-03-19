import { ref } from 'vue'
import axios from 'axios'

export interface RedeemResult {
  code: string
  status: 'pending' | 'loading' | 'success' | 'error'
  message?: string
}

const MAX_CODES_PER_BATCH = 50;

export function useRedeemer() {
  const results = ref<RedeemResult[]>([])
  const isProcessing = ref(false)

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const redeemCodes = async (pid: string, codes: string[], useProxy: boolean = false) => {
    if (isProcessing.value) return
    isProcessing.value = true
    
    // Safety: Limit total codes to prevent misuse as a DDoS tool
    const safeCodes = codes.slice(0, MAX_CODES_PER_BATCH);
    
    // Initialize results
    results.value = safeCodes.map(code => ({
      code,
      status: 'pending'
    }))

    for (let i = 0; i < results.value.length; i++) {
      const item = results.value[i]
      item.status = 'loading'

      try {
        let url = `https://coupon.netmarble.com/api/coupon/reward?gameCode=tskgb&couponCode=${item.code}&langCd=TH_TH&pid=${pid}`
        
        // Use proxy if enabled (for production)
        if (useProxy) {
          url = `https://corsproxy.io/?${encodeURIComponent(url)}`
        } else if (import.meta.env.DEV) {
          // In development, use Vite's proxy automatically if not using external proxy
          url = `/api/coupon/reward?gameCode=tskgb&couponCode=${item.code}&langCd=TH_TH&pid=${pid}`
        }

        const response = await axios.get(url)
        
        item.status = 'success'
        item.message = response.data?.msg || 'สำเร็จแล้วจ้า'
      } catch (error: any) {
        item.status = 'error'
        item.message = error.response?.data?.msg || error.message || 'เกิดข้อผิดพลาด'
      }

      // Variable delay (1000ms - 2500ms) to look more like human behavior
      if (i < results.value.length - 1) {
        const jitter = Math.floor(Math.random() * 1500) + 1000;
        await delay(jitter)
      }
    }

    isProcessing.value = false
  }

  return {
    results,
    isProcessing,
    redeemCodes
  }
}
