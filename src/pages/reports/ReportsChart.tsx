import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';

interface ReportsChartProps {
    data: any[];
}

export function ReportsChart({ data }: ReportsChartProps) {
    return (

        <Card className="col-span-1 lg:col-span-2 shadow-md border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-50/50 to-white dark:from-slate-800 dark:to-slate-800/80 border-b border-gray-100 dark:border-gray-700/50">
                <CardTitle className="text-xl font-extrabold text-purple-700 tracking-tight">Income vs Expenses</CardTitle>
                <p className="text-sm text-gray-500 font-medium">Monthly financial performance overview</p>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `K${value / 1000}k`}
                                tick={{ fill: '#64748b' }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(124, 58, 237, 0.05)' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    backgroundImage: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.95), rgba(8, 12, 18, 0.98))',
                                    border: '1px solid rgba(124, 58, 237, 0.2)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                    padding: '12px'
                                }}
                                itemStyle={{ color: '#fff', paddingBottom: '4px' }}
                                formatter={(value: number) => [formatCurrency(value), '']}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                iconType="circle"
                                iconSize={10}
                            />
                            <Bar
                                name="Income"
                                dataKey="Income"
                                fill="url(#colorIncome)"
                                radius={[6, 6, 0, 0]}
                                barSize={24}
                            >
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#7C3AED" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#6D28D9" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                            </Bar>
                            <Bar
                                name="Expenses"
                                dataKey="Expense"
                                fill="url(#colorExpense)"
                                radius={[6, 6, 0, 0]}
                                barSize={24}
                            >
                                <defs>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#DDD6FE" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#C4B5FD" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
