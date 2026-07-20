Page({
  data: {
    name: '',
    expiryDate: '',
    location: '',
    quantity: '1'
  },

  goBack() {
    wx.navigateBack()
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

  saveMedicine() {
    var name = this.data.name
    var expiryDate = this.data.expiryDate
    var location = this.data.location
    var quantity = this.data.quantity

    if (!name) {
      wx.showToast({ title: '请输入药品名称', icon: 'none' })
      return
    }
    if (!expiryDate) {
      wx.showToast({ title: '请选择有效期', icon: 'none' })
      return
    }

    var medicines = wx.getStorageSync('medicines') || []
    medicines.push({
      name: name,
      expiryDate: expiryDate,
      location: location,
      quantity: parseInt(quantity) || 1
    })
    wx.setStorageSync('medicines', medicines)

    wx.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(function() {
      wx.navigateBack()
    }, 1500)
  }
})