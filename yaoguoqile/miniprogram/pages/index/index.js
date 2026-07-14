const app = getApp()

Page({
  data: {
    alertCount: 0,
    expiredList: [],
    spriteX: 20,
    spriteY: 120,
    spriteAction: 'floating',
    bubbleShow: false,
    bubbleText: '',
    _touchStartX: 0,
    _touchStartY: 0,
    _startX: 0,
    _startY: 0,
    _isDragging: false,
    _actionTimer: null
  },

  onShow() {
    this.loadData()
    this.startSpriteIdle()
  },

  onHide() {
    if (this.data._actionTimer) {
      clearInterval(this.data._actionTimer)
    }
  },

  onUnload() {
    if (this.data._actionTimer) {
      clearInterval(this.data._actionTimer)
    }
  },

  loadData() {
    const medicines = wx.getStorageSync('medicines') || []
    const reminderDays = wx.getStorageSync('reminderDays') || 7
    const now = new Date()
    const expiredList = []

    medicines.forEach((med, index) => {
      const expiryDate = new Date(med.expiryDate)
      const diffTime = expiryDate - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays <= 0) {
        expiredList.push({ ...med, type: 'expired', originalIndex: index })
      } else if (diffDays <= reminderDays) {
        expiredList.push({ ...med, type: 'near-expiry', originalIndex: index })
      }
    })

    this.setData({
      alertCount: expiredList.length,
      expiredList: expiredList
    })
  },

  startSpriteIdle() {
    if (this.data._actionTimer) clearInterval(this.data._actionTimer)
    const timer = setInterval(() => {
      const r = Math.random()
      if (r < 0.3) {
        this.spriteJump()
      } else if (r < 0.6) {
        this.spriteWave()
      } else if (r < 0.8) {
        this.spriteBubbleRandom()
      }
    }, 10000)
    this.setData({ _actionTimer: timer })
  },

  onSpriteTap() {
    if (this.data._isDragging) return
    const actions = ['jump', 'wave', 'spin']
    const action = actions[Math.floor(Math.random() * actions.length)]
    const messages = [
      '你好呀！',
      '今天天气真好~',
      '来玩呀！',
      '好开心见到你！',
      '今天也要元气满满！',
      '想你啦~',
      '蹦蹦跳跳~',
      '我在这儿呢~',
      '你今天真好看！'
    ]
    const msg = messages[Math.floor(Math.random() * messages.length)]

    if (action === 'jump') this.spriteJump()
    else if (action === 'wave') this.spriteWave()
    else this.spriteSpin()

    this.showBubble(msg)
  },

  spriteJump() {
    this.setData({ spriteAction: 'jumping' })
    setTimeout(() => {
      this.setData({ spriteAction: 'floating' })
    }, 600)
  },

  spriteWave() {
    this.setData({ spriteAction: 'waving' })
    setTimeout(() => {
      this.setData({ spriteAction: 'floating' })
    }, 1000)
  },

  spriteSpin() {
    this.setData({ spriteAction: 'spinning' })
    setTimeout(() => {
      this.setData({ spriteAction: 'floating' })
    }, 800)
  },

  spriteBubbleRandom() {
    const tips = [
      '记得喝水哦~',
      '今天也要开心！',
      '抱抱~',
      '一起玩吧！',
      '开心每一天！'
    ]
    const tip = tips[Math.floor(Math.random() * tips.length)]
    this.showBubble(tip)
  },

  showBubble(text) {
    this.setData({ bubbleText: text, bubbleShow: true })
    clearTimeout(this._bubbleTimer)
    this._bubbleTimer = setTimeout(() => {
      this.setData({ bubbleShow: false })
    }, 2500)
  },

  onSpriteTouchStart(e) {
    const touch = e.touches[0]
    this.setData({
      _touchStartX: touch.clientX,
      _touchStartY: touch.clientY,
      _startX: this.data.spriteX,
      _startY: this.data.spriteY,
      _isDragging: false,
      spriteAction: ''
    })
  },

  onSpriteMove(e) {
    const touch = e.touches[0]
    const dx = this.data._touchStartX - touch.clientX
    const dy = this.data._touchStartY - touch.clientY
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      this.setData({ _isDragging: true })
    }
    const newX = this.data._startX + dx
    const newY = this.data._startY - dy
    this.setData({
      spriteX: Math.max(10, Math.min(200, newX)),
      spriteY: Math.max(80, Math.min(400, newY))
    })
  },

  goMedicines() {
    wx.navigateTo({ url: '/pages/medicines/medicines' })
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/add/add' })
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  deleteFromAlert(e) {
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个过期药品吗？删除后可以在回收站找回（保留7天）',
      success: (res) => {
        if (res.confirm) {
          const medicines = wx.getStorageSync('medicines') || []
          const recycleBin = wx.getStorageSync('recycleBin') || []
          const deletedMedicine = medicines[index]
          recycleBin.push(deletedMedicine)
          medicines.splice(index, 1)
          wx.setStorageSync('medicines', medicines)
          wx.setStorageSync('recycleBin', recycleBin)
          const now = new Date()
          now.setDate(now.getDate() + 7)
          wx.setStorageSync('recycleBinExpiry', now.toISOString())
          this.loadData()
        }
      }
    })
  },

  shareToFamily() {
    wx.showModal({
      title: '分享给亲人',
      content: '点击确定后，请选择要分享的微信好友或群聊',
      success: (res) => {
        if (res.confirm) {
          wx.shareAppMessage({
            title: '小药过期了 - 家庭药品管理',
            path: '/pages/index/index',
            imageUrl: ''
          })
        }
      }
    })
  },

  onShareAppMessage() {
    return {
      title: '小药过期了 - 家庭药品管理',
      path: '/pages/index/index',
      desc: '快来一起管理家庭药品，避免药品过期！'
    }
  }
})
