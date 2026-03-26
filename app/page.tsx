'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import KPICard from '@/components/KPICard';
import BudgetSlider from '@/components/BudgetSlider';
import AgeInput from '@/components/AgeInput';
import ConditionTags from '@/components/ConditionTags';

interface Filters {
  industries: string[];
  ageRanges: string[];
  genders: string[];
}

interface PredictResult {
  reach: number;
  cpm: number;
  cpc: number;
  reachChange: number | null;
  cpmChange: number | null;
  cpcChange: number | null;
  matchedCount: number;
}

export default function SimulatorPage() {
  const [filters, setFilters] = useState<Filters>({ industries: [], ageRanges: [], genders: [] });
  const [industry, setIndustry] = useState('전체');
  const [gender, setGender] = useState('전체');
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(65);
  const [budget, setBudget] = useState(10_000_000);
  const [result, setResult] = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/filters')
      .then((r) => r.json())
      .then(setFilters)
      .catch(console.error);
  }, []);

  const fetchPrediction = useCallback(async (params: {
    industry: string; gender: string; minAge: number; maxAge: number; budget: number;
  }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPrediction({ industry, gender, minAge, maxAge, budget });
    }, 300);
  }, [industry, gender, minAge, maxAge, budget, fetchPrediction]);

  const genderLabel = gender === '전체' ? '전체' : gender === 'male' ? '남성' : '여성';
  const tags = [
    { label: '업종', value: industry },
    { label: 'Gender', value: genderLabel },
    { label: 'Age', value: `${minAge}~${maxAge}세` },
    { label: '예산', value: `₩${budget.toLocaleString()}` },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">성과 예측 시뮬레이터</h1>
        <p className="text-sm text-gray-500 mt-1">캠페인 조건을 입력하면 예상 성과를 실시간으로 예측합니다.</p>
      </div>

      {/* Campaign Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-5">캠페인 설정</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Industry */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">타겟 업종</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="전체">전체</option>
              {filters.industries.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="전체">전체</option>
              <option value="male">남성 (male)</option>
              <option value="female">여성 (female)</option>
            </select>
          </div>

          {/* Age */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">연령대</label>
            <div className="flex gap-3 items-end">
              <AgeInput label="Min Age" value={minAge} min={18} max={maxAge} onChange={(v) => setMinAge(v)} />
              <span className="text-gray-400 pb-2 text-lg">~</span>
              <AgeInput label="Max Age" value={maxAge} min={minAge} max={65} onChange={(v) => setMaxAge(v)} />
            </div>
          </div>

          {/* Budget */}
          <div className="lg:col-span-3">
            <BudgetSlider value={budget} onChange={setBudget} />
          </div>
        </div>
      </div>

      {/* Condition Tags */}
      <div>
        <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">현재 적용 조건</p>
        <ConditionTags tags={tags} />
      </div>

      {/* KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">예측 결과</h2>
          {result && !loading && (
            <span className="text-xs text-gray-400">
              매칭 데이터 {result.matchedCount}건 기반
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="예상 도달 (Reach)"
            value={result ? result.reach.toLocaleString() : '—'}
            change={result?.reachChange ?? null}
            icon="👥"
            loading={loading}
          />
          <KPICard
            title="예상 CPM"
            value={result ? `₩${result.cpm.toLocaleString()}` : '—'}
            change={result?.cpmChange ?? null}
            icon="📊"
            loading={loading}
          />
          <KPICard
            title="예상 CPC"
            value={result ? `₩${result.cpc.toLocaleString()}` : '—'}
            change={result?.cpcChange ?? null}
            icon="🖱️"
            loading={loading}
          />
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-indigo-50 rounded-xl p-4 text-sm text-indigo-700">
        <strong>예측 방식:</strong> 실제 캠페인 데이터 기반 통계 예측 (조건 그룹 가중평균 + 예산 비례 스케일링).
        조건 매칭 데이터가 부족할 경우 상위 카테고리로 자동 보정합니다.
      </div>
    </div>
  );
}
