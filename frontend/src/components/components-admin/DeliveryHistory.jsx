import { useState } from 'react';
import Closebutton from '../../assets/close-button-icon.png';
import DeliveryTruckIcon from '../../assets/delivery-icon.png';
import '../components-css/deliveryhistory.css';
import { printDeliveryReceipt } from '../components-staff/recordsHelpers.js';
import API_BASE_URL from '../../api/api.js';

const API_URL = `${API_BASE_URL}/api/deliveries`;

function formatDeliveryDate(dateString) {
    const datePart = String(dateString).slice(0, 10);
    const [year, month, day] = datePart.split('-').map(Number);

    return new Date(year, month - 1, day).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatDeliveryTime(timeString) {
    if (!timeString) return 'N/A';

    const time = String(timeString).trim();

    // Supports both database time (17:12:40) and formatted time (5:12 PM).
    const formattedMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    if (formattedMatch) {
        return `${Number(formattedMatch[1])}:${formattedMatch[2]} ${formattedMatch[3].toUpperCase()}`;
    }

    const timeMatch = time.match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/);

    if (!timeMatch) return 'N/A';

    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);

    if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        hours < 0 || hours > 23 ||
        minutes < 0 || minutes > 59
    ) {
        return 'N/A';
    }

    const hour12 = hours % 12 || 12;
    const period = hours >= 12 ? 'PM' : 'AM';

    return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function DeliveryHistory() {
    const currentYear = new Date().getFullYear();

    const [month, setMonth] = useState(
        String(new Date().getMonth() + 1)
    );
    const [year, setYear] = useState(String(currentYear));
    const [deliveries, setDeliveries] = useState([]);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasGenerated, setHasGenerated] = useState(false);

    const handleGenerate = async () => {
        if (!month || !year) {
            setError('Please select a month and year.');
            return;
        }

        const token = localStorage.getItem('token');

        if (!token) {
            setError('Your session has expired. Please log in again.');
            return;
        }

        setLoading(true);
        setError('');
        setHasGenerated(true);
        setSelectedDelivery(null);

        try {
            const response = await fetch(
                `${API_URL}?month=${month}&year=${year}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || 'Failed to load delivery history.'
                );
            }

            if (!Array.isArray(data)) {
                throw new Error('Invalid delivery history response.');
            }

            console.log('DELIVERY HISTORY RESPONSE:', data);

            // The backend already groups deliveries by date.
            // Format each delivery time only once.
            setDeliveries(
                data.map((delivery) => ({
                    ...delivery,
                    deliveryTimes: Array.isArray(delivery.deliveryTimes)
                        ? delivery.deliveryTimes.map(formatDeliveryTime)
                        : [],
                }))
            );
        } catch (err) {
            setDeliveries([]);
            setError(
                err.message || 'Unable to connect to the server.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handlePrintReceipt = () => {
        printDeliveryReceipt(selectedDelivery);
    };
    const openModal = (delivery) => setSelectedDelivery(delivery);
    const closeModal = () => setSelectedDelivery(null);

    return (
        <div className="dh-page">
            <div className="dh-controls-container">
                <div className="dh-filter-group">
                    <div className="dh-filter-pill">
                        <label htmlFor="month">Month</label>
                        <select
                            id="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                        >
                            <option value="">Select Month</option>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={String(i + 1)}>
                                    {new Date(2000, i).toLocaleString('en', {
                                        month: 'long',
                                    })}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="dh-filter-pill">
                        <label htmlFor="delivery-year">Year</label>
                        <select
                            id="delivery-year"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        >
                            {Array.from(
                                { length: 11 },
                                (_, i) => currentYear - 5 + i
                            ).map((y) => (
                                <option key={y} value={String(y)}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    className="dh-generate-btn"
                    onClick={handleGenerate}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Generate'}
                </button>
            </div>

            {error && <p role="alert">{error}</p>}

            {loading ? (
                <p>Loading delivery history...</p>
            ) : (
                <div className="dh-grid">
                    {deliveries.map((delivery) => (
                        <div
                            className="dh-card"
                            key={delivery.id}
                            onClick={() => openModal(delivery)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    openModal(delivery);
                                }
                            }}
                        >
                            <div className="dh-card-header">
                                DELIVERY HISTORY
                            </div>

                            <div className="dh-card-body">
                                <img
                                    src={DeliveryTruckIcon}
                                    alt="Delivery Truck"
                                    className="dh-truck-img"
                                />
                                <p className="dh-card-date">
                                    {formatDeliveryDate(delivery.date)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && !error && hasGenerated && deliveries.length === 0 && (
                <p>
                    No delivery records found for the selected month and year.
                </p>
            )}

            {selectedDelivery && (
                <div
                    className="deduction-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="deduction-modal dh-modal-override"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="deduction-close"
                            onClick={closeModal}
                            aria-label="Close"
                        >
                            <img src={Closebutton} alt="Close" />
                        </button>

                        <h2 className="deduction-modal-title">
                            Delivery Breakdown
                        </h2>

                        <div className="deduction-breakdown-box">
                            <p className="deduction-breakdown-line">
                                Delivery Date:{' '}
                                {formatDeliveryDate(selectedDelivery.date)}
                            </p>

                            <p className="deduction-breakdown-line">
                                Delivery Time:{' '}
                                {Array.isArray(selectedDelivery.deliveryTimes) &&
                                selectedDelivery.deliveryTimes.length > 0
                                    ? selectedDelivery.deliveryTimes.join(', ')
                                    : 'N/A'}
                            </p>

                            <div className="deduction-breakdown-row deduction-breakdown-head dh-modal-cols">
                                <span>Product Name:</span>
                                <span className="dh-text-center">Qty</span>
                                <span className="dh-text-right">Total</span>
                            </div>

                            <div className="deduction-breakdown-list">
                                {selectedDelivery.items.map((item) => (
                                    <div
                                        className="deduction-breakdown-row dh-modal-cols"
                                        key={
                                            item.rowKey ??
                                            `${item.delivery_id}-${item.product_item_id}`
                                        }
                                    >
                                        <span className="rec-ellipsis">
                                            {item.name}
                                        </span>

                                        <span className="dh-text-center">
                                            {item.qty}
                                        </span>

                                        <span className="dh-text-right">
                                            ₱
                                            {Number(item.total || 0).toLocaleString(
                                                'en-PH',
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                }
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="dh-modal-footer-info">
                            <p>
                                Total Value: ₱
                                {Number(selectedDelivery.totalValue || 0).toLocaleString(
                                    'en-PH',
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}
                            </p>

                            <p>
                                Person Received:{' '}
                                {(selectedDelivery.people || []).join(', ')}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="deduction-print-btn"
                            onClick={handlePrintReceipt}
                        >
                            Print Receipt
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DeliveryHistory;