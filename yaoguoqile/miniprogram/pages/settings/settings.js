Page({
  data: {
    reminderDays: 7,
    recycleBin: [],
    shareLink: ''
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const reminderDays = wx.getStorageSync('reminderDays') || 7
    const recycleBin = wx.getStorageSync('recycleBin') || []
    const recycleBinExpiry = wx.getStorageSync('recycleBinExpiry')
    if (recycleBinExpiry && new Date() > new Date(recycleBinExpiry)) {
      wx.removeStorageSync('recycleBin')
      wx.removeStorageSync('recycleBinExpiry')
      this.setData({ reminderDays, recycleBin: [] })
    } else {
      this.setData({ reminderDays, recycleBin })
    }
  },

  goBack() {
    wx.navigateBack()
  },

  onReminderDaysInput(e) {
    this.setData({ reminderDays: e.detail.value })
  },

  saveSettings() {
    wx.setStorageSync('reminderDays', this.data.reminderDays)
    wx.showToast({ title: '设置保存成功', icon: 'success' })
  },

  restoreMedicine(e) {
    const index = e.currentTarget.dataset.index
    const medicines = wx.getStorageSync('medicines') || []
    const recycleBin = wx.getStorageSync('recycleBin') || []
    medicines.push(recycleBin[index])
    recycleBin.splice(index, 1)
    wx.setStorageSync('medicines', medicines)
    wx.setStorageSync('recycleBin', recycleBin)
    this.loadData()
    wx.showToast({ title: '已恢复', icon: 'success' })
  },

  clearRecycleBin() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空回收站吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('recycleBin')
          wx.removeStorageSync('recycleBinExpiry')
          this.setData({ recycleBin: [] })
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  },

  generateShareLink() {
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
