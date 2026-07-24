import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function PriceHistoryChart({ history, symbol }) {
  if (!history || history.length < 2) {
    return (
      <div className="chart-card">
        <h3>Price history</h3>
        <p className="chart-note">
          {history && history.length === 1
            ? 'This is the first time we\u2019ve checked this product\u2019s price. The chart will build up as it\u2019s searched again over time.'
            : 'No price history yet for this search.'}
        </p>
      </div>
    );
  }

  const data = history.map((h) => ({ day: h.day.slice(5), price: h.minPrice }));

  return (
    <div className="chart-card">
      <h3>Price history (lowest price per day, real data)</h3>
      <p className="chart-note">{'Built from every real check we\u2019ve made of this exact search.'}</p>
      <div style={{ width: '100%', height: 180 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 20, bottom: 4, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A3226" />
            <XAxis dataKey="day" tick={{ fill: '#9BA398', fontSize: 11 }} axisLine={{ stroke: '#2A3226' }} tickLine={false} />
            <YAxis
              tick={{ fill: '#9BA398', fontSize: 11 }}
              axisLine={{ stroke: '#2A3226' }}
              tickLine={false}
              width={54}
              tickFormatter={(v) => `${symbol}${v}`}
            />
            <Tooltip
              formatter={(value) => [`${symbol}${value}`, 'Lowest price']}
              contentStyle={{ background: '#1B211A', border: '1px solid #2A3226', borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: '#EFEDE2' }}
            />
            <Line type="monotone" dataKey="price" stroke="#C99A3D" strokeWidth={2} dot={{ r: 3, fill: '#C99A3D' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
