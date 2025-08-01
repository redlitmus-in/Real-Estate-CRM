import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[+]?[1-9][\d\s\-\(\)]{7,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function formatPhoneNumber(phone: string): string {
  // Format Indian phone numbers
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function getLeadStageColor(stage: string): string {
  const colors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-purple-100 text-purple-800',
    proposal: 'bg-orange-100 text-orange-800',
    negotiation: 'bg-indigo-100 text-indigo-800',
    closed_won: 'bg-green-100 text-green-800',
    closed_lost: 'bg-red-100 text-red-800',
  };
  return colors[stage] || 'bg-gray-100 text-gray-800';
}

export function getPropertyTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    apartment: '🏢',
    villa: '🏡',
    plot: '🏞️',
    commercial: '🏪',
    warehouse: '🏭',
    office: '🏢',
  };
  return icons[type] || '🏠';
}

export function calculateLeadScore(lead: any): number {
  let score = 0;
  
  // Source scoring
  const sourceWeights: Record<string, number> = {
    whatsapp: 8,
    facebook: 6,
    viber: 5,
    website: 7,
    referral: 9,
    manual: 4,
  };
  score += sourceWeights[lead.source] || 0;
  
  // Budget scoring
  if (lead.budget_min && lead.budget_max) {
    const avgBudget = (lead.budget_min + lead.budget_max) / 2;
    if (avgBudget > 5000000) score += 10; // 50L+
    else if (avgBudget > 2000000) score += 8; // 20L+
    else if (avgBudget > 1000000) score += 6; // 10L+
    else score += 4;
  }
  
  // Interaction frequency (would need interaction data)
  // Requirements specificity
  if (lead.requirements && Object.keys(lead.requirements).length > 3) {
    score += 5;
  }
  
  return Math.min(score, 100); // Cap at 100
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Lead deduplication utilities
export const identifyDuplicateLeads = (leads: any[]): { duplicates: any[], unique: any[] } => {
  const leadGroups = new Map<string, any[]>();
  
  // Group leads by customer and source
  leads.forEach(lead => {
    const key = `${lead.customer_id}-${lead.source}`;
    if (!leadGroups.has(key)) {
      leadGroups.set(key, []);
    }
    leadGroups.get(key)!.push(lead);
  });
  
  const duplicates: any[] = [];
  const unique: any[] = [];
  
  leadGroups.forEach((groupLeads, key) => {
    if (groupLeads.length > 1) {
      // Sort by creation date, keep the oldest one as unique
      const sortedLeads = groupLeads.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      unique.push(sortedLeads[0]); // Keep the first (oldest) one
      duplicates.push(...sortedLeads.slice(1)); // Mark the rest as duplicates
    } else {
      unique.push(groupLeads[0]);
    }
  });
  
  return { duplicates, unique };
};

export const getDuplicateCount = (leads: any[]): number => {
  const { duplicates } = identifyDuplicateLeads(leads);
  return duplicates.length;
};

export const formatLeadSource = (source: string): string => {
  const sourceMap: Record<string, string> = {
    'telegram': 'Telegram',
    'whatsapp': 'WhatsApp',
    'facebook': 'Facebook',
    'website': 'Website',
    'manual': 'Manual',
    'referral': 'Referral'
  };
  return sourceMap[source] || source;
};

export const getLeadPriorityColor = (score: number): string => {
  if (score >= 80) return 'text-green-600 bg-green-50';
  if (score >= 60) return 'text-yellow-600 bg-yellow-50';
  if (score >= 40) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
};