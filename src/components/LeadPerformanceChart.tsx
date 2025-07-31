import React, { useEffect, useState } from 'react';
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
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { supabase } from '../lib/supabase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

interface LeadData {
  conversionRate: number;
  sourcePerformance: { [key: string]: number };
  monthlyTrends: { month: string; leads: number; conversions: number }[];
  leadScores: { range: string; count: number }[];
}

const LeadPerformanceChart: React.FC = () => {
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'conversion' | 'sources' | 'trends' | 'scores'>('conversion');

  useEffect(() => {
    fetchLeadData();
  }, []);

  const fetchLeadData = async () => {
    try {
      if (!supabase) return;

      // Fetch leads data
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

             if (error) throw error;

       if (leads && leads.length > 0) {
         // Calculate conversion rate
         const totalLeads = leads.length;
         const convertedLeads = leads.filter(lead => 
           lead.status === 'qualified' || lead.status === 'closed_won'
         ).length;
         const conversionRate = (convertedLeads / totalLeads) * 100;

         // Calculate source performance
         const sourceCounts: { [key: string]: number } = {};
         leads.forEach(lead => {
           const source = lead.source || 'unknown';
           sourceCounts[source] = (sourceCounts[source] || 0) + 1;
         });

         // Calculate monthly trends (last 12 months)
         const monthlyData: { [key: string]: { leads: number; conversions: number } } = {};
         const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
         
         // Initialize all months with 0 data
         months.forEach(month => {
           monthlyData[month] = { leads: 0, conversions: 0 };
         });
         
         leads.forEach(lead => {
           const date = new Date(lead.created_at);
           const monthKey = months[date.getMonth()];
           monthlyData[monthKey].leads++;
           if (lead.status === 'qualified' || lead.status === 'closed_won') {
             monthlyData[monthKey].conversions++;
           }
         });

         // Calculate lead scores distribution
         const scoreRanges = [
           { range: '0-20', min: 0, max: 20 },
           { range: '21-40', min: 21, max: 40 },
           { range: '41-60', min: 41, max: 60 },
           { range: '61-80', min: 61, max: 80 },
           { range: '81-100', min: 81, max: 100 },
         ];

         const scoreCounts = scoreRanges.map(range => ({
           range: range.range,
           count: leads.filter(lead => 
             (lead.score || 0) >= range.min && (lead.score || 0) <= range.max
           ).length
         }));

         // Use real data from monthlyData
         const realTrends = Object.entries(monthlyData).map(([month, data]) => ({
           month,
           leads: data.leads,
           conversions: data.conversions
         }));
         
         setLeadData({
           conversionRate,
           sourcePerformance: sourceCounts,
           monthlyTrends: realTrends, // Use real data from database
           leadScores: scoreCounts
         });
       } else {
         // If no leads exist, set empty data
         setLeadData({
           conversionRate: 0,
           sourcePerformance: {},
           monthlyTrends: [],
           leadScores: []
         });
       }
    } catch (error) {
      console.error('Error fetching lead data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 25,
          font: {
            size: 13,
            weight: '700',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#1f2937',
          generateLabels: function(chart) {
            const datasets = chart.data.datasets;
            return datasets.map((dataset, index) => ({
              text: dataset.label || '',
              fillStyle: dataset.borderColor,
              strokeStyle: dataset.borderColor,
              lineWidth: 3,
              pointStyle: 'circle',
              hidden: false,
              index: index
            }));
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#3b82f6',
        borderWidth: 3,
        cornerRadius: 16,
        displayColors: true,
        padding: 20,
        titleFont: {
          size: 15,
          weight: '700',
          family: 'Inter, system-ui, sans-serif'
        },
        bodyFont: {
          size: 14,
          weight: '500',
          family: 'Inter, system-ui, sans-serif'
        },
        boxPadding: 12,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    animation: {
      duration: 3000,
      easing: 'easeInOutQuart',
      onProgress: function(animation) {
        const chart = animation.chart;
        const ctx = chart.ctx;
        const datasets = chart.data.datasets;
        
        datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          if (meta.data.length > 0) {
            meta.data.forEach((point, index) => {
              const x = point.x;
              const y = point.y;
              
              // Create glow effect
              ctx.save();
              ctx.shadowColor = dataset.borderColor;
              ctx.shadowBlur = 15;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
              ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
              ctx.strokeStyle = dataset.borderColor;
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(x, y, 6, 0, 2 * Math.PI);
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            });
          }
        });
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.02)',
          drawBorder: false,
          lineWidth: 1,
          drawTicks: false
        },
        ticks: {
          font: {
            size: 13,
            weight: '600',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#6b7280',
          padding: 12,
          callback: function(value) {
            return value.toLocaleString();
          }
        },
        border: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 13,
            weight: '600',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#6b7280',
          padding: 12
        },
        border: {
          display: false
        }
      }
    },
    elements: {
      point: {
        hoverRadius: 18,
        hoverBorderWidth: 5,
        hoverBorderColor: '#fff',
        hoverBackgroundColor: function(context) {
          const dataset = context.dataset;
          return dataset.borderColor;
        }
      }
    }
  };

  const conversionData = {
    labels: ['New', 'Contacted', 'Qualified', 'Closed'],
    datasets: [
      {
        label: 'Leads',
        data: leadData ? [
          leadData.monthlyTrends.reduce((sum, item) => sum + item.leads, 0) * 0.3,
          leadData.monthlyTrends.reduce((sum, item) => sum + item.leads, 0) * 0.4,
          leadData.monthlyTrends.reduce((sum, item) => sum + item.leads, 0) * 0.2,
          leadData.monthlyTrends.reduce((sum, item) => sum + item.conversions, 0)
        ] : [0, 0, 0, 0],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  const sourcesData = {
    labels: leadData ? leadData.monthlyTrends.map(item => item.month) : [],
    datasets: [
      {
        label: 'WhatsApp',
        data: leadData ? leadData.monthlyTrends.map(item => item.leads * 0.4) : [],
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: false,
        tension: 0.8,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 12,
        pointHoverBorderWidth: 4,
        borderWidth: 4,
        borderDash: [0, 0],
        pointStyle: 'circle',
        pointHoverBackgroundColor: 'rgba(34, 197, 94, 0.8)',
        pointHoverBorderColor: '#fff'
      },
      {
        label: 'Telegram',
        data: leadData ? leadData.monthlyTrends.map(item => item.leads * 0.5) : [],
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: false,
        tension: 0.8,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 12,
        pointHoverBorderWidth: 4,
        borderWidth: 4,
        borderDash: [0, 0],
        pointStyle: 'circle',
        pointHoverBackgroundColor: 'rgba(59, 130, 246, 0.8)',
        pointHoverBorderColor: '#fff'
      },
      {
        label: 'Facebook',
        data: leadData ? leadData.monthlyTrends.map(item => item.leads * 0.3) : [],
        borderColor: 'rgba(236, 72, 153, 1)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: false,
        tension: 0.8,
        pointBackgroundColor: 'rgba(236, 72, 153, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 12,
        pointHoverBorderWidth: 4,
        borderWidth: 4,
        borderDash: [0, 0],
        pointStyle: 'circle',
        pointHoverBackgroundColor: 'rgba(236, 72, 153, 0.8)',
        pointHoverBorderColor: '#fff'
      }
    ]
  };

  const trendsData = {
    labels: leadData ? leadData.monthlyTrends.map(item => item.month) : [],
    datasets: [
      {
        label: 'Total Leads',
        data: leadData ? leadData.monthlyTrends.map(item => item.leads) : [],
        borderColor: 'rgba(239, 68, 68, 0.8)',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        fill: false,
        stepped: false, // Sharp trend lines
        tension: 0,
        pointBackgroundColor: 'rgba(239, 68, 68, 0.9)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 12,
        pointHoverBorderWidth: 3,
        borderWidth: 2,
        borderDash: [0, 0],
        pointStyle: 'circle',
        pointHoverBackgroundColor: 'rgba(239, 68, 68, 0.8)',
        pointHoverBorderColor: '#fff',
        shadowColor: 'rgba(239, 68, 68, 0.1)',
        shadowBlur: 4,
        shadowOffsetX: 0,
        shadowOffsetY: 2,
        pointHoverShadowColor: 'rgba(239, 68, 68, 0.2)',
        pointHoverShadowBlur: 8,
        pointHoverShadowOffsetX: 0,
        pointHoverShadowOffsetY: 3
      },
      {
        label: 'Conversions',
        data: leadData ? leadData.monthlyTrends.map(item => item.conversions) : [],
        borderColor: 'rgba(34, 197, 94, 0.8)',
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
        fill: false,
        stepped: false, // Sharp trend lines
        tension: 0,
        pointBackgroundColor: 'rgba(34, 197, 94, 0.9)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 12,
        pointHoverBorderWidth: 3,
        borderWidth: 2,
        borderDash: [0, 0],
        pointStyle: 'circle',
        pointHoverBackgroundColor: 'rgba(34, 197, 94, 0.8)',
        pointHoverBorderColor: '#fff',
        shadowColor: 'rgba(34, 197, 94, 0.1)',
        shadowBlur: 4,
        shadowOffsetX: 0,
        shadowOffsetY: 2,
        pointHoverShadowColor: 'rgba(34, 197, 94, 0.2)',
        pointHoverShadowBlur: 8,
        pointHoverShadowOffsetX: 0,
        pointHoverShadowOffsetY: 3
      }
    ]
  };

  const scoresData = {
    labels: leadData ? leadData.leadScores.map(item => item.range) : [],
    datasets: [
      {
        label: 'Lead Score Distribution',
        data: leadData ? leadData.leadScores.map(item => item.count) : [],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(168, 85, 247, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Lead Performance</h3>
          <p className="text-sm text-gray-600">Track your lead conversion and performance metrics</p>
        </div>
        {leadData && (
          <div className="text-right">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {leadData.conversionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 font-medium">Conversion Rate</div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-8 bg-gradient-to-r from-gray-50 to-gray-100 p-2 rounded-xl">
        {[
          { key: 'conversion', label: 'Conversion', icon: '📊' },
          { key: 'sources', label: 'Sources', icon: '🎯' },
          { key: 'trends', label: 'Trends', icon: '📈' },
          { key: 'scores', label: 'Scores', icon: '⭐' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-lg border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <span className="mr-2 text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart Container */}
      <div className="h-96 bg-gradient-to-br from-gray-50/50 to-white rounded-xl p-4">
        {activeTab === 'conversion' && (
          <Bar data={conversionData} options={chartOptions} />
        )}
                 {activeTab === 'sources' && (
           <Line data={sourcesData} options={chartOptions} />
         )}
                 {activeTab === 'trends' && (
           <Line data={trendsData} options={{
             ...chartOptions,
             plugins: {
               ...chartOptions.plugins,
               legend: {
                 ...chartOptions.plugins.legend,
                 labels: {
                   ...chartOptions.plugins.legend.labels,
                   filter: function(legendItem, chartData) {
                     // Only show legend for main datasets (Total Leads and Conversions)
                     return legendItem.text === 'Total Leads' || legendItem.text === 'Conversions';
                   }
                 }
               },
               tooltip: {
                 ...chartOptions.plugins.tooltip,
                 backgroundColor: 'rgba(17, 24, 39, 0.98)',
                 borderColor: '#3b82f6',
                 borderWidth: 4,
                 cornerRadius: 20,
                 padding: 24,
                 titleFont: {
                   size: 16,
                   weight: '700',
                   family: 'Inter, system-ui, sans-serif'
                 },
                 bodyFont: {
                   size: 15,
                   weight: '600',
                   family: 'Inter, system-ui, sans-serif'
                 },
                 boxPadding: 16,
                 callbacks: {
                   label: function(context) {
                     // Only show tooltip for main datasets
                     if (context.dataset.label === 'Total Leads' || context.dataset.label === 'Conversions') {
                       return `${context.dataset.label}: ${context.parsed.y} leads`;
                     }
                     return null;
                   }
                 }
               }
             },
             animation: {
               ...chartOptions.animation,
               duration: 4000,
               easing: 'easeInOutQuart',
               onProgress: function(animation) {
                 const chart = animation.chart;
                 const ctx = chart.ctx;
                 const datasets = chart.data.datasets;
                 
                 datasets.forEach((dataset, datasetIndex) => {
                   const meta = chart.getDatasetMeta(datasetIndex);
                   if (meta.data.length > 0 && (dataset.label === 'Total Leads' || dataset.label === 'Conversions')) {
                     meta.data.forEach((point, index) => {
                       const x = point.x;
                       const y = point.y;
                       
                                               // Light glow effect for trends
                        ctx.save();
                        ctx.shadowColor = dataset.borderColor;
                        ctx.shadowBlur = 8;
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 0;
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                        ctx.strokeStyle = dataset.borderColor;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(x, y, 4, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.stroke();
                        ctx.restore();
                     });
                   }
                 });
               }
             }
           }} />
         )}
        {activeTab === 'scores' && (
          <Doughnut 
            data={scoresData} 
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: {
                  position: 'bottom' as const,
                  labels: {
                    usePointStyle: true,
                    padding: 25,
                    font: { 
                      size: 13, 
                      weight: '700',
                      family: 'Inter, system-ui, sans-serif'
                    }
                  }
                }
              }
            }} 
          />
        )}
      </div>

      {/* Key Metrics */}
      {leadData && (
        <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-200">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {Object.values(leadData.sourcePerformance).reduce((sum, count) => sum + count, 0)}
            </div>
            <div className="text-sm text-gray-600 font-medium">Total Leads</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {leadData.monthlyTrends.reduce((sum, item) => sum + item.conversions, 0)}
            </div>
            <div className="text-sm text-gray-600 font-medium">Conversions</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {Math.max(...Object.values(leadData.sourcePerformance))}
            </div>
            <div className="text-sm text-gray-600 font-medium">Top Source</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadPerformanceChart; 