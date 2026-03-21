<template>
  <div class="card bg-base-100 shadow-xl border border-primary/10 overflow-hidden group">
    <div class="bg-primary/5 px-4 py-2 flex items-center justify-between border-b border-primary/10">
      <div class="flex items-center gap-2">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        <span class="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Sponsored by Guild 3เดือนเลิก</span>
      </div>
      <span class="text-[10px] font-medium opacity-40 italic">สนับสนุนเซิร์ฟเวอร์</span>
    </div>
    <div class="card-body p-0">
      <img 
        src="/ads.jpg" 
        alt="กิลด์ 3เดือนเลิก รับสมัครสมาชิก" 
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  </div>
</template>