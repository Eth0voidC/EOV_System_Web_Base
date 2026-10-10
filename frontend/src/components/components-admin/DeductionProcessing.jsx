import { useState } from 'react';
import Viewdetails from '../../assets/view-details-icon.png';
import Closebutton from '../../assets/close-button-icon.png';
import "../components-css/deductionprocessing.css";
import { getPendingDeductions, processDeductions } from '../../api/deductions';
import { printDeductionSummary, printDeductionModal } from '../components-staff/recordsHelpers';

function DeductionProcessing() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDeduction, setSelectedDeduction] = useState(null);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [deductions, setDeductions] = useState([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const openModal = (deduction) => {
        setSelectedDeduction(deduction);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedDeduction(null);
    };

    const handleGenerate = async () => {
        if (!startDate || !endDate) {
            alert("Please select both a Period Start and Period End date.");
            return;
        }
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const data = await getPendingDeductions(token, startDate, endDate);
            setDeductions(data);
        } catch (err) {
            alert(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeduct = () => {
        if (deductions.length === 0) return;
        setIsConfirmOpen(true);
    };

    const confirmDeduct = async () => {
        setIsConfirmOpen(false);
        setIsProcessing(true);

        try {
            const token = localStorage.getItem('token');
            await processDeductions(token, startDate, endDate);
            
            // UPDATE THIS LINE: Change the status to 'Deducted' instead of clearing the array
            setDeductions((prev) => 
                prev.map((d) => ({ ...d, status: 'Deducted' }))
            );
            
            alert("Payroll successfully processed and archived.");
        } catch (err) {
            alert(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const hasPending = deductions.some((d) => d.status === 'Pending');

    return (
        <div className="deduction-page">
            <section className="deduction-card">
                <h2 className="deduction-card-header">DEDUCTION PROCESSING</h2>
                
                <div className="deduction-card-body">
                    <div className="deduction-controls">
                        <div className="deduction-date-section">
                            <div className="deduction-date-wrapper">
                                <label>Period Start</label>
                                <input 
                                    type="date" 
                                    className="deduction-date-input" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="deduction-date-wrapper">
                                <label>Period End</label>
                                <input 
                                    type="date" 
                                    className="deduction-date-input" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="deduction-actions">
                            <button 
                                type="button" 
                                className="deduction-action-btn"
                                onClick={handleGenerate}
                                disabled={isProcessing}
                            >
                                Generate
                            </button>
                            <button 
                                type="button" 
                                className="deduction-action-btn"
                                onClick={() => printDeductionSummary(deductions, startDate, endDate)}
                                disabled={isProcessing || deductions.length === 0}
                            >
                                Print
                            </button>
                            <button 
                                type="button" 
                                className="deduction-action-btn"
                                onClick={handleDeduct}
                                disabled={isProcessing || !hasPending}
                            >
                                {isProcessing ? 'Processing...' : 'Deduct'}
                            </button>
                        </div>
                    </div>

                    <div className="deduction-list-wrapper">
                        <div className="deduction-row deduction-head-row">
                            <span>Name</span>
                            <span>Period Covered</span>
                            <span>Total Amount</span>
                            <span>Status</span>
                            <span></span>
                        </div>
                        
                        <div className="deduction-list">
                            {deductions.map((d) => (
                                <div className="deduction-row deduction-item" key={d.id}>
                                    <div className="deduction-cell deduction-cell-bold" data-label="Name">
                                        {d.name}
                                    </div>
                                    <div className="deduction-cell" data-label="Period Covered">
                                        {d.period}
                                    </div>
                                    <div className="deduction-cell" data-label="Total Amount">
                                        ₱{d.total.toFixed(0)}
                                    </div>
                                    <div className="deduction-cell" data-label="Status">
                                        <span className={`deduction-badge deduction-status-${d.status.toLowerCase()}`}>
                                            {d.status}
                                        </span>
                                    </div>
                                    <div className="deduction-cell deduction-action-cell">
                                        <button 
                                            type="button" 
                                            className="deduction-icon-btn" 
                                            onClick={() => openModal(d)} 
                                            aria-label="View Breakdown"
                                            disabled={isProcessing}
                                        >
                                            <img src={Viewdetails} alt="View Details" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {deductions.length === 0 && !isProcessing && (
                                <p className="deduction-empty">No deductions to process. Click Generate to load data.</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {isConfirmOpen && (
                <div className="deduction-overlay" onClick={() => setIsConfirmOpen(false)}>
                    <div
                        className="deduction-modal deduction-confirm-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="deduction-modal-title">Confirm Deduction</h2>

                        <p className="deduction-confirm-text">
                            Are you sure you want to deduct this? This will finalize all purchases and clear the active balances.
                        </p>

                        <div className="deduction-confirm-actions">
                            <button
                                type="button"
                                className="deduction-print-btn"
                                onClick={confirmDeduct}
                            >
                                Yes, Deduct
                            </button>
                            <button
                                type="button"
                                className="deduction-cancel-btn"
                                onClick={() => setIsConfirmOpen(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && selectedDeduction && (
                <div className="deduction-overlay" onClick={closeModal}>
                    <div className="deduction-modal" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="deduction-close" onClick={closeModal} aria-label="Close">
                            <img src={Closebutton} alt="Close" />
                        </button>
                        
                        <h2 className="deduction-modal-title">Deduction Breakdown</h2>
                        
                        <div className="deduction-breakdown-box">
                            <p className="deduction-breakdown-line">Period: {selectedDeduction.period}</p>
                            
                            <div className="deduction-breakdown-row deduction-breakdown-head">
                                <span>Date:</span>
                                <span>Amount:</span>
                            </div>
                            
                            <div className="deduction-breakdown-list">
                                {selectedDeduction.details.map((detail, index) => (
                                    <div className="deduction-breakdown-row" key={index}>
                                        <span>{detail.date}</span>
                                        <span>₱{detail.amount.toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <p className="deduction-breakdown-total">
                            Total Deducted: ₱{selectedDeduction.total.toFixed(0)}
                        </p>
                        
                        <button 
                            type="button" 
                            className="deduction-print-btn"
                            onClick={() => printDeductionModal(selectedDeduction)}
                        >
                            Print Receipt
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DeductionProcessing;