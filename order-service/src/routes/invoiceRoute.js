const express = require('express');
const { generateInvoice } = require('../controllers/invoiceController');

module.exports = (authRequired) => {
  const router = express.Router();

  router.get('/:id/invoice', authRequired, generateInvoice);

  return router;
};
