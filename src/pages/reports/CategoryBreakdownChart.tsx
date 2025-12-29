import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';

interface CategoryData {
    name: string;
    value: number;
    color: string;
    [key: string]: any;
}

interface CategoryBreakdownChartProps {
    data: CategoryData[];
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return percent > 0.05 ? (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        ) : null;
    };

    return (

        <Card className="col-span-1 shadow-md border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl overflow-hidden h-full hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-white dark:from-slate-800 dark:to-slate-800/80 border-b border-gray-100 dark:border-gray-700/50">
                <CardTitle className="text-xl font-extrabold text-emerald-700 tracking-tight">Expense Breakdown</CardTitle>
                <p className="text-sm text-gray-500 font-medium">Distribution by category</p>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[350px] w-full">
                    {data.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <p>No expense data available</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={105}
                                    innerRadius={60}
                                    paddingAngle={2}
                                    fill="#10b981"
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        color: '#fff',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                        padding: '12px'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend
                                    layout="horizontal"
                                    verticalAlign="bottom"
                                    align="center"
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px', fontWeight: 500 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
