import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';

interface ReportsChartProps {
    data: any[];
}

export function ReportsChart({ data }: ReportsChartProps) {
    return (

        <Card className="col-span-1 lg:col-span-2 shadow-md border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-white dark:from-slate-800 dark:to-slate-800/80 border-b border-gray-100 dark:border-gray-700/50">
                <CardTitle className="text-xl font-extrabold text-emerald-700 tracking-tight flex items-center gap-2">
                    Income vs Expenses
                </CardTitle>
                <p className="text-sm text-gray-500 font-medium font-inter">Historical performance and AI-powered projections</p>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.5} />
                            <XAxis
                                dataKey="name"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#64748b', fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `K${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                                tick={{ fill: '#64748b' }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(124, 58, 237, 0.05)' }}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const isProjected = payload[0].payload.isProjected;
                                        return (
                                            <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/20 rounded-xl p-3 shadow-xl">
                                                <p className="text-xs font-bold text-gray-400 mb-2 flex items-center justify-between">
                                                    {label}
                                                    {isProjected && <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px] uppercase tracking-wider">AI Projected</span>}
                                                </p>
                                                {payload.map((entry: any) => (
                                                    <div key={entry.name} className="flex items-center justify-between gap-8 py-1">
                                                        <span className="text-xs text-gray-300 flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                                            {entry.name}:
                                                        </span>
                                                        <span className="text-xs font-bold text-white font-mono">
                                                            {formatCurrency(entry.value)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                iconType="circle"
                                iconSize={8}
                                formatter={(value) => <span className="text-xs font-medium text-gray-500">{value}</span>}
                            />

                            {/* Confidence Interval Shading for Forecast */}
                            <Area
                                type="monotone"
                                dataKey={(entry) => entry.isProjected ? entry.Profit + (entry.Profit * 0.2) : null} // Rough upper bound for Profit if not explicitly in data
                                stroke="none"
                                fill="#059669"
                                fillOpacity={0.05}
                                connectNulls
                            />

                            <Bar
                                name="Income"
                                dataKey="Income"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            >
                                {data.map((entry, index) => (
                                    <rect
                                        key={`cell-income-${index}`}
                                        fill={entry.isProjected ? "url(#colorIncomeProjected)" : "url(#colorIncome)"}
                                        stroke={entry.isProjected ? "#059669" : "none"}
                                        strokeDasharray={entry.isProjected ? "4 4" : "0"}
                                    />
                                ))}
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#059669" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                                    </linearGradient>
                                    <linearGradient id="colorIncomeProjected" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#059669" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#047857" stopOpacity={0.2} />
                                    </linearGradient>
                                </defs>
                            </Bar>
                            <Bar
                                name="Expenses"
                                dataKey="Expense"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            >
                                {data.map((entry, index) => (
                                    <rect
                                        key={`cell-expense-${index}`}
                                        fill={entry.isProjected ? "url(#colorExpenseProjected)" : "url(#colorExpense)"}
                                        stroke={entry.isProjected ? "#64748b" : "none"}
                                        strokeDasharray={entry.isProjected ? "4 4" : "0"}
                                    />
                                ))}
                                <defs>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#94a3b8" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#64748b" stopOpacity={0.8} />
                                    </linearGradient>
                                    <linearGradient id="colorExpenseProjected" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#64748b" stopOpacity={0.2} />
                                    </linearGradient>
                                </defs>
                            </Bar>
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
