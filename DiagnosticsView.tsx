/**
 * Pattern HMS - Diagnostics, Lab Tests, Branch Pricing & Packages View
 */
import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Plus,
  Search,
  DollarSign,
  Package,
  Layers,
  Clock,
  FileText,
  Building2,
  CheckCircle2,
  TrendingUp,
  History,
  Save,
  Tag
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DiagnosticTest, TestPrice, TestPackage, HospitalService } from '../types';

export const DiagnosticsView: React.FC = () => {
  const { organizations, branches } = useAuth();
  const [activeTab, setActiveTab] = useState<'tests' | 'pricing' | 'packages' | 'services'>('tests');
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [prices, setPrices] = useState<TestPrice[]>([]);
  const [packages, setPackages] = useState<TestPackage[]>([]);
  const [services, setServices] = useState<HospitalService[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modals
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isPriceOverrideModalOpen, setIsPriceOverrideModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);

  // Selected for Price Override
  const [targetTest, setTargetTest] = useState<DiagnosticTest | null>(null);
  const [overrideBranchId, setOverrideBranchId] = useState<string>('');
  const [overridePrice, setOverridePrice] = useState<number>(0);

  // Forms
  const [testForm, setTestForm] = useState({
    name: '',
    code: '',
    categoryId: '',
    departmentId: 'dept_lab',
    sampleType: 'Venous Blood',
    preparationInstructions: 'Fasting 8-10 hours recommended',
    turnaroundHours: 4,
    basePrice: 50,
    discountEligible: true,
    taxPercent: 5,
    reportType: 'QUANTITATIVE' as const,
    status: 'ACTIVE' as const
  });

  const [packageForm, setPackageForm] = useState({
    name: '',
    code: '',
    organizationId: organizations[0]?.id || '',
    testIds: [] as string[],
    originalPrice: 100,
    packagePrice: 75,
    discountPercent: 25,
    validityDays: 30
  });

  const loadDiagnostics = async () => {
    try {
      const [tList, cList, pList, pkgList, sList] = await Promise.all([
        api.getDiagnosticTests(),
        api.getTestCategories(),
        api.getTestPrices(),
        api.getTestPackages(),
        api.getHospitalServices()
      ]);
      setTests(tList);
      setCategories(cList);
      setPrices(pList);
      setPackages(pkgList);
      setServices(sList);
      if (cList.length > 0 && !testForm.categoryId) {
        setTestForm(prev => ({ ...prev, categoryId: cList[0].id }));
      }
    } catch (e) {
      console.error('Failed to load diagnostics', e);
    }
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDiagnosticTest(testForm);
      await loadDiagnostics();
      setIsTestModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error registering diagnostic test');
    }
  };

  const handleSavePriceOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTest) return;
    try {
      await api.saveTestPrice({
        testId: targetTest.id,
        organizationId: organizations[0]?.id || 'org_pch',
        branchId: overrideBranchId || null,
        price: Number(overridePrice),
        effectiveFrom: new Date().toISOString().split('T')[0]
      });
      await loadDiagnostics();
      setIsPriceOverrideModalOpen(false);
      alert('Price configuration saved with audit log.');
    } catch (err: any) {
      alert(err.message || 'Error saving price override');
    }
  };

  const filteredTests = tests.filter(t => {
    if (selectedCategory !== 'ALL' && t.categoryId !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.sampleType.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Diagnostics, Lab Tests & Pricing</h1>
          <p className="text-xs text-slate-500">
            Pathology tests catalog, specimen guidelines, branch price overrides & bundled health packages
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'tests' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Test Catalog
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'pricing' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Price Overrides
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'packages' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Health Packages
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'services' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hospital Services
            </button>
          </div>

          {activeTab === 'tests' && (
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-xs flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Test
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: TESTS CATALOG */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tests by name, code, sample type..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Test Name & Code</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Specimen Type</th>
                    <th className="py-3 px-4">Turnaround</th>
                    <th className="py-3 px-4">Global Base Price</th>
                    <th className="py-3 px-4">Report Format</th>
                    <th className="py-3 px-4 text-right">Pricing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTests.map(test => (
                    <tr key={test.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-purple-50 text-purple-600">
                            <FlaskConical className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{test.name}</div>
                            <div className="font-mono text-[10px] text-slate-400 font-bold">{test.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {test.categoryName || 'Laboratory'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{test.sampleType}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {test.turnaroundHours} Hours
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-teal-700 text-xs">
                        ${test.basePrice}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">+{test.taxPercent}% Tax</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                          {test.reportType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setTargetTest(test);
                            setOverridePrice(test.basePrice);
                            setIsPriceOverrideModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition"
                        >
                          Set Branch Price
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRICING OVERRIDES */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Branch-Specific Price Overrides & Tiering</h2>
            <p className="text-xs text-slate-500">
              Override standard diagnostic fees for premium branches, satellite centers, or regional clinics.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Diagnostic Test</th>
                  <th className="py-3 px-4">Target Branch</th>
                  <th className="py-3 px-4">Active Tariff</th>
                  <th className="py-3 px-4">Previous Tariff</th>
                  <th className="py-3 px-4">Effective From</th>
                  <th className="py-3 px-4">Audit Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prices.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{p.testName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{p.testCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {p.branchName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-teal-700 text-xs">
                      ${p.price}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {p.oldPrice ? `$${p.oldPrice}` : 'Initial Price'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{p.effectiveFrom}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono text-slate-500">SuperAdmin Validated</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: HEALTH PACKAGES */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{pkg.name}</h3>
                  <span className="font-mono text-[10px] text-slate-400 font-bold">{pkg.code}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {pkg.discountPercent}% OFF
                </span>
              </div>

              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-xl font-bold text-teal-700">${pkg.packagePrice}</span>
                <span className="text-xs text-slate-400 line-through">${pkg.originalPrice}</span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Included Tests ({pkg.testIds.length})
                </div>
                <div className="space-y-1">
                  {pkg.tests?.map(t => (
                    <div key={t.id} className="flex items-center gap-1.5 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span className="truncate">{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100">
                <span>Valid for {pkg.validityDays} days</span>
                <span className="font-semibold text-teal-700">Package Active</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: HOSPITAL SERVICES */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Service Name</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Service Category</th>
                <th className="py-3 px-4">Standard Rate</th>
                <th className="py-3 px-4">Tax %</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map(srv => (
                <tr key={srv.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{srv.name}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 font-bold">{srv.code}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {srv.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-teal-700">${srv.basePrice}</td>
                  <td className="py-3.5 px-4 text-slate-600">{srv.taxPercent}%</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Create Test */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Register Diagnostic Test</h3>
              <button onClick={() => setIsTestModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateTest} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Test Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Glycated Hemoglobin (HbA1c)"
                    value={testForm.name}
                    onChange={e => setTestForm({ ...testForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Test Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HBA1C-EDTA"
                    value={testForm.code}
                    onChange={e => setTestForm({ ...testForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Test Category *</label>
                  <select
                    value={testForm.categoryId}
                    onChange={e => setTestForm({ ...testForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specimen / Sample Type</label>
                  <input
                    type="text"
                    value={testForm.sampleType}
                    onChange={e => setTestForm({ ...testForm, sampleType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Turnaround (Hours)</label>
                  <input
                    type="number"
                    value={testForm.turnaroundHours}
                    onChange={e => setTestForm({ ...testForm, turnaroundHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Base Price ($) *</label>
                  <input
                    type="number"
                    required
                    value={testForm.basePrice}
                    onChange={e => setTestForm({ ...testForm, basePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Percent (%)</label>
                  <input
                    type="number"
                    value={testForm.taxPercent}
                    onChange={e => setTestForm({ ...testForm, taxPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preparation Instructions for Patient</label>
                <input
                  type="text"
                  placeholder="e.g. 10-12 hours overnight fasting required. Water allowed."
                  value={testForm.preparationInstructions}
                  onChange={e => setTestForm({ ...testForm, preparationInstructions: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition"
                >
                  Save Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Branch Price Override */}
      {isPriceOverrideModalOpen && targetTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Branch Price Override</h3>
            <p className="text-xs text-slate-500">
              Configuring custom branch fee for <span className="font-bold text-slate-800">{targetTest.name}</span> (Global Base: ${targetTest.basePrice})
            </p>
            <form onSubmit={handleSavePriceOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Branch *</label>
                <select
                  value={overrideBranchId}
                  onChange={e => setOverrideBranchId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
                >
                  <option value="">Global (All Branches)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Branch Tariff ($) *</label>
                <input
                  type="number"
                  required
                  value={overridePrice}
                  onChange={e => setOverridePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPriceOverrideModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md"
                >
                  Save Branch Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
