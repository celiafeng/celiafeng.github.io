Page({
  data: {
    medicines: [],
    filteredMedicines: [],
    searchTerm: '',
    showFilter: false,
    currentFilter: 'all'
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const medicines = wx.getStorageSync('medicines') || []
    const reminderDays = wx.getStorageSync('reminderDays') || 7
    const now = new Date()
    const list = medicines.map((med, index) => {
      const expiryDate = new Date(med.expiryDate)
      const diffTime = expiryDate - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      let status = ''
      if (diffDays <= 0) status = 'expired'
      else if (diffDays <= reminderDays) status = 'near-expiry'
      return { ...med, status, originalIndex: index }
    })
    this.setData({ medicines: list, filteredMedicines: list })
  },

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

  goBack() {
    wx.navigateBack()
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/add/add' })
  },

  goEdit(e) {
    const index = e.currentTarget.dataset.index
    wx.navigateTo({ url: '/pages/edit/edit?index=' + index })
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
  }
})
