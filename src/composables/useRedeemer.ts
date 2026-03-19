import { ref } from 'vue'
import axios from 'axios'

export interface RedeemResult {
  code: string
  status: 'pending' | 'loading' | 'success' | 'error'
  message?: string
}

export function useRedeemer() {
  const results = ref<RedeemResult[]>([])
  const isProcessing = ref(false)

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const redeemCodes = async (pid: string, codes: string[], useProxy: boolean = false) => {
    if (isProcessing.value) return
    isProcessing.value = true
    
    // Initialize results
    results.value = codes.map(code => ({
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
        
        // Netmarble API usually returns data in response.data
        // We'll assume success if no exception is thrown for now
        // Actual structure might need refinement based on real API response
        item.status = 'success'
        item.message = response.data?.msg || 'Redeemed successfully'
      } catch (error: any) {
        item.status = 'error'
        item.message = error.response?.data?.msg || error.message || 'Failed to redeem'
      }

      // Wait 1 second before next request (except for the last one)
      if (i < results.value.length - 1) {
        await delay(1000)
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
