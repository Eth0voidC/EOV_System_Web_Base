import Closebutton from '../../assets/close-button-icon.png';

import { formatMoney, formatDate, escapeHtml, printReceipt } from './recordsHelpers';
import '../components-css/recordsview.css';

/* ---------- Transaction Breakdown ---------- */
export function TransactionBreakdown({ transaction, employeeName, onClose }) {
    const total = transaction.items.reduce((sum, i) => sum + i.qty * i.price, 0);
    const processedBy = [
        ...new Set(
            transaction.items
                .map(item => item.processedBy)
                .filter(Boolean)
        )
    ].join(', ') || 'Unknown';

    const handlePrint = () => {
        const rows = transaction.items
            .map(
                (i) => `<tr>
                    <td>${escapeHtml(i.name)}</td>
                    <td>${i.qty}</td>
                    <td class="r">${formatMoney(i.qty * i.price)}</td>
                </tr>`
            )
            .join('');

        printReceipt(
            'Transaction Receipt',
            `<h2>Transaction Receipt</h2>
             <p><strong>Employee:</strong> ${escapeHtml(employeeName)}</p>
             <p><strong>Transaction Date:</strong> ${formatDate(transaction.date)}</p>
             <p><strong>Status:</strong> ${transaction.status}</p>
             <table>
                <tr><th>Product Name</th><th>Qty</th><th class="r">Total</th></tr>
                ${rows}
             </table>
             <p class="total">Total: ${formatMoney(total)}</p>
             <p><strong>Processed By:</strong> ${escapeHtml(processedBy)}</p>`

        );
    };

    return (
        <div className="rec-overlay" onClick={onClose}>
            <div className="rec-modal" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="rec-close" onClick={onClose} aria-label="Close">
                    <img src={Closebutton} alt="" />
                </button>

                <h2 className="rec-modal-title">Transaction Breakdown</h2>

                <div className="rec-breakdown-box">
                    <p className="rec-breakdown-line">
                        Transaction Date: {formatDate(transaction.date)}
                    </p>

                    <div className="rec-breakdown-row rec-breakdown-head">
                        <span>Product Name:</span>
                        <span>Qty</span>
                        <span>Total</span>
                    </div>

                    <div className="rec-breakdown-list">
                        {transaction.items.map((item) => (
                            <div className="rec-breakdown-row" key={item.name}>
                                <span className="rec-ellipsis">{item.name}</span>
                                <span>{item.qty}</span>
                                <span>{formatMoney(item.qty * item.price)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="rec-breakdown-total">Total: {formatMoney(total)}</p>
                <p className="rec-breakdown-line">Processed By: {processedBy}</p>
                <button type="button" className="rec-print-btn" onClick={handlePrint}>
                    Print Receipt
                </button>
            </div>
        </div>
    );
}

/* ---------- Deduction Breakdown ---------- */
export function DeductionBreakdown({ deduction, employeeName, onClose }) {
    const total = deduction.entries.reduce((sum, e) => sum + e.amount, 0);
    const period = `${formatDate(deduction.periodStart)} - ${formatDate(deduction.periodEnd)}`;

    const handlePrint = () => {
        const rows = deduction.entries
            .map(
                (e) => `<tr>
                    <td>${formatDate(e.date)}</td>
                    <td class="r">${formatMoney(e.amount)}</td>
                </tr>`
            )
            .join('');

        printReceipt(
            'Deduction Receipt',
            `<h2>Deduction Receipt</h2>
             <p><strong>Employee:</strong> ${escapeHtml(employeeName)}</p>
             <p><strong>Period:</strong> ${period}</p>
             <table>
                <tr><th>Date</th><th class="r">Amount</th></tr>
                ${rows}
             </table>
             <p class="total">Total Deducted: ${formatMoney(total)}</p>`
        );
    };

    return (
        <div className="rec-overlay" onClick={onClose}>
            <div className="rec-modal" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="rec-close" onClick={onClose} aria-label="Close">
                    <img src={Closebutton} alt="" />
                </button>

                <h2 className="rec-modal-title">Deduction Breakdown</h2>

                <div className="rec-breakdown-box">
                    <p className="rec-breakdown-line">Period: {period}</p>

                    <div className="rec-breakdown-row rec-breakdown-head rec-two-cols">
                        <span>Date:</span>
                        <span>Amount:</span>
                    </div>

                    <div className="rec-breakdown-list">
                        {deduction.entries.map((entry) => (
                            <div className="rec-breakdown-row rec-two-cols" key={entry.date}>
                                <span>{formatDate(entry.date)}</span>
                                <span>{formatMoney(entry.amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="rec-breakdown-total">Total Deducted: {formatMoney(total)}</p>

                <button type="button" className="rec-print-btn" onClick={handlePrint}>
                    Print Receipt
                </button>
            </div>
        </div>
    );
}