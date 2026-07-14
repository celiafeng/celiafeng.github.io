App({
  onLaunch() {
    if (!wx.getStorageSync('reminderDays')) {
      wx.setStorageSync('reminderDays', 7);
    }
  },
  globalData: {
    medicines: [],
    recycleBin: [],
    currentEditIndex: -1
  }
})
