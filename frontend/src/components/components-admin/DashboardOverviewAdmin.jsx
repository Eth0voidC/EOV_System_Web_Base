
import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getDashboardAnalytics } from '../../api/dashboard';
import '../components-css/dashboardoverviewadmin.css';

const formatCurrency = (amount) =>
  `₱ ${Number(amount || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const getTodayDate = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

function DashboardOverviewAdmin() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeChartData, setActiveChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const [inventory, setInventory] = useState({
    totalProducts: 0,
    inventoryValue: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  const [kpiStats, setKpiStats] = useState({
    monthlySales: 0,
    prevMonthlySales: 0,
    annualSales: 0,
    prevAnnualSales: 0,
    outstandingBalance: 0,
    monthlyCollections: 0,
    prevMonthlyCollections: 0,
    yearCollections: 0,
  });

  const selectedYear = selectedDate.slice(0, 4);
  const selectedMonth = selectedDate.slice(5, 7);

  const selectedDateObj = new Date(`${selectedDate}T00:00:00`);

  const currentMonthLong = selectedDateObj.toLocaleString('en-US', {
    month: 'long',
  });

  const previousMonthDate = new Date(
    selectedDateObj.getFullYear(),
    selectedDateObj.getMonth() - 1,
    1
  );

  const previousMonthLong = previousMonthDate.toLocaleString('en-US', {
    month: 'long',
  });

  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('Authentication token is missing. Please log in again.');
        }

        const data = await getDashboardAnalytics(
          token,
          selectedYear,
          selectedMonth
        );

        if (!isMounted) return;

        setActiveChartData(data.chartData ?? []);
        setTopProducts(data.topProducts ?? []);

        setInventory({
          totalProducts: Number(data.inventory?.totalProducts ?? 0),
          inventoryValue: Number(data.inventory?.inventoryValue ?? 0),
          lowStock: Number(data.inventory?.lowStock ?? 0),
          outOfStock: Number(data.inventory?.outOfStock ?? 0),
        });

        setKpiStats({
          monthlySales: Number(data.kpis?.monthlySales ?? 0),
          prevMonthlySales: Number(data.kpis?.prevMonthlySales ?? 0),
          annualSales: Number(data.kpis?.annualSales ?? 0),
          prevAnnualSales: Number(data.kpis?.prevAnnualSales ?? 0),
          outstandingBalance: Number(data.kpis?.outstandingBalance ?? 0),
          monthlyCollections: Number(data.kpis?.monthlyCollections ?? 0),
          prevMonthlyCollections: Number(
            data.kpis?.prevMonthlyCollections ?? 0
          ),
          yearCollections: Number(data.kpis?.yearCollections ?? 0),
        });
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load dashboard analytics.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, [selectedYear, selectedMonth]);

  const renderTrend = (currentValue, previousValue, compareLabel) => {
    if (previousValue === 0) {
      return (
        <p className="kpi-trend">
          <span>No previous-period data</span>
        </p>
      );
    }

    const percentChange =
      ((currentValue - previousValue) / Math.abs(previousValue)) * 100;

    const isPositive = percentChange >= 0;

    return (
      <p className={`kpi-trend ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? '+' : ''}
        {percentChange.toFixed(1)}%
        {' '}
        <span>vs. {compareLabel}</span>
      </p>
    );
  };

  if (loading) {
    return <p style={{ padding: '20px' }}>Loading Dashboard Analytics...</p>;
  }

  if (error) {
    return (
      <p style={{ padding: '20px', color: 'red' }}>
        Error: {error}
      </p>
    );
  }

  return (
    <div className="admin-dash-page">
      <div className="admin-dash-header">
        <div>
          <h1 className="admin-dash-title">DASHBOARD</h1>
          <p className="admin-dash-subtitle">
            Business Operation Overview
          </p>
        </div>

        <div className="admin-dash-date-picker">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) {
                setSelectedDate(e.target.value);
              }
            }}
            aria-label="Select dashboard reporting date"
          />
        </div>
      </div>

      <div className="admin-dash-kpi-grid">
        <div className="admin-dash-kpi-card">
          <h4>MONTHLY SALES</h4>
          <div className="kpi-value-placeholder">
            {formatCurrency(kpiStats.monthlySales)}
          </div>
          <p className="kpi-desc">
            Total Sales for: {currentMonthLong} {selectedYear}
          </p>
          {renderTrend(
            kpiStats.monthlySales,
            kpiStats.prevMonthlySales,
            previousMonthLong
          )}
        </div>

        <div className="admin-dash-kpi-card">
          <h4>ANNUAL SALES</h4>
          <div className="kpi-value-placeholder">
            {formatCurrency(kpiStats.annualSales)}
          </div>
          <p className="kpi-desc">
            Total Sales for: {selectedYear}
          </p>
          {renderTrend(
            kpiStats.annualSales,
            kpiStats.prevAnnualSales,
            String(Number(selectedYear) - 1)
          )}
        </div>

        <div className="admin-dash-kpi-card">
          <h4>MONTHLY COLLECTIONS</h4>
          <div className="kpi-value-placeholder">
            {formatCurrency(kpiStats.monthlyCollections)}
          </div>
          <p className="kpi-desc">
            Total collections for: {currentMonthLong} {selectedYear}
          </p>
          {renderTrend(
            kpiStats.monthlyCollections,
            kpiStats.prevMonthlyCollections,
            previousMonthLong
          )}
        </div>

        <div className="admin-dash-kpi-card">
          <h4>OUTSTANDING BALANCE</h4>
          <div
            className="kpi-value-placeholder"
            style={{ color: '#d93025' }}
          >
            {formatCurrency(kpiStats.outstandingBalance)}
          </div>
          <p className="kpi-desc">Total of unpaid purchases</p>
          <p className="kpi-trend">
            <span>Across all employee accounts</span>
          </p>
        </div>
      </div>

      <div className="admin-dash-main-grid">
        <div className="admin-dash-left-col">
          <div className="admin-dash-chart-card">
            <div className="chart-header">
              <div>
                <h3>SALES PERFORMANCE</h3>
                <p>MONTHLY SALES COMPARISON</p>
              </div>

              <select
                className="chart-year-select"
                value={selectedYear}
                onChange={(e) => {
                  const year = e.target.value;
                  const day = selectedDate.slice(8, 10);

                  const lastDay = new Date(
                    Number(year),
                    Number(selectedMonth),
                    0
                  ).getDate();

                  const validDay = String(
                    Math.min(Number(day), lastDay)
                  ).padStart(2, '0');

                  setSelectedDate(
                    `${year}-${selectedMonth}-${validDay}`
                  );
                }}
                aria-label="Select chart year"
              >
                <option value={String(new Date().getFullYear())}>
                  {new Date().getFullYear()}
                </option>
                <option value={String(new Date().getFullYear() - 1)}>
                  {new Date().getFullYear() - 1}
                </option>
              </select>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={activeChartData}
                  margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e0e0e0"
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#000', fontWeight: 'bold' }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#000', fontWeight: 'bold' }}
                    tickFormatter={(value) =>
                      value >= 1000 ? `${value / 1000}K` : value
                    }
                  />

                  <Tooltip
                    cursor={{ fill: '#f4f7f4' }}
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      '',
                    ]}
                  />

                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{
                      paddingBottom: '20px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#000',
                    }}
                  />

                  <Bar
                    dataKey="current"
                    name="Selected Year"
                    fill="#2f5f22"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />

                  <Bar
                    dataKey="previous"
                    name="Previous Year"
                    fill="#72ef6a"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="admin-dash-collection-card">
            <h3>TOTAL COLLECTION THIS YEAR</h3>
            <div className="collection-value">
              {formatCurrency(kpiStats.yearCollections)}
            </div>
            <p>
              <strong>Total payments collected in:</strong>{' '}
              Jan 1 - Dec 31, {selectedYear}
            </p>
          </div>
        </div>

        <div className="admin-dash-right-col">
          <div className="admin-dash-top-products-card">
            <h3>Top Selling Products</h3>

            <div className="top-products-list">
              {topProducts.length === 0 ? (
                <p className="placeholder-text">
                  No data available yet.
                </p>
              ) : (
                topProducts.map((product) => (
                  <div key={product.id} className="top-product-item">
                    <div className="top-product-left">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="top-product-thumb"
                        />
                      ) : (
                        <div className="top-product-thumb top-product-placeholder" />
                      )}

                      <div className="top-product-info">
                        <span className="top-product-name">
                          {product.name}
                        </span>
                        <span className="top-product-sold">
                          {product.sold} units sold
                        </span>
                      </div>
                    </div>

                    <span className="top-product-revenue">
                      {formatCurrency(product.revenue)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="admin-dash-inventory-card">
            <h3>INVENTORY VALUE</h3>
            <div className="inventory-value-amount">
              {formatCurrency(inventory.inventoryValue)}
            </div>

            <h3 className="inventory-summary-title">
              INVENTORY SUMMARY
            </h3>

            <div className="inventory-summary-list">
              <div className="summary-item">
                <span>TOTAL PRODUCTS -</span>
                <span>{inventory.totalProducts}</span>
              </div>

              <div className="summary-item">
                <span>LOW STOCK -</span>
                <span style={{ color: '#f57c00' }}>
                  {inventory.lowStock}
                </span>
              </div>

              <div className="summary-item">
                <span>OUT OF STOCK -</span>
                <span style={{ color: '#d93025' }}>
                  {inventory.outOfStock}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverviewAdmin;