import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';

interface ReportsChartProps {
    data: any[];
}

export function ReportsChart({ data }: ReportsChartProps) {
    return (
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-gray-100">
            <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-800">Income vs Expenses Analysis</CardTitle>
                <p className="text-sm text-gray-500">Monthly financial performance overview</p>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#64748b' }}
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
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => [formatCurrency(value), '']}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                iconType="circle"
                            />
                            <Bar
                                name="Income"
                                dataKey="Income"
                                fill="#10B981"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                            <Bar
                                name="Expenses"
                                dataKey="Expense"
                                fill="#EF4444"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
