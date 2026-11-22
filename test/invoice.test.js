'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function line(name, price, qty, hsn, gstRate) {
  return { name, price, qty, hsn, gstRate };
}

function compare(items, coupon) {
  return {
    invoice: invoice.computeInvoiceFigures({ items, coupon }),
    checkout: pricing.computeTotals(items, coupon)
  };
}

test('CURRENT BEHAVIOUR: mixed 5% and 12% items without coupon', function () {
  const items = [
    line('Toor Dal', 165, 2, '0713', 5),
    line('Ghee', 450, 1, '0405', 12)
  ];
  const result = compare(items, '');

  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, cgst: result.invoice.cgst, sgst: result.invoice.sgst, total: result.invoice.total, slabs: result.invoice.rows.map(row => row.gstPercent), lineTaxes: result.invoice.rows.map(row => row.lineTax) },
    { subtotal: 780, discount: 0, tax: 70.5, cgst: 35.25, sgst: 35.25, total: 850.5, slabs: [5, 12], lineTaxes: [16.5, 54] }
  );
  assert.equal(result.checkout.tax, 70.5);
  assert.equal(result.checkout.total, 850.5);
});

test('CURRENT BEHAVIOUR: SAVE10 on a 5% order is discounted before tax', function () {
  const items = [
    line('Rice', 640, 1, '1006', 5),
    line('Sunflower Oil', 190, 2, '1512', 5)
  ];
  const result = compare(items, 'SAVE10');

  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, total: result.invoice.total, lineTaxes: result.invoice.rows.map(row => row.lineTax) },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9, lineTaxes: [28.8, 17.1] }
  );
  assert.deepEqual(
    { discount: result.checkout.discount, tax: result.checkout.tax, total: result.checkout.total },
    { discount: 102, tax: 45.9, total: 963.9 }
  );
});

test('CURRENT BEHAVIOUR: SAVE10 invoice applies ₹150 cap on ₹2,240 subtotal', function () {
  const items = [line('Groundnut Oil', 1120, 2, '1508', 5)];
  const result = compare(items, 'SAVE10');

  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, cgst: result.invoice.cgst, sgst: result.invoice.sgst, total: result.invoice.total, lineTax: result.invoice.rows[0].lineTax },
    { subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, lineTax: 104.5 }
  );
  assert.deepEqual(
    { discount: result.checkout.discount, tax: result.checkout.tax, total: result.checkout.total },
    { discount: 150, tax: 104.5, total: 2194.5 }
  );
});

test('CURRENT BEHAVIOUR: all-18% order without coupon matches checkout totals', function () {
  const items = [
    line('Packaged Tea', 140, 1, '0902', 18),
    line('Sherbet Concentrate', 180, 2, '2106', 18)
  ];
  const result = compare(items, '');

  assert.deepEqual(
    { subtotal: result.invoice.subtotal, discount: result.invoice.discount, tax: result.invoice.tax, cgst: result.invoice.cgst, sgst: result.invoice.sgst, total: result.invoice.total, slabs: result.invoice.rows.map(row => row.gstPercent), lineTaxes: result.invoice.rows.map(row => row.lineTax) },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, slabs: [18, 18], lineTaxes: [25.2, 64.8] }
  );
  assert.equal(result.checkout.tax, 90);
  assert.equal(result.checkout.total, 590);
});

test('invoice matches checkout subtotal, per-line GST, discount, and total', function () {
  const cases = [
    {
      items: [line('Toor Dal', 165, 2, '0713', 5), line('Ghee', 450, 1, '0405', 12)],
      coupon: ''
    },
    {
      items: [line('Rice', 640, 1, '1006', 5), line('Sunflower Oil', 190, 2, '1512', 5)],
      coupon: 'SAVE10'
    },
    {
      items: [line('Groundnut Oil', 1120, 2, '1508', 5)],
      coupon: 'SAVE10'
    },
    {
      items: [line('Packaged Tea', 140, 1, '0902', 18), line('Sherbet Concentrate', 180, 2, '2106', 18)],
      coupon: ''
    }
  ];

  cases.forEach(function (scenario) {
    const result = compare(scenario.items, scenario.coupon);
    assert.deepEqual(
      {
        subtotal: result.invoice.subtotal,
        discount: result.invoice.discount,
        tax: result.invoice.tax,
        cgst: result.invoice.cgst,
        sgst: result.invoice.sgst,
        total: result.invoice.total,
        lines: result.invoice.rows.map(row => ({ gstPercent: row.gstPercent, line: row.line, lineTax: row.lineTax }))
      },
      {
        subtotal: result.checkout.subtotal,
        discount: result.checkout.discount,
        tax: result.checkout.tax,
        cgst: result.checkout.cgst,
        sgst: result.checkout.sgst,
        total: result.checkout.total,
        lines: result.checkout.lines.map(row => ({ gstPercent: row.gstPercent, line: row.gross, lineTax: row.tax }))
      }
    );
  });
});


