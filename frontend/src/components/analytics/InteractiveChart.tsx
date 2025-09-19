'use client';

import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface ChartData {
  labels: string[];
  datasets: any[];
}

interface InteractiveChartProps {
  type: 'line' | 'bar' | 'doughnut';
  data: ChartData;
  title: string;
  height?: number;
  options?: any;
  interactive?: boolean;
  onDataPointClick?: (dataPoint: any, index: number) => void;
}

export default function InteractiveChart({
  type,
  data,
  title,
  height = 300,
  options = {},
  interactive = true,
  onDataPointClick
}: InteractiveChartProps) {
  const chartRef = useRef<any>(null);

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: 'Inter, sans-serif'
          }
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
          family: 'Inter, sans-serif'
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          title: function(context: any) {
            return context[0].label;
          },
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || context.parsed;

            if (type === 'doughnut') {
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }

            return `${label}: ${value}`;
          }
        }
      }
    },
    onClick: interactive && onDataPointClick ? (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const index = element.index;
        const value = data.datasets[datasetIndex].data[index];
        const label = data.labels[index];

        onDataPointClick({ value, label, datasetIndex, index }, index);
      }
    } : undefined,
    scales: type !== 'doughnut' ? {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            family: 'Inter, sans-serif'
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12,
            family: 'Inter, sans-serif'
          }
        }
      }
    } : undefined,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const
    }
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins
    }
  };

  const chartStyle = {
    height: `${height}px`,
    position: 'relative' as const
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <Line
            ref={chartRef}
            data={data}
            options={mergedOptions}
            style={chartStyle}
          />
        );
      case 'bar':
        return (
          <Bar
            ref={chartRef}
            data={data}
            options={mergedOptions}
            style={chartStyle}
          />
        );
      case 'doughnut':
        return (
          <Doughnut
            ref={chartRef}
            data={data}
            options={mergedOptions}
            style={chartStyle}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="relative">
        {renderChart()}
      </div>

      {interactive && (
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-500">
            💡 点击图表数据点进行交互
          </p>
        </div>
      )}
    </div>
  );
}

// 预设的图表配置
export const chartConfigs = {
  // 趋势线图配置
  trendLine: {
    type: 'line' as const,
    options: {
      elements: {
        line: {
          tension: 0.4,
          borderWidth: 3
        },
        point: {
          radius: 6,
          hoverRadius: 8,
          borderWidth: 2,
          backgroundColor: 'white'
        }
      },
      plugins: {
        filler: {
          propagate: true
        }
      }
    }
  },

  // 柱状图配置
  barChart: {
    type: 'bar' as const,
    options: {
      borderRadius: 8,
      borderSkipped: false,
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    }
  },

  // 环形图配置
  doughnutChart: {
    type: 'doughnut' as const,
    options: {
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom' as const
        }
      }
    }
  }
};

// 颜色主题
export const chartColors = {
  primary: {
    background: 'rgba(59, 130, 246, 0.1)',
    border: 'rgb(59, 130, 246)',
    gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
  },
  success: {
    background: 'rgba(34, 197, 94, 0.1)',
    border: 'rgb(34, 197, 94)',
    gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)'
  },
  warning: {
    background: 'rgba(251, 191, 36, 0.1)',
    border: 'rgb(251, 191, 36)',
    gradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)'
  },
  danger: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: 'rgb(239, 68, 68)',
    gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)'
  },
  purple: {
    background: 'rgba(147, 51, 234, 0.1)',
    border: 'rgb(147, 51, 234)',
    gradient: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)'
  }
};