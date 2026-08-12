const CustomerList = require('../models/CustomerList');
const xlsx = require('xlsx');
const fs = require('fs');

// @desc    Get customer list with search & model filter
// @route   GET /api/customer-list
// @access  Private (Customer, Agent, Admin)
exports.getCustomerList = async (req, res) => {
  try {
    const { search, model } = req.query;
    let query = {};

    if (model && model !== 'All') {
      query.model = { $regex: new RegExp(`^${model.trim()}$`, 'i') };
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { address: searchRegex },
        { model: searchRegex },
        { sNo: searchRegex },
        { purchaseDate: searchRegex }
      ];
    }

    const customers = await CustomerList.find(query).sort({ createdAt: -1 });
    
    // Fetch list of all unique models for frontend dropdown filter
    const allModels = await CustomerList.distinct('model');
    const validModels = allModels.filter(m => m && m.trim() !== '');

    res.status(200).json({
      success: true,
      count: customers.length,
      models: validModels,
      data: customers
    });
  } catch (error) {
    console.error('Error fetching customer list:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching customer list'
    });
  }
};

// Helper function to extract cell value by candidate keys
const getVal = (row, candidates) => {
  const rowKeys = Object.keys(row);
  for (const cand of candidates) {
    const match = rowKeys.find(k => k.trim().toLowerCase() === cand.toLowerCase());
    if (match && row[match] !== undefined && row[match] !== null) {
      return String(row[match]).trim();
    }
  }
  return '';
};

// @desc    Upload customer list from Excel/CSV file or JSON
// @route   POST /api/customer-list/upload
// @access  Private (Admin only)
exports.uploadCustomerList = async (req, res) => {
  try {
    let recordsToInsert = [];
    const mode = req.body?.mode || 'replace'; // 'replace' or 'append'

    if (req.file) {
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = xlsx.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

      recordsToInsert = rawData.map((row, index) => {
        const sNo = getVal(row, ['s.no', 's.no.', 'sno', 's no', 'sl.no', 'sl no', 'serial no']) || String(index + 1);
        const name = getVal(row, ['name', 'customer name', 'customer']);
        const address = getVal(row, ['address', 'location', 'customer address']);
        const model = getVal(row, ['model', 'product', 'product model', 'machine model']);
        const purchaseDate = getVal(row, ['date of purchase', 'purchase date', 'date', 'purchasedate']);

        return {
          sNo,
          name: name || `Customer ${index + 1}`,
          address,
          model,
          purchaseDate
        };
      }).filter(item => item.name && item.name.trim() !== '');

      // Clean up uploaded temp file
      fs.unlink(req.file.path, () => {});
    } else if (Array.isArray(req.body?.records)) {
      recordsToInsert = req.body.records.map((row, index) => ({
        sNo: row.sNo || String(index + 1),
        name: row.name || `Customer ${index + 1}`,
        address: row.address || '',
        model: row.model || '',
        purchaseDate: row.purchaseDate || ''
      }));
    } else {
      return res.status(400).json({
        success: false,
        error: 'Please upload a file (.xlsx, .xls, .csv) or provide a records array'
      });
    }

    if (mode === 'replace') {
      await CustomerList.deleteMany({});
    }

    const inserted = await CustomerList.insertMany(recordsToInsert);

    res.status(200).json({
      success: true,
      message: `Successfully ${mode === 'replace' ? 'replaced and uploaded' : 'appended'} ${inserted.length} customer records.`,
      count: inserted.length,
      data: inserted
    });
  } catch (error) {
    console.error('Error uploading customer list:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process customer list upload'
    });
  }
};

// @desc    Add single customer record manually
// @route   POST /api/customer-list
// @access  Private (Admin only)
exports.addCustomerRecord = async (req, res) => {
  try {
    const { sNo, name, address, model, purchaseDate } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Customer name is required'
      });
    }

    const record = await CustomerList.create({
      sNo: sNo || '',
      name: name.trim(),
      address: address ? address.trim() : '',
      model: model ? model.trim() : '',
      purchaseDate: purchaseDate ? purchaseDate.trim() : ''
    });

    res.status(201).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error adding customer record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add customer record'
    });
  }
};

// @desc    Delete single customer record
// @route   DELETE /api/customer-list/:id
// @access  Private (Admin only)
exports.deleteCustomerRecord = async (req, res) => {
  try {
    const record = await CustomerList.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Customer record not found'
      });
    }

    await record.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Customer record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer record'
    });
  }
};

// @desc    Clear all customer records
// @route   DELETE /api/customer-list/clear
// @access  Private (Admin only)
exports.clearCustomerList = async (req, res) => {
  try {
    await CustomerList.deleteMany({});
    res.status(200).json({
      success: true,
      message: 'All customer records cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing customer list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear customer list'
    });
  }
};
