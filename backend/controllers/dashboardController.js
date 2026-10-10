
const { pool } = require('../config/db');

const LOW_STOCK_LIMIT = 20;

const ALL_LINES = `
  SELECT et.transaction_date, td.product_item_id, td.quantity, td.total_amount
  FROM employee_transaction et
  JOIN transaction_detail td
    ON td.employee_transaction_id = et.employee_transaction_id

  UNION ALL

  SELECT eta.transaction_date, tda.product_item_id, tda.quantity, tda.total_amount
  FROM employee_transaction_archive eta
  JOIN transaction_detail_archive tda
    ON tda.employee_transaction_archive_id = eta.employee_transaction_archive_id
`;

const getAdminDashboardData = async (req, res) => {
  const now = new Date();
  const requestedYear = Number.parseInt(req.query.year, 10);
  const requestedMonth = Number.parseInt(req.query.month, 10);

  const currentYear = Number.isInteger(requestedYear)
    ? requestedYear
    : Number(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Manila',
          year: 'numeric',
        }).format(now)
      );

  const currentMonth = Number.isInteger(requestedMonth)
    && requestedMonth >= 1
    && requestedMonth <= 12
    ? requestedMonth
    : Number(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Manila',
          month: 'numeric',
        }).format(now)
      );

  const previousMonthDate = new Date(
    Date.UTC(currentYear, currentMonth - 2, 1)
  );
  const previousYear = previousMonthDate.getUTCFullYear();
  const previousMonth = previousMonthDate.getUTCMonth() + 1;

  try {
    const [
      chartRes,
      invRes,
      topRes,
      balRes,
      colRes,
      salesKpiRes,
    ] = await Promise.all([
      // 1. Monthly sales chart: selected year vs previous year.
      pool.query(
        `WITH all_lines AS (${ALL_LINES})
         SELECT
           EXTRACT(MONTH FROM transaction_date)::int AS month_index,
           COALESCE(
             SUM(total_amount) FILTER (
               WHERE EXTRACT(YEAR FROM transaction_date) = $1::int
             ), 0
           ) AS current_year_total,
           COALESCE(
             SUM(total_amount) FILTER (
               WHERE EXTRACT(YEAR FROM transaction_date) = $2::int
             ), 0
           ) AS previous_year_total
         FROM all_lines
         WHERE EXTRACT(YEAR FROM transaction_date) IN ($1::int, $2::int)
         GROUP BY 1`,
        [currentYear, currentYear - 1]
      ),

      // 2. Active inventory only.
      pool.query(
        `SELECT
           COUNT(*) AS total_products,
           COALESCE(SUM(pi.price * pi.stock_quantity), 0) AS inventory_value,
           COUNT(*) FILTER (
             WHERE pi.stock_quantity > 0
               AND pi.stock_quantity <= $1
           ) AS low_stock,
           COUNT(*) FILTER (
             WHERE pi.stock_quantity = 0
           ) AS out_of_stock
         FROM product_item pi
         JOIN product_status ps ON pi.product_status_id = ps.id
         WHERE ps.name = 'Active'`,
        [LOW_STOCK_LIMIT]
      ),

      // 3. Top products across active and archived purchases.
      pool.query(
        `WITH all_lines AS (${ALL_LINES})
         SELECT
           p.product_item_id AS id,
           p.product_name AS name,
           img.image,
           COALESCE(SUM(l.quantity), 0) AS sold,
           COALESCE(SUM(l.total_amount), 0) AS revenue
         FROM product_item p
         LEFT JOIN product_image img
           ON p.product_image_id = img.product_image_id
         LEFT JOIN all_lines l
           ON l.product_item_id = p.product_item_id
         GROUP BY p.product_item_id, p.product_name, img.image
         ORDER BY sold DESC, revenue DESC, p.product_name ASC`
      ),

      // 4. Outstanding balances, including inactive employees who still owe.
      pool.query(
        `SELECT COALESCE(SUM(total_balance), 0) AS outstanding
         FROM employee_balance`
      ),

      // 5. Collections by deduction date.
      pool.query(
        `WITH t AS (
           SELECT
             make_date($1::int, $2::int, 1) AS selected_month,
             make_date($3::int, $4::int, 1) AS previous_month
         )
         SELECT
           COALESCE(SUM(d.deduction_amount) FILTER (
             WHERE d.deduction_date >= t.selected_month
               AND d.deduction_date < t.selected_month + INTERVAL '1 month'
           ), 0) AS current_month,
           COALESCE(SUM(d.deduction_amount) FILTER (
             WHERE d.deduction_date >= t.previous_month
               AND d.deduction_date < t.previous_month + INTERVAL '1 month'
           ), 0) AS previous_month,
           COALESCE(SUM(d.deduction_amount) FILTER (
             WHERE d.deduction_date >= make_date($1::int, 1, 1)
               AND d.deduction_date < make_date($1::int + 1, 1, 1)
           ), 0) AS year_total
         FROM t
         CROSS JOIN employee_deduction d`,
        [currentYear, currentMonth, previousYear, previousMonth]
      ),

      // 6. Sales KPIs for selected month and year.
      pool.query(
        `WITH all_lines AS (${ALL_LINES}),
         t AS (
           SELECT
             make_date($1::int, $2::int, 1) AS selected_month,
             make_date($3::int, $4::int, 1) AS previous_month
         )
         SELECT
           COALESCE(SUM(l.total_amount) FILTER (
             WHERE l.transaction_date >= t.selected_month
               AND l.transaction_date < t.selected_month + INTERVAL '1 month'
           ), 0) AS monthly_sales,
           COALESCE(SUM(l.total_amount) FILTER (
             WHERE l.transaction_date >= t.previous_month
               AND l.transaction_date < t.previous_month + INTERVAL '1 month'
           ), 0) AS previous_month_sales,
           COALESCE(SUM(l.total_amount) FILTER (
             WHERE l.transaction_date >= make_date($1::int, 1, 1)
               AND l.transaction_date < make_date($1::int + 1, 1, 1)
           ), 0) AS annual_sales,
           COALESCE(SUM(l.total_amount) FILTER (
             WHERE l.transaction_date >= make_date($1::int - 1, 1, 1)
               AND l.transaction_date < make_date($1::int, 1, 1)
           ), 0) AS previous_annual_sales
         FROM t
         CROSS JOIN all_lines l`,
        [currentYear, currentMonth, previousYear, previousMonth]
      ),
    ]);

    const chartData = Array.from({ length: 12 }, (_, index) => {
      const found = chartRes.rows.find(
        (row) => Number(row.month_index) === index + 1
      );

      return {
        name: new Date(Date.UTC(2000, index, 1)).toLocaleString('en-US', {
          month: 'short',
          timeZone: 'UTC',
        }),
        current: Number(found?.current_year_total ?? 0),
        previous: Number(found?.previous_year_total ?? 0),
      };
    });

    const inv = invRes.rows[0];
    const col = colRes.rows[0];
    const sales = salesKpiRes.rows[0];

    res.status(200).json({
      chartData,
      inventory: {
        totalProducts: Number(inv.total_products),
        inventoryValue: Number(inv.inventory_value),
        lowStock: Number(inv.low_stock),
        outOfStock: Number(inv.out_of_stock),
      },
      topProducts: topRes.rows.map((product) => ({
        ...product,
        sold: Number(product.sold),
        revenue: Number(product.revenue),
      })),
      kpis: {
        monthlySales: Number(sales.monthly_sales),
        prevMonthlySales: Number(sales.previous_month_sales),
        annualSales: Number(sales.annual_sales),
        prevAnnualSales: Number(sales.previous_annual_sales),
        outstandingBalance: Number(balRes.rows[0].outstanding),
        monthlyCollections: Number(col.current_month),
        prevMonthlyCollections: Number(col.previous_month),
        yearCollections: Number(col.year_total),
      },
    });
  } catch (err) {
    console.error('Admin dashboard analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getAdminDashboardData };
