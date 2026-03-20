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
  const shouldStop = ref(false)

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const stopRedeeming = () => {
    if (isProcessing.value) {
      shouldStop.value = true
    }
  }

  const redeemCodes = async (pid: string, codes: string[]) => {
    if (isProcessing.value) return
    isProcessing.value = true
    shouldStop.value = false
    
    try {
      // Safety: Limit total codes to prevent misuse as a DDoS tool
      const safeCodes = codes.slice(0, MAX_CODES_PER_BATCH);
      
      // Initialize results
      results.value = safeCodes.map(code => ({
        code,
        status: 'pending'
      }))

      for (let i = 0; i < results.value.length; i++) {
        if (shouldStop.value) {
          // Mark remaining as pending/stopped
          for (let j = i; j < results.value.length; j++) {
            results.value[j].status = 'pending'
            results.value[j].message = 'หยุดการทำงานโดยผู้ใช้'
          }
          break
        }

        const item = results.value[i]
        item.status = 'loading'

        try {
          const url = `/api/coupon/reward?gameCode=tskgb&couponCode=${item.code}&langCd=TH_TH&pid=${pid}`
          const response = await axios.get(url)
          
          if (response.data?.errorCode === 24001) {
            item.status = 'error'
            item.message = 'ใส่โค้ดผิดเกิน 10 ครั้งแล้วจ้า! ต้องรออีก 1 ชั่วโมงถึงจะเติมใหม่ได้นะ'
            return; // Exit loop and function
          }

          item.status = 'success'
          item.message = response.data?.msg || response.data?.errorMessage || 'สำเร็จแล้วจ้า'
        } catch (error: any) {
          item.status = 'error'
          const data = error.response?.data
          
          if (data?.errorCode === 24001) {
            item.message = 'ใส่โค้ดผิดเกิน 10 ครั้งแล้วจ้า! ต้องรออีก 1 ชั่วโมงถึงจะเติมใหม่ได้นะ'
            return; // Exit loop and function
          }

          item.message = data?.msg || data?.errorMessage || error.message || 'เกิดข้อผิดพลาด'
        }

        if (i < results.value.length - 1) {
          const jitter = Math.floor(Math.random() * 1500) + 1000;
          await delay(jitter)
        }
      }
    } finally {
      isProcessing.value = false
    }
  }

  return {
    results,
    isProcessing,
    redeemCodes,
    stopRedeeming
  }
}
