Page({
  data: {
    index: -1,
    name: '',
    expiryDate: '',
    location: '',
    quantity: '1'
  },

  onLoad(options) {
    const index = parseInt(options.index)
    const medicines = wx.getStorageSync('medicines') || []
    const med = medicines[index]
    if (med) {
      this.setData({
        index: index,
        name: med.name,
        expiryDate: med.expiryDate,
        location: med.location,
        quantity: String(med.quantity)
      })
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onDateChange(e) {
    this.setData({ expiryDate: e.detail.value })
  },

  onLocationInput(e) {
    this.setData({ location: e.detail.value })
  },

  onQuantityInput(e) {
    this.setData({ quantity: e.detail.value })
  },

  updateMedicine() {
    const { index, name, expiryDate, location, quantity } = this.data
    if (!name) {
      wx.showToast({ title: '请输入药品名称', icon: 'none' })
      return
    }
    if (!expiryDate) {
      wx.showToast({ title: '请选择有效期', icon: 'none' })
      return
    }

    const medicines = wx.getStorageSync('medicines') || []
    medicines[index] = {
      name: name,
      expiryDate: expiryDate,
      location: location,
      quantity: parseInt(quantity) || 1
    }
    wx.setStorageSync('medicines', medicines)

    wx.showToast({ title: '更新成功', icon: 'success' })
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  deleteMedicine() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个药品吗？删除后可以在回收站找回（保留7天）',
      success: (res) => {
        if (res.confirm) {
          const medicines = wx.getStorageSync('medicines') || []
          const recycleBin = wx.getStorageSync('recycleBin') || []
          const deletedMedicine = medicines[this.data.index]
          recycleBin.push(deletedMedicine)
          medicines.splice(this.data.index, 1)
          wx.setStorageSync('medicines', medicines)
          wx.setStorageSync('recycleBin', recycleBin)
          const now = new Date()
          now.setDate(now.getDate() + 7)
          wx.setStorageSync('recycleBinExpiry', now.toISOString())
          wx.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      }
    })
  }
})
