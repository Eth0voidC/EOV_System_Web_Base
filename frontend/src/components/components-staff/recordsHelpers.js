const CURRENCY = '$'; // change to your currency symbol

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
    const win = window.open('', '_blank', 'width=420,height=600');
    if (!win) {
        alert('Please allow pop-ups to print the receipt.');
        return;
    }

    win.document.write(`
        <html>
        <head>
            <title>${escapeHtml(title)}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; }
                h2 { text-align: center; margin-bottom: 4px; }
                p { margin: 4px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                th, td { text-align: left; padding: 5px 0; border-bottom: 1px solid #ccc; }
                .r { text-align: right; }
                .total { margin-top: 14px; font-weight: bold; font-size: 16px; }
            </style>
        </head>
        <body>${bodyHtml}</body>
        </html>
    `);
    win.document.close();
    win.focus();
    win.print();
}