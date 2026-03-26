'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar,
} from 'recharts';

interface TrendPoint {
  month: string;
  avgCPM: number;
  avgCPC: number;
  avgCTR: number;
  totalReach: number;
  count: number;
}

interface IndustryTrend {
  industry: string;
  trends: TrendPoint[];
}

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

const METRIC_OPTIONS = [
  { key: 'avgCPM', label: 'CPM (원)', format: (v: number) => `₩${v.toLocaleString()}` },
  { key: 'avgCPC', label: 'CPC (원)', format: (v: number) => `₩${v.toLocaleString()}` },
  { key: 'avgCTR', label: 'CTR (%)', format: (v: number) => `${v.toFixed(3)}%` },
  { key: 'totalReach', label: '총 도달', format: (v: number) => v.toLocaleString() },
];

// Merge all industry trends into a single dataset by month
function mergeByMonth(trends: IndustryTrend[], metric: string) {
  const monthMap = new Map<string, Record<string, number>>();
  for (const { industry, trends: pts } of trends) {
    for (const pt of pts) {
      if (!monthMap.has(pt.month)) monthMap.set(pt.month, { month: pt.month as unknown as number });
      monthMap.get(pt.month)![industry] = (pt as unknown as Record<string, number>)[metric];
    }
  }
  return [...monthMap.values()].sort((a, b) => String(a.month).localeCompare(String(b.month)));
}

export default function TrendsPage() {
  const [data, setData] = useState<IndustryTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [industry, setIndustry] = useState('전체');
  const [gender, setGender] = useState('전체');
  const [ageRange, setAgeRange] = useState('전체');
  const [metric, setMetric] = useState('avgCPM');
  const [industries, setIndustries] = useState<string[]>([]);
  const [ageRanges, setAgeRanges] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/filters')
      .then((r) => r.json())
      .then((f) => {
        setIndustries(f.industries);
        setAgeRanges(f.ageRanges);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ industry, gender, ageRange });
    fetch(`/api/trends?${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [industry, gender, ageRange]);

  const metricConfig = METRIC_OPTIONS.find((m) => m.key === metric)!;
  const chartData = mergeByMonth(data, metric);
  const displayedIndustries = data.map((d) => d.industry);

  // Summary stats per industry (latest month)
  const summaryRows = data.map((d) => {
    const latest = d.trends[d.trends.length - 1];
    return { industry: d.industry, ...latest };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">업종별 트렌드</h1>
        <p className="text-sm text-gray-500 mt-1">업종별 광고 성과 지표 추이를 확인합니다.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">업종</label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="전체">전체</option>
              {industries.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="전체">전체</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">연령대</label>
            <select value={ageRange} onChange={(e) => setAgeRange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="전체">전체</option>
              {ageRanges.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">지표</label>
            <select value={metric} onChange={(e) => setMetric(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {METRIC_OPTIONS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-6">
          월별 {metricConfig.label} 추이
        </h2>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">데이터가 없습니다.</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => metricConfig.format(v)} width={80} />
              <Tooltip formatter={(v) => metricConfig.format(Number(v))} />
              <Legend />
              {displayedIndustries.map((ind, i) => (
                <Line
                  key={ind}
                  type="monotone"
                  dataKey={ind}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar Chart — latest month comparison */}
      {summaryRows.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-6">업종별 최신 성과 비교</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={summaryRows} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="industry" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => metricConfig.format(v)} width={80} />
              <Tooltip formatter={(v) => metricConfig.format(Number(v))} />
              <Bar dataKey={metric} fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data Table */}
      {data.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
          <h2 className="text-base font-semibold text-gray-800 mb-4">상세 데이터</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-gray-500 font-medium">업종</th>
                <th className="text-left py-2 pr-4 text-gray-500 font-medium">월</th>
                <th className="text-right py-2 pr-4 text-gray-500 font-medium">CPM</th>
                <th className="text-right py-2 pr-4 text-gray-500 font-medium">CPC</th>
                <th className="text-right py-2 pr-4 text-gray-500 font-medium">CTR</th>
                <th className="text-right py-2 text-gray-500 font-medium">도달</th>
              </tr>
            </thead>
            <tbody>
              {data.flatMap((d) =>
                d.trends.map((pt) => (
                  <tr key={`${d.industry}-${pt.month}`} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-800">{d.industry}</td>
                    <td className="py-2 pr-4 text-gray-600">{pt.month}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">₩{pt.avgCPM.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">₩{pt.avgCPC.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">{pt.avgCTR.toFixed(3)}%</td>
                    <td className="py-2 text-right text-gray-700">{pt.totalReach.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
