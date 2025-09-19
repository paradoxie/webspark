'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Report {
  id: number;
  reason: string;
  details: string | null;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  website: {
    id: number;
    title: string;
    slug: string;
    url: string;
    author: {
      id: number;
      username: string;
      name: string | null;
    };
  };
  reporter: {
    id: number;
    username: string;
    name: string | null;
  } | null;
}

const REPORT_REASONS = {
  SPAM: '垃圾信息',
  INAPPROPRIATE_CONTENT: '不当内容',
  COPYRIGHT_INFRINGEMENT: '版权侵犯',
  BROKEN_LINK: '链接失效',
  OTHER: '其他原因'
};

const REPORT_STATUS = {
  OPEN: '待处理',
  CLOSED: '已处理'
};

export default function ReportsManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingReports, setProcessingReports] = useState<Set<number>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'OPEN' | 'CLOSED'>('OPEN');
  const [selectedReason, setSelectedReason] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReports();
  }, [selectedStatus, selectedReason, currentPage]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20'
      });

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (selectedReason !== 'all') {
        params.append('reason', selectedReason);
      }

      const response = await fetch(`/api/admin/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.data);
        setTotalPages(data.meta.pagination.pageCount);
      } else {
        throw new Error('Failed to fetch reports');
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('获取举报列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReport = async (reportId: number, action: 'close' | 'dismiss') => {
    if (!confirm(`确定要${action === 'close' ? '处理' : '忽略'}此举报吗？`)) {
      return;
    }

    setProcessingReports(prev => new Set(prev).add(reportId));

    try {
      const response = await fetch(`/api/admin/reports/${reportId}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success(`举报已${action === 'close' ? '处理' : '忽略'}`);
        fetchReports(); // 重新加载数据
      } else {
        throw new Error(`Failed to ${action} report`);
      }
    } catch (error) {
      console.error(`Failed to ${action} report:`, error);
      toast.error(`操作失败，请重试`);
    } finally {
      setProcessingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const handleBulkProcess = async (action: 'close' | 'dismiss') => {
    const openReports = reports.filter(report => report.status === 'OPEN');
    if (openReports.length === 0) {
      toast.error('没有待处理的举报');
      return;
    }

    if (!confirm(`确定要批量${action === 'close' ? '处理' : '忽略'}所有待处理的举报吗？`)) {
      return;
    }

    for (const report of openReports) {
      await handleProcessReport(report.id, action);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">举报管理</h1>
          <p className="text-slate-600 mt-2">管理和处理用户举报的内容</p>
        </div>

        {/* 筛选和操作栏 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-wrap items-center space-x-4">
              {/* 状态筛选 */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-slate-700">状态:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部</option>
                  <option value="OPEN">待处理</option>
                  <option value="CLOSED">已处理</option>
                </select>
              </div>

              {/* 原因筛选 */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-slate-700">原因:</label>
                <select
                  value={selectedReason}
                  onChange={(e) => {
                    setSelectedReason(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部</option>
                  {Object.entries(REPORT_REASONS).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 批量操作 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkProcess('close')}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
              >
                批量处理
              </button>
              <button
                onClick={() => handleBulkProcess('dismiss')}
                className="px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-colors"
              >
                批量忽略
              </button>
            </div>
          </div>
        </div>

        {/* 举报列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 mt-2">加载中...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-slate-400 text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">暂无举报</h3>
              <p className="text-slate-600">当前筛选条件下没有找到举报记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      举报内容
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      举报原因
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      举报人
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-medium text-slate-900">
                            <a
                              href={`/sites/${report.website.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {report.website.title}
                            </a>
                          </div>
                          <div className="text-sm text-slate-500">
                            作者: {report.website.author.name || report.website.author.username}
                          </div>
                          <div className="text-sm text-slate-500">
                            <a
                              href={report.website.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                            >
                              {report.website.url}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {REPORT_REASONS[report.reason as keyof typeof REPORT_REASONS]}
                          </span>
                          {report.details && (
                            <div className="text-sm text-slate-600 max-w-xs truncate" title={report.details}>
                              {report.details}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {report.reporter ? (
                          report.reporter.name || report.reporter.username
                        ) : (
                          <span className="text-slate-500">匿名用户</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.status === 'OPEN'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {REPORT_STATUS[report.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {report.status === 'OPEN' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleProcessReport(report.id, 'close')}
                              disabled={processingReports.has(report.id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {processingReports.has(report.id) ? '处理中...' : '处理'}
                            </button>
                            <button
                              onClick={() => handleProcessReport(report.id, 'dismiss')}
                              disabled={processingReports.has(report.id)}
                              className="px-3 py-1 bg-slate-600 text-white text-sm font-medium rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {processingReports.has(report.id) ? '处理中...' : '忽略'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {!loading && reports.length > 0 && totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-slate-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-slate-700">
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}