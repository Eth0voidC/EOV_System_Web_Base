const CURRENCY = '₱'; // Updated to ₱ to match your Philippine Peso formatting

export const formatMoney = (value) =>
    `${CURRENCY}${Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

// Dates are stored as 'YYYY-MM-DD'
export const formatDate = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

export const escapeHtml = (text) =>
    String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

// Opens a small window with only the receipt and starts printing
export function printReceipt(title, bodyHtml) {
    const win = window.open('', '_blank', 'width=500,height=700');
    if (!win) {
        alert('Please allow pop-ups to print the receipt.');
        return;
    }

    // Receipt-style CSS (Monospace, dashed lines, centered headers)
    win.document.write(`
        <html>
        <head>
            <title>${escapeHtml(title)}</title>
            <style>
                @page { margin: 0; }
                body { 
                    font-family: 'Courier New', Courier, monospace; 
                    color: #000; 
                    background: #fff;
                    margin: 0; 
                    padding: 20px; 
                    font-size: 13px; 
                }
                .receipt-container {
                    max-width: 400px;
                    margin: 0 auto;
                }
                .store-header {
                    text-align: center;
                    margin-bottom: 15px;
                }
                .store-name {
                    font-size: 18px;
                    font-weight: bold;
                    margin: 0;
                }
                .store-sub {
                    font-size: 12px;
                    margin: 2px 0 0 0;
                }
                .receipt-title {
                    text-align: center;
                    font-size: 15px;
                    font-weight: bold;
                    margin: 15px 0;
                    text-decoration: underline;
                }
                .info-line {
                    display: flex;
                    justify-content: space-between;
                    margin: 4px 0;
                }
                .divider {
                    border-bottom: 1px dashed #000;
                    margin: 10px 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0;
                }
                th, td {
                    padding: 6px 0;
                    text-align: left;
                    vertical-align: top;
                }
                th {
                    border-top: 1px dashed #000;
                    border-bottom: 1px dashed #000;
                }
                .r { text-align: right; }
                .c { text-align: center; }
                .total-row td {
                    border-top: 1px dashed #000;
                    font-weight: bold;
                    font-size: 15px;
                    padding-top: 10px;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 11px;
                }
            </style>
        </head>
        <body>${bodyHtml}</body>
        </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
        win.print();
    }, 250); // slight delay to ensure fonts load before printing
}

// 1. Prints the entire generated table (Batch Summary)
export const printDeductionSummary = (deductions, startDate, endDate) => {
    if (!deductions || deductions.length === 0) return;
    
    // Period is moved to the header, so the table only needs Name, Amount, and Status
    const rows = deductions.map(d => `
        <tr>
            <td>${escapeHtml(d.name)}</td>
            <td class="r">${formatMoney(d.total)}</td>
            <td class="r">${escapeHtml(d.status)}</td>
        </tr>
    `).join('');

    const totalDeducted = deductions.reduce((sum, d) => sum + d.total, 0);

    const html = `
        <div class="receipt-container" style="max-width: 500px;">
            <div class="store-header">
                <p class="store-name">ERVECC STORE</p>
                <p class="store-sub">Employee Credit System</p>
            </div>
            
            <div class="receipt-title">PAYROLL DEDUCTION BATCH</div>
            
            <div class="info-line">
                <span><strong>Date Printed:</strong></span>
                <span>${new Date().toLocaleDateString()}</span>
            </div>
            <div class="info-line">
                <span><strong>Period Covered:</strong></span>
                <span>${escapeHtml(startDate)} to ${escapeHtml(endDate)}</span>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Employee Name</th>
                        <th class="r">Amount</th>
                        <th class="r">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr class="total-row">
                        <td>BATCH TOTAL</td>
                        <td class="r">${formatMoney(totalDeducted)}</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
            
            <div class="divider"></div>
            <div class="footer">
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <p>*** END OF REPORT ***</p>
            </div>
        </div>
    `;

    printReceipt('Deduction Summary', html);
};

// 2. Prints the individual modal breakdown (Individual Receipt)
export const printDeductionModal = (selectedDeduction) => {
    if (!selectedDeduction) return;

    const rows = selectedDeduction.details.map(detail => `
        <tr>
            <td>${escapeHtml(detail.date)}</td>
            <td class="r">${formatMoney(detail.amount)}</td>
        </tr>
    `).join('');

    const html = `
        <div class="receipt-container">
            <div class="store-header">
                <p class="store-name">ERVECC STORE</p>
                <p class="store-sub">Employee Credit System</p>
            </div>
            
            <div class="receipt-title">DEDUCTION RECEIPT</div>
            
            <div class="info-line">
                <span><strong>Employee:</strong></span>
                <span>${escapeHtml(selectedDeduction.name)}</span>
            </div>
            <div class="info-line">
                <span><strong>Period:</strong></span>
                <span>${escapeHtml(selectedDeduction.period)}</span>
            </div>
            <div class="info-line">
                <span><strong>Status:</strong></span>
                <span>${escapeHtml(selectedDeduction.status)}</span>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th class="r">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr class="total-row">
                        <td>TOTAL DEDUCTED</td>
                        <td class="r">${formatMoney(selectedDeduction.total)}</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="divider"></div>
            <div class="footer">
                <p>Thank you!</p>
                <p>Printed on: ${new Date().toLocaleString()}</p>
            </div>
        </div>
    `;
    
    printReceipt('Deduction Breakdown', html);
};


 // 3. Prints the delivery history breakdown (Delivery Receipt)
export const printDeliveryReceipt = (selectedDelivery) => {
    if (!selectedDelivery) return;

    const items = Array.isArray(selectedDelivery.items)
        ? selectedDelivery.items
        : [];

    const rows = items.map((item) => `
        <tr>
            <td>${escapeHtml(item.name ?? '')}</td>
            <td class="c">${Number(item.qty) || 0}</td>
            <td class="r">${formatMoney(item.total)}</td>
        </tr>
    `).join('');

    const deliveryTimes = Array.isArray(selectedDelivery.deliveryTimes)
        && selectedDelivery.deliveryTimes.length > 0
        ? selectedDelivery.deliveryTimes.join(', ')
        : 'N/A';

    const people = Array.isArray(selectedDelivery.people)
        && selectedDelivery.people.length > 0
        ? selectedDelivery.people.join(', ')
        : 'N/A';

    const html = `
        <div class="receipt-container">
            <div class="store-header">
                <p class="store-name">ERVECC STORE</p>
                <p class="store-sub">Employee Credit System</p>
            </div>

            <div class="receipt-title">DELIVERY RECEIPT</div>

            <div class="info-line">
                <span><strong>Delivery Date:</strong></span>
                <span>${escapeHtml(
                    formatDate(String(selectedDelivery.date).slice(0, 10))
                )}</span>
            </div>

            <div class="info-line">
                <span><strong>Delivery Time:</strong></span>
                <span>${escapeHtml(deliveryTimes)}</span>
            </div>

            <div class="info-line">
                <span><strong>Received By:</strong></span>
                <span>${escapeHtml(people)}</span>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th class="c">Qty</th>
                        <th class="r">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr class="total-row">
                        <td>TOTAL VALUE</td>
                        <td></td>
                        <td class="r">${formatMoney(
                            selectedDelivery.totalValue
                        )}</td>
                    </tr>
                </tbody>
            </table>

            <div class="divider"></div>

            <div class="footer">
                <p>Thank you!</p>
                <p>Printed on: ${escapeHtml(new Date().toLocaleString())}</p>
                <p>*** END OF RECEIPT ***</p>
            </div>
        </div>
    `;

    printReceipt('Delivery Receipt', html);
};