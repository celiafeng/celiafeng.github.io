const app = getApp()

Page({
  data: {
    currentPage: 0,
    totalPages: 5,
    // 首页数据
    alertCount: 0,
    expiredList: [],
    // 药品列表数据
    medicines: [],
    filteredMedicines: [],
    searchTerm: '',
    showFilter: false,
    currentFilter: 'all',
    // 添加药品数据
    addName: '',
    addExpiryDate: '',
    addLocation: '',
    addQuantity: '1',
    // 设置数据
    reminderDays: 7,
    recycleBin: [],
    // 编辑药品数据
    editIndex: -1,
    editName: '',
    editExpiryDate: '',
    editLocation: '',
    editQuantity: '1'
  },

  onShow() {
    this.loadData()
  },

  // ========== 翻页逻辑 ==========
  goNext() {
    if (this.data.currentPage < this.data.totalPages - 1) {
      this.setData({ currentPage: this.data.currentPage + 1 })
    }
  },

  goPrev() {
    if (this.data.currentPage > 0) {
      this.setData({ currentPage: this.data.currentPage - 1 })
    }
  },

  goToPage(e) {
    const page = e.currentTarget.dataset.page
    this.setData({ currentPage: page })
  },

  goToEditPage(e) {
    const index = e.currentTarget.dataset.index
    const medicines = wx.getStorageSync('medicines') || []
    const med = medicines[index]
    if (med) {
      this.setData({
        editIndex: index,
        editName: med.name,
        editExpiryDate: med.expiryDate,
        editLocation: med.location,
        editQuantity: String(med.quantity),
        currentPage: 5
      })
    }
  },

  // ========== 数据加载 ==========
  loadData() {
    const medicines = wx.getStorageSync('medicines') || []
    const reminderDays = wx.getStorageSync('reminderDays') || 7
    const now = new Date()

    // 首页过期提醒
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

    // 药品列表
    const list = medicines.map((med, index) => {
      const expiryDate = new Date(med.expiryDate)
      const diffTime = expiryDate - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      let status = ''
      if (diffDays <= 0) status = 'expired'
      else if (diffDays <= reminderDays) status = 'near-expiry'
      return { ...med, status, originalIndex: index }
    })

    // 回收站
    const recycleBin = wx.getStorageSync('recycleBin') || []
    const recycleBinExpiry = wx.getStorageSync('recycleBinExpiry')
    let validRecycleBin = recycleBin
    if (recycleBinExpiry && new Date() > new Date(recycleBinExpiry)) {
      wx.removeStorageSync('recycleBin')
      wx.removeStorageSync('recycleBinExpiry')
      validRecycleBin = []
    }

    this.setData({
      alertCount: expiredList.length,
      expiredList,
      medicines: list,
      filteredMedicines: list,
      reminderDays,
      recycleBin: validRecycleBin
    })
  },

  // ========== 首页操作 ==========
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
            path: '/pages/splash/splash',
            imageUrl: ''
          })
        }
      }
    })
  },

  // ========== 药品列表操作 ==========
  onSearchInput(e) {
    const searchTerm = e.detail.value.toLowerCase()
    this.setData({ searchTerm })
    this.applyFilter()
  },

  toggleFilter() {
    this.setData({ showFilter: !this.data.showFilter })
  },

  filterAll() {
    this.setData({ currentFilter: 'all', showFilter: false })
    this.applyFilter()
  },

  filterExpired() {
    this.setData({ currentFilter: 'expired', showFilter: false })
    this.applyFilter()
  },

  filterNearExpiry() {
    this.setData({ currentFilter: 'near-expiry', showFilter: false })
    this.applyFilter()
  },

  filterNormal() {
    this.setData({ currentFilter: 'normal', showFilter: false })
    this.applyFilter()
  },

  applyFilter() {
    let filtered = this.data.medicines
    const searchTerm = this.data.searchTerm
    const currentFilter = this.data.currentFilter

    if (searchTerm) {
      filtered = filtered.filter(med =>
        med.name.toLowerCase().includes(searchTerm) ||
        med.location.toLowerCase().includes(searchTerm)
      )
    }

    if (currentFilter === 'expired') {
      filtered = filtered.filter(med => med.status === 'expired')
    } else if (currentFilter === 'near-expiry') {
      filtered = filtered.filter(med => med.status === 'near-expiry')
    } else if (currentFilter === 'normal') {
      filtered = filtered.filter(med => med.status === '')
    }

    this.setData({ filteredMedicines: filtered })
  },

  deleteMedicine(e) {
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个药品吗？删除后可以在回收站找回（保留7天）',
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

  // ========== 添加药品操作 ==========
  onAddNameInput(e) {
    this.setData({ addName: e.detail.value })
  },

  onAddDateChange(e) {
    this.setData({ addExpiryDate: e.detail.value })
  },

  onAddLocationInput(e) {
    this.setData({ addLocation: e.detail.value })
  },

  onAddQuantityInput(e) {
    this.setData({ addQuantity: e.detail.value })
  },

  saveMedicine() {
    const name = this.data.addName
    const expiryDate = this.data.addExpiryDate
    const location = this.data.addLocation
    const quantity = this.data.addQuantity

    if (!name) {
      wx.showToast({ title: '请输入药品名称', icon: 'none' })
      return
    }
    if (!expiryDate) {
      wx.showToast({ title: '请选择有效期', icon: 'none' })
      return
    }

    const medicines = wx.getStorageSync('medicines') || []
    medicines.push({
      name,
      expiryDate,
      location,
      quantity: parseInt(quantity) || 1
    })
    wx.setStorageSync('medicines', medicines)
    wx.showToast({ title: '保存成功', icon: 'success' })
    this.setData({ addName: '', addExpiryDate: '', addLocation: '', addQuantity: '1' })
    this.loadData()
    setTimeout(() => {
      this.setData({ currentPage: 2 })
    }, 1500)
  },

  // ========== 设置操作 ==========
  onReminderDaysInput(e) {
    this.setData({ reminderDays: e.detail.value })
  },

  saveSettings() {
    wx.setStorageSync('reminderDays', this.data.reminderDays)
    wx.showToast({ title: '设置保存成功', icon: 'success' })
    this.loadData()
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
          this.loadData()
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  },

  // ========== 编辑药品操作 ==========
  onEditNameInput(e) {
    this.setData({ editName: e.detail.value })
  },

  onEditDateChange(e) {
    this.setData({ editExpiryDate: e.detail.value })
  },

  onEditLocationInput(e) {
    this.setData({ editLocation: e.detail.value })
  },

  onEditQuantityInput(e) {
    this.setData({ editQuantity: e.detail.value })
  },

  updateMedicine() {
    const { editIndex, editName, editExpiryDate, editLocation, editQuantity } = this.data
    if (!editName) {
      wx.showToast({ title: '请输入药品名称', icon: 'none' })
      return
    }
    if (!editExpiryDate) {
      wx.showToast({ title: '请选择有效期', icon: 'none' })
      return
    }

    const medicines = wx.getStorageSync('medicines') || []
    medicines[editIndex] = {
      name: editName,
      expiryDate: editExpiryDate,
      location: editLocation,
      quantity: parseInt(editQuantity) || 1
    }
    wx.setStorageSync('medicines', medicines)
    wx.showToast({ title: '更新成功', icon: 'success' })
    this.loadData()
    setTimeout(() => {
      this.setData({ currentPage: 2 })
    }, 1500)
  },

  deleteFromEdit() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个药品吗？删除后可以在回收站找回（保留7天）',
      success: (res) => {
        if (res.confirm) {
          const medicines = wx.getStorageSync('medicines') || []
          const recycleBin = wx.getStorageSync('recycleBin') || []
          const deletedMedicine = medicines[this.data.editIndex]
          recycleBin.push(deletedMedicine)
          medicines.splice(this.data.editIndex, 1)
          wx.setStorageSync('medicines', medicines)
          wx.setStorageSync('recycleBin', recycleBin)
          const now = new Date()
          now.setDate(now.getDate() + 7)
          wx.setStorageSync('recycleBinExpiry', now.toISOString())
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadData()
          setTimeout(() => {
            this.setData({ currentPage: 2 })
          }, 1500)
        }
      }
    })
  },

  onShareAppMessage() {
    return {
      title: '小药过期了 - 家庭药品管理',
      path: '/pages/splash/splash',
      desc: '快来一起管理家庭药品，避免药品过期！'
    }
  }
})